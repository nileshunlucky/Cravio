from PIL import Image, ImageDraw, ImageFont
from fastapi import HTTPException
from io import BytesIO
import os
import openai
import ffmpeg
import datetime
import subprocess
import cloudinary
import cloudinary.uploader
import shutil
import requests
from celery_config import celery_app
from db import users_collection  # Using your existing MongoDB setup
import time
import platform
# tasks/reddit_story_task.py
from celery import shared_task
import time

@shared_task(name="create_reddit_post_task")
def create_reddit_post_task(data=None):
    """A simple task that will work regardless of Reddit API access"""
    print(f"Processing task with data: {data}")
    time.sleep(5)  # Simulate work
    return {"status": "success", "processed_data": data}

@shared_task(name="debug_task")
def debug_task():
    """Simple debug task to verify Celery worker functionality"""
    print("Debug task executed successfully!")
    return "Debug task completed"

OUTPUT_FOLDER = "output"
ASSETS_FOLDER = "assets"
GAMEPLAY_FOLDER = "gameplays"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Configure Cloudinary - these should be set in environment variables in production
cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET") 
)

DEFAULT_AVATAR_PATH = os.path.join(ASSETS_FOLDER, "reddit.png")

# Function to safely handle file paths, replacing slashes with an underscore
def safe_filename(username: str) -> str:
    # Replace slashes (/) and other potentially problematic characters with an underscore
    return username.replace("/", "_").replace("\\", "_")

def add_rounded_corners(im, radius):
    """
    Adds rounded corners to the image.
    """
    rounded = Image.new("RGBA", im.size, (255, 255, 255, 0))
    mask = Image.new("L", im.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), im.size], radius=radius, fill=255)
    rounded.paste(im, (0, 0), mask)
    return rounded

def wrap_text(text, font, max_width):
    """
    Wraps text to fit within the given width.
    """
    lines = []
    words = text.split()
    line = ""
    for word in words:
        test_line = line + word + " "
        if font.getlength(test_line) <= max_width:
            line = test_line
        else:
            lines.append(line.rstrip())
            line = word + " "
    lines.append(line.rstrip())
    return lines

def load_font(font_path, size):
    """
    Loads a font with the given path and size, falling back to default if not available.
    """
    try:
        return ImageFont.truetype(font_path, size)
    except:
        return ImageFont.load_default()

def create_avatar_image(avatar_path=None):
    """
    Creates an avatar image. Uses the provided avatar if available, otherwise defaults.
    """
    if avatar_path and os.path.exists(avatar_path):
        with open(avatar_path, "rb") as f:
            avatar_bytes = f.read()
        avatar_img = Image.open(BytesIO(avatar_bytes)).convert("RGBA").resize((80, 80))
    else:
        avatar_img = Image.open(DEFAULT_AVATAR_PATH).convert("RGBA").resize((80, 80))
    
    return add_rounded_corners(avatar_img, 20)

def create_reddit_post_layout(title, username, avatar_img):
    """
    Creates the layout for the Reddit post, including title, avatar, and icons.
    """
    # Load fonts
    font_username = load_font("arialbd.ttf", 32)
    font_title = load_font("arialbd.ttf", 44)

    max_width = 920
    wrapped_title = wrap_text(title, font_title, max_width)
    line_height = font_title.size + 10
    title_block_height = len(wrapped_title) * line_height

    # Layout values
    width = 1000
    content_y_start = 140
    reactions_y = content_y_start + title_block_height + 40
    total_height = reactions_y + 60

    # Background
    base = Image.new("RGBA", (width, total_height), (255, 255, 255, 255))
    rounded_bg = add_rounded_corners(base.copy(), 40)
    draw = ImageDraw.Draw(rounded_bg)

    # Avatar
    rounded_bg.paste(avatar_img, (40, 40), avatar_img)

    # Username and Verify
    username_x, username_y = 140, 50
    draw.text((username_x, username_y), username, fill="black", font=font_username)
    verify_img = Image.open(os.path.join(ASSETS_FOLDER, "verify.png")).convert("RGBA").resize((28, 28))
    username_bbox = draw.textbbox((username_x, username_y), username, font=font_username)
    username_width = username_bbox[2] - username_bbox[0]
    verify_x = username_x + username_width + 10
    rounded_bg.paste(verify_img, (verify_x, username_y), verify_img)

    # Title lines
    for i, line in enumerate(wrapped_title):
        draw.text((40, content_y_start + i * line_height), line, fill="black", font=font_title)

    # Load and paste icons
    like_img = Image.open(os.path.join(ASSETS_FOLDER, "like.png")).convert("RGBA").resize((100, 70))
    comment_img = Image.open(os.path.join(ASSETS_FOLDER, "comment.png")).convert("RGBA").resize((100, 70))
    share_img = Image.open(os.path.join(ASSETS_FOLDER, "share.png")).convert("RGBA").resize((100, 70))

    rounded_bg.paste(like_img, (40, reactions_y), like_img)
    rounded_bg.paste(comment_img, (150, reactions_y), comment_img)
    share_x = width - 100 - 32  # 40px padding from right
    rounded_bg.paste(share_img, (share_x, reactions_y), share_img)

    return rounded_bg

