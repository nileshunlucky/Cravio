from celery_config import celery_app
import os
import subprocess
import tempfile
import requests
import json
from datetime import datetime
import cloudinary
import cloudinary.uploader
from db import users_collection
import openai

# Setup Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET")
)

@celery_app.task(name="process_split_screen_task", bind=True)
def process_split_screen_task(self,
                            video_url=None, 
                            user_video_url=None,
                            font_color=None, 
                            user_email=None):
    """Process videos to create a split-screen effect with subtitles"""
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            self.update_state(state='PROGRESS', meta={'status': 'Downloading videos', 'percent_complete': 5})
            # Download videos
            user_video_path = os.path.join(temp_dir, "user_video.mp4")
            template_video_path = os.path.join(temp_dir, "template_video.mp4")
            
            download_video(user_video_url, user_video_path)
            download_video(video_url, template_video_path)

            self.update_state(state='PROGRESS', meta={'status': 'Extracting audio', 'percent_complete': 20})
            # Extract audio for transcription
            audio_path = os.path.join(temp_dir, "audio.wav")
            extract_audio(user_video_path, audio_path)

            self.update_state(state='PROGRESS', meta={'status': 'Generating transcript', 'percent_complete': 35})
            # Generate transcript
            transcript = generate_transcript(audio_path)

            self.update_state(state='PROGRESS', meta={'status': 'Creating split-screen video', 'percent_complete': 50})
            # Create split-screen video
            combined_video_path = os.path.join(temp_dir, "combined.mp4")
            create_split_screen(user_video_path, template_video_path, combined_video_path)

            self.update_state(state='PROGRESS', meta={'status': 'Adding subtitles', 'percent_complete': 65})
            # Add subtitles
            final_video_path = os.path.join(temp_dir, "final_video.mp4")
            add_subtitles(combined_video_path, transcript, final_video_path, font_color)

            self.update_state(state='PROGRESS', meta={'status': 'Generating script and caption', 'percent_complete': 75})
            # Extract script and generate caption
            script = extract_script_from_transcript(transcript)
            caption = generate_caption(script)

            self.update_state(state='PROGRESS', meta={'status': 'Uploading video', 'percent_complete': 85})
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                final_video_path,
                resource_type="video",
                folder="Cravio"
            )
            final_video_url = upload_result['secure_url']

            self.update_state(state='PROGRESS', meta={'status': 'Saving to database', 'percent_complete': 90})
            # Save to MongoDB
            save_success = save_video_to_mongodb(
                user_email=user_email,
                video_url=final_video_url,
                script=script,
                caption=caption,
            )

            if not save_success:
                raise Exception("Failed to save video to MongoDB")

            self.update_state(state='PROGRESS', meta={'status': 'Cleaning up', 'percent_complete': 95})
            # Clean up user video
            delete_cloudinary_video(user_video_url)

            return {
                "status": "success",
                "url": final_video_url,
                "caption": caption
            }

    except Exception as e:
        print(f"General error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


def extract_script_from_transcript(transcript):
    """Extract full script text from transcript object"""
    segments = transcript.get('segments', [])
    script = " ".join([segment.get('text', '') for segment in segments])
    return script


def save_video_to_mongodb(user_email, video_url, script=None, caption=None):
    """Save video details to MongoDB under user's 'videos' array."""
    try:
        # Current timestamp
        created_at = datetime.utcnow()
        
        # Find the user by email
        user = users_collection.find_one({"email": user_email})
        
        if not user:
            print(f"User with email {user_email} not found in database.")
            return False

        # Build video entry
        video_entry = {
            "url": video_url,
            "script": script,
            "caption": caption,
            "created_at": created_at
        }
        
        # Push into user's videos array
        result = users_collection.update_one(
            {"email": user_email},
            {"$push": {"videos": video_entry}}
        )

        if result.modified_count == 0:
            print(f"No document was updated for user {user_email}.")
            return False
        
        return True

    except Exception as e:
        print(f"Error saving to MongoDB: {str(e)}")
        return False


def download_video(url, output_path):
    """Download video from URL"""
    response = requests.get(url, stream=True)
    with open(output_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)


def extract_audio(video_path, audio_path):
    """Extract audio from video"""
    try:
        subprocess.run([
            "ffmpeg", "-i", video_path, "-vn", "-acodec", "pcm_s16le", 
            "-ar", "16000", "-ac", "1", audio_path, "-y"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error extracting audio: {str(e)}")
        raise


def generate_transcript(audio_path):
    """Generate transcript using OpenAI's Whisper via the latest SDK"""
    client = openai.OpenAI()
    
    try:
        with open(audio_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json"
            )
        
        # Convert the response to a dictionary
        if hasattr(response, 'model_dump'):
            # For Pydantic models in newer SDK versions
            transcript = response.model_dump()
        elif hasattr(response, 'dict'):
            # Alternative method
            transcript = response.dict()
        elif hasattr(response, 'to_dict'):
            # Another alternative
            transcript = response.to_dict()
        else:
            # Last resort - convert to JSON and back
            transcript = json.loads(json.dumps(response))
        
        return transcript
    except Exception as e:
        print(f"Error generating transcript: {str(e)}")
        # Return a minimal transcript structure if it fails
        return {"segments": []}


def create_split_screen(user_video, template_video, output_path):
    """Create split-screen video with 9:16 ratio with proper centering and scaling.
    Optimized for faster processing and lower memory usage."""
    # Target dimensions (9:16 aspect ratio)
    width = 360
    height = 640
    segment_height = height // 2  # Each video gets half the height
    
    try:
        # Use more efficient ffmpeg settings
        subprocess.run([
            'ffmpeg', 
            '-i', user_video, 
            '-i', template_video,
            # Skip unnecessary decoding
            '-vsync', '0',
            # More efficient filter chain
            '-filter_complex',
            f'[0:v]scale={width}:{segment_height}:force_original_aspect_ratio=increase,crop={width}:{segment_height},setsar=1[top];'
            f'[1:v]scale={width}:{segment_height}:force_original_aspect_ratio=increase,crop={width}:{segment_height},setsar=1[bottom];'
            f'[top][bottom]vstack=inputs=2[outv]',
            # Map only needed streams
            '-map', '[outv]', 
            '-map', '0:a',
            # Hardware acceleration if available (uncomment the appropriate one for your system)
            # '-hwaccel', 'auto',  # For automatic hardware selection
            # '-c:v', 'h264_nvenc',  # For NVIDIA GPU
            # '-c:v', 'h264_amf',   # For AMD GPU
            # '-c:v', 'h264_qsv',   # For Intel Quick Sync
            # More efficient encoding settings
            '-c:v', 'libx264', 
            '-preset', 'veryfast',  # Faster than ultrafast with minimal quality loss
            '-tune', 'fastdecode',  # Optimize for decoding speed
            '-crf', '30',
            # Improve threading
            '-threads', '0',        # Auto-detect optimal thread count
            # Reduced audio bitrate
            '-c:a', 'aac', 
            '-b:a', '48k',          # Lower than original but still acceptable
            '-ac', '1',             # Mono audio to save bandwidth
            # Limit input processing
            '-max_muxing_queue_size', '1024',
            '-shortest',
            # Avoid unnecessary metadata
            '-metadata', 'title=', 
            '-fflags', '+bitexact',
            output_path, 
            '-y'
        ], check=True)
        
    except subprocess.CalledProcessError as e:
        if "SIGKILL" in str(e):
            print("Process killed due to memory constraints. Try with smaller videos.")
        else:
            print(f"Error during processing: {e}")
        raise



def create_split_screen(user_video, template_video, output_path):
    """Create split-screen video with 9:16 ratio with proper centering and scaling.
    Extremely optimized for low memory environments like Railway."""
    # Target dimensions (9:16 aspect ratio)
    width = 360
    height = 640
    segment_height = height // 2  # Each video gets half the height
    
    try:
        # Use memory-optimized ffmpeg settings
        subprocess.run([
            'ffmpeg', 
            # Limit memory usage
            '-memory_size', '64M',
            # Set buffer sizes very small
            '-bufsize', '2M',
            # Reduce input buffer size
            '-probesize', '1M',
            '-analyzeduration', '1M',
            # Limit frame thread usage
            '-thread_queue_size', '8',
            # Process minimal amount of the input initially
            '-fflags', 'nobuffer',
            # Skip ahead decoding to reduce memory
            '-skip_frame', 'nokey',
            # Lower frame rate to reduce processing load
            '-r', '15',
            # Input files
            '-i', user_video, 
            '-i', template_video,
            # Efficient filter chain with less memory usage
            '-filter_complex',
            f'[0:v]fps=15,scale={width}:{segment_height}:force_original_aspect_ratio=increase:sws_flags=fast_bilinear,crop={width}:{segment_height},setsar=1[top];'
            f'[1:v]fps=15,scale={width}:{segment_height}:force_original_aspect_ratio=increase:sws_flags=fast_bilinear,crop={width}:{segment_height},setsar=1[bottom];'
            f'[top][bottom]vstack=inputs=2[outv]',
            # Map only needed streams
            '-map', '[outv]', 
            # Only include audio if needed, comment this out to save more memory
            '-map', '0:a',
            # Extreme memory-saving encoding settings
            '-c:v', 'libx264', 
            '-preset', 'ultrafast',  # Lowest memory usage
            '-crf', '35',           # Higher compression (lower quality but less memory)
            # Explicitly limit threads
            '-threads', '2',        # Force lower thread count to reduce memory
            # Very low audio settings
            '-c:a', 'aac', 
            '-b:a', '32k',          # Very low bitrate
            '-ac', '1',             # Mono audio
            '-ar', '22050',         # Lower sample rate
            # Process less data in memory at once
            '-max_muxing_queue_size', '128',
            '-shortest',
            output_path, 
            '-y'
        ], check=True)
        
    except subprocess.CalledProcessError as e:
        if "SIGKILL" in str(e):
            print("Process killed due to memory constraints. Try with smaller videos.")
            # Create fallback version with even more aggressive memory settings
            try:
                print("Attempting emergency fallback processing with minimal settings...")
                subprocess.run([
                    'ffmpeg',
                    # Extreme memory limitations
                    '-memory_size', '32M',
                    '-bufsize', '1M',
                    '-probesize', '512K',
                    '-thread_queue_size', '4',
                    # Drop frames aggressively
                    '-r', '10',
                    # Input files with minimal processing
                    '-i', user_video,
                    '-i', template_video,
                    # Simplest possible filter with tiny output
                    '-filter_complex',
                    f'[0:v]fps=10,scale=180:160:sws_flags=fast_bilinear[top];'
                    f'[1:v]fps=10,scale=180:160:sws_flags=fast_bilinear[bottom];'
                    f'[top][bottom]vstack=inputs=2[outv]',
                    '-map', '[outv]',
                    # Skip audio to save memory
                    # Lowest possible quality settings
                    '-c:v', 'libx264',
                    '-preset', 'ultrafast',
                    '-crf', '40',
                    '-threads', '1',
                    '-g', '250',           # Keyframe every 25 seconds
                    '-sc_threshold', '0',  # Disable scene detection
                    output_path,
                    '-y'
                ], check=True)
                print("Emergency fallback processing completed successfully.")
            except subprocess.CalledProcessError as fallback_error:
                print(f"Emergency fallback processing also failed: {fallback_error}")
                raise
        else:
            print(f"Error during processing: {e}")
            raise


def format_time(seconds):
    """Convert seconds to SRT timestamp"""
    if not isinstance(seconds, (int, float)):
        seconds = 0
        
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    ms = int((float(seconds) - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def generate_caption(script):
    """Generate caption with GPT-3.5"""
    try:
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Create a short, engaging caption for a video."},
                {"role": "user", "content": script}
            ],
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating caption: {str(e)}")
        return "Check out my new video!"


def delete_cloudinary_video(url):
    """Delete video from Cloudinary"""
    if not url:
        return
        
    parts = url.split('/')
    try:
        upload_index = parts.index('upload')
        public_id = '/'.join(parts[upload_index+2:]).split('.')[0]
        cloudinary.uploader.destroy(public_id, resource_type="video")
    except (ValueError, IndexError, Exception) as e:
        print(f"Error deleting from Cloudinary: {str(e)}")