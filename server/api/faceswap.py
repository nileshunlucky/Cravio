import os
import re
import uuid
import base64
import httpx
import boto3
import datetime
import io
from typing import Optional
from fastapi import APIRouter, Form, UploadFile, File
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI
from db import users_collection
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# Clients
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

S3_BUCKET = os.getenv("S3_BUCKET_NAME")

YT_REGEX = r"(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})"

async def get_valid_thumbnail_url(url: str) -> str:
    """Extracts Video ID and returns the best available thumbnail URL."""
    match = re.search(YT_REGEX, url)
    if not match:
        return None
    
    video_id = match.group(1)
    maxres_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    hq_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.head(maxres_url, timeout=2.0)
            return maxres_url if response.status_code == 200 else hq_url
        except:
            return hq_url

async def download_image_to_buffer(url: str) -> io.BytesIO:
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=15.0)
        if response.status_code != 200:
            raise Exception(f"Failed to download image from {url}")
        buffer = io.BytesIO(response.content)
        buffer.name = "image.jpg" 
        return buffer

@router.post("/api/faceswap")
async def faceswap_endpoint(
    email: str = Form(...),
    youtubeUrl: str = Form(...),
    persona: str = Form(...), 
    prompt: Optional[str] = Form(None),
):
    user = users_collection.find_one({"email": email})
    if not user or user.get("credits", 0) < 10:
        return JSONResponse(status_code=403, content={"error": "Insufficient credits"})

    # Deduct credits upfront
    users_collection.update_one({"email": email}, {"$inc": {"credits": -10}})

    try:
        yt_thumb_url = await get_valid_thumbnail_url(youtubeUrl)
        
        # Download images to buffers
        face_buffer = await download_image_to_buffer(persona)
        thumb_buffer = await download_image_to_buffer(yt_thumb_url)

        # Call the API
        # We removed response_format if it causes issues, and handle 'url' instead
        response = await openai_client.images.edit(
            model="gpt-image-1.5",
            image=[face_buffer, thumb_buffer],
            prompt=(
                f"Face-swap composition: Replace the face in the second image with the identity from the first image. "
                f"Maintain the exact resolution and lighting of the second image. {prompt or ''}"
            ),
        )

        # Logic to handle either B64 or URL response
        generated_data = response.data[0]
        if hasattr(generated_data, 'b64_json') and generated_data.b64_json:
            image_bytes = base64.b64decode(generated_data.b64_json)
        else:
            # If the API returned a URL, download it to save to your own S3
            async with httpx.AsyncClient() as client:
                img_res = await client.get(generated_data.url)
                image_bytes = img_res.content

        # 5. S3 Upload
        filename = f"swaps/{uuid.uuid4().hex}.jpg"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=filename,
            Body=image_bytes,
            ContentType="image/jpeg"
        )
        
        final_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"

        # 6. Database Log
        users_collection.update_one(
            {"email": email}, 
            {"$push": {"generated_thumbnails": {
                "url": final_url,
                "source_video": youtubeUrl,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            }}}
        )

        return {"success": True, "thumbnailUrl": final_url}

    except Exception as e:
        # Refund on failure
        users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
        print(f"Faceswap Error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/api/add-persona")
async def add_persona_endpoint(
    email: str = Form(...),
    name: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        user = users_collection.find_one({"email": email})
        if not user:
            return JSONResponse(status_code=404, content={"message": "User not found"})

        if user.get("credits", 0) < 10:
            return JSONResponse(status_code=403, content={"error": "Insufficient credits"})

        filename = f"personas/{uuid.uuid4().hex}.jpg"
        image_content = await image.read()

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=filename,
            Body=image_content,
            ContentType=image.content_type or "image/jpeg"
        )
        
        public_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"

        new_persona = {
            "id": str(uuid.uuid4()),
            "name": name,
            "image": public_url,
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }

        users_collection.update_one(
            {"email": email},
            {"$push": {"personas": new_persona}}
        )

        return {"success": True, "persona": new_persona}

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})