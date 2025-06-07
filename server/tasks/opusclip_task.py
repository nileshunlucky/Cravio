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
            
            # Calculate credit usage: 1 minute = 3 credits, minimum 3 credits
            duration_minutes = video_duration / 60
            # check if videoduration is greater than 2hrs return error less than 2hrs
            if duration_minutes > 120:
                raise Exception("Video duration is greater than 2 hours")
            credit_usage = max(3, int(3 * round(duration_minutes + 0.5)))
            
            logger.info(f"Video duration: {video_duration} seconds ({duration_minutes:.2f} minutes)")
            logger.info(f"Credit usage: {credit_usage} credits")
        except Exception as e:
            logger.error(f"Error calculating duration: {str(e)}")
            video_duration = 0
            credit_usage = 3  # Default minimum
        
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
            identify up to 10 potential viral clips that are approximately 30 seconds each.
            
            Find moments that are engaging, surprising, emotional, or contain valuable information. Look for:
            - starting hook that attracts viewers
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
            - virality_score: a score from 1% to 100% indicating how likely this clip is to go viral

            Transcript:
            {full_transcript}
            
            Respond ONLY with valid JSON like this: 
            {{
                "clips": [
                    {{
                        "start": 120.5,
                        "end": 150.2,
                        "subtitle": "This is the transcript text for this clip",
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
        
        # Helper function for word-level SRT generation
        def create_word_level_srt(subtitle_text, clip_start, clip_end, transcription_data, clip_idx):
            """
            Creates an SRT file with word-level timing for better audio synchronization.
            
            Args:
                subtitle_text (str): The full subtitle text for the clip
                clip_start (float): Start time of the clip in seconds
                clip_end (float): End time of the clip in seconds
                transcription_data: The Whisper transcription data with word-level timestamps
                clip_idx (int): The index of the current clip
                
            Returns:
                str: Formatted SRT content
            """
            # Extract words from the subtitle text
            subtitle_words = subtitle_text.strip().lower().split()
            
            try:
                # Try to use word-level timestamps from Whisper if available
                if hasattr(transcription_data, 'segments'):
                    # Create a list of all words with their timestamps
                    all_words = []
                    for segment in transcription_data.segments:
                        # Check if segment has word-level timestamps
                        if hasattr(segment, 'words') and segment.words:
                            for word_data in segment.words:
                                if hasattr(word_data, 'word') and hasattr(word_data, 'start') and hasattr(word_data, 'end'):
                                    all_words.append({
                                        'word': word_data.word.strip().lower(),
                                        'start': word_data.start,
                                        'end': word_data.end
                                    })
                
                    # Filter words that are within our clip timeframe
                    clip_words = [w for w in all_words if w['start'] >= clip_start and w['end'] <= clip_end]
                    
                    # If we found matching words with timestamps
                    if clip_words:
                        srt_content = ""
                        for i, word_data in enumerate(clip_words):
                            word = word_data['word'].strip().lower().strip('.,!?;:"\'')
                            # Skip empty words
                            if not word:
                                continue
                                
                            # Adjust timing to be relative to clip start
                            word_start = word_data['start'] - clip_start
                            word_end = word_data['end'] - clip_start
                            
                            # Format times as HH:MM:SS,mmm
                            start_time = time.strftime('%H:%M:%S', time.gmtime(word_start)) + f",{int((word_start % 1) * 1000):03d}"
                            end_time = time.strftime('%H:%M:%S', time.gmtime(word_end)) + f",{int((word_end % 1) * 1000):03d}"
                            
                            # Add this word to SRT content
                            srt_content += f"{i+1}\n{start_time} --> {end_time}\n{word_data['word'].strip()}\n\n"
                        
                        if srt_content:
                            return srt_content
            
            except Exception as e:
                logger.warning(f"Error creating word-level SRT from Whisper data for clip {clip_idx}: {str(e)}")
            
            # Fallback: Evenly distribute words across the clip duration
            words = subtitle_text.split()
            total_words = len(words)
            
            # Calculate duration for each word
            clip_duration = clip_end - clip_start
            word_duration = clip_duration / total_words if total_words > 0 else clip_duration
            
            srt_content = ""
            line_num = 1
            
            for i in range(total_words):
                # Calculate timing for this word
                word_start = clip_start + (i * word_duration)
                word_end = word_start + word_duration
                
                # Format times as HH:MM:SS,mmm
                # For the SRT file, we need to adjust to be relative to the clip start
                relative_start = word_start - clip_start
                relative_end = word_end - clip_start
                
                start_time = time.strftime('%H:%M:%S', time.gmtime(relative_start)) + f",{int((relative_start % 1) * 1000):03d}"
                end_time = time.strftime('%H:%M:%S', time.gmtime(relative_end)) + f",{int((relative_end % 1) * 1000):03d}"
                
                # Add this word to SRT content
                srt_content += f"{line_num}\n{start_time} --> {end_time}\n{words[i]}\n\n"
                line_num += 1
            
            return srt_content
        
        # Process and create each clip
        processed_clips = []
        
        for i, clip in enumerate(clips):
            try:
                clip_start = clip["start"]
                clip_end = clip["end"]
                subtitle = clip["subtitle"]
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
                
                # Create clip output path
                clip_filename = f"{unique_id}_clip_{i+1}.mp4"
                temp_clip_path = os.path.join(TEMP_DIR, clip_filename)
                
                # Set target dimensions
                target_height = 1920
                target_width = 1080

                # Create subtitle file with improved word-level formatting
                subtitle_file = os.path.join(TEMP_DIR, f"{unique_id}_subtitle_{i+1}.srt")

                # Create word-level SRT content with whisper timestamps if available
                srt_content = create_word_level_srt(subtitle, clip_start, clip_end, transcription, i)

                with open(subtitle_file, 'w') as f:
                    f.write(srt_content)
                logger.info(f"Created word-level SRT subtitle file: {subtitle_file}")
                
                # First extract the clip segment
                temp_raw_clip = os.path.join(TEMP_DIR, f"{unique_id}_raw_clip_{i+1}.mp4")
                ffmpeg_extract_cmd = [
                    'ffmpeg',
                    '-ss', str(clip_start),
                    '-i', temp_video_path,
                    '-t', str(clip_end - clip_start),
                    '-c:v', 'libx264',
                    '-preset', 'ultrafast',
                    '-crf', '28', 
                    '-threads', '2',
                    '-max_muxing_queue_size', '512',
                    '-b:a', '64k', 
                    '-c:a', 'aac',
                    '-y',
                    temp_raw_clip
                ]
                subprocess.run(ffmpeg_extract_cmd, check=True)
                logger.info(f"Extracted raw clip: {temp_raw_clip}")
                
                # Now create the final clip with proper aspect ratio and subtitles
                # Fix backslash issue in path for subtitles
                subtitle_path = subtitle_file.replace('\\', '/')
                
                # Enhanced subtitle styling with ASS filter for better control
                # Yellow bold font in center as requested
                ass_style = ("FontName=Arial,FontSize=24,PrimaryColour=&H0000FFFF,SecondaryColour=&H0000FFFF,"
                             "OutlineColour=&H000000,BackColour=&H80000000,Bold=1,Alignment=2,MarginV=30,"
                             "BorderStyle=3,Outline=2,Shadow=1")
                
                filter_complex = f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2[v];"
                filter_complex += f"[v]subtitles='{subtitle_path}':force_style='{ass_style}'[outv]"
                
                ffmpeg_process_cmd = [
                    'ffmpeg',
                    '-i', temp_raw_clip,
                    '-filter_complex', filter_complex,
                    '-map', '[outv]',
                    '-map', '0:a',
                    '-c:v', 'libx264',
                    '-preset', 'ultrafast',
                    '-crf', '28', 
                    '-threads', '2',
                    '-max_muxing_queue_size', '512',
                    '-b:a', '64k', 
                    '-c:a', 'aac',
                    '-y',
                    temp_clip_path
                ]
                
                try:
                    subprocess.run(ffmpeg_process_cmd, check=True)
                    logger.info(f"Created final clip with improved subtitles: {temp_clip_path}")
                except Exception as e:
                    logger.error(f"Error creating clip with subtitles: {str(e)}")
                    
                    # Enhanced fallback method with better subtitle styling
                    try:
                        # Create a temporary ASS subtitle file for better control
                        ass_file = os.path.join(TEMP_DIR, f"{unique_id}_subtitle_{i+1}.ass")
                        
                        # Basic ASS header with yellow bold font
                        ass_header = """[Script Info]
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&H0000FFFF,&H0000FFFF,&H000000,&H80000000,1,0,0,0,100,100,0,0,3,2,1,2,10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
                        
                        # Parse the SRT content and convert to ASS
                        ass_content = ass_header
                        lines = srt_content.strip().split('\n\n')
                        for line in lines:
                            parts = line.split('\n')
                            if len(parts) >= 3:
                                timecode = parts[1].replace(',', '.')
                                start_time, end_time = timecode.split(' --> ')
                                text = parts[2]
                                
                                # Add event line
                                ass_content += f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{text}\n"
                        
                        with open(ass_file, 'w') as f:
                            f.write(ass_content)
                        
                        # Use the ASS file with ffmpeg
                        ass_path = ass_file.replace('\\', '/')
                        filter_complex = f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2[v];"
                        filter_complex += f"[v]ass='{ass_path}'[outv]"
                        
                        fallback_cmd = [
                            'ffmpeg',
                            '-i', temp_raw_clip,
                            '-filter_complex', filter_complex,
                            '-map', '[outv]',
                            '-map', '0:a',
                            '-c:v', 'libx264',
                            '-preset', 'ultrafast',
                           '-crf', '28', 
                           '-threads', '2',
                           '-max_muxing_queue_size', '512',
                           '-b:a', '64k', 
                            '-c:a', 'aac',
                            '-y',
                            temp_clip_path
                        ]
                        
                        subprocess.run(fallback_cmd, check=True)
                        logger.info(f"Created clip with ASS subtitle fallback: {temp_clip_path}")
                        
                        # Clean up ASS file
                        if os.path.exists(ass_file):
                            os.remove(ass_file)
                            
                    except Exception as fallback_error:
                        logger.error(f"ASS subtitle fallback also failed: {str(fallback_error)}")
                        
                        # Fallback: Use drawtext filter for each word with proper timing
                        try:
                            # Parse the SRT content to get word timing
                            words_data = []
                            lines = srt_content.strip().split('\n\n')
                            for line in lines:
                                parts = line.split('\n')
                                if len(parts) >= 3:
                                    timecode = parts[1]
                                    start_time_str, end_time_str = timecode.split(' --> ')
                                    
                                    # Convert timestamp to seconds
                                    def timestamp_to_seconds(ts):
                                        h, m, s = ts.split(':')
                                        s, ms = s.split(',')
                                        return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
                                    
                                    start_seconds = timestamp_to_seconds(start_time_str)
                                    end_seconds = timestamp_to_seconds(end_time_str)
                                    
                                    words_data.append({
                                        'text': parts[2],
                                        'start': start_seconds,
                                        'end': end_seconds
                                    })
                            
                            # Create a complex filter for each word with precise timing
                            filter_chain = f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2"
                            
                            clip_duration = clip_end - clip_start
                            
                            for idx, word_data in enumerate(words_data):
                                # Make sure word is safe for filter
                                safe_word = word_data['text'].replace("'", "").replace('"', "").replace(':', "").replace(',', "")
                                
                                # Add drawtext filter for this word - yellow bold text
                                filter_chain += f",drawtext=text='{safe_word}':fontcolor=yellow:fontsize=24:box=1:boxcolor=black@0.8:boxborderw=5" \
                                             f":x=(w-text_w)/2:y=(h*0.9):enable='between(t,{word_data['start']},{word_data['end']})':" \
                                             f"shadowcolor=black:shadowx=2:shadowy=2:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
                            
                            final_resort_cmd = [
                                'ffmpeg',
                                '-i', temp_raw_clip,
                                '-vf', filter_chain,
                                '-c:v', 'libx264',
                                '-preset', 'ultrafast',
                                '-crf', '28', 
                                '-threads', '2',
                                '-max_muxing_queue_size', '512',
                                '-b:a', '64k', 
                                '-c:a', 'aac',
                                '-y',
                                temp_clip_path
                            ]
                            
                            subprocess.run(final_resort_cmd, check=True)
                            logger.info(f"Created clip with drawtext word-by-word fallback: {temp_clip_path}")
                            
                        except Exception as final_error:
                            logger.error(f"Word-by-word drawtext fallback failed: {str(final_error)}")
                            
                            # Final fallback: Use a single drawtext for the entire subtitle
                            try:
                                # Process subtitle for better display
                                words = subtitle.split()
                                # Join with newlines to ensure 1 word per line
                                formatted_subtitle = '\n'.join(words)
                                # Make the subtitle text safe for the filter
                                safe_subtitle = formatted_subtitle.replace("'", "").replace('"', "").replace(':', "").replace(',', "")
                                
                                # Use a single drawtext with yellow bold font
                                single_text_cmd = [
                                    'ffmpeg',
                                    '-i', temp_raw_clip,
                                    '-vf', f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,"
                                           f"pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2,"
                                           f"drawtext=text='{safe_subtitle}':fontcolor=yellow:fontsize=24:box=1:boxcolor=black@0.8:"
                                           f"boxborderw=5:x=(w-text_w)/2:y=(h-text_h)/2:line_spacing=12:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                                    '-c:v', 'libx264',
                                    '-preset', 'ultrafast',
                                    '-crf', '28', 
                                    '-threads', '2',
                                    '-max_muxing_queue_size', '512',
                                    '-b:a', '64k', 
                                    '-c:a', 'aac',
                                    '-y',
                                    temp_clip_path
                                ]
                                
                                subprocess.run(single_text_cmd, check=True)
                                logger.info(f"Created clip with simple drawtext fallback: {temp_clip_path}")
                                
                            except Exception as absolute_final_error:
                                logger.error(f"All subtitle methods failed: {str(absolute_final_error)}")
                                
                                # Absolute last resort: Just use the raw clip with proper aspect ratio
                                last_resort_cmd = [
                                    'ffmpeg',
                                    '-i', temp_raw_clip,
                                    '-vf', f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease,"
                                           f"pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2",
                                    '-preset', 'ultrafast',
                                    '-crf', '28', 
                                    '-threads', '2',
                                    '-max_muxing_queue_size', '512',
                                    '-b:a', '64k', 
                                    '-c:a', 'aac',
                                    '-y',
                                    temp_clip_path
                                ]
                                subprocess.run(last_resort_cmd, check=True)
                                logger.error(f"Created clip without subtitles as last resort: {temp_clip_path}")
                
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
                    "subtitle": subtitle,
                    "caption": caption,
                    "viralityScore": virality_score,
                })
                
                # Clean up temporary clip files
                for file_path in [temp_raw_clip, temp_clip_path, subtitle_file]:
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
    
def create_improved_srt(subtitle_text, clip_start, clip_end, words_per_line=1, max_width_percent=80):
    """
    Creates an improved SRT file with better word wrapping and timing.
    
    Args:
        subtitle_text (str): The full subtitle text for the clip
        clip_start (float): Start time of the clip in seconds
        clip_end (float): End time of the clip in seconds
        words_per_line (int): Target number of words per line (default: 1 word per line)
        max_width_percent (int): Maximum width percentage of the video (80% recommended)
        
    Returns:
        str: Formatted SRT content
    """
    words = subtitle_text.split()
    total_words = len(words)
    
    # Calculate how many lines we'll need
    total_lines = total_words  # Since we're using 1 word per line
    
    # Calculate duration for each line to match speech rhythm
    # Assume equal distribution of words across the clip duration
    clip_duration = clip_end - clip_start
    word_duration = clip_duration / total_words if total_words > 0 else clip_duration
    
    srt_content = ""
    line_num = 1
    
    for i in range(total_words):
        # Calculate timing for this word
        word_start = clip_start + (i * word_duration)
        word_end = word_start + word_duration
        
        # Format times as HH:MM:SS,mmm
        start_time = time.strftime('%H:%M:%S', time.gmtime(word_start)) + f",{int((word_start % 1) * 1000):03d}"
        end_time = time.strftime('%H:%M:%S', time.gmtime(word_end)) + f",{int((word_end % 1) * 1000):03d}"
        
        # Add this word to SRT content
        srt_content += f"{line_num}\n{start_time} --> {end_time}\n{words[i]}\n\n"
        line_num += 1
    
    return srt_content