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
import time
import cv2

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

import re
from math import ceil

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

            cookies_path = "/tmp/cookies.txt"

            # Write cookies.txt from environment variable
            with open(cookies_path, "w") as f:
                f.write(os.environ["COOKIES_TXT"])
            
            # Download YouTube video
            ydl_opts = {
                'format': 'best[ext=mp4]/best',
                'outtmpl': temp_video_path,
                'quiet': False,
                'writethumbnail': True,
                'cookiefile': cookies_path,
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

            logger.info(f"Video duration: {video_duration} seconds")
        except Exception as e:
            logger.error(f"Error calculating duration: {str(e)}")
            video_duration = 0

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
            'video_duration': video_duration,
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
def process_opusclip(self, s3_video_url, s3_thumbnail_url, user_email=None, clips_duration=None, aspect_ratio=None, include_moments=None, subtitle_color=None, clip_range=None):
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
        
        # If clip_range is provided, trim the video
        self.update_state(state='PROGRESS', meta={
            'status': 'Trimming video', 
            'percent_complete': 15
        })

        if clip_range and isinstance(clip_range, (list, tuple)) and len(clip_range) == 2:
         clip_start = float(clip_range[0])
         clip_end = float(clip_range[1])
         clip_duration = clip_end - clip_start

         trimmed_video_path = os.path.join(TEMP_DIR, f"{unique_id}_trimmed.mp4")

         ffmpeg_trim_cmd = [
              'ffmpeg',
              '-ss', str(clip_start),  # Start time
               '-i', temp_video_path,   # Input original video
               '-t', str(clip_duration),  # Duration to keep
              '-c', 'copy',  # Copy codec (faster)
               '-y',  # Overwrite output
                trimmed_video_path
          ]

         try:
                subprocess.run(ffmpeg_trim_cmd, check=True)
                logger.info(f"Trimmed video from {clip_start}s to {clip_end}s.")
                temp_video_path = trimmed_video_path  # Replace path for next steps
         except Exception as e:
                logger.error(f"Error trimming video: {str(e)}")
                raise Exception("Failed to trim video.")
        
        # Extract audio from video
        self.update_state(state='PROGRESS', meta={
            'status': 'Extracting audio from video', 
            'percent_complete': 15
        })

        bitrates = ['32k', '24k', '16k']  # Try progressively lower bitrates
        max_size_bytes = 25 * 1024 * 1024  # 25 MB

        for bitrate in bitrates:
            try:
                ffmpeg_cmd = [
                    'ffmpeg',
                    '-i', temp_video_path,
                    '-vn',
                    '-ac', '1',
                    '-ar', '16000',
                    '-b:a', bitrate,
                    '-y',
                    temp_audio_path
                ]
                subprocess.run(ffmpeg_cmd, check=True)
                file_size = os.path.getsize(temp_audio_path)
                logger.info(f"Extracted audio with bitrate {bitrate}, size: {file_size / (1024 * 1024):.2f} MB")
        
                if file_size <= max_size_bytes:
                 break  # Success — file is within limit
                else:
                   logger.warning(f"Audio too large ({file_size / (1024 * 1024):.2f} MB) at bitrate {bitrate}, trying lower bitrate...")
            except Exception as e:
                logger.error(f"Error extracting audio at {bitrate}: {str(e)}")
                continue

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
                    timestamp_granularities=["segment", "word"]  # Request word-level timestamps
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
            identify up to 10 potential viral clips that must be at least {clips_duration} longer, but not shorter than {clips_duration}. max 10 clips.

            Find specific moments by user input: {include_moments}.
            - starting hook that attracts viewers
            - ending should complement the hook properly
            - emotional or surprising moments
            - moments that are likely to go viral
            
            Respond in JSON format with an array of clips. Each clip should include:
            - start: the start time in seconds (float)
            - end: the end time in seconds (float, approximately 30 seconds after start)
            - caption: a catchy, attention-grabbing caption for social media
            - virality_score: a score from 1% to 100% indicating how likely this clip is to go viral

            Transcript:
            {full_transcript}
            
            Respond ONLY with valid JSON like this: 
            {{
                "clips": [
                    {{
                        "start": 120.5,
                        "end": 150.2,
                        "caption": "You won't believe what happens next! ",
                        "virality_score": "85%"
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
                caption = clip["caption"]
                virality_score = clip.get("virality_score", "50%")  # Default to 50% if not provided

                # Ensure clip is not longer than 60 seconds
                if clip_end - clip_start > 60:
                    clip_end = clip_start + 30
                
                # Ensure clip doesn't exceed video duration
                if clip_end > duration:
                    clip_end = duration
                    if clip_end - clip_start < 5:  # If resulting clip is too short
                        continue
                
                # Update task state for each clip
                self.update_state(state='PROGRESS', meta={
                    'status': f'Processing clip {i+1}/{len(clips)}', 
                    'percent_complete': 50 + (i * 30 // len(clips))
                })

                clip_transcript_data = extract_clip_transcript_from_whisper(transcription, clip_start, clip_end)
                clip_duration = clip_end - clip_start
                
                logger.info(f"Clip {i+1} transcript: '{clip_transcript_data['text'][:100]}...'")
                logger.info(f"Clip {i+1} has {clip_transcript_data['word_count']} words")
                
                # Create clip output path
                clip_filename = f"{unique_id}_clip_{i+1}.mp4"
                temp_clip_path = os.path.join(TEMP_DIR, clip_filename)
                
                
                # First extract the clip segment
                temp_raw_clip = os.path.join(TEMP_DIR, f"{unique_id}_raw_clip_{i+1}.mp4")
                ffmpeg_extract_cmd = [
                    'ffmpeg',
                    '-ss', str(clip_start),
                    '-i', temp_video_path,
                    '-t', str(clip_end - clip_start),
                    '-c:v', 'libx264',
                    '-preset', 'fast',
                    '-crf', '23', 
                    '-threads', '2',
                    '-max_muxing_queue_size', '512',
                    '-b:a', '64k', 
                    '-c:a', 'aac',
                    '-y',
                    temp_raw_clip
                ]
                subprocess.run(ffmpeg_extract_cmd, check=True)
                logger.info(f"Extracted raw clip: {temp_raw_clip}")
                

                success = create_ultra_high_quality_clip_with_accurate_subtitles(
                    temp_raw_clip, temp_clip_path, clip_transcript_data, 
                    clip_duration, unique_id, i, subtitle_color, aspect_ratio
                )

                if not success:
                    logger.error(f"Failed to create high-quality clip: {temp_clip_path}")
                    continue
                
                # Verify clip was created
                if not os.path.exists(temp_clip_path) or os.path.getsize(temp_clip_path) < 1000:
                    logger.error(f"Clip creation failed or produced invalid file: {temp_clip_path}")
                    continue
                
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
                    "subtitle": clip_transcript_data['text'],
                    "caption": caption,
                    "viralityScore": virality_score,
                })
                
                # Clean up temporary clip files
                for file_path in [temp_raw_clip, temp_clip_path, temp_transcript_path]:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                
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
            "gpt_clips_data": clips_data
        }
        
    except Exception as e:
        logger.error(f"Error in OpusClip processing task: {str(e)}")
        raise Exception(f"OpusClip processing failed: {str(e)}")
    
# Enhanced subtitle generation functions for OpusClip-style subtitles

def detect_faces_in_video(video_path, num_frames=5):
    """
    Detect faces in video and return the average face position
    
    Args:
        video_path (str): Path to the video file
        num_frames (int): Number of frames to analyze
        
    Returns:
        dict: Contains face detection results with center coordinates
    """
    try:
        # Initialize face detector
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Could not open video: {video_path}")
            return None
            
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        logger.info(f"Video dimensions: {width}x{height}, total frames: {total_frames}")
        
        face_positions = []
        frame_interval = max(1, total_frames // num_frames)
        
        for i in range(0, min(total_frames, num_frames * frame_interval), frame_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            
            if not ret:
                continue
                
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            # If faces found, calculate center
            if len(faces) > 0:
                # Use the largest face
                largest_face = max(faces, key=lambda x: x[2] * x[3])
                x, y, w, h = largest_face
                
                face_center_x = x + w // 2
                face_center_y = y + h // 2
                
                face_positions.append({
                    'x': face_center_x,
                    'y': face_center_y,
                    'frame': i
                })
                
                logger.info(f"Face detected in frame {i} at ({face_center_x}, {face_center_y})")
        
        cap.release()
        
        if face_positions:
            # Calculate average face position
            avg_x = sum(pos['x'] for pos in face_positions) / len(face_positions)
            avg_y = sum(pos['y'] for pos in face_positions) / len(face_positions)
            
            return {
                'faces_found': True,
                'face_center_x': int(avg_x),
                'face_center_y': int(avg_y),
                'video_width': width,
                'video_height': height,
                'num_faces_detected': len(face_positions)
            }
        else:
            logger.info("No faces detected in video")
            return {
                'faces_found': False,
                'video_width': width,
                'video_height': height
            }
            
    except Exception as e:
        logger.error(f"Error in face detection: {str(e)}")
        return None


def get_final_dimensions_and_filter(aspect_ratio, crop_params):
    """
    Get final output dimensions and create appropriate filter for aspect ratio
    FIXED: Properly handle 1:1 and 16:9 content in 9:16 container with letterboxing
    
    Args:
        aspect_ratio (str): Target aspect ratio ("9:16", "1:1", "16:9")
        crop_params (dict): Crop parameters from calculate_crop_parameters
        
    Returns:
        dict: Contains final dimensions and filter string
    """
    # Always output to 9:16 format (1080x1920) for social media
    final_width, final_height = 1080, 1920
    
    # First crop the video based on the content aspect ratio
    filter_parts = []
    filter_parts.append(f"crop={crop_params['crop_width']}:{crop_params['crop_height']}:{crop_params['crop_x']}:{crop_params['crop_y']}")
    
    # Calculate the aspect ratio of the cropped content
    crop_aspect = crop_params['crop_width'] / crop_params['crop_height']
    
    logger.info(f"Crop aspect: {crop_aspect:.4f}, Content aspect ratio: {aspect_ratio}")
    
    if aspect_ratio == "9:16":
        # For 9:16 content, scale to fill the entire 1080x1920 frame
        filter_parts.append(f"scale={final_width}:{final_height}:flags=lanczos")
        
    elif aspect_ratio == "1:1":
        # For 1:1 (square) content, maintain square aspect ratio in 9:16 container
        # Scale to fit width while maintaining square proportions
        square_size = final_width  # 1080x1080 square
        
        # Scale to square dimensions
        filter_parts.append(f"scale={square_size}:{square_size}:flags=lanczos")
        
        # Add black letterboxing (top and bottom bars)
        y_offset = (final_height - square_size) // 2  # Center vertically
        filter_parts.append(f"pad={final_width}:{final_height}:0:{y_offset}:black")
        
    elif aspect_ratio == "16:9":
        # For 16:9 content, maintain 16:9 aspect ratio in 9:16 container
        # Scale to fit width while maintaining 16:9 proportions
        landscape_width = final_width  # 1080
        landscape_height = int(final_width * 9 / 16)  # 1080 * 9/16 = 607.5 ≈ 608
        
        # Ensure height is even
        if landscape_height % 2 != 0:
            landscape_height -= 1
            
        # Scale to 16:9 dimensions that fit within the container
        filter_parts.append(f"scale={landscape_width}:{landscape_height}:flags=lanczos")
        
        # Add black letterboxing (top and bottom bars)
        y_offset = (final_height - landscape_height) // 2  # Center vertically
        filter_parts.append(f"pad={final_width}:{final_height}:0:{y_offset}:black")
        
    else:
        # Default to 9:16 behavior
        filter_parts.append(f"scale={final_width}:{final_height}:flags=lanczos")
    
    logger.info(f"Final output: {final_width}x{final_height} with aspect ratio preservation")
    
    return {
        'final_width': final_width,
        'final_height': final_height,
        'filter_string': ','.join(filter_parts)
    }


def calculate_crop_parameters(video_width, video_height, face_data=None, aspect_ratio="9:16"):
    """
    Calculate optimal crop parameters for different aspect ratios
    UPDATED: Minimal cropping for 1:1 and 16:9 to preserve content
    
    Args:
        video_width (int): Original video width
        video_height (int): Original video height
        face_data (dict): Face detection results
        aspect_ratio (str): Target aspect ratio ("9:16", "1:1", "16:9")
        
    Returns:
        dict: Crop parameters for ffmpeg
    """
    current_aspect_ratio = video_width / video_height
    
    logger.info(f"Original video: {video_width}x{video_height} (aspect: {current_aspect_ratio:.4f})")
    logger.info(f"Target content aspect ratio: {aspect_ratio}")
    
    if aspect_ratio == "1:1":
        # For square output, take the largest possible square from the center
        min_dimension = min(video_width, video_height)
        target_width = min_dimension
        target_height = min_dimension
        
        crop_x = (video_width - target_width) // 2
        crop_y = (video_height - target_height) // 2
        
        # If faces detected, try to center around face
        if face_data and face_data.get('faces_found'):
            face_x = face_data['face_center_x']
            face_y = face_data['face_center_y']
            
            # Adjust crop to center around face while keeping square
            crop_x = max(0, min(face_x - target_width // 2, video_width - target_width))
            crop_y = max(0, min(face_y - target_height // 2, video_height - target_height))
        
    elif aspect_ratio == "16:9":
        # For 16:9 output, minimal cropping to get closest to 16:9
        target_aspect_ratio = 16/9  # 1.7778
        
        if current_aspect_ratio > target_aspect_ratio:
            # Video is wider than 16:9, crop width
            target_height = video_height
            target_width = int(video_height * target_aspect_ratio)
            crop_x = (video_width - target_width) // 2
            crop_y = 0
            
            # Center around face if detected
            if face_data and face_data.get('faces_found'):
                face_x = face_data['face_center_x']
                crop_x = max(0, min(face_x - target_width // 2, video_width - target_width))
                
        else:
            # Video is taller than 16:9, crop height
            target_width = video_width
            target_height = int(video_width / target_aspect_ratio)
            crop_x = 0
            crop_y = (video_height - target_height) // 2
            
            # Center around face if detected
            if face_data and face_data.get('faces_found'):
                face_y = face_data['face_center_y']
                crop_y = max(0, min(face_y - target_height // 2, video_height - target_height))
            
    else:  # 9:16 or default
        # For vertical video, more aggressive cropping is acceptable
        target_aspect_ratio = 9/16  # 0.5625
        
        if current_aspect_ratio > target_aspect_ratio:
            # Video is wider than target - need to crop width
            target_width = int(video_height * target_aspect_ratio)
            target_height = video_height
            
            if face_data and face_data.get('faces_found'):
                # Center crop around face
                face_x = face_data['face_center_x']
                crop_x = max(0, min(face_x - target_width // 2, video_width - target_width))
            else:
                # Center crop
                crop_x = (video_width - target_width) // 2
                
            crop_y = 0
            
        else:
            # Video is taller than target - need to crop height
            target_width = video_width
            target_height = int(video_width / target_aspect_ratio)
            
            if face_data and face_data.get('faces_found'):
                # Center crop around face
                face_y = face_data['face_center_y']
                crop_y = max(0, min(face_y - target_height // 2, video_height - target_height))
            else:
                # Center crop
                crop_y = (video_height - target_height) // 2
                
            crop_x = 0
    
    # Ensure crop parameters are valid and even numbers for video encoding
    target_width = min(target_width, video_width)
    target_height = min(target_height, video_height)
    
    # Make dimensions even for video encoding compatibility
    if target_width % 2 != 0:
        target_width -= 1
    if target_height % 2 != 0:
        target_height -= 1
    
    crop_x = max(0, min(crop_x, video_width - target_width))
    crop_y = max(0, min(crop_y, video_height - target_height))
    
    logger.info(f"Crop parameters: {target_width}x{target_height} at ({crop_x}, {crop_y})")
    
    return {
        'crop_x': crop_x,
        'crop_y': crop_y,
        'crop_width': target_width,
        'crop_height': target_height,
        'aspect_ratio': aspect_ratio
    }

def create_ultra_high_quality_clip_with_accurate_subtitles(temp_raw_clip, temp_clip_path, clip_transcript_data, clip_duration, unique_id, clip_idx, subtitle_color, aspect_ratio="9:16"):
    """
    Create ultra high-quality clip with accurate karaoke-style subtitles and proper aspect ratio handling
    """
    try:
        logger.info(f"Processing clip {clip_idx} with karaoke-style subtitles for aspect ratio {aspect_ratio}")
        
        # Step 1: Face detection and crop calculation
        face_data = detect_faces_in_video(temp_raw_clip)
        
        if face_data:
            crop_params = calculate_crop_parameters(
                face_data['video_width'], 
                face_data['video_height'], 
                face_data,
                aspect_ratio
            )
        else:
            # Fallback crop calculation
            ffprobe_cmd = [
                'ffprobe', '-v', 'error', '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height', '-of', 'json', temp_raw_clip
            ]
            result = subprocess.run(ffprobe_cmd, capture_output=True, text=True)
            video_info = json.loads(result.stdout)
            width = int(video_info['streams'][0]['width'])
            height = int(video_info['streams'][0]['height'])
            crop_params = calculate_crop_parameters(width, height, None, aspect_ratio)
        
        # Step 2: Get final dimensions and create base filter
        dimensions_data = get_final_dimensions_and_filter(aspect_ratio, crop_params)
        filter_complex = dimensions_data['filter_string']
        
        logger.info(f"Final output will be {dimensions_data['final_width']}x{dimensions_data['final_height']}")
        
        # Step 3: Get accurate word timing from clip transcript
        words_data = clip_transcript_data['words']
        
        if not words_data:
            # Fallback to splitting text evenly if no word timing available
            text_words = clip_transcript_data['text'].split()
            word_duration = clip_duration / len(text_words) if text_words else clip_duration
            
            words_data = []
            for i, word in enumerate(text_words):
                words_data.append({
                    'word': word,
                    'start': i * word_duration,
                    'end': (i + 1) * word_duration
                })
        
        # **CRITICAL FIX**: Ensure all word timings are relative to clip start (0-based)
        logger.info("Adjusting word timings to be relative to clip start...")
        for word_data in words_data:
            # Ensure no negative timing and clip to duration
            word_data['start'] = max(0, word_data['start'])
            word_data['end'] = min(clip_duration, word_data['end'])
        
        # Step 4: Create subtitle lines with proper text wrapping
        subtitle_lines = []
        current_line_words = []
        max_chars_per_line = 20
        max_words_per_line = 3
        
        for word_data in words_data:
            current_line_text = ' '.join([w['word'].strip() for w in current_line_words])
            potential_line_text = current_line_text + ' ' + word_data['word'].strip() if current_line_words else word_data['word'].strip()
            
            should_break = (
                len(current_line_words) >= max_words_per_line or
                len(potential_line_text) > max_chars_per_line or
                word_data == words_data[-1]
            )
            
            if should_break and current_line_words:
                line_text = ' '.join([w['word'].strip() for w in current_line_words])
                line_start = current_line_words[0]['start']
                line_end = current_line_words[-1]['end']
                
                subtitle_lines.append({
                    'words': current_line_words.copy(),
                    'start_time': line_start,
                    'end_time': line_end,
                    'text': line_text.upper()
                })
                current_line_words = [word_data] if word_data != words_data[-1] else []
            else:
                current_line_words.append(word_data)
        
        # Handle last line if it exists
        if current_line_words:
            line_text = ' '.join([w['word'].strip() for w in current_line_words])
            line_start = current_line_words[0]['start']
            line_end = current_line_words[-1]['end']
            
            subtitle_lines.append({
                'words': current_line_words.copy(),
                'start_time': line_start,
                'end_time': line_end,
                'text': line_text.upper()
            })
        
        logger.info(f"Created {len(subtitle_lines)} subtitle lines for clip timing")
        
        # Step 5: Add karaoke-style subtitles with aspect ratio aware positioning
        for line_idx, subtitle_line in enumerate(subtitle_lines):
            line_text = subtitle_line['text']
            line_start = subtitle_line['start_time']
            line_end = subtitle_line['end_time']
            
            # Ensure valid timing
            if line_end <= line_start:
                line_end = line_start + 0.5
            
            # Clean text for ffmpeg
            safe_line_text = clean_text_for_karaoke(line_text)
            
            # Adjust font size and positioning based on aspect ratio
            if aspect_ratio == "9:16":
                font_size = 64
                y_position = "h*0.78"
            elif aspect_ratio == "1:1":
                font_size = 56
                y_position = "h*0.85"  # Lower position for square format
            elif aspect_ratio == "16:9":
                font_size = 48
                y_position = "h*0.88"  # Lower position for landscape
            else:
                font_size = 64
                y_position = "h*0.78"
            
            from pathlib import Path
            font_path = Path("assets/Roboto-Bold.ttf").resolve()

            # Set subtitle color dynamically
            if subtitle_color == "yellow":
                font_color = "#FFFF00"
            elif subtitle_color == "green":
                font_color = "#00FF00"
            elif subtitle_color == "white":
                font_color = "#FFFFFF"
                if aspect_ratio == "1:1":
                    y_position = "(h-text_h)/2"  # Centered vertically for white text in square
                elif aspect_ratio == "16:9":
                    y_position = "(h-text_h)/2"  # Centered vertically for white text in landscape
            else:
                font_color = "#FFFFFF"
            
            # Add the subtitle
            filter_complex += f",drawtext=text='{safe_line_text}':" \
                             f"fontcolor={font_color}:" \
                             f"fontsize={font_size}:" \
                             f"x=(w-text_w)/2:" \
                             f"y={y_position}:" \
                             f"enable='between(t,{line_start:.3f},{line_end:.3f})':" \
                             f"fontfile='{font_path}'"
        
        # Step 6: Create ultra high-quality FFmpeg command
        ffmpeg_cmd = [
            'ffmpeg',
            '-i', temp_raw_clip,
            '-vf', filter_complex,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '22',
            '-level:v', '4.1',
            '-pix_fmt', 'yuv420p',
            '-threads', '2',
            '-max_muxing_queue_size', '2048',
            '-b:a', '128k',
            '-c:a', 'aac',
            '-ar', '44100',
            '-ac', '2',
            '-y',
            temp_clip_path
        ]
        
        logger.info(f"Executing FFmpeg command for clip {clip_idx} with aspect ratio {aspect_ratio}")
        logger.info(f"Filter: {filter_complex}")
        
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg failed for clip {clip_idx}: {result.stderr}")
            return False
        
        # Verify the output
        if not os.path.exists(temp_clip_path) or os.path.getsize(temp_clip_path) < 1000:
            logger.error(f"Clip creation failed or produced invalid file: {temp_clip_path}")
            return False
        
        logger.info(f"Successfully created clip {clip_idx} with karaoke-style subtitles and {aspect_ratio} aspect ratio")
        return True
        
    except Exception as e:
        logger.error(f"Error creating clip {clip_idx}: {str(e)}")
        return False


def extract_clip_transcript_from_whisper(transcription_data, clip_start, clip_end):
    """
    FIXED: Enhanced function to extract exact transcript text with precise timing for the clip
    
    Args:
        transcription_data: Whisper transcription with segments and words
        clip_start (float): Start time of clip in seconds (absolute time from original video)
        clip_end (float): End time of clip in seconds (absolute time from original video)
        
    Returns:
        dict: Contains transcript text and word-level timing data relative to clip start (0-based)
    """
    try:
        clip_words = []
        clip_text = ""
        
        logger.info(f"Extracting transcript for clip: {clip_start:.3f}s to {clip_end:.3f}s")
        
        if hasattr(transcription_data, 'segments'):
            for segment in transcription_data.segments:
                segment_start = segment.start
                segment_end = segment.end
                
                # Check if segment overlaps with our clip timeframe
                if segment_start < clip_end and segment_end > clip_start:
                    logger.info(f"Processing segment: {segment_start:.3f}s to {segment_end:.3f}s")
                    
                    # If we have word-level data (preferred)
                    if hasattr(segment, 'words') and segment.words:
                        for word_data in segment.words:
                            word_start = word_data.start
                            word_end = word_data.end
                            
                            # Include words that overlap with the clip timeframe
                            if word_start < clip_end and word_end > clip_start:
                                # **CRITICAL FIX**: Convert absolute timing to relative timing (clip-based)
                                # Subtract clip_start to make timing relative to clip beginning
                                relative_start = max(0, word_start - clip_start)
                                relative_end = min(clip_end - clip_start, word_end - clip_start)
                                
                                # Ensure we don't have negative or invalid timing
                                if relative_end > relative_start and relative_start >= 0:
                                    word_text = word_data.word.strip()
                                    
                                    clip_words.append({
                                        'word': word_text,
                                        'start': relative_start,  # Now 0-based for the clip
                                        'end': relative_end,      # Now 0-based for the clip
                                        'original_start': word_start,  # Keep original for reference
                                        'original_end': word_end       # Keep original for reference
                                    })
                                    
                                    clip_text += word_text + " "
                                    logger.debug(f"Added word: '{word_text}' at {relative_start:.3f}s-{relative_end:.3f}s (clip-relative)")
                    else:
                        # Fallback to segment text if no word-level data
                        overlap_start = max(segment_start, clip_start)
                        overlap_end = min(segment_end, clip_end)
                        
                        if overlap_end > overlap_start:
                            # Create artificial word timing for segment
                            segment_text = segment.text.strip()
                            words = segment_text.split()
                            
                            if words:
                                word_duration = (overlap_end - overlap_start) / len(words)
                                
                                for i, word in enumerate(words):
                                    word_abs_start = overlap_start + (i * word_duration)
                                    word_abs_end = overlap_start + ((i + 1) * word_duration)
                                    
                                    # Convert to clip-relative timing
                                    relative_start = max(0, word_abs_start - clip_start)
                                    relative_end = min(clip_end - clip_start, word_abs_end - clip_start)
                                    
                                    clip_words.append({
                                        'word': word,
                                        'start': relative_start,
                                        'end': relative_end,
                                        'original_start': word_abs_start,
                                        'original_end': word_abs_end
                                    })
                            
                            clip_text += segment_text + " "
                            logger.info(f"Added segment text with artificial timing: '{segment_text}'")
        
        # Sort words by start time to ensure proper order
        clip_words.sort(key=lambda x: x['start'])
        
        # **VALIDATION**: Ensure all timings are within clip duration
        clip_duration = clip_end - clip_start
        for word in clip_words:
            if word['start'] > clip_duration or word['end'] > clip_duration:
                logger.warning(f"Word timing exceeds clip duration: '{word['word']}' {word['start']:.3f}-{word['end']:.3f}s (clip duration: {clip_duration:.3f}s)")
                word['end'] = min(word['end'], clip_duration)
                word['start'] = min(word['start'], clip_duration)
        
        result = {
            'text': clip_text.strip(),
            'words': clip_words,
            'word_count': len(clip_words)
        }
        
        logger.info(f"Extracted {len(clip_words)} words for clip")
        logger.info(f"Clip text preview: '{clip_text.strip()[:100]}...'")
        logger.info(f"First word timing: {clip_words[0]['start']:.3f}-{clip_words[0]['end']:.3f}s" if clip_words else "No words")
        logger.info(f"Last word timing: {clip_words[-1]['start']:.3f}-{clip_words[-1]['end']:.3f}s" if clip_words else "No words")
        
        return result
        
    except Exception as e:
        logger.error(f"Error extracting clip transcript: {str(e)}")
        return {
            'text': "Unable to extract transcript",
            'words': [],
            'word_count': 0
        }


def clean_text_for_karaoke(text):
    """Enhanced text cleaning for karaoke-style subtitles"""
    # Remove problematic characters for FFmpeg
    text = text.replace("'", "").replace('"', '').replace('\\', '')
    text = text.replace(':', '').replace(';', '').replace('|', '')
    text = text.replace('=', '').replace('+', '').replace('*', '')
    text = text.replace('%', '').replace('$', '').replace('#', '')
    
    # Keep basic punctuation but remove complex characters
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Ensure text isn't empty
    if not text:
        text = "..."
    
    return text