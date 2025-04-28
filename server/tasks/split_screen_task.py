from celery_config import celery_app
import os
import subprocess
import tempfile
import requests
import json
import cloudinary
import cloudinary.uploader
from datetime import datetime
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
            script = " ".join([segment['text'] for segment in transcript['segments']])
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

            self.update_state(state='SUCCESS', meta={'status': 'Completed', 'percent_complete': 100})
            return {
                "status": "success",
                "video_url": final_video_url,
                "caption": caption
            }

    except Exception as e:
        print(f"General error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


def save_video_to_mongodb(user_email: str, video_url: str, script: str = None, caption: str = None) -> bool:
    """Save video details to MongoDB under user's 'videos' array."""
    try:
        # Current timestamp
        created_at = datetime.datetime.utcnow()
        
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
    subprocess.run([
        "ffmpeg", "-i", video_path, "-vn", "-acodec", "pcm_s16le", 
        "-ar", "16000", "-ac", "1", audio_path, "-y"
    ], check=True)


def generate_transcript(audio_path):
    client = openai.OpenAI()
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json"
        )
    return response

def create_split_screen(user_video, template_video, output_path):
    """Create split-screen video with 9:16 ratio"""
    width = 720
    height = 1280
    
    subprocess.run([
        'ffmpeg', '-i', user_video, '-i', template_video,
        '-filter_complex',
        f'[0:v]scale={width}:{height//2}[top];[1:v]scale={width}:{height//2}[bottom];[top][bottom]vstack[outv]',
        '-map', '[outv]', '-map', '0:a',
        '-c:v', 'libx264', '-c:a', 'aac', '-shortest',
        output_path, '-y'
    ], check=True)


def add_subtitles(video_path, transcript, output_path, font_color):
    """Add subtitles to video"""
    srt_path = f"{video_path}.srt"
    color_hex = {
        "white": "FFFFFF", "black": "000000", "red": "FF0000",
"green": "00FF00", "blue": "0000FF", "yellow": "FFFF00",
"purple": "800080", "orange": "FFA500", "gray": "808080", "pink": "FFC0CB"
    }.get(font_color.lower(), "FFFFFF")
    
    with open(srt_path, 'w') as srt_file:
        for i, segment in enumerate(transcript['segments'], 1):
            start = format_time(segment['start'])
            end = format_time(segment['end'])
            
            srt_file.write(f"{i}\n{start} --> {end}\n{segment['text']}\n\n")
    
    subprocess.run([
        'ffmpeg', '-i', video_path,
        '-vf', f"subtitles={srt_path}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H{color_hex},Alignment=10'",
        '-c:a', 'copy', output_path, '-y'
    ], check=True)
    
    os.remove(srt_path)


def format_time(seconds):
    """Convert seconds to SRT timestamp"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def generate_caption(script):
    """Generate caption with GPT-3.5"""
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "Create a short, engaging caption for a video."},
            {"role": "user", "content": script}
        ],
        max_tokens=150,
        temperature=0.7
    )
    return response.choices[0].message.content.strip()


def delete_cloudinary_video(url):
    """Delete video from Cloudinary"""
    parts = url.split('/')
    try:
        upload_index = parts.index('upload')
        public_id = '/'.join(parts[upload_index+2:]).split('.')[0]
        cloudinary.uploader.destroy(public_id, resource_type="video")
    except:
        pass