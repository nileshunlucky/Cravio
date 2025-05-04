from celery import Task
import os
import logging
import cloudinary
import cloudinary.uploader
from celery_config import celery_app
from db import users_collection

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
TEMP_DIR = os.path.join(os.getcwd(), "temp_videos")
os.makedirs(TEMP_DIR, exist_ok=True)

# Custom Celery Task class with progress reporting
class ProcessVideoTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")
        super().on_failure(exc, task_id, args, kwargs, einfo)

# Celery tasks
@celery_app.task(bind=True, base=ProcessVideoTask)
def process_video_file(self, video_path, file_name, user_id=None):
    """Process a video file asynchronously"""
    try:
        # Validate file path - ensure absolute path is used
        if not os.path.isabs(video_path):
            video_path = os.path.abspath(video_path)
        
        # Check if file exists before proceeding
        if not os.path.exists(video_path):
            logger.error(f"Video file not found: {video_path}")
            # Check if file exists in TEMP_DIR instead
            temp_file_path = os.path.join(TEMP_DIR, os.path.basename(video_path))
            if os.path.exists(temp_file_path):
                logger.info(f"Found video in temp directory instead: {temp_file_path}")
                video_path = temp_file_path
            else:
                # If filename is passed separately, try that
                potential_path = os.path.join(TEMP_DIR, file_name)
                if os.path.exists(potential_path):
                    logger.info(f"Found video using provided filename: {potential_path}")
                    video_path = potential_path
                else:
                    raise FileNotFoundError(f"Video file not found at {video_path} or in temp directory")

        # Update state to STARTED
        self.update_state(state='PROGRESS', meta={
            'status': 'Starting video processing', 
            'percent_complete': 10
        })
        
        # Log the actual file we're processing
        logger.info(f"Processing video file: {video_path}")
        
        # Update state for duration analysis
        self.update_state(state='PROGRESS', meta={
            'status': 'Analyzing video duration', 
            'percent_complete': 30
        })
        
        # Calculate video duration and credit usage
        video_duration = 0.0
        credit_usage = 5  # Default minimum credit usage
        
        # Get video duration using ffprobe with better error handling
        try:
            duration_cmd = f"ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{video_path}\""
            logger.info(f"Running duration command: {duration_cmd}")
            process = os.popen(duration_cmd)
            duration_output = process.read().strip()
            process.close()
            
            if duration_output:
                # Get duration in seconds from ffprobe output
                video_duration = float(duration_output)
                
                # Convert to minutes
                duration_minutes = video_duration / 60
                
                # Calculate credit usage: 1 minute = 5 credits
                # Round up to ensure partial minutes count as full credits
                credit_usage = int(max(1, 5 * round(duration_minutes + 0.5)))
                
                logger.info(f"Video duration: {video_duration} seconds ({duration_minutes:.2f} minutes)")
                logger.info(f"Credit usage: {credit_usage} credits")
            else:
                logger.warning("Failed to get video duration, using default credit value")
        except Exception as e:
            logger.error(f"Error parsing video duration: {str(e)}")
            # Continue with default credit usage
        
        # Update state for uploading
        self.update_state(state='PROGRESS', meta={
            'status': 'Uploading video to cloud storage', 
            'percent_complete': 50
        })
        
        # Double-check file exists before upload
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at {video_path} before upload")
            
        # Upload video to Cloudinary (synchronous for Celery)
        try:
            video_upload = cloudinary.uploader.upload(
                video_path,
                resource_type="video",
                folder="opusclip",
                use_filename=True,
                unique_filename=True
            )
            
            # Use video URL with .mp4 replaced by .png as thumbnail URL
            thumbnail_url = video_upload.get("secure_url", "").replace('.mp4', '.png')
            
            logger.info(f"Successfully uploaded video to Cloudinary: {video_upload.get('secure_url')}")
        except Exception as cloud_error:
            logger.error(f"Cloudinary upload failed: {str(cloud_error)}")
            raise
        
        # Clean up temp files
        self.update_state(state='PROGRESS', meta={
            'status': 'Cleaning up temporary files', 
            'percent_complete': 90
        })
        
        try:
            if os.path.exists(video_path):
                os.unlink(video_path)
                logger.info(f"Removed temporary file: {video_path}")
        except Exception as e:
            logger.warning(f"Failed to remove temporary file {video_path}: {str(e)}")
        
        # Return the result
        result = {
            'video_url': video_upload.get("secure_url"),
            'thumbnail_url': thumbnail_url,
            'credit_usage': credit_usage
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing uploaded file: {str(e)}")
        raise Exception(f"Failed to process uploaded file: {str(e)}")