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
    """Downloads an image from a URL and returns a seekable BytesIO object."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0)
        if response.status_code != 200:
            raise Exception(f"Failed to download image from {url}")
        # Create a buffer and seek to start
        buffer = io.BytesIO(response.content)
        buffer.name = "image.jpg" # OpenAI requires a filename property
        return buffer

@router.post("/api/faceswap")
async def faceswap_endpoint(
    email: str = Form(...),
    youtubeUrl: str = Form(...),
    persona: str = Form(...), # This is the S3 URL of the user's face
    prompt: Optional[str] = Form(None),
):
    # 1. Credit Check
    user = users_collection.find_one({"email": email})
    if not user or user.get("credits", 0) < 10:
        return JSONResponse(status_code=403, content={"error": "Insufficient credits"})

    try:
        # 2. Prepare Source Image Buffers
        yt_thumb_url = await get_valid_thumbnail_url(youtubeUrl)
        if not yt_thumb_url:
            raise ValueError("Invalid YouTube URL")

        # DOWNLOAD the images into memory buffers
        face_buffer = await download_image_to_buffer(persona)
        thumb_buffer = await download_image_to_buffer(yt_thumb_url)

        # 3. Call the API with the BUFFERS (not the strings)
        response = await openai_client.images.edit(
            model="gpt-image-1.5",
            image=[
                face_buffer,   # Now passing bytes buffer
                thumb_buffer   # Now passing bytes buffer
            ],
            prompt=(
                f"Face-swap composition: Extract the facial identity from the first image "
                f"and map it onto the main subject in the second image. "
                f"Ensure the lighting and resolution match the second image perfectly. "
                f"{prompt or ''}"
            ),
            extra_body={
                "composition_mode": "identity_transfer",
                "fidelity": 1.0,
                "preserve_background": True
            },
            response_format="b64_json"
        )

        # 4. Process and Decode
        image_base64 = response.data[0].b64_json
        image_bytes = base64.b64decode(image_base64)

        # 5. S3 Upload Logic
        filename = f"swaps/{uuid.uuid4().hex}.jpg"
        s3_client.put_object(
            Bucket=os.getenv("S3_BUCKET_NAME"),
            Key=filename,
            Body=image_bytes,
            ContentType="image/jpeg"
        )
        
        final_url = f"https://{os.getenv('S3_BUCKET_NAME')}.s3.amazonaws.com/{filename}"

        # 6. Database Update
        users_collection.update_one(
            {"email": email}, 
            {
                "$inc": {"credits": -10},
                "$push": {"generated_thumbnails": {
                    "url": final_url,
                    "source_video": youtubeUrl,
                    "created_at": datetime.datetime.now(datetime.timezone.utc)
                }}
            }
        )

        return {"success": True, "thumbnailUrl": final_url}

    except Exception as e:
        print(f"Error: {str(e)}")
        # Refund credits on crash
        users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
        return JSONResponse(status_code=500, content={"error": "Faceswap failed. Check server logs."})

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