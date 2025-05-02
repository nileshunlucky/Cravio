from fastapi import UploadFile, File, HTTPException, APIRouter, Depends, Request
import cloudinary
import cloudinary.uploader
import yt_dlp
import os
import uuid
import tempfile
import shutil
import random
import time
import requests
from pydantic import BaseModel
import logging
from typing import Optional, List, Dict, Any

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
    raw_cookies: Optional[str] = None  # Raw cookies string
    attempts: Optional[int] = 3  # Number of attempts to try downloading
    use_invidious: Optional[bool] = False  # Whether to try Invidious instances

class CookieFile(BaseModel):
    raw_cookies: str

# List of user agents to rotate
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11.5; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_5_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15'
]

# List of public Invidious instances that can be used as fallbacks
INVIDIOUS_INSTANCES = [
    'https://invidious.snopyta.org',
    'https://yewtu.be',
    'https://invidious.kavin.rocks',
    'https://vid.puffyan.us',
    'https://inv.riverside.rocks',
]

def get_ydl_options(raw_cookies: Optional[str] = None) -> dict:
    """
    Prepare yt-dlp options with advanced settings to bypass restrictions
    
    Args:
        raw_cookies: Raw cookies string (optional)
    """
    # Select a random user agent
    user_agent = random.choice(USER_AGENTS)
    
    options = {
        'noplaylist': True,
        'quiet': True,
        'no_warnings': False,
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': '/tmp/%(id)s.%(ext)s',
        'nocheckcertificate': True,  # Don't verify SSL certificates
        'ignoreerrors': True,  # Continue on download errors
        'no_color': True,
        'geo_bypass': True,  # Try to bypass geo-restrictions
        'geo_bypass_country': 'US',  # Specify a country for geo-bypass
        'user_agent': user_agent,  # Use a rotating user agent
        'http_headers': {  # Set custom HTTP headers
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'DNT': '1',
            'Connection': 'keep-alive',
        },
        'socket_timeout': 15,  # Timeout for socket connections
        'retries': 3,  # Number of retries for failing downloads
    }
    
    # Add raw cookies if provided
    if raw_cookies:
        # Create a temporary cookie file
        fd, cookie_path = tempfile.mkstemp(suffix='.txt')
        with os.fdopen(fd, 'w') as f:
            f.write(raw_cookies)
        
        options['cookiefile'] = cookie_path
    
    return options

