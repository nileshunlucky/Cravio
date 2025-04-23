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
    except Exception: # Catch any exception during font loading
        print(f"Warning: Could not load font {font_path}, falling back to default.")
        return ImageFont.load_default()

def create_avatar_image(avatar_path=None):
    """
    Creates an avatar image. Uses the provided avatar if available, otherwise defaults.
    """
    if avatar_path and os.path.exists(avatar_path):
        try:
            with open(avatar_path, "rb") as f:
                avatar_bytes = f.read()
            avatar_img = Image.open(BytesIO(avatar_bytes)).convert("RGBA").resize((80, 80))
        except Exception as e:
            print(f"Error loading custom avatar {avatar_path}: {str(e)}. Using default.")
            avatar_img = Image.open(DEFAULT_AVATAR_PATH).convert("RGBA").resize((80, 80))
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
    try:
        verify_img = Image.open(os.path.join(ASSETS_FOLDER, "verify.png")).convert("RGBA").resize((28, 28))
        username_bbox = draw.textbbox((username_x, username_y), username, font=font_username)
        username_width = username_bbox[2] - username_bbox[0]
        verify_x = username_x + username_width + 10
        rounded_bg.paste(verify_img, (verify_x, username_y), verify_img)
    except FileNotFoundError:
        print("Warning: verify.png not found in assets folder.")
    except Exception as e:
        print(f"Error pasting verify icon: {str(e)}")


    # Title lines
    for i, line in enumerate(wrapped_title):
        draw.text((40, content_y_start + i * line_height), line, fill="black", font=font_title)

    # Load and paste icons
    try:
        like_img = Image.open(os.path.join(ASSETS_FOLDER, "like.png")).convert("RGBA").resize((100, 70))
        comment_img = Image.open(os.path.join(ASSETS_FOLDER, "comment.png")).convert("RGBA").resize((100, 70))
        share_img = Image.open(os.path.join(ASSETS_FOLDER, "share.png")).convert("RGBA").resize((100, 70))

        rounded_bg.paste(like_img, (40, reactions_y), like_img)
        rounded_bg.paste(comment_img, (150, reactions_y), comment_img)
        share_x = width - 100 - 32  # 40px padding from right
        rounded_bg.paste(share_img, (share_x, reactions_y), share_img)
    except FileNotFoundError:
        print("Warning: One or more reaction icons not found in assets folder.")
    except Exception as e:
        print(f"Error pasting reaction icons: {str(e)}")

    return rounded_bg

def convert_to_audio(text, voice):
    """Convert text to speech using OpenAI's TTS API"""
    try:
        response = openai.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text
        )
        return response
    except Exception as e:
        # It's better to raise a standard Exception or a custom one here
        # as HTTPException is typically for FastAPI request handling.
        print(f"OpenAI TTS error: {str(e)}")
        raise Exception(f"OpenAI TTS error: {str(e)}")


def save_audio_and_get_duration(audio_response, path: str) -> float:
    """Save audio to file and return its duration"""
    try:
        with open(path, "wb") as f:
            # Use iter_bytes() for potentially large responses
            for chunk in audio_response.iter_bytes():
                f.write(chunk)
        probe = ffmpeg.probe(path)
        duration = float(probe['format']['duration'])
        return duration
    except ffmpeg.Error as e:
        print(f"FFmpeg probing error for audio {path}: {e.stderr.decode()}")
        raise Exception(f"FFmpeg probing error for audio {path}: {e.stderr.decode()}")
    except Exception as e:
        print(f"Error saving or probing audio file {path}: {str(e)}")
        raise Exception(f"Error saving or probing audio file {path}: {str(e)}")


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

