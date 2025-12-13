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
    """
    Extract the first JSON object in a string and parse it.
    Raises HTTPException if parsing fails.
    """
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="GPT did not return valid JSON.")
    try:
        return json.loads(match.group())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse JSON from GPT response: {e}")


@router.post("/api/image")
async def analyze_image(
    email: str = Form(...),
    image: UploadFile = File(...),
):
    """
    Analyze a trading chart image and return/save a prediction entry.
    Saves the entry in the user's document under 'image_analysis' in this format:
    {
      "image_url": "...",
      "title": "...",
      "note": "...",
      "labels": {
        "Prediction": "BUY",
        "Probability": 87,
        "Current Price": 5845.48,
        "Stop Loss": 5845.2,
        "Profit Trade 1": 5845.7,
        "Profit Trade 2": 5846
      },
      "created_at": "2025-11-24T18:05:26.061854"
    }
    """
    deduct_aura(email)

    try:
        # Read file and upload to S3 (store under trade/ prefix)
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

        # === STEP 1: Analyze chart image and return prediction labels ===
        analysis_prompt = (
            "You are an expert market analyst who interprets trading chart images (candlesticks, line charts, indicators). "
            "Identify the dominant market structure/pattern (e.g., consolidation, breakout, uptrend, downtrend, head and shoulders, support/resistance). "
            "Return a JSON object with these keys exactly: "
            "\"Prediction\" (one of BUY, SELL), "
            "\"Probability\" (integer 0-100), "
            "\"Current Price\" (float), "
            "\"Stop Loss\" (float), "
            "\"Profit Trade 1\" (float), "
            "\"Profit Trade 2\" (float). "
            "All numeric values should be numbers (not strings). ONLY return the JSON object and no extra text.\n\n"
            "Example:\n"
            "{ \"Prediction\": \"BUY\", \"Probability\": 87, \"Current Price\": 5845.48, \"Stop Loss\": 5845.2, \"Profit Trade 1\": 5845.7, \"Profit Trade 2\": 5846 }"
        )

        analysis_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a precise trading chart analyst."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": analysis_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        labels = safe_json_parse(analysis_response.output_text.strip())

        # === STEP 2: Title + note ===
        title_note_prompt = (
            "You are a trading content writer. Based on the chart image, generate:\n"
            "1) A short, clean title (max 7 words) describing the chart/pattern (no hashtags, emojis, or fluff).\n"
            "2) A concise practical note (1-2 sentences) that explains the actionable insight.\n"
            "ONLY return JSON in this format:\n"
            "{ \"title\": \"...\", \"note\": \"...\" }"
        )

        title_note_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a trading content writer."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": title_note_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        title_note = safe_json_parse(title_note_response.output_text.strip())

        # === STEP 3: Optional detailed summary/plan saved as an achievement ===
        summary_prompt = (
            "You are a trading strategist. Provide a concise trade plan based on the chart image including:\n"
            "1) market_overview Summary (1-3 sentences)\n"
            "2) trade_setups\n"
            "3) risk_management\n"
            "ONLY return JSON in this format:\n"
            "{ \"market_overview\": \"...\", \"trade_setups\": \"...\", \"risk_management\": \"...\" }"
        )

        summary_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a trading strategist who writes concise trade plans."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": summary_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        summary = safe_json_parse(summary_response.output_text.strip())

        # Save achievement separately (keeps user's achievements of analyses)
        achievement_entry = {
            "title": f"Analysis: {title_note.get('title', '').strip()}",
            "summary": summary,
            "image_url": image_url,
            "created_at": datetime.utcnow().isoformat()
        }

        users_collection.update_one(
            {"email": email},
            {"$push": {"achievements": achievement_entry}}
        )

        # === STEP 4: Save analysis entry to DB in the requested format ===
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
        raise HTTPException(status_code=500, detail=f"Chart analysis failed: {str(e)}")