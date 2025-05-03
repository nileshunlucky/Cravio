from fastapi import UploadFile, File, HTTPException, APIRouter, BackgroundTasks, Depends
import cloudinary
import cloudinary.uploader
import yt_dlp
import os
import uuid
import tempfile
import shutil
import subprocess
import time
from pydantic import BaseModel, validator
import logging
from dotenv import load_dotenv
import httpx
from pathlib import Path

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

# Define the path for the YouTube cookies file
YOUTUBE_COOKIES_PATH = "youtube_cookies.txt"
COOKIES_AGE_LIMIT_DAYS = 7  # Refresh cookies if older than this

class YouTubeRequest(BaseModel):
    youtube_url: str
    
    @validator('youtube_url')
    def validate_youtube_url(cls, v):
        # Basic validation to ensure it's a YouTube URL
        if not any(domain in v for domain in ['youtube.com', 'youtu.be']):
            raise ValueError("Please provide a valid YouTube URL")
        return v

def check_cookie_health():
    """Check if cookies are healthy and not too old"""
    if not os.path.exists(YOUTUBE_COOKIES_PATH):
        logger.warning("YouTube cookies file does not exist")
        return False
        
    # Check file size
    if os.path.getsize(YOUTUBE_COOKIES_PATH) < 100:
        logger.warning("YouTube cookies file is too small to be valid")
        return False
        
    # Check file age
    mtime = os.path.getmtime(YOUTUBE_COOKIES_PATH)
    age_days = (time.time() - mtime) / (60 * 60 * 24)
    
    if age_days > COOKIES_AGE_LIMIT_DAYS:
        logger.warning(f"YouTube cookies are {age_days:.1f} days old and may be expired")
        return False
        
    return True

def refresh_cookies_if_needed(background_tasks: BackgroundTasks):
    """Schedule cookie refresh in background if needed"""
    if not check_cookie_health():
        background_tasks.add_task(refresh_cookies)

