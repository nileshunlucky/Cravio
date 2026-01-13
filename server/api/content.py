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
        file_key = f"trade/{uuid.uuid4()}.{file_ext}"

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=file_key,
            Body=image_bytes,
            ContentType=image.content_type,
        )

        image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{file_key}"

        # === STEP 1: Analyze trading ===
        analysis_prompt = (
        "You are a professional trading analyst. Analyze this trading chart image "
        "and identify the current market condition to predict a trading decision (BUY or SELL) "
        "with a probability percentage. Then provide the following details:\n"
        "- Stop Loss level\n"
        "- Profit Trade 1 level\n"
        "- Profit Trade 2 level (always more than Profit Trade 1)\n"
        "Return ONLY JSON in the exact format below (no extra text or explanation):\n"
        "{ \"Prediction\": \"BUY\", \"Probability\": 87, \"Current Price\": 22600,  \"Stop Loss\": 22455, "
        "\"Profit Trade 1\": 22505, \"Profit Trade 2\": 22553, }\n"
        "Ensure all values are realistic and consistent with the detected trend in the image."
        )

        analysis_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a precise trading chart evaluator who analyzes market structures and predicts trades accurately."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": analysis_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        labels = safe_json_parse(analysis_response.output_text.strip())

        # === STEP 2: Title + note ===
        title_note_prompt = (
        "You are a professional trading analyst and content writer. Generate:\n"
        "1. A short, clear title (max 7 words) describing the market condition or setup seen in the chart. No hashtags, emojis, or fluff.\n"
        "2. A short practical note (1-2 sentences) giving real insight or feedback about the current trading setup.\n"
        "ONLY return JSON.\n"
        "Format:\n"
        "{ \"title\": \"...\", \"note\": \"...\" }"
        )

        title_note_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a professional trading analyst and content writer."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": title_note_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        title_note = safe_json_parse(title_note_response.output_text.strip())

        # === STEP 3: Generate trading Summary & Save as Achievement ===

        summary_prompt = (
        "You are a professional trading analyst. Based on the uploaded trading chart image, "
        "create a clear, concise, long detailed summary including:\n"
        "1. Market Overview (trend, key levels, volume insights)\n"
        "2. Potential Trade Setups (entry, stop loss, target zones)\n"
        "3. Risk Management & Suggestions\n"
        "Format it in a clean, valuable, human-readable style (no fluff). "
        "ONLY return JSON in the format:\n"
        "{ \"market_overview\": \"...\", \"trade_setups\": \"...\", \"risk_management\": \"...\" }"
        )

        summary_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a professional trading analyst who summarizes plans from images."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": summary_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        summary = safe_json_parse(summary_response.output_text.strip())

        # Save achievement separately
        achievement_entry = {
            "title": f"{title_note.get('title', '').strip()}",
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
