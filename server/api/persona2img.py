from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import os
import boto3
import uuid
from db import users_collection
from tasks.image_task import image2image, text2image

router = APIRouter()

# Configure AWS S3
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

@router.post("/io")
async def persona_image(
    lora_url: str = Form(...),
    email: str = Form(...),
    prompt: str = Form(...),
    image: Optional[UploadFile] = File(None)  
):
    # Check if user has enough aura
    user = users_collection.find_one({"email": email})
    if not user or user.get("aura", 0) < 10:
        raise HTTPException(status_code=403, detail="Not enough Aura")
    
    # Deduct aura immediately
    users_collection.update_one({"email": email}, {"$inc": {"aura": -10}})
    
    try:
        # ✅ Conditional logic based on image presence
        if image and image.filename:
            # IMAGE-TO-IMAGE: Upload image to S3 first
            image_content = await image.read()
            
            # Create unique filename
            unique_id = uuid.uuid4().hex[:8]
            s3_key = f"temp_images/{email}_{unique_id}_{image.filename}"
            
            # Upload to S3
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=image_content,
                ContentType=image.content_type or "image/jpeg"
            )
            
            image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
            
            # Call image-to-image task
            task = image2image.delay(
                lora_url=lora_url,
                prompt=prompt,
                image_url=image_url,
                email=email
            )
            
            generation_type = "image-to-image"
            
        else:
            # TEXT-TO-IMAGE: No image provided
            task = text2image.delay(
                lora_url=lora_url,
                prompt=prompt,
                email=email
            )
            
            generation_type = "text-to-image"
        
        return {
            "status": "success",
            "message": f"Persona image generation queued ({generation_type})",
            "task_id": task.id,
        }
        
    except Exception as e:
        # Refund aura if task creation fails
        users_collection.update_one({"email": email}, {"$inc": {"aura": 10}})
        raise HTTPException(status_code=500, detail=f"Failed to queue generation: {str(e)}")