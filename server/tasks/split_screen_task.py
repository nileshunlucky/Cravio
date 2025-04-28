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


# def create_split_screen(user_video, template_video, output_path):
#     """Create split-screen video with 9:16 ratio with lower resource usage"""
#     # Use lower resolution for less memory usage
#     width = 360
#     height = 640
    
#     try:
#         subprocess.run([
#             'ffmpeg', '-i', user_video, '-i', template_video,
#             '-filter_complex',
#             f'[0:v]scale={width}:{height//2}[top];[1:v]scale={width}:{height//2}[bottom];[top][bottom]vstack[outv]',
#             '-map', '[outv]', '-map', '0:a',
#             '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30',  # Faster encoding
#             '-c:a', 'aac', '-b:a', '64k',  # Lower audio bitrate
#             '-threads', '2',  # Limit CPU threads
#             '-shortest',
#             output_path, '-y'
#         ], check=True)
#     except subprocess.CalledProcessError as e:
#         if "SIGKILL" in str(e):
#             print("Process killed due to memory constraints. Try with smaller videos.")
#         raise

def create_split_screen(user_video, template_video, output_path):
    """
    Creates a 9:16 split-screen video.
    Each input video is scaled and cropped to cover its half (top/bottom)
    while maintaining aspect ratio. Simplified without logging.
    """

    # --- TARGET OUTPUT & QUALITY SETTINGS ---
    # Target 9:16 resolution (e.g., 720x1280 for HD Reels/Shorts)
    target_w = 720
    target_h = 1280

    # Calculate dimensions for each half
    half_h = target_h // 2 # Integer division

    # Quality Settings (Adjust as needed)
    crf_value = '24'       # Lower = Better Quality (23-26 good range)
    preset_value = 'ultrafast'  # Slower = Better Quality/Compression (fast/medium good balance)
    audio_bitrate = '128k' # Audio quality
    # --- END SETTINGS ---

    # Construct the complex filter graph (Scale to cover and crop)
    filter_complex = (
        f"[0:v]scale=w='max({target_w},iw*{half_h}/ih)':h='max({half_h},ih*{target_w}/iw)',"
        f"crop={target_w}:{half_h}:(iw-{target_w})/2:(ih-{half_h})/2,setsar=1[top];"
        f"[1:v]scale=w='max({target_w},iw*{half_h}/ih)':h='max({half_h},ih*{target_w}/iw)',"
        f"crop={target_w}:{half_h}:(iw-{target_w})/2:(ih-{half_h})/2,setsar=1[bottom];"
        f"[top][bottom]vstack=inputs=2[outv]" # Stack the processed halves
    )

    try:
        ffmpeg_command = [
            'ffmpeg',
            '-i', user_video,                 # Input 0 (User Video)
            '-i', template_video,             # Input 1 (Template Video)

            '-filter_complex', filter_complex, # Apply the scaling, cropping, stacking filter

            '-map', '[outv]',                 # Map the filtered video output
            '-map', '0:a?',                   # Map audio from the FIRST input (user video), '?' makes it optional

            # Video Encoding Settings
            '-c:v', 'libx264',                # Video codec H.264
            '-preset', preset_value,          # Encoding speed/efficiency preset
            '-crf', crf_value,                # Constant Rate Factor (Quality)
            '-pix_fmt', 'yuv420p',            # Ensure common pixel format for compatibility

            # Audio Encoding Settings
            '-c:a', 'aac',                    # Audio codec AAC
            '-b:a', audio_bitrate,            # Audio bitrate
            '-ac', '2',                       # Force stereo audio (optional, adjust if needed)

            # Other options
            '-r', '30',                       # Set frame rate (optional, e.g., 30 fps)
            '-shortest',                      # Finish encoding when the shortest input ends
            output_path,
            '-y'                              # Overwrite output if exists
        ]

        print(f"Executing ffmpeg for split screen...") # Simplified info message
        # Keep capture_output=True to access stderr/stdout in case of errors
        subprocess.run(ffmpeg_command, check=True, capture_output=True, text=True, encoding='utf-8')
        print("FFmpeg split screen process completed successfully.")
        # Removed debug logging of stdout/stderr


    except subprocess.CalledProcessError as e:
        # Print detailed error information from ffmpeg using print
        print(f"Error creating split screen video: {str(e)}")
        print(f"FFmpeg command: {' '.join(e.cmd)}") # Print the exact command run
        print(f"FFmpeg stdout:\n{e.stdout}")
        print(f"FFmpeg stderr:\n{e.stderr}")
        if "SIGKILL" in str(e.stderr) or "Cannot allocate memory" in str(e.stderr):
             print("Warning: Process likely killed due to memory constraints. Consider using lower resolution (e.g., 540x960) or less demanding preset/crf if this persists.")
        raise
    except Exception as e:
        print(f"An unexpected error occurred in create_split_screen: {e}")
        raise


def add_subtitles(video_path, transcript, output_path, font_color):
    """Add subtitles to video"""
    srt_path = f"{video_path}.srt"

    # Define the RGB color mapping
    rgb_color_map = {
        "white": "FFFFFF", "black": "000000", "red": "FF0000",
        "green": "00FF00", "blue": "0000FF", "yellow": "FFFF00",
        "purple": "800080", "orange": "FFA500", "gray": "808080", "pink": "FFC0CB"
    }

    # Get the RGB hex code, default to white if None or not found
    rgb_hex = rgb_color_map.get(font_color.lower() if font_color else "white", "FFFFFF")

    # Convert RRGGBB to BBGGRR for ffmpeg/ASS styling
    if len(rgb_hex) == 6:
        rr = rgb_hex[0:2]
        gg = rgb_hex[2:4]
        bb = rgb_hex[4:6]
        ffmpeg_color_hex = f"{bb}{gg}{rr}"
    else:
        # Fallback to white in BBGGRR format if the hex code is invalid
        ffmpeg_color_hex = "FFFFFF" # White is the same in RGB and BGR hex
    
    try:
        with open(srt_path, 'w') as srt_file:
            segments = transcript.get('segments', [])
            for i, segment in enumerate(segments, 1):
                start = format_time(segment.get('start', 0))
                end = format_time(segment.get('end', 0))
                text = segment.get('text', '')
                
                srt_file.write(f"{i}\n{start} --> {end}\n{text}\n\n")
        
        subprocess.run([
            'ffmpeg', '-i', video_path,
            '-vf', f"subtitles={srt_path}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H{ffmpeg_color_hex},Alignment=10'",
            '-c:a', 'copy', output_path, '-y'
        ], check=True)
        
        # Clean up the temporary SRT file
        if os.path.exists(srt_path):
            os.remove(srt_path)
    except Exception as e:
        print(f"Error adding subtitles: {str(e)}")
        # If subtitles fail, just copy the video
        subprocess.run(['cp', video_path, output_path], check=True)


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