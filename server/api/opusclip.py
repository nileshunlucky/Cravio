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

YOUTUBE_COOKIES_PATH = "youtube_cookies.txt"

class YouTubeRequest(BaseModel):
    youtube_url: str

def get_ydl_options() -> dict:
    """Simplified yt-dlp options for best MP4 format"""
    return {
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'cookies': YOUTUBE_COOKIES_PATH,
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    }

@router.post("/process-youtube")
async def process_youtube(request: YouTubeRequest):
    youtube_url = request.youtube_url

    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            # Configure download options
            ydl_opts = get_ydl_options()
            ydl_opts['outtmpl'] = os.path.join(tmp_dir, '%(title)s.%(ext)s')

            # Download video
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(youtube_url, download=True)
                video_path = ydl.prepare_filename(info_dict)

            # Upload video to Cloudinary
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
                "thumbnail_url": thumbnail_url
            }

    except yt_dlp.utils.DownloadError as e:
        logger.error(f"YouTube download failed: {str(e)}")
        raise HTTPException(400, detail="Failed to download YouTube video")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(500, detail="Internal server error")

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
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)