# Helper function to format time for ASS subtitles
def format_time(seconds):
    """Convert seconds to h:mm:ss.cc format for ASS subtitles"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centisecs = int((seconds % 1) * 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"


def get_video_dimensions_and_duration(video_path):
    """Get video dimensions and duration using ffprobe"""
    try:
        # Adding -analyzeduration and -probesize to ffprobe call as well
        probe = ffmpeg.probe(video_path, analyze_duration='2147483647', probesize='2147483647')
        video_info = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)

        if not video_info:
             print(f"Could not find video stream in {video_path}")
             return None, None, 0.0

        width = int(video_info.get('width', 0))
        height = int(video_info.get('height', 0))
        # Safely get duration, defaulting to 0 if not present or invalid
        duration = float(probe['format'].get('duration', 0) or 0) # Use 'or 0' to handle None or empty string


        if width == 0 or height == 0:
             print(f"Warning: Video dimensions are zero for {video_path}.")

        return width, height, duration
    except ffmpeg.Error as e:
        print(f"FFprobe error for video {video_path}:\nStdout: {e.stdout.decode()}\nStderr: {e.stderr.decode()}")
        return None, None, 0.0
    except Exception as e:
        print(f"Error probing video file {video_path}: {str(e)}")
        return None, None, 0.0


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
    except Exception as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        raise Exception(f"Error uploading to Cloudinary: {str(e)}")


def cleanup_output_files(file_paths: list):
    """Remove temporary files after processing"""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed file: {file_path}")
        except Exception as e:
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
            print("No document was updated or found for update.")
            return False

        return True

    except Exception as e:
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
    except Exception as e:
        raise Exception(f"Error generating title: {str(e)}")

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
    except Exception as e:
        raise Exception(f"Error generating script: {str(e)}")

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
    except Exception as e:
        raise Exception(f"Error generating caption: {str(e)}")


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
        try:
            title_audio_response = convert_to_audio(title, voice)
            title_duration = save_audio_and_get_duration(title_audio_response, title_audio_path)
            temporary_files.append(title_audio_path)
        except Exception as e:
             return {"status": "error", "message": f"Failed to convert title to audio: {str(e)}"}


        # Step 5: Convert script to audio
        script_audio_path = f"{base_output_path}_script.mp3"
        self.update_state(state='PROGRESS', meta={'status': 'Converting script to audio', 'percent_complete': 60})
        try:
            script_audio_response = convert_to_audio(script, voice)
            script_duration = save_audio_and_get_duration(script_audio_response, script_audio_path)
            temporary_files.append(script_audio_path)
        except Exception as e:
             return {"status": "error", "message": f"Failed to convert script to audio: {str(e)}"}


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
            print(f"Running FFmpeg audio combine command: {' '.join(cmd)}")
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"FFmpeg audio combine stdout: {result.stdout}") # Print stdout as well
            print(f"FFmpeg audio combine stderr: {result.stderr}")
            print(f"Combined audio saved to: {combined_audio_path}")
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error combining audio. Command: {' '.join(e.cmd)}\nStdout: {e.stdout}\nStderr: {e.stderr}")
            raise Exception(f"FFmpeg error combining audio: {e.stderr}")
        except Exception as e:
            print(f"Error during audio combining: {str(e)}")
            raise Exception(f"Error during audio combining: {str(e)}")

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
        video_width, video_height, video_duration = get_video_dimensions_and_duration(gameplay_video_path)

        if video_width is None or video_height is None:
             # Added a more specific error message if probing fails
             error_msg = f"Failed to probe video dimensions/duration for {gameplay_video_path}. Input file might be corrupt or incompatible."
             print(f"Error: {error_msg}")
             return {"status": "error", "message": error_msg}


        if video_duration <= 0:
             print(f"Warning: Could not get valid duration ({video_duration}s) for video {gameplay_video_path}. Proceeding without trimming assumption.")
             # Cannot reliably trim or sync without valid duration.
             pass


        # Step 8: Processing video - trim if needed and prepare base video
        trim_video = False
        # Only attempt to trim if we have a valid video duration
        if video_duration > 0 and video_duration > total_duration:
            trim_video = True
            print(f"Video duration ({video_duration}s) > audio duration ({total_duration}s). Will trim video.")
        elif video_duration > 0 and video_duration < total_duration:
            print(f"Video duration ({video_duration}s) < audio duration ({total_duration}s). Output video will be limited by video duration.")
            # The "-shortest" flag in the final command will handle this.
            pass # No trimming needed if video is shorter or equal
        elif video_duration == 0:
             print("Cannot determine video duration. Cannot apply trimming based on audio length.")
             pass # Cannot trim if duration is unknown


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
                    # Ensure new_width is an even number for compatibility
                    new_width = new_width if new_width % 2 == 0 else new_width - 1
                    crop_x = (video_width - new_width) // 2
                    # Ensure crop_x is an even number
                    crop_x = crop_x if crop_x % 2 == 0 else crop_x - 1
                    filter_complex.append(f"crop={new_width}:{video_height}:{crop_x}:0")
                else:  # Too tall
                    # Crop height
                    new_height = int(video_width / target_aspect_ratio)
                    # Ensure new_height is an even number
                    new_height = new_height if new_height % 2 == 0 else new_height - 1
                    crop_y = (video_height - new_height) // 2
                     # Ensure crop_y is an even number
                    crop_y = crop_y if crop_y % 2 == 0 else crop_y - 1
                    filter_complex.append(f"crop={video_width}:{new_height}:0:{crop_y}")

            # Scale to target dimensions - ensure output dimensions are even
            # Use scale filter with dynamic width/height based on aspect ratio
            # force_original_aspect_ratio=decrease scales down to fit within bounds without stretching
            # pad adds black bars if needed to reach the target resolution
            filter_complex.append(f"scale=w={target_width}:h={target_height}:force_original_aspect_ratio=decrease,pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2")


            # Add trim if needed (only if video_duration is valid)
            if trim_video and video_duration > 0:
                # We'll take the middle portion of the video
                start_time = max(0, (video_duration - total_duration) / 2) # Ensure start_time is not negative
                # trim filter now applied BEFORE scaling and padding
                filter_complex.insert(0, f"trim=start={start_time}:duration={total_duration}")
                # setpts is crucial after trim to reset timestamps
                filter_complex.append("setpts=PTS-STARTPTS")
            elif video_duration > 0 and video_duration < total_duration:
                 # If video is shorter, no trim needed, but setpts is still good practice
                 filter_complex.append("setpts=PTS-STARTPTS")


            # Build and run the command
            # Add -analyzeduration and -probesize for more robust input analysis
            cmd = [
                "ffmpeg",
                "-analyzeduration", "2147483647", # Max value (approx 35 minutes)
                "-probesize", "2147483647",       # Max value (approx 2GB)
                "-i", gameplay_video_path
            ]

            # Add filter complex if we have any
            if filter_complex:
                # Join filters with comma
                cmd.extend(["-vf", ",".join(filter_complex)])

            cmd.extend([
                "-an",  # Remove audio
                "-r", "30", # Force frame rate to 30 fps
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-pix_fmt", "yuv420p", # Ensure compatible pixel format
                "-level", "4.1",
                "-y", # Overwrite output file without asking
                muted_video_path
            ])

            print(f"Running FFmpeg muted video command: {' '.join(cmd)}")
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"FFmpeg muted video stdout: {result.stdout}") # Print stdout
            print(f"FFmpeg muted video stderr: {result.stderr}") # Print stderr
            print(f"Processed base video saved to: {muted_video_path}")

            # **Crucial Check:** Verify the output file exists and is not empty
            if not os.path.exists(muted_video_path) or os.path.getsize(muted_video_path) == 0:
                 error_msg = f"FFmpeg failed to produce a valid muted video file at {muted_video_path}.\nStdout: {result.stdout}\nStderr: {result.stderr}"
                 print(f"Error: {error_msg}")
                 return {"status": "error", "message": error_msg}


        except subprocess.CalledProcessError as e:
            error_msg = f"FFmpeg error processing video. Command: {' '.join(e.cmd)}\nStdout: {e.stdout}\nStderr: {e.stderr}"
            print(f"Error: {error_msg}")
            # Return the specific error message from FFmpeg stderr
            return {"status": "error", "message": f"FFmpeg processing error: {e.stderr.strip()}"}
        except Exception as e:
            error_msg = f"Error during video processing: {str(e)}"
            print(f"Error: {error_msg}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "message": error_msg}

        temporary_files.append(muted_video_path)

        # Step 9: Create a transparent PNG with correctly positioned overlay and subtitles (Subtitle creation moved here)
        # First, prepare the reddit post image with proper sizing
        resized_overlay_path = f"{base_output_path}_resized_overlay.png"
        try:
            # Target size - 90% of target video width
            overlay_width = int(target_width * 0.9)
            # Maintain aspect ratio for height
            aspect_ratio = reddit_post_img.width / reddit_post_img.height
            overlay_height = int(overlay_width / aspect_ratio)

            # Resize the image using a high-quality filter
            resized_overlay = reddit_post_img.resize((overlay_width, overlay_height), Image.Resampling.LANCZOS)
            resized_overlay.save(resized_overlay_path, format="PNG")
            temporary_files.append(resized_overlay_path)

            # Calculate position to center the overlay
            x_position = (target_width - overlay_width) // 2
            y_position = (target_height - overlay_height) // 2

            print(f"Overlay dimensions: {overlay_width}x{overlay_height}, position: {x_position},{y_position}")
        except Exception as e:
            print(f"Error preparing overlay: {str(e)}")
            return {"status": "error", "message": f"Error preparing overlay: {str(e)}"}

        # Create ASS subtitles for better positioning and styling
        subtitles_path = f"{base_output_path}_subtitles.ass"
        try:
            color_code = font_name_to_color_code(font)

            # Create an improved ASS subtitle file with better centering
            with open(subtitles_path, "w", encoding='utf-8') as f:
                f.write("""[Script Info]
