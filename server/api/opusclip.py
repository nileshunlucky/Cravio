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
from dotenv import load_dotenv
load_dotenv()

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

# Define the path for the YouTube cookies file
# Using an absolute path might be safer in deployment if the working directory varies
# For Render, you need to ensure this file is included in your build/deployment
YOUTUBE_COOKIES_PATH = "youtube_cookies.txt"

class YouTubeRequest(BaseModel):
    youtube_url: str

def get_ydl_options() -> dict:
    """Get yt-dlp options, prioritizing browser cookies if available"""
    options = {
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    }
    
    # Try to use cookies file if it exists
    if os.path.exists(YOUTUBE_COOKIES_PATH) and os.path.getsize(YOUTUBE_COOKIES_PATH) > 0:
        logger.info(f"Using cookies file at: {YOUTUBE_COOKIES_PATH}")
        options['cookiefile'] = YOUTUBE_COOKIES_PATH    
    else:
        # Fallback to cookiesfrombrowser if available (works better on some systems)
        browser_name, browser_path = _detect_browser()
        if browser_name and browser_path:
            logger.info(f"Using cookies from browser: {browser_name} at {browser_path}")
            options['cookiesfrombrowser'] = browser_name      # ← only the browser key
        else:
            logger.warning("No cookies file or browser profile found. YouTube authentication may fail.")
    
    return options

def _detect_browser():
    """Detect available browser and profile path"""
    # Check for Chrome on Windows
    chrome_win_path = os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\User Data")
    if os.path.exists(chrome_win_path):
        return "chrome", chrome_win_path
        
    # Check for Edge on Windows
    edge_win_path = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\User Data")
    if os.path.exists(edge_win_path):
        return "edge", edge_win_path
        
    # Check for Chrome on macOS
    chrome_mac_path = os.path.expanduser("~/Library/Application Support/Google/Chrome")
    if os.path.exists(chrome_mac_path):
        return "chrome", chrome_mac_path
        
    # Check for Chrome on Linux
    chrome_linux_path = os.path.expanduser("~/.config/google-chrome")
    if os.path.exists(chrome_linux_path):
        return "chrome", chrome_linux_path
    
    # No browser found
    return None, None

@router.post("/process-youtube")
async def process_youtube(request: YouTubeRequest):
    youtube_url = request.youtube_url
    logger.info(f"Processing YouTube URL: {youtube_url}")

    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            # Configure download options
            ydl_opts = get_ydl_options()
            ydl_opts['outtmpl'] = os.path.join(tmp_dir, '%(title)s.%(ext)s')
            
            # First try to extract info without downloading to check authentication
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    logger.info("Extracting video info...")
                    info_dict = ydl.extract_info(youtube_url, download=False)
                    
                    # If info extraction successful, proceed with download
                    logger.info(f"Successfully authenticated. Downloading video: {info_dict.get('title', youtube_url)}")
                    info_dict = ydl.extract_info(youtube_url, download=True)
                    video_path = ydl.prepare_filename(info_dict)
            except yt_dlp.utils.DownloadError as e:
                error_msg = str(e)
                logger.error(f"YouTube download failed: {error_msg}")
                
                # Provide specific error messages based on the error type
                if "Sign in to confirm you're not a bot" in error_msg:
                    raise HTTPException(
                        status_code=401,
                        detail="YouTube authentication required. The server needs valid authentication to access this video."
                    )
                elif "Private video" in error_msg:
                    raise HTTPException(
                        status_code=403,
                        detail="This YouTube video is private and cannot be accessed."
                    )
                elif "This video is unavailable" in error_msg or "Video unavailable" in error_msg:
                    raise HTTPException(
                        status_code=404,
                        detail="The requested YouTube video is unavailable or does not exist."
                    )
                else:
                    # Generic download error
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to download YouTube video: {error_msg}"
                    )

            # Upload video to Cloudinary
            logger.info(f"Uploading video to Cloudinary: {video_path}")
            video_upload = cloudinary.uploader.upload(
                video_path,
                resource_type="video",
                folder="opusclip",
                public_id=f"video_{uuid.uuid4().hex}"
            )

            # Handle thumbnail
            thumbnail_url = None
            if info_dict.get('thumbnail'):
                try:
                    logger.info(f"Uploading thumbnail from: {info_dict.get('thumbnail')}")
                    thumbnail_upload = cloudinary.uploader.upload(
                        info_dict['thumbnail'],
                        resource_type="image",
                        folder="opusclip/thumbnails",
                        public_id=f"thumb_{uuid.uuid4().hex}"
                    )
                    thumbnail_url = thumbnail_upload['secure_url']
                except Exception as e:
                    logger.error(f"Thumbnail upload failed: {str(e)}")

            return {
                "status": "success",
                "video_url": video_upload['secure_url'],
                "thumbnail_url": thumbnail_url,
                "title": info_dict.get('title', ''),
                "duration": info_dict.get('duration', 0)
            }

    except yt_dlp.utils.DownloadError as e:
        # This catch is for any download errors not handled in the nested try block
        logger.error(f"YouTube download failed: {str(e)}")
        raise HTTPException(400, detail=f"Failed to download YouTube video: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during YouTube processing: {str(e)}")
        raise HTTPException(500, detail="Internal server error during video processing")

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
            public_id=f"upload_{uuid.uuid4().hex}"
        )

        return {
            "status": "success",
            "file_url": upload_result['secure_url'],
            "thumbnail_url": upload_result.get('secure_url', '').rsplit('.', 1)[0] + '.jpg',
            "resource_id": upload_result['public_id']
        }
    except Exception as e:
         logger.error(f"Unexpected error during file upload: {str(e)}")
         raise HTTPException(500, detail="Internal server error during file upload")
    finally:
        # Ensure the temporary file is cleaned up
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.get("/check-youtube-auth")
async def check_youtube_auth():
    """Check if YouTube authentication is properly configured"""
    auth_methods = []
    
    # Check cookies file
    if os.path.exists(YOUTUBE_COOKIES_PATH):
        file_size = os.path.getsize(YOUTUBE_COOKIES_PATH)
        if file_size > 0:
            auth_methods.append({
                "method": "cookies_file",
                "path": YOUTUBE_COOKIES_PATH,
                "size_bytes": file_size,
                "status": "available"
            })
        else:
            auth_methods.append({
                "method": "cookies_file",
                "path": YOUTUBE_COOKIES_PATH,
                "size_bytes": 0,
                "status": "empty_file"
            })
    else:
        auth_methods.append({
            "method": "cookies_file",
            "path": YOUTUBE_COOKIES_PATH,
            "status": "not_found"
        })
    
    # Check browser profiles
    browser_name, browser_path = _detect_browser()
    if browser_name and browser_path:
        auth_methods.append({
            "method": "browser_profile",
            "browser": browser_name,
            "path": browser_path,
            "status": "available"
        })
    else:
        auth_methods.append({
            "method": "browser_profile",
            "status": "not_found"
        })
    
    # Overall status
    has_valid_auth = any(method.get("status") == "available" for method in auth_methods)
    
    return {
        "status": "authenticated" if has_valid_auth else "not_authenticated",
        "auth_methods": auth_methods,
        "recommendations": [] if has_valid_auth else [
            "Create a youtube_cookies.txt file with valid YouTube authentication cookies",
            "Login to YouTube in Chrome/Edge on the server"
        ]
    }