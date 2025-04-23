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
    base_output_path = os.path.join(OUTPUT_FOLDER, f"ai_{sanitized_username}")

    try:
        # Steps 1-6 remain largely the same...
        
        # Step 1: Sanitize the username for file path safety
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

        # Step 6: Combine both audios with FFmpeg
        self.update_state(state='PROGRESS', meta={'status': 'Combining audio', 'percent_complete': 70})
        combined_audio_path = f"{base_output_path}_combined.mp3"
        try:
            cmd = [
                "ffmpeg",
                "-i", title_audio_path,
                "-i", script_audio_path,
                "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1[outa]",
                "-map", "[outa]",
                "-c:a", "libmp3lame",
                "-q:a", "4",
                "-y",
                combined_audio_path
            ]
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"Combined audio saved to: {combined_audio_path}")
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error combining audio: {e.stderr}")
            raise Exception(f"FFmpeg error combining audio: {e.stderr}")
        
        temporary_files.append(combined_audio_path)
        total_duration = title_duration + script_duration

        # Step 7: Process the video URL (Download/Locate and prepare)
        self.update_state(state='PROGRESS', meta={'status': 'Processing background video', 'percent_complete': 80})
        if video.startswith("http"):
            downloaded_video_path = f"{base_output_path}_downloaded_video.mp4"
            try:
                print(f"Downloading video from: {video}")
                response = requests.get(video, stream=True, timeout=60)
                response.raise_for_status()
                with open(downloaded_video_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                print(f"Video downloaded successfully to: {downloaded_video_path}")
                gameplay_video_path = downloaded_video_path
                temporary_files.append(downloaded_video_path)
            except requests.exceptions.RequestException as e:
                print(f"Could not download video from URL: {video} - {e}")
                return {"status": "error", "message": f"Could not download video from URL: {video} - {e}"}
        else:
            gameplay_video_path = os.path.join(GAMEPLAY_FOLDER, video)
            if not os.path.exists(gameplay_video_path):
                print(f"Video file not found: {gameplay_video_path}")
                return {"status": "error", "message": f"Video file not found: {gameplay_video_path}"}

        # Get video dimensions and duration
        print(f"Probing video dimensions for: {gameplay_video_path}")
        probe = ffmpeg.probe(gameplay_video_path)
        video_info = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
        
        if not video_info:
            return {"status": "error", "message": "Could not extract video information"}
        
        video_width = int(video_info['width'])
        video_height = int(video_info['height']) 
        video_duration = float(probe['format']['duration'])
        
        # Step 8: Processing video - trim if needed and prepare base video
        trim_video = False
        if video_duration > total_duration:
            trim_video = True
            print(f"Video duration ({video_duration}s) > audio duration ({total_duration}s). Will trim video.")
        else:
            print(f"Video duration ({video_duration}s) <= audio duration ({total_duration}s). Will use full video.")
            # We'll match audio length to video length if video is shorter
        
        # Define target dimensions - vertical video 9:16 ratio
        target_width = 576
        target_height = 1024
        
        # Prepare base muted video with proper dimensions
        muted_video_path = f"{base_output_path}_muted.mp4"
        try:
            filter_complex = []
            
            # Handle aspect ratio first (crop to 9:16)
            current_aspect_ratio = video_width / video_height
            target_aspect_ratio = 9 / 16
            
            if abs(current_aspect_ratio - target_aspect_ratio) > 0.01:
                if current_aspect_ratio > target_aspect_ratio:  # Too wide
                    # Crop width
                    new_width = int(video_height * target_aspect_ratio)
                    crop_x = (video_width - new_width) // 2
                    filter_complex.append(f"crop={new_width}:{video_height}:{crop_x}:0")
                else:  # Too tall
                    # Crop height
                    new_height = int(video_width / target_aspect_ratio)
                    crop_y = (video_height - new_height) // 2
                    filter_complex.append(f"crop={video_width}:{new_height}:0:{crop_y}")
            
            # Scale to target dimensions
            filter_complex.append(f"scale={target_width}:{target_height}")
            
            # Add trim if needed
            if trim_video:
                # We'll take the middle portion of the video
                start_time = (video_duration - total_duration) / 2
                filter_complex.append(f"trim=start={start_time}:duration={total_duration}")
            
            # Set duration (needed for setpts after trim)
            if trim_video:
                filter_complex.append("setpts=PTS-STARTPTS")
            
            # Build and run the command
            cmd = [
                "ffmpeg",
                "-i", gameplay_video_path
            ]
            
            # Add filter complex if we have any
            if filter_complex:
                cmd.extend(["-vf", ",".join(filter_complex)])
            
            cmd.extend([
                "-an",  # Remove audio
                "-r", "30",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-level", "4.1", 
                "-y",
                muted_video_path
            ])
            
            print(f"Running FFmpeg muted video command: {' '.join(cmd)}")
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"Processed base video saved to: {muted_video_path}")
            
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error processing video: {e.stderr}")
            return {"status": "error", "message": f"FFmpeg error processing video: {e.stderr}"}
        except Exception as e:
            print(f"Error during video processing: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "message": f"Error processing video: {str(e)}"}
            
        temporary_files.append(muted_video_path)
        
        # Step 9: Create a transparent PNG with correctly positioned overlay and subtitles
        # First, prepare the reddit post image with proper sizing
        resized_overlay_path = f"{base_output_path}_resized_overlay.png"
        try:
            # Target size - 80% of video width
            overlay_width = int(target_width * 0.9)  # 90% of video width
            # Maintain aspect ratio for height
            aspect_ratio = reddit_post_img.width / reddit_post_img.height
            overlay_height = int(overlay_width / aspect_ratio)
            
            # Resize the image
            resized_overlay = reddit_post_img.resize((overlay_width, overlay_height), Image.LANCZOS)
            resized_overlay.save(resized_overlay_path, format="PNG")
            temporary_files.append(resized_overlay_path)
            
            # Calculate position to center the overlay
            x_position = (target_width - overlay_width) // 2
            y_position = (target_height - overlay_height) // 2
            
            print(f"Overlay dimensions: {overlay_width}x{overlay_height}, position: {x_position},{y_position}")
        except Exception as e:
            print(f"Error preparing overlay: {str(e)}")
            return {"status": "error", "message": f"Error preparing overlay: {str(e)}"}
        
        # Step 10: Combine everything: video + overlay + audio + subtitles
        final_output_path = f"{base_output_path}_final.mp4"
        self.update_state(state='PROGRESS', meta={'status': 'Creating final video', 'percent_complete': 90})
        
        try:
            # Create ASS subtitles for better positioning and styling
            subtitles_path = f"{base_output_path}_subtitles.ass"
            color_code = font_name_to_color_code(font)
            
            # Create an improved ASS subtitle file with better centering
            with open(subtitles_path, "w", encoding='utf-8') as f:
                f.write("""[Script Info]
ScriptType: v4.00+
PlayResX: 576
PlayResY: 1024
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
""")
                # Style with appropriate color and improved visibility
                f.write(f"Style: Default,Arial,40,&H00{color_code},&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n")
                
                f.write("[Events]\n")
                f.write("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
                
                # Only show subtitles during script portion, not during title
                start_time_str = format_time(title_duration)
                end_time_str = format_time(total_duration)
                
                # Add the subtitle - showing entire script during the script portion
                f.write(f"Dialogue: 0,{start_time_str},{end_time_str},Default,,0,0,0,,{script}")
            
            temporary_files.append(subtitles_path)
            
            # Now create the complex filter graph for FFmpeg
            # This will handle overlay timing and subtitle placement in one command
            escaped_path = subtitles_path.replace(':', '\\:')
            filter_complex = [
                # Input declarations
                "[0:v]setpts=PTS-STARTPTS[bg];", # Background video
                "[1:v]setpts=PTS-STARTPTS[ovr];", # Overlay image
    
                # Overlay positioned center during title duration
                f"[bg][ovr]overlay=(W-w)/2:(H-h)/2:enable='between(t,0,{title_duration})'[withoverlay];",
    
                # Use the pre-escaped variable
                f"[withoverlay]subtitles={escaped_path}:force_style='FontSize=40,Alignment=2,PrimaryColour=&H00{color_code}'[withsubs]"
            ]
            
            cmd = [
                "ffmpeg",
                "-i", muted_video_path,          # Input 0: background video
                "-i", resized_overlay_path,      # Input 1: overlay image
                "-i", combined_audio_path,       # Input 2: audio
                "-filter_complex", "".join(filter_complex),
                "-map", "[withsubs]",            # Use the video with subtitles
                "-map", "2:a",                   # Use the combined audio
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "128k",
                "-shortest",                     # End with shortest stream
                "-y",
                final_output_path
            ]
            
            print(f"Running final FFmpeg command: {' '.join(cmd)}")
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"FFmpeg final processing stderr: {result.stderr}")
            print(f"Final video saved to: {final_output_path}")
            
            temporary_files.append(final_output_path)
            
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error creating final video: {e.stderr}")
            return {"status": "error", "message": f"FFmpeg error creating final video: {e.stderr}"}
        except Exception as e:
            print(f"Error creating final video: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "message": f"Error creating final video: {str(e)}"}

        # Step 11: Upload to Cloudinary
        self.update_state(state='PROGRESS', meta={'status': 'Uploading to Cloudinary', 'percent_complete': 95})
        try:
            cloudinary_url = upload_to_cloudinary(final_output_path, user_email)
            print(f"Video uploaded to Cloudinary: {cloudinary_url}")
        except Exception as e:
            print(f"Cloudinary upload error: {str(e)}")
            return {"status": "error", "message": f"Error uploading to Cloudinary: {str(e)}"}

        # Step 12: Save to MongoDB
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
        # Clean up temporary files
        cleanup_output_files(temporary_files)

# Helper function to format time for ASS subtitles
def format_time(seconds):
    """Convert seconds to h:mm:ss.cc format for ASS subtitles"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centisecs = int((seconds % 1) * 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"