def convert_to_audio(text, voice):
    """Convert text to speech using OpenAI's TTS API"""
    response = openai.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text
    )
    return response

def save_audio_and_get_duration(audio_response, path: str) -> float:
    """Save audio to file and return its duration"""
    with open(path, "wb") as f:
        f.write(audio_response.read())
    probe = ffmpeg.probe(path)
    duration = float(probe['format']['duration'])
    return duration

def font_name_to_color_code(font_name):
    color_map = {
        "white": "FFFFFF",
        "yellow": "FFFF00",
        "blue": "0000FF",
        "red": "FF0000",
        "green": "00FF00",
        "purple": "800080",
        "black": "000000",
        "orange": "FFA500",
        "gray": "808080",
        "pink": "FFC0CB",
    }
    return color_map.get(font_name.lower(), "FFFFFF")

def generate_styled_ass_subtitles(script_text, start_time_sec, total_duration_sec, color_code):
    """Generate ASS format subtitles with styling"""
    words = script_text.strip().split()
    num_words = len(words)
    duration_per_word = total_duration_sec / num_words
    
    # Ensure color code is in correct format
    color_code = color_code.lstrip("&H").upper()
    
    # ASS header
    ass_header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,150,&H00{color_code},&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    # Generate events
    events = []
    for i, word in enumerate(words):
        start = start_time_sec + i * duration_per_word
        end = start_time_sec + (i + 1) * duration_per_word
        
        # Format times as h:mm:ss.cc
        start_str = "{:d}:{:02d}:{:02d}.{:02d}".format(
            int(start // 3600),
            int((start % 3600) // 60),
            int(start % 60),
            int((start % 1) * 100)
        )
        
        end_str = "{:d}:{:02d}:{:02d}.{:02d}".format(
            int(end // 3600),
            int((end % 3600) // 60),
            int(end % 60),
            int((end % 1) * 100)
        )
        
        event_line = f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{word}"
        events.append(event_line)
    
    return ass_header + "\n".join(events)

def get_video_dimensions(video_path):
    """Get video dimensions and return in format suitable for ffmpeg commands"""
    probe = ffmpeg.probe(video_path)
    video_info = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
    if video_info:
        width = int(video_info['width'])
        height = int(video_info['height'])
        return width, height
    return None, None

def upload_to_cloudinary(file_path: str, user_email: str) -> str:
    """Upload a file to Cloudinary and return the URL"""
    try:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        public_id = f"reddit_videos/{user_email}/{timestamp}"
        
        # Upload the file to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file_path,
            resource_type="video",
            public_id=public_id,
            overwrite=True,
            folder="Cravio"
        )
        
        # Return the secure URL
        return upload_result['secure_url']
    except HTTPException as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        raise

def cleanup_output_files(file_paths: list):
    """Remove temporary files after processing"""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed file: {file_path}")
        except HTTPException as e:
            print(f"Error removing file {file_path}: {str(e)}")

def save_video_to_mongodb(user_email: str, video_url: str, title: str, script: str = None, caption: str = None):
    """Save video details to MongoDB user collection"""
    try:
        # Get the current date
        created_at = datetime.datetime.now()
        
        # Find the user by email
        user = users_collection.find_one({"email": user_email})
        
        if not user:
            print(f"User {user_email} not found in database")
            return False
            
        # Create the video entry
        video_entry = {
            "url": video_url,
            "title": title,
            "script": script,
            "caption": caption,
            "created_at": created_at
        }
        
        # Update the user document to add the video
        # If the 'videos' array doesn't exist, it will be created
        result = users_collection.update_one(
            {"email": user_email},
            {"$push": {"videos": video_entry}}
        )
        
        if result.modified_count == 0:
            print("No document was updated")
            return False
            
        return True
        
    except HTTPException as e:
        print(f"Error saving to MongoDB: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
# Create a function to generate the title from GPT-3.5-turbo
def generate_title(prompt: str) -> str:
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user", 
                "content": f"""Create a short, attention-grabbing title for a viral Reddit story video based on this prompt: {prompt}
                
                Requirements:
                - Keep it under 15 words
                - Make it dramatic and intriguing
                - Use casual, conversational language
                - No quotes, emojis, hashtags or special characters
                - Format like popular TikTok/YouTube Reddit story titles
                - Should create curiosity and make viewers want to hear the full story
                - Must be a complete sentence
                """
            }],
            max_tokens=100,
            temperature=0.7
        )
        title = response.choices[0].message.content.strip()
        return title
    except HTTPException as e:
        raise HTTPException(f"Error generating title: {str(e)}")

# Create a function to generate the script based on the title
def generate_script(title: str) -> str:
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user", 
                "content": f"""Create an engaging Reddit story script for a Instagram/TikTok/YouTube short based on this title: "{title}"
                
                Requirements:
                - First-person narrative style like genuine Reddit posts
                - Conversational tone with natural speech patterns
                - Include realistic details and emotional elements
                - Create a clear story arc with setup, conflict, and resolution
                - Keep it between 150 words
                - No introductions or explanations - just the story itself
                - Make it sound like a real person telling their story
                - Include 1-2 surprising twists or turns
                - End with a satisfying conclusion or punchline
                """
            }],
            max_tokens=500,
            temperature=0.7
        )
        script = response.choices[0].message.content.strip()
        return script
    except HTTPException as e:
        raise HTTPException(f"Error generating script: {str(e)}")

