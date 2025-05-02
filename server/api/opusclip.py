from fastapi import UploadFile, File, HTTPException, APIRouter
import cloudinary
import cloudinary.uploader
import yt_dlp
import os
import uuid
import tempfile
import shutil
from pydantic import BaseModel
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

class YouTubeRequest(BaseModel):
    youtube_url: str

def get_ydl_options(base_options: dict) -> dict:
    """Prepare yt-dlp options with cookies from ENV if available"""
    final_options = base_options.copy()
    final_options.update({
        'noplaylist': True,
        'quiet': True,
        'no_warnings': False,
    })

    cookie_content = os.getenv("YT_COOKIES_PATH")
    if cookie_content:
        try:
            # Write env cookie content to a temporary file
            tmp_cookie_file = tempfile.NamedTemporaryFile(delete=False, suffix=".txt", mode='w')
            tmp_cookie_file.write(cookie_content)
            tmp_cookie_file.close()

            final_options['cookiefile'] = tmp_cookie_file.name
            logger.info(f"Temporary cookie file written to: {tmp_cookie_file.name}")
        except Exception as e:
            logger.warning(f"Failed to write cookie file from env: {e}")
    else:
        logger.warning("YT_COOKIES_PATH is not set or empty.")
    
    return final_options

def sanitize_filename(filename):
    sanitized = re.sub(r'[\\/*?:"<>|]', "", filename)
    sanitized = sanitized.replace(' ', '_').strip('_')
    return re.sub(r'_+', '_', sanitized) or "downloaded_video"

@router.post("/process-youtube")
async def process_youtube(request: YouTubeRequest):
    youtube_url = request.youtube_url
    logger.info(f"Processing YouTube URL: {youtube_url}")
    
    temp_dir = None
    cookie_temp_path = None  # To store the path of the temp cookie file
    try:
        # 1. Get video info with cookies
        ydl_opts_info = get_ydl_options({
            'skip_download': True,
            'extract_flat': True
        })
        
        # Capture the temporary cookie file path
        cookie_temp_path = ydl_opts_info.get('cookiefile', None)
        
        with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
            info_dict = ydl.extract_info(youtube_url, download=False)
        
        video_title = sanitize_filename(info_dict.get('title', 'Untitled Video'))
        thumbnail_url = info_dict.get('thumbnail', '')

        # 2. Download video with cookies
        temp_dir = tempfile.mkdtemp()
        download_template = os.path.join(
            temp_dir, 
            f"{uuid.uuid4().hex}_{video_title}.%(ext)s"
        )

        ydl_opts_download = get_ydl_options({
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': download_template,
            'writethumbnail': True,
            'merge_output_format': 'mp4'
        })

        with yt_dlp.YoutubeDL(ydl_opts_download) as ydl:
            ydl.download([youtube_url])

        # Find downloaded file
        downloaded_files = [f for f in os.listdir(temp_dir) if f.endswith('.mp4')]
        if not downloaded_files:
            raise FileNotFoundError("No video file downloaded")
        
        video_path = os.path.join(temp_dir, downloaded_files[0])

        # 3. Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            video_path,
            resource_type="video",
            folder="Opusclip",
            public_id=os.path.splitext(downloaded_files[0])[0]
        )

        return {
            "status": "success",
            "video_url": upload_result['secure_url'],
            "thumbnail_url": thumbnail_url,
            "resource_id": upload_result['public_id']
        }
        
    except yt_dlp.utils.DownloadError as e:
        logger.error(f"Download failed: {str(e)}")
        raise HTTPException(400, detail=f"YouTube download error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(500, detail="Internal server error")
    finally:
        # Clean up: Remove temp files if they exist
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        if cookie_temp_path and os.path.exists(cookie_temp_path):
            os.remove(cookie_temp_path)
            logger.info(f"Removed temporary cookie file: {cookie_temp_path}")


@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
        
        upload_result = cloudinary.uploader.upload(
            tmp_path,
            resource_type="auto",
            folder="opusclip",
            public_id=f"{uuid.uuid4().hex}"
        )
        
        return {
            "status": "success",
            "file_url": upload_result['secure_url'],
            "thumbnail_url": upload_result['secure_url'].replace('.mp4', '.png'),
            "resource_id": upload_result['public_id']
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)