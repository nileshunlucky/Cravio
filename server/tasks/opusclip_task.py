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

# Configure Cloudinary (assuming this is configured in your main app)
# cloudinary.config is expected to be called in your main application

# Constants
TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)

# Custom Celery Task class with progress reporting
class ProcessVideoTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")
        super().on_failure(exc, task_id, args, kwargs, einfo)

# Celery tasks
@celery_app.task(bind=True, base=ProcessVideoTask)
def process_video_file(self, video_path, file_name):
    """Process a video file asynchronously"""
    try:
        # Update state to STARTED
        self.update_state(state='PROGRESS', meta={
            'status': 'Starting video processing', 
            'percent_complete': 10
        })
        
        duration_cmd = f"ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 {video_path}"
        process = os.popen(duration_cmd)
        duration_output = process.read().strip()
        process.close()
        
        # Calculate video duration and credit usage
        video_duration = 0.0
        credit_usage = 0
        
        # Get video duration using ffprobe
        self.update_state(state='PROGRESS', meta={
            'status': 'Analyzing video duration', 
            'percent_complete': 30
        })
        try:
            # Get duration in seconds from ffprobe output
            video_duration = float(duration_output)
            
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
        
        # Update state for uploading
        self.update_state(state='PROGRESS', meta={
            'status': 'Uploading video to cloud storage', 
            'percent_complete': 50
        })
        
        # Upload video to Cloudinary (synchronous for Celery)
        video_upload = cloudinary.uploader.upload(
            video_path,
            resource_type="video",
            folder="opusclip",
            use_filename=True,
            unique_filename=True
        )
        
        # Use video URL with .mp4 replaced by .png as thumbnail URL
        thumbnail_url = video_upload.get("secure_url", "").replace('.mp4', '.png')
        
        # Clean up temp files
        self.update_state(state='PROGRESS', meta={
            'status': 'Cleaning up temporary files', 
            'percent_complete': 90
        })
        
        if os.path.exists(video_path):
            os.unlink(video_path)
        
        # Return the result
        result = {
            'video_url': video_upload.get("secure_url"),
            'thumbnail_url': thumbnail_url,
            'credit_usage': credit_usage
        }
        
        # Update user credit usage in MongoDB if needed
        # users_collection.update_one({"_id": user_id}, {"$inc": {"credits_used": credit_usage}})
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing uploaded file: {str(e)}")
        raise Exception(f"Failed to process uploaded file: {str(e)}")