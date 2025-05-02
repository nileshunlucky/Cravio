from fastapi import UploadFile, File, Form, HTTPException, APIRouter
import cloudinary
import cloudinary.uploader
import yt_dlp
import os
import uuid
import tempfile
import shutil
from pydantic import BaseModel
import logging
import re # For sanitizing filenames

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app (assuming you have one elsewhere)
# app = FastAPI() # Example: if this file were the main app
# router = APIRouter() # Keep using the router

# --- Assuming router is defined elsewhere or uncomment the line above ---
router = APIRouter() # Define router if not already defined


# Configure Cloudinary (ensure environment variables are set)
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

class YouTubeRequest(BaseModel):
    youtube_url: str

def sanitize_filename(filename):
    """Removes or replaces characters unsuitable for filenames."""
    # Remove invalid characters
    sanitized = re.sub(r'[\\/*?:"<>|]', "", filename)
    # Replace spaces with underscores
    sanitized = sanitized.replace(' ', '_')
    # Reduce multiple consecutive underscores to one
    sanitized = re.sub(r'_+', '_', sanitized)
    # Remove leading/trailing underscores
    sanitized = sanitized.strip('_')
    # Limit length if necessary (optional)
    # max_len = 100
    # if len(sanitized) > max_len:
    #     name, ext = os.path.splitext(sanitized)
    #     sanitized = name[:max_len - len(ext)] + ext
    return sanitized if sanitized else "downloaded_video" # Ensure filename is not empty


@router.post("/process-youtube")
async def process_youtube(request: YouTubeRequest):
    """
    Process a YouTube video URL: get info, download video using yt-dlp,
    upload video to Cloudinary, and return video details including thumbnail URL.
    """
    youtube_url = request.youtube_url
    logger.info(f"Processing YouTube URL: {youtube_url}")
    
    temp_dir = None # Initialize outside try block for cleanup
    info_dict = None

    try:
        # 1. Extract video info using yt-dlp without downloading yet
        logger.info("Extracting video information...")
        ydl_opts_info = {
             'quiet': True,
             'noplaylist': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
             info_dict = ydl.extract_info(youtube_url, download=False)
        
        video_title = info_dict.get('title', 'Untitled Video')
        thumbnail_url = info_dict.get('thumbnail') # yt-dlp provides this directly
        
        logger.info(f"Video Title: {video_title}")
        if thumbnail_url:
             logger.info(f"Thumbnail URL: {thumbnail_url}")
        else:
             logger.warning("Could not retrieve thumbnail URL.")

        # 2. Prepare for download
        # Create a temporary directory for downloads
        temp_dir = tempfile.mkdtemp()
        
        # Generate a unique filename
        sanitized_title = sanitize_filename(video_title)
        unique_filename_base = f"{uuid.uuid4().hex}_{sanitized_title}"
        # Let yt-dlp add the correct extension based on the format downloaded
        download_template = os.path.join(temp_dir, f"{unique_filename_base}.%(ext)s")

        # 3. Download the video using yt-dlp
        logger.info(f"Attempting to download video to template: {download_template}")
        ydl_opts_download = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', # Prefer mp4
            'outtmpl': download_template,
            'quiet': True,
            'noplaylist': True,
            # 'progress_hooks': [lambda d: logger.info(f"Download status: {d['status']}")], # Optional: for progress logging
        }

        with yt_dlp.YoutubeDL(ydl_opts_download) as ydl:
            ydl.download([youtube_url])

        # Find the actual downloaded file (since extension is determined by yt-dlp)
        downloaded_files = os.listdir(temp_dir)
        if not downloaded_files:
             raise FileNotFoundError("yt-dlp finished but no file was found in the temp directory.")
        
        # Assume the first file found is the one we want (should be only one video)
        actual_filename = downloaded_files[0]
        download_path = os.path.join(temp_dir, actual_filename)
        logger.info(f"Downloaded video successfully to {download_path}")
        
        # 4. Upload to Cloudinary
        logger.info(f"Uploading {download_path} to Cloudinary...")
        # Use the unique base name (without extension) for the public_id
        public_id_base = os.path.splitext(actual_filename)[0]
        
        upload_result = cloudinary.uploader.upload(
            download_path,
            resource_type="video",
            folder="Opusclip", # Consider making this configurable or dynamic
            public_id=public_id_base
        )
        
        logger.info(f"Uploaded to Cloudinary: {upload_result.get('secure_url')}")
        
        # 5. Return results
        return {
            "status": "success",
            "message": "YouTube video processed successfully",
            "thumbnail_url": thumbnail_url, # Return the thumbnail URL
            "video_url": upload_result.get('secure_url'),
            "resource_id": upload_result.get('public_id')
        }
        
    except yt_dlp.utils.DownloadError as e:
        logger.error(f"yt-dlp download/extraction error for URL {youtube_url}: {str(e)}")
        # Try to extract specific error message if possible
        error_msg = str(e)
        if hasattr(e, 'msg'):
             error_msg = e.msg
        raise HTTPException(status_code=400, detail=f"Error processing YouTube video (yt-dlp): {error_msg}")
    except FileNotFoundError as e:
         logger.error(f"File not found after download attempt: {str(e)}")
         raise HTTPException(status_code=500, detail=f"Download succeeded but couldn't find the file: {str(e)}")
    except Exception as e:
        # Catch potential errors during Cloudinary upload or other steps
        logger.error(f"Unexpected error processing {youtube_url}: {str(e)}", exc_info=True) # Log traceback
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
        
    finally:
        # Clean up temporary files and directory
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                logger.info(f"Cleaned up temporary directory: {temp_dir}")
            except Exception as cleanup_error:
                 logger.error(f"Error cleaning up temp directory {temp_dir}: {cleanup_error}")


