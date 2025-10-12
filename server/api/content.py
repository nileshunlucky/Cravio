from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from db import users_collection
from openai import OpenAI
from datetime import datetime
import boto3
import os
import base64
import json
import uuid

router = APIRouter()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# AWS S3 Config
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)


def deduct_aura(email: str):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("aura", 0) < 1:
        raise HTTPException(status_code=403, detail="Not enough Aura")
    users_collection.update_one({"email": email}, {"$inc": {"aura": -1}})


@router.post("/api/image")
async def analyze_image(
    email: str = Form(...),
    image: UploadFile = File(...),
):
    deduct_aura(email)

    try:
        # Read file
        image_bytes = await image.read()

        # Upload to S3
        file_ext = image.filename.split(".")[-1]
        file_key = f"fitness/{uuid.uuid4()}.{file_ext}"
        s3_client.put_object(Bucket=S3_BUCKET, Key=file_key, Body=image_bytes, ContentType=image.content_type)
        image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{file_key}"

        # Prepare image for GPT
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        image_data_uri = f"data:{image.content_type};base64,{encoded_image}"

        # === STEP 1: Analyze physique ===
        analysis_prompt = (
            "You are a professional fitness coach. Analyze this fitness image "
            "and identify which body part it shows (e.g., chest, back, biceps, shoulders, legs, abs - and if only 1 part is shown for ex. legs then go in detail to cover labels, like squats, calves like that). "
            "Then return a valid JSON with 5 labels relevant to that body part, each with a percentage score out of 100. "
            "Always include a fixed 'AURA' score at the end that represents aesthetic physique quality. "
            "For example, for a chest image:\n"
            "{ \"Upper Chest\": 94, \"Lower Chest\": 84,  \"Middel Chest\": 81,  \"Chest Density\": 90, \"AURA\": 87 }"
        )

        analysis_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a precise fitness image evaluator."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": analysis_prompt},
                    {"type": "input_image", "image_url": image_data_uri}
                ]}
            ],
        )

        analysis_text = analysis_response.output_text.strip()
        labels = json.loads(analysis_text)

        # === STEP 2: Generate title + note ===
        title_note_prompt = (
            "You are a fitness content writer. Generate:\n"
            "1. A short, clean title (max 7 words) describing the physique in the image. "
            "No hashtags, emojis, or fluff. Style: fitness + aesthetic.\n"
            "2. A short practical note (1-2 sentences) giving real feedback about the physique.\n\n"
            "Return JSON:\n"
            "{ \"title\": \"...\", \"note\": \"...\" }"
        )

        title_note_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a fitness content writer."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": title_note_prompt},
                    {"type": "input_image", "image_url": image_data_uri}
                ]}
            ],
        )

        title_note_text = title_note_response.output_text.strip()
        title_note = json.loads(title_note_text)

        # === STEP 3: Save to DB ===
        entry = {
            "image_url": image_url,
            "title": title_note.get("title", "").strip(),
            "note": title_note.get("note", "").strip(),
            "labels": labels,
            "created_at": datetime.utcnow().isoformat()
        }

        users_collection.update_one(
            {"email": email},
            {"$push": {"image_analysis": entry}}
        )

        return {
            "status": "success",
            "data": entry
        }

    except Exception as e:
        # Refund aura if something fails
        users_collection.update_one({"email": email}, {"$inc": {"aura": 1}})
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")