async def try_invidious_download(video_id: str) -> Dict[str, Any]:
    """
    Attempt to download a video using public Invidious instances as a fallback
    
    Args:
        video_id: YouTube video ID
        
    Returns:
        Dict containing video information or None if all attempts fail
    """
    # Shuffle the list of instances to try them in random order
    instances = INVIDIOUS_INSTANCES.copy()
    random.shuffle(instances)
    
    for instance in instances:
        try:
            # Construct API URL for video info
            api_url = f"{instance}/api/v1/videos/{video_id}"
            
            # Get video info from Invidious API
            response = requests.get(api_url, timeout=10)
            if response.status_code == 200:
                video_info = response.json()
                
                # Find best format
                formats = video_info.get('adaptiveFormats', [])
                if not formats:
                    continue
                
                # Sort by quality (descending)
                formats.sort(key=lambda x: x.get('bitrate', 0), reverse=True)
                
                # Get best format URL
                best_format = formats[0]
                video_url = best_format.get('url')
                
                if video_url:
                    # Download the video to a temporary file
                    tmp_path = f"/tmp/{video_id}.mp4"
                    response = requests.get(video_url, stream=True, timeout=30)
                    
                    with open(tmp_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    return {
                        'id': video_id,
                        'title': video_info.get('title', 'Unknown Title'),
                        'thumbnail': video_info.get('thumbnailUrl'),
                        '_filename': tmp_path
                    }
        except Exception as e:
            logger.warning(f"Failed to download from Invidious instance {instance}: {str(e)}")
            continue
    
    return None

def extract_video_id(url: str) -> Optional[str]:
    """Extract the YouTube video ID from a URL"""
    try:
        # Try using yt-dlp's extract_id function
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            return ydl.extract_id(url)
    except Exception:
        # Fallback to manual extraction
        if "youtu.be/" in url:
            return url.split("youtu.be/")[1].split("?")[0].split("&")[0]
        elif "youtube.com/watch" in url:
            if "v=" in url:
                v_param = url.split("v=")[1].split("&")[0]
                return v_param
        return None

@router.post("/process-youtube")
async def process_youtube(request: YouTubeRequest, client_request: Request):
    youtube_url = request.youtube_url
    raw_cookies = request.raw_cookies
    max_attempts = request.attempts if request.attempts else 3
    use_invidious = request.use_invidious
    
    # Temporary files to clean up later
    tmp_paths = []
    
    # Extract video ID for possible Invidious fallback
    video_id = extract_video_id(youtube_url)

    for attempt in range(max_attempts):
        try:
            # 1. Prepare download options
            ydl_opts = get_ydl_options(raw_cookies)
            
            # If this is not the first attempt, add some randomization and delay
            if attempt > 0:
                # Add a slight delay between attempts
                time.sleep(random.uniform(1, 3))
                
                # Modify user agent for each attempt
                ydl_opts['user_agent'] = random.choice(USER_AGENTS)
                
                logger.info(f"Retry attempt {attempt+1}/{max_attempts} for {youtube_url}")
            
            # 2. Try to download with yt-dlp
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(youtube_url, download=True)
                
                # If we got here, the download succeeded
                if info_dict is None:
                    # This happens when ignoreerrors=True and download fails
                    logger.warning(f"Download succeeded but info_dict is None for {youtube_url}")
                    continue
                
                # Get video path
                video_path = ydl.prepare_filename(info_dict)
                tmp_paths.append(video_path)
                
                # Skip further processing if file doesn't exist or is empty
                if not os.path.exists(video_path) or os.path.getsize(video_path) < 1000:
                    logger.warning(f"Downloaded file is missing or too small: {video_path}")
                    continue
                
                # 3. Upload video to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    video_path,
                    resource_type="auto",
                    folder="opusclip",
                    public_id=f"{uuid.uuid4().hex}"
                )
                
                # Get the video URL from the Cloudinary upload result
                video_url = upload_result['secure_url']
        
                # 4. Get thumbnail URL
                thumbnail_url = info_dict.get('thumbnail', None)
                
                # If a thumbnail URL is provided, upload it to Cloudinary
                if thumbnail_url:
                    thumbnail_upload_result = cloudinary.uploader.upload(
                        thumbnail_url,
                        resource_type="image",
                        folder="opusclip/thumbnails",
                        public_id=f"{uuid.uuid4().hex}"
                    )
                    thumbnail_url = thumbnail_upload_result['secure_url']
                else:
                    thumbnail_url = None
        
                # 5. Return video URL and thumbnail URL
                return {
                    "status": "success",
                    "video_url": video_url,
                    "thumbnail_url": thumbnail_url,
                    "title": info_dict.get('title', 'Unknown Title'),
                    "source": "youtube-dl"
                }
            
        except yt_dlp.utils.DownloadError as e:
            logger.error(f"YouTube download error (attempt {attempt+1}/{max_attempts}): {str(e)}")
            
            # On last attempt, try using Invidious if enabled
            if attempt == max_attempts - 1 and use_invidious and video_id:
                logger.info(f"Trying Invidious fallback for video ID: {video_id}")
                
                invidious_info = await try_invidious_download(video_id)
                if invidious_info:
                    video_path = invidious_info.get('_filename')
                    tmp_paths.append(video_path)
                    
                    # Upload to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        video_path,
                        resource_type="auto",
                        folder="opusclip",
                        public_id=f"{uuid.uuid4().hex}"
                    )
                    
                    # Get the video URL
                    video_url = upload_result['secure_url']
                    
                    # Upload thumbnail if available
                    thumbnail_url = invidious_info.get('thumbnail')
                    if thumbnail_url:
                        thumbnail_upload_result = cloudinary.uploader.upload(
                            thumbnail_url,
                            resource_type="image",
                            folder="opusclip/thumbnails",
                            public_id=f"{uuid.uuid4().hex}"
                        )
                        thumbnail_url = thumbnail_upload_result['secure_url']
                    
                    return {
                        "status": "success",
                        "video_url": video_url,
                        "thumbnail_url": thumbnail_url,
                        "title": invidious_info.get('title', 'Unknown Title'),
                        "source": "invidious"
                    }
                
                # If we get here, all methods failed
                raise HTTPException(400, detail={
                    "error": "Video download failed",
                    "message": f"Could not download video after trying YouTube-DL and Invidious instances. Error: {str(e)}",
                    "possible_solutions": [
                        "Try a different video",
                        "If you have YouTube cookies, provide them with the 'raw_cookies' parameter",
                        "Check if the video is private or region-restricted"
                    ]
                })
            
            # Continue to next attempt if we haven't exhausted attempts
            continue
            
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            # Continue to next attempt
            continue
    
    # If we get here, all attempts failed
    raise HTTPException(400, detail={
        "error": "Video download failed",
        "message": f"Could not download video after {max_attempts} attempts",
        "possible_solutions": [
            "Try a different video",
            "Set 'use_invidious' to true to try alternative sources",
            "If you have YouTube cookies, provide them with the 'raw_cookies' parameter"
        ]
    })
    
