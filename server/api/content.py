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

def deduct_aura_mog(email: str):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("aura", 0) < 2:
        raise HTTPException(status_code=403, detail="Not enough Aura")
    users_collection.update_one({"email": email}, {"$inc": {"aura": -2}})


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

# === STEP 1: Analyze face/body image and return looks glow-up ratings ===
        analysis_prompt = (
    "You are an expert looks analyst and aesthetic evaluator. "
    "Analyze the provided image focusing on physical presence, posture, facial structure, and overall masculine appeal. "
    "Evaluate symmetry, confidence projection, bone structure, skin clarity, and visual dominance. "
    
    "Return a JSON object with these keys exactly: "
    "\"Overall\" (integer 0-100), "
    "\"Position\" (posture, confidence, frame presence — integer 0-100), "
    "\"Masculinity\" (facial masculinity, dominance cues — integer 0-100), "
    "\"Skin Quality\" (clarity, texture, glow — integer 0-100), "
    "\"Jawline\" (sharpness, definition — integer 0-100), "
    "\"Cheekbones\" (structure, prominence — integer 0-100). "

    "All values must be numbers (not strings). "
    "ONLY return the JSON object. No explanations, no extra text.\n\n"

    "Example:\n"
    "{ "
    "\"Overall\": 82, "
    "\"Position\": 78, "
    "\"Masculinity\": 85, "
    "\"Skin Quality\": 80, "
    "\"Jawline\": 88, "
    "\"Cheekbones\": 79 "
    "}"
        )


        analysis_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a model expert looks."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": analysis_prompt},
                    {"type": "input_image", "image_url": image_url}
                ]}
            ],
        )

        labels = safe_json_parse(analysis_response.output_text.strip())

# === STEP 2: Optional detailed glow-up plan saved as an achievement ===
        summary_prompt = (
    "You are a looks optimization and masculine glow-up strategist. "
    "Based on the provided image, create a concise, practical glow-up plan including:\n"
    
    "1) overall_assessment (1–3 sentences summarizing current appearance and main limiting factors)\n"
    "2) nutrition_plan (what to eat and avoid to improve skin quality, facial leanness, and masculinity)\n"
    "3) skincare_routine (specific product types and usage timing)\n"
    "4) daily_routine (a structured morning-to-night routine in table format)\n\n"
    
    "The daily_routine MUST be an array of objects formatted like a table with these exact keys:\n"
    "\"Time\", \"Action\", \"Summary\"\n\n"
    
    "The routine should cover the full day from 6:00 AM to 10:00 PM, "
    "including waking, meals, skincare, training, work focus, recovery, and sleep prep. "
    "Summaries should be short and explain why the action supports glow-up or masculine presence.\n\n"
    
    "ONLY return JSON in this format:\n"
    "{ "
    "\"overall_assessment\": \"...\", "
    "\"nutrition_plan\": \"...\", "
    "\"skincare_routine\": \"...\", "
    "\"daily_routine\": [ "
    "{ \"Time\": \"6:00 AM\", \"Action\": \"...\", \"Summary\": \"...\" }, "
    "{ \"Time\": \"...\", \"Action\": \"...\", \"Summary\": \"...\" } "
    "] "
    "}"
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
            "summary": summary,
            "image_url": image_url,
            "created_at": datetime.utcnow().isoformat()
        }

        users_collection.update_one(
            {"email": email},
            {"$push": {"achievements": achievement_entry}}
        )

        # === STEP 3: Save analysis entry to DB in the requested format ===
        entry = {
            "image_url": image_url,
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

@router.post("/api/mog")
async def analyze_image(
    email: str = Form(...),
    leftImg: UploadFile = File(...),
    rightImg: UploadFile = File(...),
):
    deduct_aura_mog(email)

    try:
        # Read file and upload left img to S3 (store under trade/ prefix)
        image_bytes = await leftImg.read()
        file_ext = leftImg.filename.split(".")[-1]
        file_key = f"trade/{uuid.uuid4()}.{file_ext}"

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=file_key,
            Body=image_bytes,
            ContentType=leftImg.content_type,
        )

        left_image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{file_key}"

        # Read file and upload right img to S3 (store under trade/ prefix)
        image_bytes = await rightImg.read()
        file_ext = rightImg.filename.split(".")[-1]
        file_key = f"trade/{uuid.uuid4()}.{file_ext}"

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=file_key,
            Body=image_bytes,
            ContentType=rightImg.content_type,
        )

        right_image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{file_key}"

        analysis_prompt = (
    "You are a strict visual comparison engine.\n\n"

    "Two face images are provided in this order:\n"
    "1) LEFT image\n"
    "2) RIGHT image\n\n"

    "Compare both images and decide who is more physically attractive overall.\n\n"
    "\"Overall\" (integer 0-100), "
    "\"Position\" (posture, confidence, frame presence — integer 0-100), "
    "\"Masculinity\" (facial masculinity, dominance cues — integer 0-100), "
    "\"Skin Quality\" (clarity, texture, glow — integer 0-100), "
    "\"Jawline\" (sharpness, definition — integer 0-100), "
    "\"Cheekbones\" (structure, prominence — integer 0-100). "

    "You MUST return a single JSON object ONLY.\n"
    "No markdown, no explanations, no extra text.\n\n"

    "Definitions:\n"
    "- 'Mogs' = winner (more attractive)\n"
    "- 'Mogged' = loser (less attractive)\n\n"

    "Scoring rules:\n"
    "- All scores must be integers between 0 and 100.\n\n"

    "JSON FORMAT (follow exactly):\n"
    "{\n"
    "  \"Mogs\": \"LEFT\" | \"RIGHT\",\n"
    "  \"Mogged\": \"LEFT\" | \"RIGHT\",\n"
    "  \"LEFT\": {\n"
    "    \"Overall\": number,\n"
    "    \"Position\": number,\n"
    "    \"Masculinity\": number,\n"
    "    \"SkinQuality\": number,\n"
    "    \"Jawline\": number,\n"
    "    \"Cheekbones\": number\n"
    "  },\n"
    "  \"RIGHT\": {\n"
    "    \"Overall\": number,\n"
    "    \"Position\": number,\n"
    "    \"Masculinity\": number,\n"
    "    \"SkinQuality\": number,\n"
    "    \"Jawline\": number,\n"
    "    \"Cheekbones\": number\n"
    "  }\n"
    "}\n\n"

    "Rules:\n"
    "- 'Mogs' and 'Mogged' must be different.\n"
    "- Output JSON ONLY.\n"
)


        analysis_response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a strict visual comparison engine that follows instructions exactly and outputs JSON only."},
                {"role": "user", "content": [
                    {"type": "input_text", "text": analysis_prompt},
                    {"type": "input_image", "image_url": left_image_url},
                    {"type": "input_image", "image_url": right_image_url},
                ]}
            ],
        )

        labels = safe_json_parse(analysis_response.output_text.strip())

        return {"status": "success", "data": labels}

    except Exception as e:
        # Refund aura if something fails
        users_collection.update_one({"email": email}, {"$inc": {"aura": 2}})
        raise HTTPException(status_code=500, detail=f"Chart analysis failed: {str(e)}")