from fastapi import UploadFile, File, HTTPException, APIRouter, Depends
import cloudinary
import cloudinary.uploader
import yt_dlp
import os
import uuid
import tempfile
import shutil
from pydantic import BaseModel
import logging
from typing import Optional, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

class YouTubeRequest(BaseModel):
    youtube_url: str
    cookie_file: Optional[str] = None  # Path to cookies file (if provided)
    browser_name: Optional[str] = None  # Browser to extract cookies from

class CookieFile(BaseModel):
    file_content: str

def get_ydl_options(cookie_file: Optional[str] = None, browser_name: Optional[str] = None) -> dict:
    """
    Prepare yt-dlp options with cookie support
    
    Args:
        cookie_file: Path to a cookies.txt file with YouTube cookies
        browser_name: Browser to extract cookies from (chrome, firefox, etc.)
    """
    options = {
        'noplaylist': True,
        'quiet': True,
        'no_warnings': False,
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',  # Highest quality
        'outtmpl': '/tmp/%(id)s.%(ext)s',  # Temporary file storage
    }
    
    # Add cookie options if provided
    if cookie_file:
        options['cookiefile'] = cookie_file
    elif browser_name:
        options['cookiesfrombrowser'] = (browser_name, None, None, None)
    
    return options

@router.post("/process-youtube")
async def process_youtube(request: YouTubeRequest):
    youtube_url = request.youtube_url
    cookie_file = request.cookie_file
    browser_name = request.browser_name
    
    # Temporary file to clean up later
    tmp_path = None
    cookie_tmp_path = None

    try:
        # 1. Download video with cookie support
        ydl_opts = get_ydl_options(cookie_file, browser_name)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(youtube_url, download=True)

        # 2. Get video path
        video_path = ydl.prepare_filename(info_dict)
        tmp_path = video_path
        
        # 3. Upload video to Cloudinary
        upload_result = cloudinary.uploader.upload(
            video_path,
            resource_type="auto",  # Cloudinary will auto-detect video format
            folder="opusclip",  # Folder where videos will be stored
            public_id=f"{uuid.uuid4().hex}"  # Unique ID for the video file
        )
        
        # Get the video URL from the Cloudinary upload result
        video_url = upload_result['secure_url']

        # 4. Get thumbnail URL (from yt-dlp's info_dict)
        thumbnail_url = info_dict.get('thumbnail', None)
        
        # If a thumbnail URL is provided by yt-dlp, upload it to Cloudinary
        if thumbnail_url:
            thumbnail_upload_result = cloudinary.uploader.upload(
                thumbnail_url,
                resource_type="image",  # Cloudinary should handle image type
                folder="opusclip/thumbnails",  # Optional: Use a separate folder for thumbnails
                public_id=f"{uuid.uuid4().hex}"  # Unique ID for the thumbnail
            )
            thumbnail_url = thumbnail_upload_result['secure_url']
        else:
            thumbnail_url = None  # If no thumbnail, set as None

        # 5. Return video URL and thumbnail URL
        return {
            "status": "success",
            "video_url": video_url,  # Cloud URL for the uploaded video
            "thumbnail_url": thumbnail_url,  # Cloud URL for the thumbnail (if available)
            "title": info_dict.get('title', 'Unknown Title')
        }

    except yt_dlp.utils.DownloadError as e:
        logger.error(f"YouTube download error: {str(e)}")  # Log error for debugging
        
        # Provide more helpful error message with instructions
        if "Sign in to confirm you're not a bot" in str(e):
            raise HTTPException(400, detail={
                "error": "YouTube bot detection triggered",
                "message": "YouTube requires authentication for this video. Try providing cookies using the 'browser_name' parameter or upload your own cookie file.",
                "supported_browsers": ["chrome", "firefox", "edge", "safari", "opera"]
            })
        else:
            raise HTTPException(400, detail=f"YouTube download error: {str(e)}")
    except Exception as e:
        logger.error(f"Error: {str(e)}")  # Log error for debugging
        raise HTTPException(500, detail="Internal server error")
    finally:
        # Clean up temporary files
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {tmp_path}: {str(e)}")
        
        if cookie_tmp_path and os.path.exists(cookie_tmp_path):
            try:
                os.remove(cookie_tmp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary cookie file {cookie_tmp_path}: {str(e)}")

@router.post("/upload-cookies")
async def upload_cookies(cookie_data: CookieFile):
    """Endpoint to upload YouTube cookies file content and get a reference to use in process-youtube"""
    try:
        # Create a temporary file to store the cookies
        fd, tmp_path = tempfile.mkstemp(suffix='.txt')
        with os.fdopen(fd, 'w') as tmp:
            tmp.write(cookie_data.file_content)
        
        return {
            "status": "success",
            "cookie_file": tmp_path,
            "message": "Use this cookie_file path in your process-youtube request"
        }
    except Exception as e:
        logger.error(f"Error processing cookie file: {str(e)}")
        raise HTTPException(500, detail="Failed to process cookie file")

@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    tmp_path = None
    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
        
        # Upload file to Cloudinary
        upload_result = cloudinary.uploader.upload(
            tmp_path,
            resource_type="auto",  # Auto-detect the file type (image/video)
            folder="opusclip",  # Folder to store the file in Cloudinary
            public_id=f"{uuid.uuid4().hex}"  # Unique ID for the file
        )
        
        # Get file URL from Cloudinary result
        file_url = upload_result['secure_url']
        thumbnail_url = file_url.replace('.mp4', '.png')  # Assuming you want to generate a thumbnail URL

        return {
            "status": "success",
            "file_url": file_url,
            "thumbnail_url": thumbnail_url,  # Provide the thumbnail link
            "resource_id": upload_result['public_id']  # Cloudinary resource ID
        }
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(500, detail=f"Failed to upload file: {str(e)}")
    finally:
        # Clean up the temporary file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {tmp_path}: {str(e)}")