@router.post("/upload-cookies")
async def upload_cookies(cookie_data: CookieFile):
    """Endpoint to upload YouTube cookies as raw string"""
    try:
        return {
            "status": "success",
            "raw_cookies": cookie_data.raw_cookies,
            "message": "Use this raw_cookies string in your process-youtube request"
        }
    except Exception as e:
        logger.error(f"Error processing cookie data: {str(e)}")
        raise HTTPException(500, detail="Failed to process cookie data")

@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    tmp_path = None
    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
        
        # Upload file to Cloudinary
        upload_result = cloudinary.uploader.upload(
            tmp_path,
            resource_type="auto",  # Auto-detect the file type (image/video)
            folder="opusclip",  # Folder to store the file in Cloudinary
            public_id=f"{uuid.uuid4().hex}"  # Unique ID for the file
        )
        
        # Get file URL from Cloudinary result
        file_url = upload_result['secure_url']
        thumbnail_url = file_url.replace('.mp4', '.png')  # Assuming you want to generate a thumbnail URL

        return {
            "status": "success",
            "file_url": file_url,
            "thumbnail_url": thumbnail_url,  # Provide the thumbnail link
            "resource_id": upload_result['public_id']  # Cloudinary resource ID
        }
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(500, detail=f"Failed to upload file: {str(e)}")
    finally:
        # Clean up the temporary file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {tmp_path}: {str(e)}")


def clean_temp_files():
    """Utility function to clean up old temporary files"""
    try:
        temp_dir = '/tmp'
        current_time = time.time()
        
        # Look for files that match our pattern and are older than 30 minutes
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            
            # Only remove files, not directories
            if os.path.isfile(file_path):
                # Check if file matches our pattern (YouTube IDs or temp files)
                if filename.endswith('.mp4') or filename.endswith('.webm') or filename.endswith('.txt'):
                    # Check if file is older than 30 minutes
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > (30 * 60):  # 30 minutes in seconds
                        try:
                            os.remove(file_path)
                            logger.info(f"Cleaned up old temp file: {file_path}")
                        except Exception as e:
                            logger.warning(f"Failed to clean up temp file {file_path}: {str(e)}")
    except Exception as e:
        logger.error(f"Error in clean_temp_files: {str(e)}")


# Schedule cleanup of temp files once per hour
def schedule_cleanup(interval=3600):
    """Schedule periodic cleanup of temporary files"""
    import threading
    
    def cleanup_task():
        while True:
            clean_temp_files()
            time.sleep(interval)
    
    # Start cleanup thread
    cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
    cleanup_thread.start()

# Start the cleanup schedule when the module is imported
schedule_cleanup()