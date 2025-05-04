from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
from pydantic import BaseModel, validator
import os
import uuid
import logging
import boto3
from botocore.exceptions import ClientError
import re
import aiofiles
from tasks.opusclip_task import process_video

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

# Create temporary directory if it doesn't exist
TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)

# S3 configuration
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client('s3',
                        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                        region_name=os.getenv("AWS_REGION", "us-east-1"))

# Models
class YouTubeRequest(BaseModel):
    youtube_url: str
    
    @validator('youtube_url')
    def validate_youtube_url(cls, v):
        # Basic YouTube URL validation
        if not v:
            raise ValueError("YouTube URL cannot be empty")
        
        if not ('youtube.com' in v or 'youtu.be' in v):
            raise ValueError("Not a valid YouTube URL")
            
        return v

class ProcessingResponse(BaseModel):
    video_url: str
    thumbnail_url: str
    credit_usage: int

@router.post("/opusclip/upload-file", response_model=ProcessingResponse)
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file to S3 and process it with Celery"""
    
    if not file.content_type or "video" not in file.content_type:
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Generate a unique ID and safe filename
    unique_id = uuid.uuid4().hex
    original_filename = os.path.basename(file.filename)
    safe_filename = re.sub(r'[^\w\.\-]', '_', original_filename)
    temp_path = os.path.join(TEMP_DIR, f"{unique_id}_{safe_filename}")
    
    try:
        # Save uploaded file temporarily
        async with aiofiles.open(temp_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Upload file to S3
        s3_key = f"uploads/{unique_id}/{safe_filename}"
        s3_client.upload_file(temp_path, S3_BUCKET, s3_key)
        logger.info(f"Uploaded file to S3: {s3_key}")
        
        # Clean up the temporary file
        os.remove(temp_path)
        
        # Start Celery task to process the video
        task = process_video.delay(
            s3_bucket=S3_BUCKET,
            s3_key=s3_key,
        )
        
        return JSONResponse(
            status_code=202,
            content={
                "task_id": task.id,
                "message": "Video processing started"
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        # Clean up temporary file if it exists
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/process-youtube", response_model=ProcessingResponse)
async def process_youtube_video(request: YouTubeRequest):
    """Process a YouTube URL by sending it directly to the Celery task"""
    try:
        # Start Celery task to download and process the YouTube video
        task = process_video.delay(
            youtube_url=request.youtube_url
        )
        
        return JSONResponse(
            status_code=202,
            content={
                "task_id": task.id,
                "message": "YouTube video processing started"
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing YouTube URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")