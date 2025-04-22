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

DEFAULT_AVATAR_PATH = os.path.join(ASSETS_FOLDER, "default-avatar.png")

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
        "yellow": "00FFFF",
        "blue": "FF0000",
        "red": "0000FF",
        "green": "00FF00",
        "purple": "800080",
        "black": "000000",
        "orange": "00A5FF",
        "gray": "808080",
        "pink": "CBC0FF",
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
def create_reddit_post_task(self, **kwargs):
    avatar_path = kwargs.get("avatar_path")
    username = kwargs.get("username")
    title = kwargs.get("title")
    script = kwargs.get("script")
    caption = kwargs.get("caption")
    voice = kwargs.get("voice")
    video = kwargs.get("video")
    font = kwargs.get("font")
    user_email = kwargs.get("user_email")

    print(f"Task started with avatar_path={avatar_path} and username={username}")
    self.update_state(state='PROGRESS', meta={'status': 'Creating Reddit post', 'percent_complete': 0})

    """
    Celery task to handle the creation of a Reddit post by generating an image with avatar, title, 
    username, and other icons. Then creates a video with the post overlay and narration, 
    uploads to Cloudinary and saves to database.
    """
    temporary_files = []  # List to track files for cleanup
    
    try:
        # Step 1: Sanitize the username for file path safety
        self.update_state(state='PROGRESS', meta={'status': 'Sanitizing username', 'percent_complete': 10})
        sanitized_username = safe_filename(username)

        # Step 2: Create the avatar image
        self.update_state(state='PROGRESS', meta={'status': 'Creating avatar image', 'percent_complete': 20})
        avatar_img = create_avatar_image(avatar_path)

        # Step 3: Create the Reddit post layout
        self.update_state(state='PROGRESS', meta={'status': 'Creating Reddit post layout' , 'percent_complete': 30})
        reddit_post_img = create_reddit_post_layout(title, username, avatar_img)

        # Save the post image
        self.update_state(state='PROGRESS', meta={'status': 'Saving Reddit post image', 'percent_complete': 40})
        output_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_reddit_post.png")
        reddit_post_img.save(output_path, format="PNG")
        temporary_files.append(output_path)

        # Step 4: Convert title to audio using OpenAI TTS
        self.update_state(state='PROGRESS', meta={'status': 'Converting title to audio', 'percent_complete': 50})
        title_audio_response = convert_to_audio(title, voice)
        title_audio_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_title.mp3")
        title_duration = save_audio_and_get_duration(title_audio_response, title_audio_path)
        temporary_files.append(title_audio_path)

        # Step 5: Convert script to audio
        self.update_state(state='PROGRESS', meta={'status': 'Converting script to audio', 'percent_complete': 60})
        script_audio_response = convert_to_audio(script, voice)
        script_audio_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_script.mp3")
        script_duration = save_audio_and_get_duration(script_audio_response, script_audio_path)
        temporary_files.append(script_audio_path)

        # Step 6: Combine both audios using ffmpeg
        self.update_state(state='PROGRESS', meta={'status': 'Combining audio', 'percent_complete': 70})
        combined_audio_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_combined.mp3")
        ffmpeg.input(f'concat:{title_audio_path}|{script_audio_path}').output(
            combined_audio_path, codec='copy'
        ).run(overwrite_output=True)
        temporary_files.append(combined_audio_path)

        total_duration = title_duration + script_duration

        # Step 7: Process the video URL
        # Check if the video is a full URL or just a filename
        self.update_state(state='PROGRESS', meta={'status': 'Processing video URL', 'percent_complete': 80})
        if video.startswith("http"):
            # It's a full Cloudinary URL - download it first
            
            # Create a temporary file for the downloaded video
            downloaded_video_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_downloaded_video.mp4")

            # Download the video
            response = requests.get(video, stream=True)
            if response.status_code == 200:
                with open(downloaded_video_path, 'wb') as f:
                    shutil.copyfileobj(response.raw, f)
                gameplay_video_path = downloaded_video_path  # Now defined here
                temporary_files.append(downloaded_video_path)
            else:
                return {
                    "status": "error", 
                    "message": f"Could not download video from URL: {video}"
                }
        else:
            # It's just a filename - use the path in gameplay folder
            gameplay_video_path = os.path.join(GAMEPLAY_FOLDER, video)
            if not os.path.exists(gameplay_video_path):
                return {
                    "status": "error", 
                    "message": f"Video file not found: {gameplay_video_path}"
                }

        # Process video to match 9:16 aspect ratio
        video_width, video_height = get_video_dimensions(gameplay_video_path)
        
        if video_width and video_height:
            # Calculate target dimensions for 9:16 aspect ratio
            target_aspect_ratio = 9/16
            current_aspect_ratio = video_width / video_height
            
            if abs(current_aspect_ratio - target_aspect_ratio) > 0.01:  # If not already 9:16
                # Determine new dimensions
                if current_aspect_ratio > target_aspect_ratio:  # too wide
                    new_width = int(video_height * target_aspect_ratio)
                    new_height = video_height
                    # Center crop
                    x_offset = int((video_width - new_width) / 2)
                    y_offset = 0
                else:  # too tall
                    new_width = video_width
                    new_height = int(video_width / target_aspect_ratio)
                    # Center crop
                    x_offset = 0
                    y_offset = int((video_height - new_height) / 2)
                
                crop_params = f"crop={new_width}:{new_height}:{x_offset}:{y_offset}"
            else:
                crop_params = None
        else:
            crop_params = None
        
        muted_video_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_muted.mp4")
        
        if crop_params:
            # Apply crop filter to achieve 9:16 aspect ratio
            ffmpeg.input(gameplay_video_path).filter('crop', new_width, new_height, x_offset, y_offset).output(
                muted_video_path, **{'c:v': 'libx264', 'an': None}  # 'an' = no audio
            ).run(overwrite_output=True)
        else:
            # Copy as is if already correct ratio
            ffmpeg.input(gameplay_video_path).output(
                muted_video_path, **{'c:v': 'copy', 'an': None}
            ).run(overwrite_output=True)
        temporary_files.append(muted_video_path)

        # Step 8: Combine muted video and combined audio
        final_output_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_final.mp4")
        ffmpeg.output(
            ffmpeg.input(muted_video_path),
            ffmpeg.input(combined_audio_path),
            final_output_path,
            **{'vcodec': 'libx264', 'acodec': 'aac', 'shortest': None, 'preset': 'ultrafast'}
        ).run(overwrite_output=True)
        temporary_files.append(final_output_path)

        # Step 9: Create colored ASS format subtitles
        self.update_state(state='PROGRESS', meta={'status': 'Creating subtitles', 'percent_complete': 90})
        try:
            # Get color code for the specified font
            color_code = font_name_to_color_code(font)
            
            # Create ASS format subtitles
            ass_subtitles = generate_styled_ass_subtitles(script, title_duration, script_duration, color_code)
            subtitles_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_subtitles.ass")
            
            with open(subtitles_path, "w", encoding='utf-8') as subtitle_file:
                subtitle_file.write(ass_subtitles)
            temporary_files.append(subtitles_path)
            
            # Now add the overlay image at the beginning of the video
            # Get updated dimensions after any cropping
            video_width, video_height = get_video_dimensions(final_output_path)
            
            # Calculate overlay position
            overlay_width, overlay_height = Image.open(output_path).size
            
            # Adjust image width to 90% of the video width
            target_image_width = int(video_width * 0.9)
            target_image_height = int(reddit_post_img.height * (target_image_width / reddit_post_img.width))
            resized_reddit_post_img = reddit_post_img.resize((target_image_width, target_image_height))
            
            # Calculate overlay position based on resized image dimensions
            overlay_width = target_image_width
            overlay_height = target_image_height
            x_position = (video_width - overlay_width) // 2
            y_position = (video_height - overlay_height) // 2
            
            # Save resized Reddit post image
            resized_output_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_resized_reddit_post.png")
            resized_reddit_post_img.save(resized_output_path, format="PNG")
            temporary_files.append(resized_output_path)
            
            # Create complex filtergraph for overlay
            overlay_output_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_with_overlay.mp4")
            
            # Build the overlay command
            overlay_cmd = [
                "ffmpeg",
                "-i", final_output_path,
                "-i", resized_output_path,
                "-filter_complex", 
                f"[0:v][1:v]overlay={x_position}:{y_position}:enable='between(t,0,{title_duration})'",
                "-c:a", "copy",
                overlay_output_path
            ]
            
            subprocess.run(overlay_cmd, check=True)
            temporary_files.append(overlay_output_path)
            
            # Update path for final step
            final_output_path = overlay_output_path
            
            # Now add subtitles
            final_with_subs_path = os.path.join(OUTPUT_FOLDER, f"{sanitized_username}_final_with_subs.mp4")
            
            # Ensure the subtitles file path is properly escaped for the command
            if os.name == 'nt':  # Windows
                subtitles_path_esc = subtitles_path.replace('\\', '\\\\\\\\')
            else:  # Unix-like
                subtitles_path_esc = subtitles_path.replace('\\', '\\\\').replace(':', '\\:')
            
            # Build the subtitle command with ASS
            subtitle_cmd = [
                "ffmpeg",
                "-i", final_output_path,
                "-vf", f"ass={subtitles_path_esc}",
                "-c:a", "copy",
                "-c:v", "libx264",
                final_with_subs_path
            ]
            
            subprocess.run(subtitle_cmd, check=True)
            temporary_files.append(final_with_subs_path)
            final_output_path = final_with_subs_path
            
        except HTTPException as e:
            print(f"Error in overlay/subtitle step: {str(e)}")
            import traceback
            traceback.print_exc()

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
        
        # Step 12: Clean up temporary files
        self.update_state(state='PROGRESS', meta={'status': 'Cleaning up temporary files', 'percent_complete': 100})
        cleanup_output_files(temporary_files)
        
        # Return only the cloudinary URL and caption
        return {
            "status": "success",
            "url": cloudinary_url,
            "caption": caption
        }
        
    except HTTPException as e:
        print(f"General error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Clean up any temporary files that were created before the error
        cleanup_output_files(temporary_files)
        
        return {
            "status": "error",
            "message": str(e)
        }