# Create a function to generate captions based on the title
def generate_caption(title: str) -> str:
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user", 
                "content": f"""Create an engaging, viral-worthy caption for a Instagram/TikTok/YouTube short based on this title: "{title}"
                
                Requirements:
                - Keep it under 100 characters
                - Include 2-3 relevant hashtags
                - Make it intriguing and clickable
                - Use casual, conversational language
                - Should complement the title without repeating it exactly
                - End with a question or hook that drives engagement
                """
            }],
            max_tokens=150,
            temperature=0.7
        )
        caption = response.choices[0].message.content.strip()
        return caption
    except HTTPException as e:
        raise HTTPException(f"Error generating caption: {str(e)}")

@celery_app.task(name="create_reddit_post_task", bind=True)
def create_reddit_post_task(
    self,
    avatar_path=None,
    username=None,
    title=None,
    script=None,
    caption=None,
    voice=None,
    video=None,
    font=None,
    user_email=None
):
    print(f"Task started with avatar_path={avatar_path} and username={username}")
    self.update_state(state='PROGRESS', meta={'status': 'Creating Reddit post', 'percent_complete': 0})

    temporary_files = []  # List to track files for cleanup
    sanitized_username = safe_filename(username)
    base_output_path = os.path.join(OUTPUT_FOLDER, sanitized_username)

    try:
        # Step 1: Sanitize the username for file path safety (already done)
        self.update_state(state='PROGRESS', meta={'status': 'Sanitizing username', 'percent_complete': 10})

        # Step 2: Create the avatar image
        self.update_state(state='PROGRESS', meta={'status': 'Creating avatar image', 'percent_complete': 20})
        avatar_img = create_avatar_image(avatar_path)

        # Step 3: Create the Reddit post layout
        self.update_state(state='PROGRESS', meta={'status': 'Creating Reddit post layout', 'percent_complete': 30})
        reddit_post_img = create_reddit_post_layout(title, username, avatar_img)

        # Save the post image
        reddit_post_image_path = f"{base_output_path}_reddit_post.png"
        self.update_state(state='PROGRESS', meta={'status': 'Saving Reddit post image', 'percent_complete': 40})
        reddit_post_img.save(reddit_post_image_path, format="PNG")
        temporary_files.append(reddit_post_image_path)

        # Step 4: Convert title to audio using OpenAI TTS
        title_audio_path = f"{base_output_path}_title.mp3"
        self.update_state(state='PROGRESS', meta={'status': 'Converting title to audio', 'percent_complete': 50})
        title_audio_response = convert_to_audio(title, voice)
        title_duration = save_audio_and_get_duration(title_audio_response, title_audio_path)
        temporary_files.append(title_audio_path)

        # Step 5: Convert script to audio
        script_audio_path = f"{base_output_path}_script.mp3"
        self.update_state(state='PROGRESS', meta={'status': 'Converting script to audio', 'percent_complete': 60})
        script_audio_response = convert_to_audio(script, voice)
        script_duration = save_audio_and_get_duration(script_audio_response, script_audio_path)
        temporary_files.append(script_audio_path)

        # Step 6: Combine both audios using ffmpeg
        combined_audio_path = f"{base_output_path}_combined.mp3"
        self.update_state(state='PROGRESS', meta={'status': 'Combining audio', 'percent_complete': 70})
        try:
            ffmpeg.input(title_audio_path).input(script_audio_path).output(
                combined_audio_path, acodec='aac', **{'filter_complex': 'concat=n=2:v=0:a=1'}
            ).run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
        except ffmpeg.Error as e:
            print(f"FFmpeg error combining audio: {e.stderr.decode('utf8')}")
            raise
        temporary_files.append(combined_audio_path)

        total_duration = title_duration + script_duration

        # Step 7: Process the video URL
        self.update_state(state='PROGRESS', meta={'status': 'Processing video URL', 'percent_complete': 80})
        if video.startswith("http"):
            downloaded_video_path = f"{base_output_path}_downloaded_video.mp4"
            try:
                response = requests.get(video, stream=True)
                response.raise_for_status()  # Raise an exception for bad status codes
                with open(downloaded_video_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                gameplay_video_path = downloaded_video_path
                temporary_files.append(downloaded_video_path)
            except requests.exceptions.RequestException as e:
                return {"status": "error", "message": f"Could not download video from URL: {video} - {e}"}
        else:
            gameplay_video_path = os.path.join(GAMEPLAY_FOLDER, video)
            if not os.path.exists(gameplay_video_path):
                return {"status": "error", "message": f"Video file not found: {gameplay_video_path}"}

        # Process video to match 9:16 aspect ratio
        video_width, video_height = get_video_dimensions(gameplay_video_path)
        crop_params = None
        if video_width and video_height:
            target_aspect_ratio = 9 / 16
            current_aspect_ratio = video_width / video_height
            if abs(current_aspect_ratio - target_aspect_ratio) > 0.01:
                if current_aspect_ratio > target_aspect_ratio:
                    new_width = int(video_height * target_aspect_ratio)
                    x_offset = int((video_width - new_width) / 2)
                    crop_params = f"crop={new_width}:{video_height}:{x_offset}:0"
                else:
                    new_height = int(video_width / target_aspect_ratio)
                    y_offset = int((video_height - new_height) / 2)
                    crop_params = f"crop={video_width}:{new_height}:0:{y_offset}"

        muted_video_path = f"{base_output_path}_muted.mp4"
        try:
            input_video = ffmpeg.input(gameplay_video_path)
            if crop_params:
                input_video = input_video.filter('crop', crop_params)
            input_video.output(muted_video_path, an=None, vcodec='libx264').run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
        except ffmpeg.Error as e:
            print(f"FFmpeg error processing video aspect ratio: {e.stderr.decode('utf8')}")
            raise
        temporary_files.append(muted_video_path)

        # Step 8: Combine muted video and combined audio
        final_with_audio_path = f"{base_output_path}_final_with_audio.mp4"
        try:
            ffmpeg.input(muted_video_path).input(combined_audio_path).output(
                final_with_audio_path, vcodec='libx264', acodec='aac', shortest=None, preset='ultrafast'
            ).run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
        except ffmpeg.Error as e:
            print(f"FFmpeg error combining video and audio: {e.stderr.decode('utf8')}")
            raise
        temporary_files.append(final_with_audio_path)

        # Step 9: Create colored ASS format subtitles and overlay
        self.update_state(state='PROGRESS', meta={'status': 'Creating subtitles and overlay', 'percent_complete': 90})
        subtitles_path = f"{base_output_path}_subtitles.ass"
        final_with_overlay_path = f"{base_output_path}_final_with_overlay.mp4"
        final_with_subs_path = f"{base_output_path}_final_with_subs.mp4"
        final_video_path = final_with_audio_path  # Initialize

        try:
            color_code = font_name_to_color_code(font)
            ass_subtitles = generate_styled_ass_subtitles(script, title_duration, script_duration, color_code)
            with open(subtitles_path, "w", encoding='utf-8') as subtitle_file:
                subtitle_file.write(ass_subtitles)
            temporary_files.append(subtitles_path)

            # Add overlay image at the beginning of the video
            video_width_final, video_height_final = get_video_dimensions(final_with_audio_path)
            if video_width_final and video_height_final:
                target_image_width = int(video_width_final * 0.9)
                target_image_height = int(reddit_post_img.height * (target_image_width / reddit_post_img.width))
                resized_reddit_post_img = reddit_post_img.resize((target_image_width, target_image_height))
                resized_output_path = f"{base_output_path}_resized_reddit_post.png"
                resized_reddit_post_img.save(resized_output_path, format="PNG")
                temporary_files.append(resized_output_path)

                x_position = (video_width_final - target_image_width) // 2
                y_position = (video_height_final - target_image_height) // 2

                try:
                    ffmpeg.input(final_with_audio_path).input(resized_output_path).filter('overlay', x=x_position, y=y_position, enable=f'between(t,0,{title_duration})').output(
                        final_with_overlay_path, vcodec='libx264', acodec='copy', preset='veryfast', overwrite_output=True
                    ).run(capture_stdout=True, capture_stderr=True)
                    temporary_files.append(final_with_overlay_path)
                    final_video_path = final_with_overlay_path
                except ffmpeg.Error as e:
                    print(f"FFmpeg error adding overlay: {e.stderr.decode('utf8')}")
                    # Fallback: Continue with the video that has audio
            else:
                # Fallback: Continue with the video that has audio
                pass

            # Now add subtitles to the video (either with or without overlay)
            subtitles_path_esc = subtitles_path.replace('\\', '\\\\\\\\') if platform.system() == 'Windows' else subtitles_path.replace(':', r'\:')
            try:
                ffmpeg.input(final_video_path).output(
                    final_with_subs_path,
                    vf=f'subtitles={subtitles_path_esc}:force_style=\'FontSize=150,PrimaryColour=&H00{color_code},Alignment=2\'',
                    vcodec='libx264', acodec='aac', preset='veryfast', overwrite_output=True
                ).run(capture_stdout=True, capture_stderr=True)
                temporary_files.append(final_with_subs_path)
                final_output_path = final_with_subs_path
            except ffmpeg.Error as e:
                print(f"FFmpeg error adding subtitles: {e.stderr.decode('utf8')}")
                final_output_path = final_video_path # Fallback: Use the video without subtitles

        except Exception as e:
            print(f"Error in overlay/subtitle step: {str(e)}")
            import traceback
            traceback.print_exc()
            final_output_path = final_with_audio_path # Fallback to video with audio

        # Step 10: Upload the final video to Cloudinary
        self.update_state(state='PROGRESS', meta={'status': 'Uploading to Cloudinary', 'percent_complete': 95})
        cloudinary_url = upload_to_cloudinary(final_output_path, user_email)

        # Step 11: Save video details to MongoDB
        self.update_state(state='PROGRESS', meta={'status': 'Saving to MongoDB', 'percent_complete': 100})
        save_success = save_video_to_mongodb(
            user_email=user_email,
            video_url=cloudinary_url,
            title=title,
            script=script,
            caption=caption
        )

        if not save_success:
            print(f"Warning: Could not save video data for user {user_email} to MongoDB")

        # Return only the cloudinary URL and caption
        return {
            "status": "success",
            "url": cloudinary_url,
            "caption": caption
        }

    except Exception as e:
        print(f"General error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e)
        }
    finally:
        # Step 12: Clean up temporary files
        self.update_state(state='PROGRESS', meta={'status': 'Cleaning up temporary files', 'percent_complete': 100})
        cleanup_output_files(temporary_files)