import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import os
import boto3
from db import users_collection
from tasks.opus_task import veo3, kling2_1master, hailuo_02_pro, wan_2_5, sora_2

router = APIRouter()

# Configure AWS S3
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)

AURA_COSTS = {"veo3": 400, "kling 2.1 master": 250, "hailuo 02 pro": 250, "wan 2.5": 100, "sora 2": 100}

def deduct_aura_by_model(email: str, model: str):
    # Ensure model exists in pricing
    if model not in AURA_COSTS:
        raise HTTPException(status_code=400, detail="Invalid model selected")

    aura_cost = AURA_COSTS[model]

    # Fetch user
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user has enough aura
    if user.get("aura", 0) < aura_cost:
        raise HTTPException(status_code=403, detail="Not enough Aura")

    # Deduct aura
    result = users_collection.update_one(
        {"email": email}, {"$inc": {"aura": -aura_cost}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=403, detail="Failed to deduct Aura. Not enough balance."
        )

    return {"message": f"{aura_cost} Aura deducted for model {model}"}


@router.post("/api/opus")
async def persona_image(
    email: str = Form(...),
    prompt: str = Form(...),
    model: str = Form(...),
    aspect_ratio: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    # Check if user has enough aura
    deduct_aura_by_model(email, model)

    try:
        # ✅ Conditional logic based on image presence
        if image and image.filename:
            # IMAGE-TO-IMAGE: Upload image to S3 first
            image_content = await image.read()
            unique_id = uuid.uuid4().hex[:8]
            s3_key = f"temp_images/{email}_{unique_id}_{image.filename}"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=image_content,
                ContentType=image.content_type,
            )
            image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
        else:
            image_url = None

        if model == "veo3":
            task = veo3.delay(prompt=prompt, image_url=image_url, email=email, aspect_ratio=aspect_ratio)

        if model == "kling2.1 master":
            task = kling2_1master.delay(prompt=prompt, image_url=image_url, email=email, aspect_ratio=aspect_ratio)

        if model == "hailuo 02 pro":
            task = hailuo_02_pro.delay(prompt=prompt, image_url=image_url, email=email, aspect_ratio=aspect_ratio)

        if model == "wan 2.5":
            task = wan_2_5.delay(prompt=prompt, image_url=image_url, email=email, aspect_ratio=aspect_ratio)

        if model == "sora 2":
            task = sora_2.delay(prompt=prompt, image_url=image_url, email=email, aspect_ratio=aspect_ratio)

        return {
            "status": "success",
            "message": f"Video generation queued ({model}).",
            "task_id": task.id,
        }

    except Exception as e:
        # Refund aura if task creation fails
        users_collection.update_one({"email": email}, {"$inc": {"aura": AURA_COSTS[model]}})
        raise HTTPException(
            status_code=500, detail=f"Failed to queue generation: {str(e)}"
        )
