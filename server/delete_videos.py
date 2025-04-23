from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import users_collection 
from datetime import datetime, timedelta
import cloudinary
import cloudinary.uploader
import os

# Cloudinary Configuration
cloudinary.config( 
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"), 
    api_key=os.getenv("CLOUDINARY_API_KEY"), 
    api_secret=os.getenv("CLOUDINARY_API_SECRET") 
)

router = APIRouter()

class EmailPayload(BaseModel):
    email: str

@router.delete("/delete_old_videos")
async def delete_old_videos(payload: EmailPayload):
    email = payload.email
    now = datetime.utcnow()
    three_days_ago = now - timedelta(days=3)

    user = users_collection.find_one({"email": email})
    if not user or "videos" not in user:
        raise HTTPException(status_code=404, detail="User or videos not found.")

    old_videos = [video for video in user["videos"] if video.get("created_at") and video["created_at"] < three_days_ago]

    if not old_videos:
        raise HTTPException(status_code=404, detail="No videos older than 3 days found.")

    for video in old_videos:
        video_url = video['url']
        public_id = video_url.rsplit("/", 1)[-1].split(".")[0]

        try:
            cloudinary.uploader.destroy(public_id)
            print(f"✅ Deleted {video_url} from Cloudinary.")

            users_collection.update_one(
                {"email": email},
                {"$pull": {"videos": {"url": video_url}}}
            )
            print(f"✅ Removed {video_url} from MongoDB.")
        except Exception as e:
            print(f"❌ Error deleting {video_url}: {e}")

    return {"detail": f"{len(old_videos)} old video(s) deleted successfully."}
