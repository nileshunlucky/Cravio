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
import traceback
import time


OUTPUT_FOLDER = "output"
ASSETS_FOLDER = "assets"
GAMEPLAY_FOLDER = "gameplays"
FONT_PATH = os.path.join("assets", "Roboto-Bold.ttf")

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
    font_username = load_font(FONT_PATH, 40)
    font_title = load_font(FONT_PATH, 50)

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
    """Generate ASS format subtitles with styling - centered with one word at a time and proper timing"""
    words = script_text.strip().split()
    
    # Calculate appropriate word duration to fit within script duration
    # This ensures all words will be shown during the script audio
    word_count = len(words)
    duration_per_word = total_duration_sec / word_count if word_count > 0 else 1.0
    
    # Ensure color code is in correct format
    color_code = color_code.strip("#").upper()

# Convert RGB to BGR for ASS subtitles
    r, g, b = color_code[0:2], color_code[2:4], color_code[4:6]
    bgr_code = f"{b}{g}{r}"
    
    # ASS header with centered position and increased font size
    ass_header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,150,&H00{bgr_code},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    # Generate events - one word at a time distributed over script duration
    events = []
    for i, word in enumerate(words):
        start = start_time_sec + i * duration_per_word
        end = start + duration_per_word
        
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
        
        # Each word gets its own dialogue entry with center alignment
        event_line = f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{{\\b1}}{word}"
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
                - Keep it between 100 words
                - No introductions or explanations - just the story itself
                - Make it sound like a real person telling their story
                - Include 1-2 surprising twists or turns
                - End with a satisfying conclusion or punchline
                """
            }],
            max_tokens=300,
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

        # Step 6: Combine both audios using direct file copy
        self.update_state(state='PROGRESS', meta={'status': 'Combining audio', 'percent_complete': 70})
        combined_audio_path = f"{base_output_path}_combined.mp3"
        try:
            with open(combined_audio_path, 'wb') as outfile:
                with open(title_audio_path, 'rb') as infile:
                    shutil.copyfileobj(infile, outfile)
                with open(script_audio_path, 'rb') as infile:
                    shutil.copyfileobj(infile, outfile)
        except Exception as e:
            print(f"Error combining audio using copy protocol: {e}")
            raise
        temporary_files.append(combined_audio_path)

        total_duration = title_duration + script_duration

        # Step 7: Process the video URL (Download/Locate and Mute/Crop)
        self.update_state(state='PROGRESS', meta={'status': 'Processing background video', 'percent_complete': 80})
        if video.startswith("https"):
            downloaded_video_path = f"{base_output_path}_downloaded_video.mp4"
            try:
                print(f"Downloading video from: {video}")
                response = requests.get(video, stream=True, timeout=60) # Added timeout
                response.raise_for_status()  # Raise an exception for bad status codes
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

        # Get video dimensions using ffmpeg.probe
        print(f"Probing video dimensions for: {gameplay_video_path}")
        video_width, video_height = get_video_dimensions(gameplay_video_path)
        if not video_width or not video_height:
            # Handle error or proceed without cropping if dimensions are unknown
            print(f"Warning: Could not get video dimensions for {gameplay_video_path}. Proceeding without crop.")
            # Optionally raise an error here if dimensions are critical

        muted_video_path = f"{base_output_path}_muted.mp4"
        # --- START: Revised Step 7 using subprocess with conditional copy ---
        try:
            cmd = ["ffmpeg", "-i", gameplay_video_path]
            vf_filters = [] # List for video filters (-vf)

            # --- Cropping logic (remains the same) ---
            if video_width and video_height:
                target_aspect_ratio = 9 / 16
                current_aspect_ratio = video_width / video_height
                if abs(current_aspect_ratio - target_aspect_ratio) > 0.01:
                    print(f"Cropping video. Current AR: {current_aspect_ratio}, Target AR: {target_aspect_ratio}")
                    crop_filter_str = ""
                    # ... (cropping calculation logic remains the same) ...
                    if crop_filter_str:
                         vf_filters.append(crop_filter_str)
                else:
                     print("Video aspect ratio matches target. No crop needed.")
            else:
                 print("Skipping crop due to unknown video dimensions.")
            # --- End Cropping logic ---


            # --- Select codec based on whether filters are applied ---
            output_options = []
            if vf_filters:
                # Filters require re-encoding
                print("Applying video filters, using libx264 encoding.")
                output_options.extend([
                    "-vf", ",".join(vf_filters),
                    "-c:v", "libx264",
                    "-preset", "veryfast", # Keep preset for now, might need tuning if error persists
                ])
            else:
                # No filters applied, safe to copy the video stream
                print("No video filters applied, attempting video stream copy.")
                output_options.extend([
                    "-c:v", "copy",
                ])
            # --- End codec selection ---


            # Common options for both encoding and copying
            cmd.extend([
                "-map", "0:v",      # Select video stream
                "-an",             # Disable audio (mute)
            ])
            cmd.extend(output_options) # Add the codec/filter options decided above
            cmd.extend([
                "-pix_fmt", "yuv420p", # Good practice, though ignored by -c:v copy
                "-y",              # Overwrite output
                # "-loglevel", "debug", # Uncomment for VERY verbose FFmpeg logs if needed
                muted_video_path
            ])

            print(f"Running FFmpeg command for Step 7: {' '.join(cmd)}")
            result = subprocess.run(cmd, check=True, capture_output=True, text=True, encoding='utf-8')
            # print(f"FFmpeg Step 7 stdout: {result.stdout}")
            print(f"FFmpeg Step 7 stderr (Info/Progress): {result.stderr}")
            print(f"Muted/Cropped video saved to: {muted_video_path}")
            # --- END: Revised Step 7 ---

        except subprocess.CalledProcessError as e:
            # Log the error including stderr from FFmpeg for better debugging
            print(f"FFmpeg error processing video (Step 7). Command: {' '.join(e.cmd)}")
            print(f"FFmpeg stderr: {e.stderr}")
            raise Exception(f"FFmpeg error during video processing: {e.stderr}") from e
        except Exception as e:
            print(f"Unexpected error during video processing (Step 7): {str(e)}")
            raise

        temporary_files.append(muted_video_path)

        # Step 8: Combine muted video and combined audio using subprocess
        final_with_audio_path = f"{base_output_path}_final_with_audio.mp4"
        self.update_state(state='PROGRESS', meta={'status': 'Combining video and audio', 'percent_complete': 85})

        try:
            # SOLUTION: Instead of trying to re-encode the video, just copy the streams
            # This significantly reduces memory and CPU usage
            command = [
                'ffmpeg',
                '-i', muted_video_path,
                '-i', combined_audio_path,
                '-c:v', 'copy',  # Copy video stream without re-encoding
                '-c:a', 'aac',   # Convert audio to AAC (much lighter than full video re-encoding)
                '-b:a', '48k',   # Very low audio bitrate to save resources
                '-ar', '22050',  # Lower audio sample rate (standard was 44100)
                '-shortest',
                '-movflags', '+faststart',
                final_with_audio_path
            ]

            # Print the command for debugging
            print(f"Combining video '{muted_video_path}' and audio '{combined_audio_path}' using streamcopy: {command}")

            # Run the subprocess command
            result = subprocess.run(command, check=True, timeout=180)  # 3 minute timeout
    
            # After successful combination
            print(f"Combined video with audio saved to: {final_with_audio_path}")
            temporary_files.append(final_with_audio_path)

        except subprocess.TimeoutExpired:
            print("FFmpeg command timed out - process took too long")
            # FALLBACK: If timeout occurs, try an even simpler approach
            try:
                fallback_output = f"{base_output_path}_audio_only.mp4"
                # Just take the audio and create a simple video
                fallback_cmd = [
                    'ffmpeg',
                    '-i', combined_audio_path,
                    '-f', 'lavfi', 
                    '-i', 'color=c=black:s=720x1280:r=15',  # Black background video at lower framerate
                    '-c:v', 'libx264', 
                    '-preset', 'ultrafast',
                    '-tune', 'stillimage',
                    '-crf', '35',  # Very low quality to save resources
                    '-c:a', 'aac',
                    '-shortest',
                    fallback_output
                ]
                subprocess.run(fallback_cmd, check=True, timeout=120)
                final_with_audio_path = fallback_output
                temporary_files.append(fallback_output)
                print(f"Created fallback audio-only video: {fallback_output}")
            except Exception as fallback_error:
                print(f"Fallback approach also failed: {fallback_error}")
                raise Exception("All FFmpeg approaches failed") from fallback_error
    
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: Return code {e.returncode}")
    
            # ALTERNATIVE FALLBACK: Try splitting the process into smaller steps
            try:
                print("Trying alternative approach - splitting the process")
                temp_audio_path = f"{base_output_path}_temp_audio.aac"
        
                # Step 1: Extract and convert audio to AAC separately (lower quality)
                audio_cmd = [
                    'ffmpeg',
                    '-i', combined_audio_path,
                    '-c:a', 'aac',
                    '-b:a', '32k',  # Very low bitrate
                    '-ar', '22050',  # Lower sample rate
                    temp_audio_path
                ]
                subprocess.run(audio_cmd, check=True, timeout=60)
                temporary_files.append(temp_audio_path)
        
                # Step 2: Combine with video using stream copy for both
                final_cmd = [
                    'ffmpeg',
                    '-i', muted_video_path,
                    '-i', temp_audio_path,
                    '-c:v', 'copy',  # Copy video
                    '-c:a', 'copy',  # Copy already-converted audio
                    '-shortest',
                    final_with_audio_path
                ]
                subprocess.run(final_cmd, check=True, timeout=120)
                print(f"Successfully created video using split approach: {final_with_audio_path}")
                temporary_files.append(final_with_audio_path)
            except Exception as alt_error:
                print(f"Alternative approach also failed: {alt_error}")
                raise Exception("All FFmpeg approaches failed") from alt_error

        except Exception as e:
            print(f"Unexpected error in Step 8: {str(e)}")
            raise

# Replace your entire subtitle creation section with this more robust approach

# Step 9: Add overlay image and subtitles - modified for robustness
        self.update_state(state='PROGRESS', meta={'status': 'Creating subtitles and overlay', 'percent_complete': 90})
        final_output_path = f"{base_output_path}_final_complete.mp4"

        try:
                # Get video dimensions for proper overlay positioning
                video_width, video_height = get_video_dimensions(final_with_audio_path)
                if not video_width or not video_height:
                        print("Warning: Could not get video dimensions. Using defaults.")
                        video_width, video_height = 720, 1280  # Common mobile video dimensions
                
                print(f"Video dimensions for overlay: {video_width}x{video_height}")
                
                # Resize Reddit post image for overlay (80% of video width)
                target_image_width = int(video_width * 0.8)
                target_image_height = int(reddit_post_img.height * (target_image_width / reddit_post_img.width))
                resized_reddit_post_img = reddit_post_img.resize((target_image_width, target_image_height))
                resized_output_path = f"{base_output_path}_resized_reddit_post.png"
                resized_reddit_post_img.save(resized_output_path, format="PNG")
                temporary_files.append(resized_output_path)
                
                print(f"Resized image saved to: {resized_output_path} with dimensions {target_image_width}x{target_image_height}")
                
                # Convert font color to hex for ASS subtitles
                font_color = font_name_to_color_code(font)
                
                # Create ASS subtitle file
                subtitle_file_path = f"{base_output_path}_subtitles.ass"
                
                # Generate subtitle content - one word at a time
                ass_content = generate_styled_ass_subtitles(
                        script_text=script,
                        start_time_sec=title_duration,
                        total_duration_sec=script_duration,
                        color_code=font_color
                )
                
                # Write subtitle file
                with open(subtitle_file_path, "w", encoding="utf-8") as f:
                        f.write(ass_content)
                
                temporary_files.append(subtitle_file_path)
                print(f"Created ASS subtitle file: {subtitle_file_path}")
                
                # IMPORTANT CHANGE: Apply both overlay and subtitles in a single FFmpeg command
                # This is more efficient and less error-prone than separating them
                overlay_cmd = [
                        "ffmpeg",
                        "-i", final_with_audio_path,
                        "-i", resized_output_path,
                        "-filter_complex",
                        # This complex filter does two things:
                        # 1. Overlays the image for the title duration
                        # 2. Applies the subtitles from the ASS file throughout the video
                        f"[0:v][1:v]overlay=(W-w)/2:150:enable='between(t,0,{title_duration})'[v]; [v]ass={subtitle_file_path}[outv]",
                        "-map", "[outv]",  # Use the output from the filter chain
                        "-map", "0:a",     # Keep the original audio
                        "-c:v", "libx264",
                        "-preset", "veryfast",  # Balance between speed and quality
                        "-crf", "26",           # Better quality for visibility
                        "-c:a", "copy",         # Copy audio stream
                        "-y",
                        final_output_path
                ]
                
                print("Running combined overlay and subtitles command:")
                print(" ".join(overlay_cmd))
                
                # Increase timeout to allow for processing
                overlay_process = subprocess.run(overlay_cmd, capture_output=True, text=True, timeout=300)
                
                if overlay_process.returncode == 0 and os.path.exists(final_output_path) and os.path.getsize(final_output_path) > 0:
                        print("Successfully added overlay and subtitles in one pass")
                else:
                        print(f"Combined overlay and subtitle command failed: {overlay_process.stderr}")
                        print("Attempting two-step approach as fallback...")
                        
                        # Fallback: Try two-step approach if combined approach fails
                        overlay_only_output = f"{base_output_path}_overlay_only.mp4"
                        
                        # Step 1: Only add overlay first
                        simple_overlay_cmd = [
                                "ffmpeg",
                                "-i", final_with_audio_path,
                                "-i", resized_output_path,
                                "-filter_complex", f"overlay=(W-w)/2:150:enable='between(t,0,{title_duration})'",
                                "-c:v", "libx264",
                                "-preset", "ultrafast",
                                "-c:a", "copy",
                                "-y",
                                overlay_only_output
                        ]
                        
                        print("Trying simple overlay first:")
                        print(" ".join(simple_overlay_cmd))
                        
                        overlay_result = subprocess.run(simple_overlay_cmd, capture_output=True, text=True, timeout=180)
                        
                        if overlay_result.returncode == 0 and os.path.exists(overlay_only_output) and os.path.getsize(overlay_only_output) > 0:
                                temporary_files.append(overlay_only_output)
                                print("Simple overlay succeeded, now adding subtitles")
                                
                                # Step 2: Add subtitles to overlayed video
                                subtitle_cmd = [
                                        "ffmpeg",
                                        "-i", overlay_only_output,
                                        "-vf", f"ass={subtitle_file_path}",
                                        "-c:v", "libx264",
                                        "-preset", "ultrafast",
                                        "-c:a", "copy",
                                        "-y",
                                        final_output_path
                                ]
                                
                                print("Adding subtitles to overlayed video:")
                                print(" ".join(subtitle_cmd))
                                
                                subtitle_result = subprocess.run(subtitle_cmd, capture_output=True, text=True, timeout=180)
                                
                                if subtitle_result.returncode == 0 and os.path.exists(final_output_path) and os.path.getsize(final_output_path) > 0:
                                        print("Successfully added subtitles in second pass")
                                else:
                                        print(f"Subtitle addition failed: {subtitle_result.stderr}")
                                        final_output_path = overlay_only_output
                                        print("Using overlay-only video as final result")
                        else:
                                print(f"Simple overlay failed: {overlay_result.stderr}")
                                print("Trying hardcoded overlay position as last resort...")
                                
                                # Last resort: Try with hardcoded position
                                last_resort_output = f"{base_output_path}_last_resort.mp4"
                                last_resort_cmd = [
                                        "ffmpeg",
                                        "-i", final_with_audio_path,
                                        "-i", resized_output_path,
                                        "-filter_complex", f"overlay=10:10:enable='if(lt(t,{title_duration}),1,0)'",
                                        "-c:v", "libx264",
                                        "-preset", "ultrafast",
                                        "-c:a", "copy",
                                        "-y",
                                        last_resort_output
                                ]
                                
                                last_resort_result = subprocess.run(last_resort_cmd, capture_output=True, text=True, timeout=120)
                                
                                if last_resort_result.returncode == 0 and os.path.exists(last_resort_output) and os.path.getsize(last_resort_output) > 0:
                                        temporary_files.append(last_resort_output)
                                        print("Last resort overlay succeeded")
                                        final_output_path = last_resort_output
                                else:
                                        print("All overlay attempts failed, using original audio-video")
                                        final_output_path = final_with_audio_path

        except subprocess.TimeoutExpired as e:
                print(f"FFmpeg process timed out: {str(e)}")
                print("Using previous video stage as final output")
                final_output_path = final_with_audio_path
        except Exception as e:
                print(f"Error in Step 9: {str(e)}")
                traceback.print_exc()
                final_output_path = final_with_audio_path  # Fallback to previous stage

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
            "caption": caption,
        }

    except Exception as e:
        print(f"General error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
    finally:
        # Step 12: Clean up temporary files
        self.update_state(state='PROGRESS', meta={'status': 'Cleaning up temporary files', 'percent_complete': 100})
        cleanup_output_files(temporary_files)