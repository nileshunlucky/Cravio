from celery import Task
import os
import logging
import subprocess
import json
import boto3
from botocore.exceptions import ClientError
import uuid
import shutil
import yt_dlp
from celery_config import celery_app

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)

# Configure AWS
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client('s3',
                        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                        region_name=os.getenv("AWS_REGION", "us-east-1"))

class VideoProcessTask(Task):
    """Custom Celery Task with progress reporting"""
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")
        super().on_failure(exc, task_id, args, kwargs, einfo)

@celery_app.task(bind=True, base=VideoProcessTask)
def process_video(self, s3_bucket=None, s3_key=None, youtube_url=None):
    """
    Process a video from either S3 or YouTube
    
    Args:
        s3_bucket (str, optional): S3 bucket name if processing an uploaded file
        s3_key (str, optional): S3 object key if processing an uploaded file
        filename (str, optional): Original filename of the uploaded file
        youtube_url (str, optional): YouTube URL if processing from YouTube
        
    Returns:
        dict: Contains video_url, thumbnail_url, and credit_usage
    """
    try:
        # Update task state
        self.update_state(state='PROGRESS', meta={
            'status': 'Starting video processing', 
            'percent_complete': 5
        })
        
        unique_id = uuid.uuid4().hex
        temp_video_path = os.path.join(TEMP_DIR, f"{unique_id}.mp4")
        temp_thumbnail_path = os.path.join(TEMP_DIR, f"{unique_id}_thumbnail.jpg")
        
        # Case 1: Processing from YouTube
        if youtube_url:
            logger.info(f"Processing YouTube video: {youtube_url}")
            self.update_state(state='PROGRESS', meta={
                'status': 'Downloading YouTube video', 
                'percent_complete': 10
            })
            
            # Download YouTube video
            ydl_opts = {
                'format': 'best[ext=mp4]/best',
                'outtmpl': temp_video_path,
                'quiet': False,
                'writethumbnail': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(youtube_url, download=True)
                
            if not os.path.exists(temp_video_path):
                raise Exception("Failed to download YouTube video")
                
            logger.info(f"YouTube video downloaded to {temp_video_path}")
            
            # Check for the downloaded thumbnail
            thumbnail_base = os.path.splitext(temp_video_path)[0]
            for ext in ['.jpg', '.webp', '.png']:
                if os.path.exists(f"{thumbnail_base}{ext}"):
                    shutil.copy(f"{thumbnail_base}{ext}", temp_thumbnail_path)
                    break
        
        # Case 2: Processing uploaded file from S3
        elif s3_bucket and s3_key:
            logger.info(f"Processing video from S3: {s3_bucket}/{s3_key}")
            self.update_state(state='PROGRESS', meta={
                'status': 'Downloading video from S3', 
                'percent_complete': 10
            })
            
            # Download file from S3
            try:
                s3_client.download_file(s3_bucket, s3_key, temp_video_path)
                logger.info(f"Downloaded file from S3 to {temp_video_path}")
            except ClientError as e:
                logger.error(f"S3 download error: {str(e)}")
                raise Exception(f"Failed to download file from S3: {str(e)}")
        else:
            raise ValueError("Either youtube_url or both s3_bucket and s3_key must be provided")
        
        # Update task state
        self.update_state(state='PROGRESS', meta={
            'status': 'Calculating video duration', 
            'percent_complete': 30
        })
        
        # Calculate video duration using ffprobe
        try:
            ffprobe_cmd = [
                'ffprobe', 
                '-v', 'error', 
                '-show_entries', 'format=duration', 
                '-of', 'json', 
                temp_video_path
            ]
            
            result = subprocess.run(ffprobe_cmd, capture_output=True, text=True)
            ffprobe_data = json.loads(result.stdout)
            video_duration = float(ffprobe_data['format']['duration'])
            
            # Calculate credit usage: 1 minute = 5 credits, minimum 5 credits
            duration_minutes = video_duration / 60
            credit_usage = max(5, int(5 * round(duration_minutes + 0.5)))
            
            logger.info(f"Video duration: {video_duration} seconds ({duration_minutes:.2f} minutes)")
            logger.info(f"Credit usage: {credit_usage} credits")
        except Exception as e:
            logger.error(f"Error calculating duration: {str(e)}")
            video_duration = 0
            credit_usage = 5  # Default minimum
        
        # Generate thumbnail if it doesn't exist (for uploaded files)
        if not os.path.exists(temp_thumbnail_path):
            self.update_state(state='PROGRESS', meta={
                'status': 'Generating thumbnail', 
                'percent_complete': 40
            })
            
            try:
                ffmpeg_cmd = [
                    'ffmpeg',
                    '-i', temp_video_path,
                    '-ss', '00:00:01',  # Take frame at 1 second
                    '-vframes', '1',
                    '-q:v', '2',
                    temp_thumbnail_path
                ]
                subprocess.run(ffmpeg_cmd, check=True)
                logger.info(f"Generated thumbnail: {temp_thumbnail_path}")
            except Exception as e:
                logger.error(f"Error generating thumbnail: {str(e)}")
                # Create a default thumbnail if ffmpeg fails
                with open(temp_thumbnail_path, 'wb') as f:
                    f.write(b'')  # Empty file as placeholder
        
        # Update task state
        self.update_state(state='PROGRESS', meta={
            'status': 'Uploading to S3', 
            'percent_complete': 60
        })
        
        # Generate S3 keys for final storage
        final_video_key = f"videos/{unique_id}/video.mp4"
        final_thumbnail_key = f"videos/{unique_id}/thumbnail.jpg"
        
        # Upload video to S3
        try:
            s3_client.upload_file(
                temp_video_path, 
                S3_BUCKET, 
                final_video_key,
                ExtraArgs={'ContentType': 'video/mp4'}
            )
            logger.info(f"Uploaded video to S3: {final_video_key}")
            
            # Upload thumbnail to S3
            s3_client.upload_file(
                temp_thumbnail_path,
                S3_BUCKET,
                final_thumbnail_key,
                ExtraArgs={'ContentType': 'image/jpeg'}
            )
            logger.info(f"Uploaded thumbnail to S3: {final_thumbnail_key}")
        except Exception as e:
            logger.error(f"S3 upload error: {str(e)}")
            raise Exception(f"Failed to upload to S3: {str(e)}")
        
        # Generate public URLs
        region = os.getenv("AWS_REGION", "us-east-1")
        video_url = f"https://{S3_BUCKET}.s3.{region}.amazonaws.com/{final_video_key}"
        thumbnail_url = f"https://{S3_BUCKET}.s3.{region}.amazonaws.com/{final_thumbnail_key}"
        
        # Clean up temporary files
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        if os.path.exists(temp_thumbnail_path):
            os.remove(temp_thumbnail_path)
        logger.info("Removed temporary files")
        
        # Clean up original S3 object if it was an uploaded file
        if s3_bucket and s3_key and s3_key.startswith('uploads/'):
            try:
                s3_client.delete_object(Bucket=s3_bucket, Key=s3_key)
                logger.info(f"Deleted original S3 object: {s3_bucket}/{s3_key}")
            except Exception as e:
                logger.warning(f"Failed to clean up original S3 object: {str(e)}")
        
        # Update task state to complete
        self.update_state(state='PROGRESS', meta={
            'status': 'Video processing complete', 
            'percent_complete': 100
        })
        
        # Return the minimal required data
        return {
            'video_url': video_url,
            'thumbnail_url': thumbnail_url,
            'credit_usage': credit_usage
        }
        
    except Exception as e:
        logger.error(f"Error in video processing task: {str(e)}")
        raise Exception(f"Video processing failed: {str(e)}")