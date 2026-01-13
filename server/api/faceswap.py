import os
import re
import uuid
import base64
import httpx
import boto3
import datetime
from typing import Optional
from fastapi import APIRouter, Form
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI
from db import users_collection
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# Clients
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=80.0)
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

S3_BUCKET = os.getenv("S3_BUCKET_NAME")

# Robust YouTube Regex
YT_REGEX = r"(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})"

async def get_valid_thumbnail_url(url: str) -> str:
    """Extracts Video ID and returns the best available thumbnail URL."""
    match = re.search(YT_REGEX, url)
    if not match:
        return None
    
    video_id = match.group(1)
    # FIXED: Added https:// and /vi/ path
    maxres_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    hq_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

    async with httpx.AsyncClient() as client:
        try:
            # Check if 1280x720 exists, else fallback to 480x360
            response = await client.head(maxres_url, timeout=2.0)
            return maxres_url if response.status_code == 200 else hq_url
        except:
            return hq_url

@router.post("/api/faceswap")
async def faceswap_endpoint(
    email: str = Form(...),
    youtubeUrl: str = Form(...), 
    persona: str = Form(...),    # Persona face image URL
    prompt: Optional[str] = Form(None),
):
    # 1. Credit Check
    user = users_collection.find_one({"email": email})
    if not user or user.get("credits", 0) < 10:
        return JSONResponse(status_code=403, content={"error": "Insufficient credits"})

    # Deduct credits
    users_collection.update_one({"email": email}, {"$inc": {"credits": -10}})

    try:
        # 2. Extract Thumbnail
        yt_thumb_url = await get_valid_thumbnail_url(youtubeUrl)
        if not yt_thumb_url:
            raise ValueError("Invalid YouTube URL format provided.")

        # 3. Call OpenAI gpt-image-1
        response = await openai_client.images.edit(
            model="gpt-image-1",
            image=[persona, yt_thumb_url], 
            prompt=(
                f"Face swap: Take the person's face from the first image and "
                f"seamlessly blend it onto the main person in the second YouTube thumbnail. "
                f"Maintain skin tone, lighting, and the background of the original thumbnail. "
                f"Style: {prompt if prompt else 'Viral 4K high-quality thumbnail.'}"
            ),
            input_fidelity="high",
            size="1536x1024", # Best 3:2 landscape for YouTube
            output_format="jpeg" # Match your S3 content type
        )

        # 4. Extract and Upload to S3
        b64_data = response.data[0].b64_json
        if not b64_data:
            raise Exception("AI failed to return image data.")
            
        image_bytes = base64.b64decode(b64_data)
        filename = f"{uuid.uuid4().hex}.jpg"
        s3_key = f"thumbnails/{filename}"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=image_bytes,
            ContentType="image/jpeg"
        )
        
        public_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"

        # 5. Log to DB
        users_collection.update_one(
            {"email": email}, 
            {"$push": {"generated_thumbnails": {
                "id": str(uuid.uuid4()),
                "url": public_url, 
                "source_video": youtubeUrl,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            }}}
        )

        return {"success": True, "thumbnailUrl": public_url}

    except Exception as e:
        # Refund credits on failure
        users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
        return JSONResponse(status_code=500, content={"error": str(e)})