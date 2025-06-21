from datetime import datetime, timedelta
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
import os
import uuid
import logging
import boto3
from botocore.exceptions import ClientError
import re
import aiofiles
import urllib.parse
from tasks.opusclip_task import process_video, process_opusclip
from celery_config import celery_app
from db import users_collection
from typing import List, Optional

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
    



class OpusClipRequest(BaseModel):
    videoUrl: str
    thumbnail: str  
    creditUsage: int
    email: str 
    duration: str
    aspectRatio: str
    includeMoments: str
    subtitleColor: str
    clipRange: Optional[List[float]] = None


@router.post("/opusclip")
async def opusclip(request: OpusClipRequest):
    """
    Process a video with OpusClip after checking and deducting user credits
    """
    try:
        # Check if user exists
        user = users_collection.find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user has enough credits
        user_credits = user.get("credits", 0)
        if user_credits < request.creditUsage:
            return JSONResponse(
                status_code=402,  # Payment Required
                content={
                    "message": "Not enough credits",
                    "available_credits": user_credits,
                    "required_credits": request.creditUsage
                }
            )
        
        # Deduct the credits
        users_collection.update_one(
            {"email": request.email},
            {"$inc": {"credits": -request.creditUsage}}
        )
        
        logger.info(f"Deducted {request.creditUsage} credits from user {request.email}")
        
        # Start Celery task to process the video
        task = process_opusclip.delay(
            s3_video_url=request.videoUrl,
            s3_thumbnail_url=request.thumbnail,
            user_email=request.email,
            clips_duration=request.duration,
            aspect_ratio=request.aspectRatio,
            include_moments=request.includeMoments,
            subtitle_color=request.subtitleColor,
            clip_range=request.clipRange
        )
        
        return JSONResponse(
            status_code=202,
            content={
                "task_id": task.id,
                "message": "Video processing started"
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing OpusClip request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    
@router.get("/task-status/{task_id}")
async def get_task_status(task_id: str):
    """
    Get the status of a task by its ID.
    """
    try:
        task = celery_app.AsyncResult(task_id)
        
        if task.state == 'PENDING':
            response = {
                'status': 'pending',
                'message': 'Task is waiting for execution'
            }
        elif task.state == 'PROGRESS':
            meta = task.info or {}
            response = {
                'status': 'progress',
                'message': meta.get('status', 'Task is in progress'),
                'percent_complete': meta.get('percent_complete', 0)
            }
        elif task.state == 'FAILURE':
            response = {
                'status': 'failed',
                'message': str(task.info)
            }
        elif task.state == 'SUCCESS':
            response = {
                'status': 'success',
                'result': task.info
            }
        else:
            response = {
                'status': task.state.lower(),
                'message': task.info.get('status', '') if isinstance(task.info, dict) else '',
                'result': task.info.get('result', '') if isinstance(task.info, dict) else task.info
            }
        
        return JSONResponse(content=response)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    

@router.get("/delete-clips-3days")
async def delete_clips_3days():
    """
    Automatically delete all clips older than 3 days from S3 and database
    """
    try:
        # Calculate the cutoff date (3 days ago)
        cutoff_date = datetime.utcnow() - timedelta(days=3)
        logger.info(f"Deleting clips created before: {cutoff_date}")
        
        # Query database for users who have clips older than 3 days
        pipeline = [
            {
                "$match": {
                    "opusclips": {
                        "$elemMatch": {
                            "createdAt": {"$lt": cutoff_date}
                        }
                    }
                }
            },
            {
                "$project": {
                    "email": 1,
                    "old_clips": {
                        "$filter": {
                            "input": "$opusclips",
                            "cond": {"$lt": ["$$this.createdAt", cutoff_date]}
                        }
                    },
                    "remaining_clips": {
                        "$filter": {
                            "input": "$opusclips", 
                            "cond": {"$gte": ["$$this.createdAt", cutoff_date]}
                        }
                    }
                }
            }
        ]

        users_with_old_clips = list(users_collection.aggregate(pipeline))

        # Count total old clips across all users
        total_old_clips = sum(len(user.get('old_clips', [])) for user in users_with_old_clips)
        
        if not users_with_old_clips or total_old_clips == 0:
            logger.info("No clips found older than 3 days")
            return JSONResponse(
                content={
                    "message": "No clips found older than 3 days",
                    "deleted_clips_count": 0,
                    "deleted_files_count": 0,
                    "processed_users": 0
                }
            )
        
        total_deleted_files = 0
        total_deleted_clips = 0
        processed_users = 0
        deletion_errors = []
        
        # Process each user with old clips
        for user in users_with_old_clips:
            try:
                user_email = user.get('email')
                user_id = user.get('_id')
                old_clips = user.get('old_clips', [])
                remaining_clips = user.get('remaining_clips', [])
                processed_users += 1
                
                logger.info(f"Processing user: {user_email} with {len(old_clips)} old clips")
                
                # Process each old clip for this user
                for clip_doc in old_clips:
                    try:
                        unique_id = clip_doc.get('uniqueId')
                        clips = clip_doc.get('clips', [])
                        thumbnail = clip_doc.get('thumbnail', '')
                        
                        logger.info(f"Processing clip document with uniqueId: {unique_id}")
                        
                        # Collect all S3 objects to delete for this clip document
                        objects_to_delete = []
                        
                        # 1. Add thumbnail to deletion list if exists
                        if thumbnail:
                            parsed_thumbnail = urllib.parse.urlparse(thumbnail)
                            if 's3.' in parsed_thumbnail.netloc:
                                thumbnail_key = parsed_thumbnail.path.lstrip('/')
                                objects_to_delete.append({'Key': thumbnail_key})
                                logger.info(f"Adding thumbnail to delete: {thumbnail_key}")
                        
                        # 2. Add all clip videos to deletion list
                        for clip in clips:
                            clip_url = clip.get('clipUrl', '')
                            if clip_url:
                                parsed_clip = urllib.parse.urlparse(clip_url)
                                if 's3.' in parsed_clip.netloc:
                                    clip_key = parsed_clip.path.lstrip('/')
                                    objects_to_delete.append({'Key': clip_key})
                                    logger.info(f"Adding clip to delete: {clip_key}")
                        
                        # 3. Delete the entire video directory for this unique_id
                        if unique_id:
                            # Delete processed video directory
                            video_directory = f"videos/{unique_id}"
                            logger.info(f"Checking video directory: {video_directory}")
                            
                            try:
                                video_response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=video_directory)
                                if 'Contents' in video_response:
                                    for obj in video_response['Contents']:
                                        obj_key = {'Key': obj['Key']}
                                        if obj_key not in objects_to_delete:
                                            objects_to_delete.append(obj_key)
                                            logger.info(f"Adding video file to delete: {obj['Key']}")
                            except ClientError as e:
                                logger.error(f"Error listing video directory {video_directory}: {str(e)}")
                            
                            # Delete original upload directory
                            upload_directory = f"uploads/{unique_id}"
                            logger.info(f"Checking upload directory: {upload_directory}")
                            
                            try:
                                upload_response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=upload_directory)
                                if 'Contents' in upload_response:
                                    for obj in upload_response['Contents']:
                                        obj_key = {'Key': obj['Key']}
                                        if obj_key not in objects_to_delete:
                                            objects_to_delete.append(obj_key)
                                            logger.info(f"Adding upload file to delete: {obj['Key']}")
                            except ClientError as e:
                                logger.error(f"Error listing upload directory {upload_directory}: {str(e)}")
                        
                        # Delete S3 objects if any found
                        if objects_to_delete:
                            try:
                                s3_response = s3_client.delete_objects(
                                    Bucket=S3_BUCKET,
                                    Delete={
                                        'Objects': objects_to_delete,
                                        'Quiet': False
                                    }
                                )
                                
                                deleted_files = len(s3_response.get('Deleted', []))
                                s3_errors = s3_response.get('Errors', [])
                                
                                total_deleted_files += deleted_files
                                
                                if s3_errors:
                                    error_details = [f"{e.get('Key')}: {e.get('Message')}" for e in s3_errors]
                                    deletion_errors.extend(error_details)
                                    logger.error(f"S3 deletion errors for {unique_id}: {error_details}")
                                
                                logger.info(f"Deleted {deleted_files} S3 files for clip {unique_id}")
                                
                            except ClientError as e:
                                error_msg = f"S3 error for clip {unique_id}: {str(e)}"
                                deletion_errors.append(error_msg)
                                logger.error(error_msg)
                        
                        total_deleted_clips += 1
                        
                    except Exception as clip_error:
                        error_msg = f"Error processing clip {unique_id}: {str(clip_error)}"
                        deletion_errors.append(error_msg)
                        logger.error(error_msg)
                        continue
                
                # Update user document to remove old clips (keep only remaining clips)
                try:
                    update_result = users_collection.update_one(
                        {"_id": user_id},
                        {"$set": {"opusclips": remaining_clips}}
                    )
                    
                    if update_result.modified_count > 0:
                        logger.info(f"Updated user {user_email} - removed {len(old_clips)} old clips")
                    else:
                        logger.warning(f"Failed to update user {user_email} clips in database")
                        
                except Exception as db_error:
                    error_msg = f"Database update error for user {user_email}: {str(db_error)}"
                    deletion_errors.append(error_msg)
                    logger.error(error_msg)
                        
            except Exception as user_error:
                error_msg = f"Error processing user {user_email}: {str(user_error)}"
                deletion_errors.append(error_msg)
                logger.error(error_msg)
                continue
        
        # Prepare response
        response_data = {
            "message": f"Cleanup completed. Processed {processed_users} users with old clips",
            "deleted_clips_count": total_deleted_clips,
            "deleted_files_count": total_deleted_files,
            "processed_users": processed_users,
            "cutoff_date": cutoff_date.isoformat(),
            "total_old_clips_found": total_old_clips
        }
        
        if deletion_errors:
            response_data["errors"] = deletion_errors
            response_data["error_count"] = len(deletion_errors)
            logger.warning(f"Completed with {len(deletion_errors)} errors")
            return JSONResponse(
                status_code=207,  # Partial success
                content=response_data
            )
        
        logger.info(f"Successfully completed cleanup: {total_deleted_clips} clips, {total_deleted_files} files")
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error in delete_clips_3days: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete old clips: {str(e)}")