def refresh_cookies():
    """Attempt to refresh YouTube cookies"""
    try:
        logger.info("Attempting to refresh YouTube cookies")
        # Run the cookie extractor script
        result = subprocess.run(
            ["python", "youtube_cookie_manager.py"], 
            capture_output=True, 
            text=True, 
            timeout=30
        )
        
        if result.returncode == 0:
            logger.info("Successfully refreshed YouTube cookies")
            return True
        else:
            logger.error(f"Failed to refresh cookies: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"Error refreshing cookies: {str(e)}")
        return False

def get_ydl_options() -> dict:
    """Get yt-dlp options with optimal cookie handling"""
    options = {
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'geo_bypass': True,  # Try to bypass geo-restrictions
        'geo_bypass_country': 'US',  # Use US as proxy location
        'socket_timeout': 30,  # Increase socket timeout
        'retries': 5,  # Retry failed downloads 
    }
    
    # Try multiple authentication methods
    
    # 1. First priority: Use cookies file if it exists and has content
    if os.path.exists(YOUTUBE_COOKIES_PATH) and os.path.getsize(YOUTUBE_COOKIES_PATH) > 0:
        logger.info(f"Using cookies file at: {YOUTUBE_COOKIES_PATH}")
        options['cookiefile'] = YOUTUBE_COOKIES_PATH
    
    # 2. Second priority: Use browser cookies if available
    browser_name, browser_path = _detect_browser()
    if browser_name and browser_path:
        logger.info(f"Using cookies from browser: {browser_name}")
        options['cookiesfrombrowser'] = (browser_name, browser_path)
    
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
        
    # Check for Firefox on Windows
    firefox_win_path = os.path.expandvars(r"%APPDATA%\Mozilla\Firefox\Profiles")
    if os.path.exists(firefox_win_path):
        # Find the default profile
        profiles = os.listdir(firefox_win_path)
        if profiles:
            return "firefox", os.path.join(firefox_win_path, profiles[0])
    
    # Check for Brave on Windows
    brave_win_path = os.path.expandvars(r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data")
    if os.path.exists(brave_win_path):
        return "brave", brave_win_path
        
    # Check for Chrome on macOS
    chrome_mac_path = os.path.expanduser("~/Library/Application Support/Google/Chrome")
    if os.path.exists(chrome_mac_path):
        return "chrome", chrome_mac_path
        
    # Check for Firefox on macOS
    firefox_mac_path = os.path.expanduser("~/Library/Application Support/Firefox/Profiles")
    if os.path.exists(firefox_mac_path):
        profiles = os.listdir(firefox_mac_path)
        if profiles:
            return "firefox", os.path.join(firefox_mac_path, profiles[0])
            
    # Check for Chrome on Linux
    chrome_linux_path = os.path.expanduser("~/.config/google-chrome")
    if os.path.exists(chrome_linux_path):
        return "chrome", chrome_linux_path
    
    # Check for Firefox on Linux
    firefox_linux_path = os.path.expanduser("~/.mozilla/firefox")
    if os.path.exists(firefox_linux_path):
        # Find profile with .default in name
        for item in os.listdir(firefox_linux_path):
            if '.default' in item and os.path.isdir(os.path.join(firefox_linux_path, item)):
                return "firefox", os.path.join(firefox_linux_path, item)
    
    # No browser found
    return None, None

async def check_youtube_health(youtube_url: str):
    """Test if we can access YouTube without authentication issues"""
    try:
        with yt_dlp.YoutubeDL({'quiet': True, 'simulate': True}) as ydl:
            # Try with a known public YouTube video
            test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Public video
            ydl.extract_info(test_url, download=False)
            return True
    except Exception as e:
        logger.warning(f"YouTube health check failed: {str(e)}")
        return False

@router.post("/process-youtube")
async def process_youtube(request: YouTubeRequest, background_tasks: BackgroundTasks):
    youtube_url = request.youtube_url
    logger.info(f"Processing YouTube URL: {youtube_url}")

    # First check if we need to refresh cookies
    refresh_cookies_if_needed(background_tasks)

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
                    
                    if not os.path.exists(video_path):
                        # Try alternate filename pattern if the expected file doesn't exist
                        possible_files = [f for f in os.listdir(tmp_dir) if os.path.isfile(os.path.join(tmp_dir, f))]
                        if possible_files:
                            video_path = os.path.join(tmp_dir, possible_files[0])
                            logger.info(f"Using alternate video path: {video_path}")
                        else:
                            raise FileNotFoundError("Download completed but video file not found")
                    
            except yt_dlp.utils.DownloadError as e:
                error_msg = str(e)
                logger.error(f"YouTube download failed: {error_msg}")
                
                # Try to refresh cookies and retry if it's an authentication error
                if "Sign in to confirm you're not a bot" in error_msg:
                    logger.info("Attempting to refresh cookies and retry...")
                    refresh_cookies()
                    
                    # Try again with fresh options
                    try:
                        ydl_opts = get_ydl_options()  # Get fresh options
                        ydl_opts['outtmpl'] = os.path.join(tmp_dir, '%(title)s.%(ext)s')
                        
                        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                            info_dict = ydl.extract_info(youtube_url, download=True)
                            video_path = ydl.prepare_filename(info_dict)
                            logger.info(f"Retry successful for: {info_dict.get('title', youtube_url)}")
                    except Exception as retry_e:
                        # If retry also fails, provide specific error messages
                        if "Sign in to confirm you're not a bot" in str(retry_e):
                            raise HTTPException(
                                status_code=401,
                                detail="YouTube authentication required. The server needs valid authentication to access this video."
                            )
                        elif "Private video" in str(retry_e):
                            raise HTTPException(
                                status_code=403,
                                detail="This YouTube video is private and cannot be accessed."
                            )
                        elif "This video is unavailable" in str(retry_e) or "Video unavailable" in str(retry_e):
                            raise HTTPException(
                                status_code=404,
                                detail="The requested YouTube video is unavailable or does not exist."
                            )
                        else:
                            # Generic download error
                            raise HTTPException(
                                status_code=400,
                                detail=f"Failed to download YouTube video: {str(retry_e)}"
                            )
                else:
                    if "Private video" in error_msg:
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

    except Exception as e:
        logger.error(f"Unexpected error during YouTube processing: {str(e)}")
        raise HTTPException(500, detail=f"Internal server error during video processing: {str(e)}")

@router.get("/check-youtube-auth")
async def check_youtube_auth():
    """Check if YouTube authentication is properly configured"""
    auth_methods = []
    
    # Check cookies file
    cookies_status = "not_found"
    cookies_size = 0
    
    if os.path.exists(YOUTUBE_COOKIES_PATH):
        cookies_size = os.path.getsize(YOUTUBE_COOKIES_PATH)
        if cookies_size > 100:  # Reasonable size for valid cookies
            # Check file age
            mtime = os.path.getmtime(YOUTUBE_COOKIES_PATH)
            age_days = (time.time() - mtime) / (60 * 60 * 24)
            
            if age_days <= COOKIES_AGE_LIMIT_DAYS:
                cookies_status = "available"
            else:
                cookies_status = f"expired ({age_days:.1f} days old)"
        else:
            cookies_status = "empty_file"
    
    auth_methods.append({
        "method": "cookies_file",
        "path": YOUTUBE_COOKIES_PATH,
        "size_bytes": cookies_size,
        "status": cookies_status
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
    
    # Test YouTube connectivity with a known public video
    youtube_connectivity = await check_youtube_health("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    
    # Overall status
    has_valid_auth = (cookies_status == "available" or browser_name is not None) and youtube_connectivity
    
    recommendations = []
    if not has_valid_auth:
        if cookies_status != "available":
            recommendations.append("Run the youtube_cookie_manager.py script to generate fresh YouTube cookies")
        
        if not browser_name:
            recommendations.append("Install a supported browser (Chrome, Firefox, Edge, Brave) and login to YouTube")
    
    return {
        "status": "authenticated" if has_valid_auth else "not_authenticated",
        "youtube_connectivity": "working" if youtube_connectivity else "issues_detected",
        "auth_methods": auth_methods,
        "recommendations": recommendations
    }

@router.post("/refresh-youtube-cookies")
async def refresh_youtube_cookies():
    """Endpoint to manually trigger YouTube cookie refresh"""
    success = refresh_cookies()
    
    if success:
        return {
            "status": "success",
            "message": "YouTube cookies refreshed successfully"
        }
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to refresh YouTube cookies. Check server logs for details."
        )