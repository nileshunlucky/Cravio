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
from db import users_collection
import openai
from datetime import datetime

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
    

# opusclip task

# Configure OpenAI client
client = openai.OpenAI()

class OpusClipProcessTask(Task):
    """Custom Celery Task for OpusClip processing with progress reporting"""
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")
        super().on_failure(exc, task_id, args, kwargs, einfo)

@celery_app.task(bind=True, base=OpusClipProcessTask)
def process_opusclip(self, s3_video_url, s3_thumbnail_url, user_email=None):
    """
    Process a video to create short viral clips
    
    Args:
        s3_video_url (str): S3 URL of the uploaded video
        s3_thumbnail_url (str): S3 URL of the video thumbnail
        user_email (str, optional): Email of the user
    
    Returns:
        dict: Contains original video details and generated clips
    """
    try:
        # Generate a unique ID for this process
        unique_id = uuid.uuid4().hex
        
        # Update task state
        self.update_state(state='PROGRESS', meta={
            'status': 'Starting viral clip processing', 
            'percent_complete': 5
        })
        
        # Extract S3 bucket and key from URLs
        video_parsed_url = s3_video_url.replace('https://', '').split('/')
        bucket_name = video_parsed_url[0].split('.')[0]
        video_key = '/'.join(video_parsed_url[1:])
        
        # Create temporary file paths
        temp_video_path = os.path.join(TEMP_DIR, f"{unique_id}_source.mp4")
        temp_audio_path = os.path.join(TEMP_DIR, f"{unique_id}_audio.wav")
        temp_transcript_path = os.path.join(TEMP_DIR, f"{unique_id}_transcript.txt")
        
        # Download the video from S3
        self.update_state(state='PROGRESS', meta={
            'status': 'Downloading video from S3', 
            'percent_complete': 10
        })
        
        try:
            s3_client.download_file(bucket_name, video_key, temp_video_path)
            logger.info(f"Downloaded video from S3 to {temp_video_path}")
        except ClientError as e:
            logger.error(f"S3 download error: {str(e)}")
            raise Exception(f"Failed to download video from S3: {str(e)}")
        
        # Extract audio from video
        self.update_state(state='PROGRESS', meta={
            'status': 'Extracting audio from video', 
            'percent_complete': 15
        })
        
        try:
            ffmpeg_cmd = [
                'ffmpeg',
                '-i', temp_video_path,
                '-vn',
                '-ac', '1',
                '-ar', '16000',
                '-b:a', '32k',
                '-y',
                temp_audio_path
            ]
            subprocess.run(ffmpeg_cmd, check=True)
            logger.info(f"Extracted and compressed audio to {temp_audio_path}")
        except Exception as e:
            logger.error(f"Error extracting audio: {str(e)}")
            raise Exception(f"Failed to extract audio: {str(e)}")

        
        # Get video dimensions
        try:
            ffprobe_cmd = [
                'ffprobe',
                '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height,duration',
                '-of', 'json',
                temp_video_path
            ]
            result = subprocess.run(ffprobe_cmd, capture_output=True, text=True)
            video_info = json.loads(result.stdout)
            width = int(video_info['streams'][0]['width'])
            height = int(video_info['streams'][0]['height'])
            duration = float(video_info['streams'][0]['duration'])
            logger.info(f"Video dimensions: {width}x{height}, duration: {duration} seconds")
        except Exception as e:
            logger.error(f"Error getting video info: {str(e)}")
            width, height = 1920, 1080  # Default dimensions
            duration = 0
        
        # Transcribe audio using OpenAI Whisper API
        self.update_state(state='PROGRESS', meta={
            'status': 'Transcribing audio using Whisper API', 
            'percent_complete': 25
        })
        
        try:
            with open(temp_audio_path, 'rb') as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-1",
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )
                
            # Save transcript to file
            with open(temp_transcript_path, 'w') as f:
                json.dump(transcription.model_dump(), f)  # Using model_dump() for OpenAI object
                
            logger.info(f"Transcription completed and saved to {temp_transcript_path}")
            
            # Extract text for GPT
            full_transcript = ""
            segments = transcription.segments
            for segment in segments:
                full_transcript += f"{segment.start} - {segment.end}: {segment.text}\n"
                
        except Exception as e:
            logger.error(f"Error transcribing audio: {str(e)}")
            raise Exception(f"Failed to transcribe audio: {str(e)}")
        
        # Use GPT 3.5 to identify viral clips
        self.update_state(state='PROGRESS', meta={
            'status': 'Identifying viral clips with GPT-3.5', 
            'percent_complete': 40
        })
        
        try:
            # Prompt for GPT
            prompt = f"""
            You are an expert at finding viral moments in videos. Given the following transcript with timestamps, 
            identify up to 10 potential viral clips that are approximately 30 seconds each.
            
            Find moments that are engaging, surprising, emotional, or contain valuable information. Look for:
            - Memorable quotes or statements
            - Surprising revelations
            - Emotional moments
            - Valuable advice or insights
            - Controversial or thought-provoking statements
            
            Respond in JSON format with an array of clips. Each clip should include:
            - start: the start time in seconds (float)
            - end: the end time in seconds (float, approximately 30 seconds after start)
            - subtitle: the transcript text for this clip
            - caption: a catchy, attention-grabbing caption for social media
            
            Transcript:
            {full_transcript}
            
            Respond ONLY with valid JSON like this: 
            {{
                "clips": [
                    {{
                        "start": 120.5,
                        "end": 150.2,
                        "subtitle": "This is the transcript text for this clip",
                        "caption": "You won't believe what happens next! #viral"
                    }}
                ]
            }}
            """
            
            # Get completion from GPT-3.5
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that identifies viral clips from video transcripts."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            clips_data = json.loads(response.choices[0].message.content)
            clips = clips_data.get("clips", [])
            
            if not clips:
                logger.warning("No viral clips identified by GPT")
                # Create at least one clip if none identified
                clips = [{
                    "start": 0,
                    "end": min(30, duration),
                    "subtitle": "Highlight clip",
                    "caption": "Check out this highlight! #viral"
                }]
            
            logger.info(f"Identified {len(clips)} potential viral clips")
            
        except Exception as e:
            logger.error(f"Error identifying viral clips: {str(e)}")
            # Create a default clip
            clips = [{
                "start": 0,
                "end": min(30, duration),
                "subtitle": "Highlight clip",
                "caption": "Check out this highlight! #viral"
            }]
        
        # Process and create each clip
        processed_clips = []
        
        for i, clip in enumerate(clips):
            try:
                clip_start = clip["start"]
                clip_end = clip["end"]
                subtitle = clip["subtitle"]
                caption = clip["caption"]
                
                # Ensure clip is not longer than 60 seconds
                if clip_end - clip_start > 60:
                    clip_end = clip_start + 30
                
                # Ensure clip doesn't exceed video duration
                if clip_end > duration:
                    clip_end = duration
                    if clip_end - clip_start < 5:  # If resulting clip is too short
                        continue
                
                # Update task state
                self.update_state(state='PROGRESS', meta={
                    'status': 'Processing clip ', 
                    'percent_complete': 50
                })
                
                # Create clip output path
                clip_filename = f"{unique_id}_clip_{i+1}.mp4"
                temp_clip_path = os.path.join(TEMP_DIR, clip_filename)
                
                # Calculate output dimensions for 9:16 aspect ratio
                target_height = 1920
                target_width = 1080
                
                # Create a subtitle file instead of embedding directly in command
                subtitle_file = os.path.join(TEMP_DIR, f"{unique_id}_subtitle_{i+1}.txt")
                with open(subtitle_file, 'w') as f:
                    f.write(subtitle)
                
                # Create the clip using FFmpeg with a safer approach
                self.update_state(state='PROGRESS', meta={
                'status': 'Saving results to database', 
                'percent_complete': 70
                })
                # First create the clip without subtitles
                ffmpeg_cmd = [
                    'ffmpeg',
                    '-ss', str(clip_start),
                    '-i', temp_video_path,
                    '-t', str(clip_end - clip_start),
                    '-vf', f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2",
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-y',  # Overwrite output file if it exists
                    temp_clip_path
                ]
                
                subprocess.run(ffmpeg_cmd, check=True)
                
                # Now add subtitles as a separate overlay text (if subtitle is not empty)
                if subtitle.strip():
                    temp_with_subtitle_path = os.path.join(TEMP_DIR, f"{unique_id}_clip_sub_{i+1}.mp4")
                    
                    # Read subtitle from file to avoid command line issues
                    with open(subtitle_file, 'r') as f:
                        subtitle_text = f.read().strip().replace('\n', ' ')
                    
                    # Truncate subtitle if too long (prevent command line issues)
                    if len(subtitle_text) > 100:
                        subtitle_text = subtitle_text[:97] + "..."
                    
                    # Escape special characters for drawtext filter
                    subtitle_text = subtitle_text.replace("'", "'\\\\''").replace(':', '\\:').replace(',', '\\,')
                    
                    ffmpeg_subtitle_cmd = [
                        'ffmpeg',
                        '-i', temp_clip_path,
                        '-vf', f"drawtext=text='{subtitle_text}':fontcolor=yellow:fontsize=30:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-tw)/2:y=h-th-50",
                        '-c:a', 'copy',
                        '-y',
                        temp_with_subtitle_path
                    ]
                    
                    try:
                        subprocess.run(ffmpeg_subtitle_cmd, check=True)
                        # If successful, replace original clip with subtitled version
                        shutil.move(temp_with_subtitle_path, temp_clip_path)
                    except Exception as subtitle_error:
                        logger.error(f"Error adding subtitles: {str(subtitle_error)}")
                        # Continue with the clip without subtitles
                
                logger.info(f"Created clip {i+1}: {temp_clip_path}")
                
                # Upload clip to S3
                clip_s3_key = f"videos/{unique_id}/clips/{clip_filename}"
                s3_client.upload_file(
                    temp_clip_path, 
                    S3_BUCKET, 
                    clip_s3_key,
                    ExtraArgs={'ContentType': 'video/mp4'}
                )
                
                # Generate public URL for clip
                region = os.getenv("AWS_REGION", "us-east-1")
                clip_url = f"https://{S3_BUCKET}.s3.{region}.amazonaws.com/{clip_s3_key}"
                
                # Add clip to processed clips
                processed_clips.append({
                    "clipUrl": clip_url,
                    "subtitle": subtitle,
                    "caption": caption,
                })
                
                # Clean up temporary clip files
                os.remove(temp_clip_path)
                if os.path.exists(subtitle_file):
                    os.remove(subtitle_file)
                
            except Exception as e:
                logger.error(f"Error processing clip {i+1}: {str(e)}")
                continue
        
        # Save to database
        self.update_state(state='PROGRESS', meta={
            'status': 'Saving results to database', 
            'percent_complete': 95
        })
        
        try:
            # Create OpusClip document
            opusclip_doc = {
                "uniqueId": unique_id,
                "thumbnail": s3_thumbnail_url,
                "clips": processed_clips,
                "createdAt": datetime.now()
            }
            # find user by email
            if user_email:
                user = users_collection.find_one({"email": user_email})
                if not user:
                    logger.warning(f"User with email {user_email} not found in database.")
                else:
                    # Insert into database
                    result = users_collection.update_one(
                        {"email": user_email},
                        {"$push": {"opusclips": opusclip_doc}}
                    )
                    logger.info(f"Saved OpusClip to database with ID: {unique_id}")
            else:
                logger.warning("No user email provided, skipping database save")
            
        except Exception as e:
            logger.error(f"Error saving to database: {str(e)}")
            # Continue anyway to return the data
        
        # Clean up other temporary files
        for file_path in [temp_video_path, temp_audio_path, temp_transcript_path]:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Update task state to complete
        self.update_state(state='PROGRESS', meta={
            'status': 'Viral clip processing complete', 
            'percent_complete': 100
        })
        
        # Return the results
        return {
            "message": "Viral clip processing complete",
            "clips": processed_clips,
            "transcript": full_transcript,
            "gpt-clips_data": clips_data
        }
        
    except Exception as e:
        logger.error(f"Error in OpusClip processing task: {str(e)}")
        raise Exception(f"OpusClip processing failed: {str(e)}")