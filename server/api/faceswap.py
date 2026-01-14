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
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=80.0)
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

async def encode_image_from_url(url: str) -> str:
    """Downloads an image and returns a base64 string."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0)
        if response.status_code != 200:
            raise Exception(f"Failed to download image from {url}")
        return base64.b64encode(response.content).decode("utf-8")

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
        # 2. Extract Thumbnail URL
        yt_thumb_url = await get_valid_thumbnail_url(youtubeUrl)
        if not yt_thumb_url:
            raise ValueError("Invalid YouTube URL format provided.")

        # 3. Convert both images to Base64 (Best for Responses API fidelity)
        # Note: You can also pass the raw URLs, but Base64 is more reliable for "edit" actions
        b64_persona = await encode_image_from_url(persona)
        b64_thumb = await encode_image_from_url(yt_thumb_url)

        # 4. Call OpenAI Responses API
        response = await openai_client.responses.create(
            model="gpt-4o", 
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text", 
                            "text": (
                                f"seamlessly blend it onto the main person in the second YouTube thumbnail. "
                                f"Maintain skin tone, lighting, and background. "
                                f"Style: {prompt if prompt else 'Viral 4K high-quality thumbnail.'}"
                            )
                        },
                        {
                            "type": "input_image",
                            "image_url": f"data:image/jpeg;base64,{b64_persona}"
                        },
                        {
                            "type": "input_image",
                            "image_url": f"data:image/jpeg;base64,{b64_thumb}"
                        }
                    ]
                }
            ],
            tools=[{
                "type": "image_generation",
                "action": "edit",
                "input_fidelity": "high",
                "size": "1536x1024"
            }]
        )

        # 5. Extract result from Tool Output
        # Look for the 'image_generation_call' in the response output
        image_call = next((o for o in response.output if o.type == "image_generation_call"), None)
        
        if not image_call or not image_call.result:
            raise Exception("AI failed to generate an image. Check prompt or image safety filters.")
            
        # In the 2026 Responses API, the result is the base64 string
        image_bytes = base64.b64decode(image_call.result)
        
        # 6. Upload to S3
        filename = f"{uuid.uuid4().hex}.jpg"
        s3_key = f"thumbnails/{filename}"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=image_bytes,
            ContentType="image/jpeg"
        )
        
        public_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"

        # 7. Log to DB
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

@router.post("/api/add-persona")
async def add_persona_endpoint(
    email: str = Form(...),
    name: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        # 1. Check if user exists
        user = users_collection.find_one({"email": email})
        if not user:
            return JSONResponse(status_code=404, content={"message": "User not found"})

       if user.get("credits", 0) < 10:
            return JSONResponse(status_code=403, content={"error": "Insufficient credits"})

        # 2. Prepare file for S3
        file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        filename = f"personas/{uuid.uuid4().hex}.{file_extension}"
        
        # Read image content
        image_content = await image.read()

        # 3. Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=filename,
            Body=image_content,
            ContentType=image.content_type or "image/jpeg"
        )
        
        public_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"

        # 4. Save to DB (Push to personas array)
        new_persona = {
            "id": str(uuid.uuid4()),
            "name": name,
            "image": public_url,
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }

        result = users_collection.update_one(
            {"email": email},
            {"$push": {"personas": new_persona}}
        )

        return {
            "success": True, 
            "message": "Persona added successfully",
            "persona": new_persona
        }

    except Exception as e:
        print(f"Error adding persona: {e}")
        return JSONResponse(status_code=500, content={"message": str(e)})