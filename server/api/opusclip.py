from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, validator, HttpUrl
import yt_dlp
import os
import uuid
import asyncio
import cloudinary
import cloudinary.uploader
import cloudinary.api
import aiofiles
import shutil
import logging
from urllib.parse import urlparse, parse_qs
from tasks.opusclip_task import process_video_file

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

router = APIRouter()

# Create temporary directory if it doesn't exist
TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)

# Models
class YouTubeRequest(BaseModel):
    youtube_url: str
    
    @validator('youtube_url')
    def validate_youtube_url(cls, v):
        # Basic YouTube URL validation
        if not v:
            raise ValueError("YouTube URL cannot be empty")
        
        parsed_url = urlparse(v)
        
        # Check if domain is youtube.com or youtu.be
        if not ('youtube.com' in parsed_url.netloc or 'youtu.be' in parsed_url.netloc):
            raise ValueError("Not a valid YouTube URL")
            
        # For youtube.com, check if it has a video ID (v parameter)
        if 'youtube.com' in parsed_url.netloc:
            params = parse_qs(parsed_url.query)
            if 'v' not in params:
                raise ValueError("Missing video ID in YouTube URL")
        
        return v

class ProcessingResponse(BaseModel):
    video_url: str
    thumbnail_url: str
    message: str
    video_duration: Optional[float] = None
    credit_usage: Optional[int] = None

# Helper functions
def get_video_id(youtube_url: str) -> str:
    """Extract video ID from YouTube URL"""
    parsed_url = urlparse(youtube_url)
    
    if 'youtube.com' in parsed_url.netloc:
        params = parse_qs(parsed_url.query)
        return params['v'][0]
    elif 'youtu.be' in parsed_url.netloc:
        return parsed_url.path.lstrip('/')
    else:
        raise ValueError("Could not extract video ID from URL")

async def download_youtube_video(url: str) -> Dict[str, str]:
    """Download YouTube video and thumbnail using yt-dlp"""
    video_id = get_video_id(url)
    unique_id = f"{video_id}_{uuid.uuid4().hex[:8]}"
    video_path = os.path.join(TEMP_DIR, f"{unique_id}.mp4")
    thumbnail_path = os.path.join(TEMP_DIR, f"{unique_id}.jpg")
    
    # yt-dlp options
    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'outtmpl': video_path,
        'writethumbnail': True,
        'quiet': False,
        'no_warnings': False,
        'ignoreerrors': False,
    }
    
    try:
        # Use yt-dlp to download video
        logger.info(f"Downloading YouTube video: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            
            # Handle case where yt-dlp might save thumbnail with different extension
            thumbnail_base = os.path.join(TEMP_DIR, f"{unique_id}")
            possible_extensions = ['.jpg', '.webp', '.png']
            
            # Check all possible thumbnail extensions
            for ext in possible_extensions:
                possible_thumb = f"{thumbnail_base}{ext}"
                if os.path.exists(possible_thumb):
                    thumbnail_path = possible_thumb
                    break
        
        # If thumbnail wasn't downloaded, use a default one or raise error
        if not os.path.exists(thumbnail_path):
            logger.warning(f"Thumbnail for {url} not downloaded")
            raise HTTPException(status_code=500, detail="Failed to download video thumbnail")
            
        return {
            "video_path": video_path,
            "thumbnail_path": thumbnail_path,
            "title": info_dict.get('title', f"YouTube Video {video_id}")
        }
    except Exception as e:
        logger.error(f"Error downloading YouTube video: {str(e)}")
        
        # Provide better error messages for common YouTube errors
        error_message = str(e).lower()
        if "private video" in error_message:
            raise HTTPException(status_code=403, detail="This video is private and cannot be accessed")
        elif "unavailable" in error_message:
            raise HTTPException(status_code=404, detail="This YouTube video is unavailable or doesn't exist")
        elif "copyright" in error_message:
            raise HTTPException(status_code=403, detail="This video has been removed due to copyright issues")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to download YouTube video: {str(e)}")

async def upload_to_cloudinary(file_path: str, resource_type: str = "video", folder: str = "opusclip") -> Dict[str, Any]:
    """Upload a file to Cloudinary"""
    try:
        logger.info(f"Uploading to Cloudinary: {file_path}")
        
        # Upload file to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file_path,
            resource_type=resource_type,
            folder=folder,
            use_filename=True,
            unique_filename=True
        )
        
        logger.info(f"Upload successful: {upload_result.get('public_id')}")
        return upload_result
    except Exception as e:
        logger.error(f"Cloudinary upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload to cloud storage: {str(e)}")

