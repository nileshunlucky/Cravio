from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from db import users_collection
from openai import OpenAI
from datetime import datetime
import boto3
import os
import json
import uuid
import re

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


def safe_json_parse(text: str):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="GPT did not return valid JSON.")
    return json.loads(match.group())


@router.post("/api/image")
async def analyze_image(
    email: str = Form(...),
    image: UploadFile = File(...),
):
    deduct_aura(email)

    try:
        # Read file and upload to S3
        image_bytes = await image.read()
        file_ext = image.filename.split(".")[-1]
        file_key = f"fitness/{uuid.uuid4()}.{file_ext}"

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=file_key,
            Body=image_bytes,
            ContentType=image.content_type,
        )

        image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{file_key}"

        # === STEP 1: Analyze physique ===
        analysis_prompt = (
            "You are a professional fitness coach. Analyze this fitness image "
            "and identify which body part it shows (chest, back, biceps, shoulders, legs, abs, veins). "
            "Return a JSON with 5 labels relevant to that body part, each with a percentage 0-100. "
            "Always include 'AURA' at the end. ONLY return JSON, no extra text.\n"
            "Example:\n"
            "{ \"Chest\": 94, \"Shoulder\": 84, \"Abs\": 81, \"Arms\": 90, \"AURA\": 87 }"
            "Do not include body parts that are not visible in the image."
        )

        analysis_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a precise fitness image evaluator."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": analysis_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        labels = safe_json_parse(analysis_response.output_text.strip())

        # === STEP 2: Title + note ===
        title_note_prompt = (
            "You are a fitness content writer. Generate:\n"
            "1. A short, clean title (max 7 words) describing the physique in the image. No hashtags, emojis, fluff.\n"
            "2. A short practical note (1-2 sentences) giving real feedback about the physique.\n"
            "ONLY return JSON.\n"
            "Format:\n"
            "{ \"title\": \"...\", \"note\": \"...\" }"
        )

        title_note_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a fitness content writer."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": title_note_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        title_note = safe_json_parse(title_note_response.output_text.strip())

        # === STEP 3: Generate Workout/Diet/Routine Summary & Save as Achievement ===
        summary_prompt = (
            "You are a professional fitness coach. Based on the uploaded fitness image, "
            "create a clear, concise long detail summary including:\n"
            "1. Recommended Workout Plan\n"
            "2. Diet suggestions\n"
            "3. Daily Routine/Timing\n"
            "Format it in a clean, valuable, human-readable style (no fluff)."
            "ONLY return JSON in the format:\n"
            "{ \"workout_plan\": \"...\", \"diet\": \"...\", \"routine\": \"...\" }"
        )

        summary_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a fitness coach who summarizes plans from images."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": summary_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        summary = safe_json_parse(summary_response.output_text.strip())

        # Save achievement separately
        achievement_entry = {
            "title": f"Achievement: {title_note.get('title', '').strip()}",
            "summary": summary,
            "image_url": image_url,
            "created_at": datetime.utcnow().isoformat()
        }

        users_collection.update_one(
            {"email": email},
            {"$push": {"achievements": achievement_entry}}
        )


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

        return {"status": "success", "data": entry}

    except Exception as e:
        # Refund aura if something fails
        users_collection.update_one({"email": email}, {"$inc": {"aura": 1}})
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")
