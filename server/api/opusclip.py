from fastapi import FastAPI, UploadFile, File, Form, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cloudinary
import cloudinary.uploader
import cloudinary.api
import pytube 
import os
import uuid
import tempfile
import shutil
from pydantic import BaseModel
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app

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

@router.post("/process-youtube")
async def process_youtube(request: YouTubeRequest):
    """
    Process a YouTube video URL, download it, and upload to Cloudinary
    """
    try:
        youtube_url = request.youtube_url
        logger.info(f"Processing YouTube URL: {youtube_url}")
        
        # Create a temporary directory for downloads
        temp_dir = tempfile.mkdtemp()
        try:
            # Download YouTube video
            yt = pytube.YouTube(youtube_url)
            video_title = yt.title
            video_stream = yt.streams.get_highest_resolution()
            
            # Generate a unique filename
            unique_filename = f"{uuid.uuid4().hex}_{video_title.replace(' ', '_')}.mp4"
            download_path = os.path.join(temp_dir, unique_filename)
            
            # Download the video
            video_stream.download(output_path=temp_dir, filename=unique_filename)
            logger.info(f"Downloaded video to {download_path}")
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                download_path,
                resource_type="video",
                folder="Opusclip",
                public_id=unique_filename.split('.')[0]
            )
            
            logger.info(f"Uploaded to Cloudinary: {upload_result['secure_url']}")
            
            return {
                "status": "success",
                "message": "YouTube video processed successfully",
                "video_title": video_title,
                "video_url": upload_result['secure_url'],
                "resource_id": upload_result['public_id']
            }
            
        finally:
            # Clean up temporary files
            shutil.rmtree(temp_dir, ignore_errors=True)
            
    except pytube.exceptions.PytubeError as e:
        logger.error(f"YouTube processing error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing YouTube video: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a video file to Cloudinary
    """
    try:
        logger.info(f"Processing file upload: {file.filename}")
        
        # Create a temporary file
        temp_dir = tempfile.mkdtemp()
        temp_file_path = os.path.join(temp_dir, file.filename)
        
        try:
            # Save uploaded file to temp location
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Generate a unique ID for the file
            unique_id = uuid.uuid4().hex
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                temp_file_path,
                resource_type="auto",  # Automatically detect resource type
                folder="opusclip",
                public_id=f"{unique_id}_{os.path.splitext(file.filename)[0]}"
            )
            
            logger.info(f"Uploaded to Cloudinary: {upload_result['secure_url']}")
            
            return {
                "status": "success",
                "message": "File uploaded successfully",
                "filename": file.filename,
                "file_url": upload_result['secure_url'],
                "resource_id": upload_result['public_id']
            }
            
        finally:
            # Clean up temporary files
            shutil.rmtree(temp_dir, ignore_errors=True)
            
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")