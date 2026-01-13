from fastapi import APIRouter, Form
from typing import Optional
from fastapi.responses import JSONResponse
import os, uuid, httpx, boto3, datetime, base64
import yt_dlp
from openai import AsyncOpenAI
from db import users_collection
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=80.0)

S3_BUCKET = os.getenv("S3_BUCKET_NAME")
s3_client = boto3.client("s3")

@router.post("/api/faceswap")
async def faceswap_endpoint(
    email: str = Form(...),
    youtubeUrl: str = Form(...), # e.g., "https://www.youtube.com/watch?v=..."
    persona: str = Form(...),    # Persona face URL
    prompt: Optional[str] = Form(None),
):
    # 1. Credit Check
    user = users_collection.find_one({"email": email})
    if not user or user.get("credits", 0) < 10:
        return JSONResponse(status_code=403, content={"error": "Insufficient credits"})

    users_collection.update_one({"email": email}, {"$inc": {"credits": -10}})

    try:
        # 2. Extract Thumbnail URL from YouTube Link
        ydl_opts = {'quiet': True, 'skip_download': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtubeUrl, download=False)
            # Fetch the highest resolution thumbnail available
            yt_thumb_url = info.get('thumbnail') 
            
        if not yt_thumb_url:
            raise Exception("Could not find thumbnail for this YouTube video.")

        # 3. Call OpenAI gpt-image-1 (Reference both images)
        # prompt: uses persona for face and yt_thumb_url for layout/context
        response = await openai_client.images.edit(
            model="gpt-image-1",
            image=[persona, yt_thumb_url], 
            prompt=(
                f"Combine these: use the person's face from the first image and "
                f"put them into the setting of the second YouTube thumbnail. "
                f"User request: {prompt if prompt else 'Make it professional.'}"
            ),
            input_fidelity="high", # Crucial for face preservation
            size="1024x1024",
            output_format="jpeg"
        )

        # 4. Process and Upload to S3
        image_data = base64.b64decode(response.data[0].b64_json)
        filename = f"{uuid.uuid4().hex}.jpg"
        s3_key = f"thumbnails/{filename}"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=image_data,
            ContentType="image/jpeg"
        )
        
        public_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"

        # 5. DB Logging
        users_collection.update_one(
            {"email": email}, 
            {"$push": {"generated_thumbnails": {
                "url": public_url, 
                "source": youtubeUrl,
                "date": datetime.datetime.utcnow()
            }}}
        )

        return {"success": True, "thumbnailUrl": public_url}

    except Exception as e:
        users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
        return JSONResponse(status_code=500, content={"error": str(e)})