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
import urllib.parse
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
    
class DeleteVideoRequest(BaseModel):
    video_url: str

@router.post("/delete-video")
async def delete_video(request: DeleteVideoRequest):
    """
    Delete a video and its corresponding thumbnail from S3, as well as any original uploaded files
    """
    try:
        # Extract the S3 key from the video URL
        # Example URL: https://my-video-bucket.s3.us-east-1.amazonaws.com/videos/abc123/video.mp4
        video_url = request.video_url
        
        # Parse the URL to extract the bucket and key
        parsed_url = urllib.parse.urlparse(video_url)
        
        # Extract the path without leading slash
        path = parsed_url.path.lstrip('/')
        
        # Check if this is an S3 URL
        if 's3.' not in parsed_url.netloc:
            raise HTTPException(status_code=400, detail="Invalid S3 video URL")
        
        # Extract the bucket name from the URL if different from configured bucket
        bucket_name = S3_BUCKET
        if parsed_url.netloc.startswith(bucket_name):
            logger.info(f"Using bucket from URL: {bucket_name}")
        
        # Extract the video key from the path
        video_key = path
        
        # Extract the directory containing the video
        # Example: if key is 'videos/abc123/video.mp4', directory is 'videos/abc123'
        key_parts = video_key.split('/')
        if len(key_parts) < 2:
            raise HTTPException(status_code=400, detail="Invalid video path format")
        
        # Get the unique ID from the path
        # Assuming path pattern is 'videos/unique_id/video.mp4'
        if len(key_parts) >= 3:
            unique_id = key_parts[1]  # Extract the unique ID from the path
            logger.info(f"Extracted unique ID: {unique_id}")
        else:
            unique_id = None
            logger.warning("Could not extract unique ID from path")
        
        # Objects to delete
        objects_to_delete = []
        
        # 1. First, delete the processed video directory
        directory = '/'.join(key_parts[:-1])
        logger.info(f"Video directory to delete: {directory}")
        
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=directory)
        if 'Contents' in response:
            for obj in response['Contents']:
                objects_to_delete.append({'Key': obj['Key']})
                logger.info(f"Adding processed file to delete: {obj['Key']}")
        
        # 2. If we have a unique ID, also check for any original uploaded files
        if unique_id:
            upload_directory = f"uploads/{unique_id}"
            logger.info(f"Checking for original uploads in: {upload_directory}")
            
            upload_response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=upload_directory)
            if 'Contents' in upload_response:
                for obj in upload_response['Contents']:
                    objects_to_delete.append({'Key': obj['Key']})
                    logger.info(f"Adding original upload to delete: {obj['Key']}")
        
        if not objects_to_delete:
            logger.warning(f"No objects found to delete for video: {video_key}")
            raise HTTPException(status_code=404, detail="Video files not found")
        
        # Delete all identified objects
        response = s3_client.delete_objects(
            Bucket=bucket_name,
            Delete={
                'Objects': objects_to_delete,
                'Quiet': False
            }
        )
        
        deleted_count = len(response.get('Deleted', []))
        errors = response.get('Errors', [])
        
        if errors:
            error_details = [f"{e.get('Key')}: {e.get('Message')}" for e in errors]
            logger.error(f"Errors deleting objects: {error_details}")
            return JSONResponse(
                status_code=207,  # Partial success
                content={
                    "message": f"Deleted {deleted_count} files, but encountered {len(errors)} errors",
                    "errors": error_details,
                    "deleted_count": deleted_count
                }
            )
        
        return JSONResponse(
            content={
                "message": f"Successfully deleted video and associated files",
                "deleted_count": deleted_count
            }
        )
        
    except ClientError as e:
        logger.error(f"S3 client error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"S3 operation failed: {str(e)}")
    except Exception as e:
        logger.error(f"Error deleting video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete video: {str(e)}")