ScriptType: v4.00+
PlayResX: 576
PlayResY: 1024
WrapStyle: 0
ScaledBorderAndShadow: yes # Important for scaling subtitles correctly

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
""")
                # Style with appropriate color, improved visibility (outline/shadow), and bottom center alignment (2)
                # Outline and Shadow values are relative to Fontsize
                f.write(f"Style: Default,Arial,40,&H00{color_code},&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,2,10,10,50,1\n\n") # Adjusted MarginV to 50 for bottom padding

                f.write("[Events]\n")
                f.write("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")

                # Only show subtitles during script portion, not during title
                start_time_str = format_time(title_duration)
                end_time_str = format_time(total_duration)

                # Add the subtitle - showing entire script during the script portion
                # Ensure the script text doesn't contain ASS-breaking characters if possible, or escape them.
                # Simple escape for common problematic characters in ASS text
                script_escaped = script.replace('\\', '\\\\').replace('{', '\\{').replace('}', '\\}')
                f.write(f"Dialogue: 0,{start_time_str},{end_time_str},Default,,0,0,0,,{script_escaped}")

            temporary_files.append(subtitles_path)

        except Exception as e:
            print(f"Error creating subtitles file: {str(e)}")
            return {"status": "error", "message": f"Error creating subtitles file: {str(e)}"}


        # Step 10: Combine everything: video + overlay + audio + subtitles
        final_output_path = f"{base_output_path}_final.mp4"
        self.update_state(state='PROGRESS', meta={'status': 'Creating final video', 'percent_complete': 90})

        try:
            # Need to escape the path for FFmpeg's subtitles filter
            # Using ffmpeg.escape_ffmpeg if available, otherwise manual.
            try:
                 # Check if ffmpeg-python's escape is available (it is if ffmpeg is imported)
                 escaped_subtitles_path = ffmpeg.escape_ffmpeg(subtitles_path)
            except AttributeError:
                 # Manual escaping if ffmpeg.escape_ffmpeg is not available (less robust)
                 # This manual escape is basic; for complex paths, a more robust solution is needed.
                 escaped_subtitles_path = subtitles_path.replace('\\', '\\\\').replace(':', '\\:')
                 print("Warning: Using manual subtitle path escaping, consider using a dedicated escaping function.")


            # Using subprocess directly for FFmpeg command construction
            # This allows easier inclusion of input options like -analyzeduration etc.

            cmd = [
                "ffmpeg",
                "-i", muted_video_path,          # Input 0: background video (already processed)
                "-i", resized_overlay_path,       # Input 1: overlay image
                "-i", combined_audio_path,        # Input 2: audio
                # Define the complex filter graph
                "-filter_complex",
                # [0:v] -> video stream from input 0
                # [1:v] -> video stream from input 1 (overlay image)
                # overlay filter: put [1:v] on top of [0:v]
                # x and y positioning, enable based on time (during title duration)
                # [2:a] -> audio stream from input 2
                f"[0:v]setpts=PTS-STARTPTS[bg];"  # Reset timestamps for background video
                f"[1:v]setpts=PTS-STARTPTS[ovr];" # Reset timestamps for overlay image
                f"[bg][ovr]overlay={x_position}:{y_position}:enable='between(t,0,{title_duration})'[withoverlay];" # Apply overlay
                # subtitles filter: apply subtitles from the ASS file to the video with overlay
                # Use the escaped path and specify style parameters in the filter for reliability
                f"[withoverlay]subtitles='{escaped_subtitles_path}'[withsubs]", # Apply subtitles
                "-map", "[withsubs]",             # Map the output video stream from the filter graph
                "-map", "2:a",                   # Map the audio stream from input 2
                "-c:v", "libx264",               # Video codec
                "-preset", "fast",               # Encoding preset
                "-crf", "23",                    # Constant Rate Factor (quality)
                "-c:a", "aac",                   # Audio codec
                "-b:a", "128k",                  # Audio bitrate
                "-shortest",                     # Finish encoding when the shortest input stream ends
                "-y",                            # Overwrite output file without asking
                final_output_path
            ]

            print(f"Running final FFmpeg command: {' '.join(cmd)}")
            # Execute the command
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"FFmpeg final processing stdout: {result.stdout}") # Print stdout
            print(f"FFmpeg final processing stderr: {result.stderr}") # Print stderr
            print(f"Final video saved to: {final_output_path}")

            temporary_files.append(final_output_path)

        except subprocess.CalledProcessError as e:
            error_msg = f"FFmpeg error creating final video. Command: {' '.join(e.cmd)}\nStdout: {e.stdout}\nStderr: {e.stderr}"
            print(f"Error: {error_msg}")
            # Return the specific error message from FFmpeg stderr
            return {"status": "error", "message": f"FFmpeg final processing error: {e.stderr.strip()}"}
        except Exception as e:
            error_msg = f"Error creating final video: {str(e)}"
            print(f"Error: {error_msg}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "message": error_msg}


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
        # This catches any exceptions not handled by the specific try...except blocks
        error_msg = f"An unexpected error occurred during task execution: {str(e)}"
        print(f"Error: {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": error_msg
        }
    finally:
        # Clean up temporary files
        cleanup_output_files(temporary_files)