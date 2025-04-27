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
def process_split_screen_task(self, video_url, user_video_url, font_color, user_email):
    """Process videos to create a split-screen effect with subtitles"""
    try:
        job_id = self.request.id
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download videos
            user_video_path = os.path.join(temp_dir, "user_video.mp4")
            template_video_path = os.path.join(temp_dir, "template_video.mp4")
            
            download_video(user_video_url, user_video_path)
            download_video(video_url, template_video_path)
            
            # Extract audio for transcription
            audio_path = os.path.join(temp_dir, "audio.wav")
            extract_audio(user_video_path, audio_path)
            
            # Generate transcript
            transcript = generate_transcript(audio_path)
            
            # Create split-screen video
            combined_video_path = os.path.join(temp_dir, "combined.mp4")
            create_split_screen(user_video_path, template_video_path, combined_video_path)
            
            # Add subtitles
            final_video_path = os.path.join(temp_dir, "final_video.mp4")
            add_subtitles(combined_video_path, transcript, final_video_path, font_color)
            
            # Extract script and generate caption
            script = " ".join([segment['text'] for segment in transcript['segments']])
            caption = generate_caption(script)
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                final_video_path,
                resource_type="video",
                folder="split_screen_finals"
            )
            final_video_url = upload_result['secure_url']
            
            # Save to MongoDB
            video_data = {
                "user_email": user_email,
                "final_video_url": final_video_url,
                "script": script,
                "caption": caption,
                "created_at": datetime.utcnow()
            }
            
            # video_id = videos_collection.insert_one(video_data).inserted_id
            
            # Clean up user video
            delete_cloudinary_video(user_video_url)
            
        return {
            "status": "completed",
            "video_url": final_video_url,
            "caption": caption
        }

    except Exception as e:
        self.update_state(state='FAILURE', meta={'status': 'Error', 'error': str(e)})
        return {"status": "error", "message": str(e)}


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
    """Generate transcript with Whisper API"""
    with open(audio_path, 'rb') as audio_file:
        response = requests.post(
            'https://api.openai.com/v1/audio/transcriptions',
            headers={'Authorization': f'Bearer {os.environ.get("OPENAI_API_KEY")}'},
            files={'file': audio_file},
            data={'model': 'whisper-1', 'response_format': 'verbose_json'}
        )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Whisper API error: {response.text}")


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
        "green": "00FF00", "blue": "0000FF", "yellow": "FFFF00"
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