# --- Keep the existing /upload-file endpoint as it is ---

@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a video file to Cloudinary
    """
    temp_dir = None # Initialize for cleanup
    try:
        logger.info(f"Processing file upload: {file.filename}")
        
        # Create a temporary directory
        temp_dir = tempfile.mkdtemp()
        # Sanitize filename before joining path
        sanitized_filename = sanitize_filename(file.filename or "uploaded_file")
        temp_file_path = os.path.join(temp_dir, sanitized_filename)
        
        # Save uploaded file to temp location
        logger.info(f"Saving uploaded file temporarily to: {temp_file_path}")
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info("Temporary file saved.")
        
        # Generate a unique ID for the Cloudinary public_id base
        unique_id = uuid.uuid4().hex
        # Get filename without extension for public_id
        filename_base = os.path.splitext(sanitized_filename)[0]
        
        # Upload to Cloudinary
        logger.info(f"Uploading {temp_file_path} to Cloudinary...")
        upload_result = cloudinary.uploader.upload(
            temp_file_path,
            resource_type="auto",  # Automatically detect resource type
            folder="opusclip", # Consistent folder name (lowercase?)
            public_id=f"{unique_id}_{filename_base}" # Ensure unique public ID
        )
        
        logger.info(f"Uploaded to Cloudinary: {upload_result.get('secure_url')}")
        # covert secure_url mp4 to png as thumbnail - pop .mp4 push .png
        thumbnail_url = upload_result['secure_url'].replace('.mp4', '.png')
        
        return {
            "status": "success",
            "message": "File uploaded successfully",
            "file_url": upload_result.get('secure_url'),
            "thumbnail_url": thumbnail_url,
            "resource_id": upload_result.get('public_id')
        }
        
    except Exception as e:
        logger.error(f"File upload error: {str(e)}", exc_info=True) # Log traceback
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
        
    finally:
        # Clean up temporary files and directory
        if temp_dir and os.path.exists(temp_dir):
             try:
                 shutil.rmtree(temp_dir)
                 logger.info(f"Cleaned up temporary directory: {temp_dir}")
             except Exception as cleanup_error:
                 logger.error(f"Error cleaning up temp directory {temp_dir}: {cleanup_error}")