async def cleanup_temp_files(files: List[str]):
    """Delete temporary files after processing"""
    for file_path in files:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Deleted temporary file: {file_path}")
            except Exception as e:
                logger.error(f"Error deleting temporary file {file_path}: {str(e)}")

# Routes
@router.post("/process-youtube", response_model=ProcessingResponse)
async def process_youtube(request: YouTubeRequest, background_tasks: BackgroundTasks):
    """Process a YouTube URL: download video and thumbnail, upload to Cloudinary"""
    try:
        # Download video and thumbnail
        download_results = await download_youtube_video(request.youtube_url)
        video_path = download_results["video_path"]
        thumbnail_path = download_results["thumbnail_path"]
        video_title = download_results["title"]
        
        # Get video duration using ffprobe
        duration_cmd = f"ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 {video_path}"
        duration_process = await asyncio.create_subprocess_shell(
            duration_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await duration_process.communicate()
        
        # Calculate video duration in minutes and credit usage
        video_duration = 0.0
        credit_usage = 0
        
        if duration_process.returncode == 0:
            try:
                # Get duration in seconds from ffprobe output
                video_duration = float(stdout.decode().strip())
                
                # Convert to minutes
                duration_minutes = video_duration / 60
                
                # Calculate credit usage: 1 minute = 5 credits
                # Round up to ensure partial minutes count as full credits
                credit_usage = int(max(1, 5 * round(duration_minutes + 0.5)))
                
                logger.info(f"Video duration: {video_duration} seconds ({duration_minutes:.2f} minutes)")
                logger.info(f"Credit usage: {credit_usage} credits")
            except ValueError as e:
                logger.error(f"Error parsing video duration: {str(e)}")
                # Default to minimum credit usage if parsing fails
                credit_usage = 5
        else:
            logger.error(f"FFprobe error: {stderr.decode()}")
            # Default to minimum credit usage if ffprobe fails
            credit_usage = 5
        
        # Upload video to Cloudinary
        video_upload = await upload_to_cloudinary(video_path, resource_type="video")
        
        # Use video URL with .mp4 replaced by .png as thumbnail URL
        thumbnail_url = video_upload.get("secure_url", "").replace('.mp4', '.png')
        
        # Schedule cleanup of temporary files
        background_tasks.add_task(cleanup_temp_files, [video_path, thumbnail_path])
        
        return ProcessingResponse(
            video_url=video_upload.get("secure_url"),
            thumbnail_url=thumbnail_url,
            message=f"Successfully processed video: {video_title}",
            video_duration=video_duration,
            credit_usage=credit_usage
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error processing YouTube URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.post("/opusclip/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """Process an uploaded video file and create a background task for processing"""
    if not file.content_type or "video" not in file.content_type:
        raise HTTPException(status_code=400, detail="File must be a video")
    
    unique_id = uuid.uuid4().hex
    video_path = os.path.join(TEMP_DIR, f"{unique_id}_{file.filename}")
    
    try:
        # Save uploaded file
        async with aiofiles.open(video_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Get video duration using ffprobe
        duration_cmd = f"ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 {video_path}"
        duration_process = await asyncio.create_subprocess_shell(
            duration_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await duration_process.communicate()
        
        # Check video duration
        if duration_process.returncode == 0:
            try:
                video_duration = float(stdout.decode().strip())
                
                # Check if video is too long (2 hours = 7200 seconds)
                if video_duration > 7200:
                    raise HTTPException(
                        status_code=400, 
                        detail={
                            "message": "Video is too long (maximum 2 hours)",
                            "possible_solutions": ["Upload a shorter video", "Trim your video before uploading"]
                        }
                    )
                
                logger.info(f"Video duration: {video_duration} seconds")
            except ValueError as e:
                logger.error(f"Error parsing video duration: {str(e)}")
        else:
            logger.error(f"FFprobe error: {stderr.decode()}")
        
        # Start the Celery task
        task = process_video_file.delay(video_path, file.filename)
        
        return {"task_id": task.id, "message": "Video processing started"}
    
    except HTTPException:
        # Clean up the file if we have an HTTP exception
        if os.path.exists(video_path):
            os.remove(video_path)
        raise
    except Exception as e:
        # Clean up the file if we have any other exception
        if os.path.exists(video_path):
            os.remove(video_path)
        logger.error(f"Error processing uploaded file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded file: {str(e)}")