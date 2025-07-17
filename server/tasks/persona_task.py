import logging
import time
import uuid
import os
import requests
from datetime import datetime
from celery_config import celery_app
from db import users_collection

# Configs (assumes your .env or system environments)
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
RUNPOD_ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID")
RUNPOD_API_URL = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/run"
HEADERS = {"Authorization": f"Bearer {RUNPOD_API_KEY}"}

@celery_app.task(bind=True, time_limit=3600, soft_time_limit=3500)
def train_persona_lora(self, persona_name, s3_image_urls, email):
    """
    Celery task: Launches a serverless LoRA training job on RunPod,
    tracks job status, and updates user DB.
    """
    if not persona_name or not s3_image_urls or not email:
        raise ValueError("persona_name, s3_image_urls, and email are required.")

    if not (10 <= len(s3_image_urls) <= 20):
        raise ValueError("You must provide between 10 and 20 training images.")

    persona_id = str(uuid.uuid4())
    user_doc = users_collection.find_one({"email": email})
    trigger_word = f"{persona_id}_{persona_name.lower().replace(' ', '_')}"

    persona_summary = {
        "id": persona_id,
        "persona_name": persona_name,
        "trigger_word": trigger_word,
        "uploaded_urls": s3_image_urls[0], 
        "training_status": "pending",
        "created_at": datetime.utcnow(),
    }

    # Create or update user record
    if user_doc:
        users_collection.update_one(
            {"email": email}, {"$push": {"personas": persona_summary}}
        )
    else:
        users_collection.insert_one(
            {"email": email, "personas": [persona_summary], "created_at": datetime.utcnow()}
        )

    # Payload for RunPod
    training_job = {
        "s3_image_urls": s3_image_urls,
        "email": email,
        "persona_name": persona_name,
        "trigger_word": trigger_word,
        # Add other config params if needed...
    }

    # Step 1: Submit job to RunPod serverless
    self.update_state(state="PROGRESS", meta={"stage": "posting", "status": "Submitting job to RunPod"})
    try:
        response = requests.post(
            RUNPOD_API_URL,
            headers={**HEADERS, "Content-Type": "application/json"},
            json=training_job,
            timeout=30,
        )
        response.raise_for_status()
        job = response.json()
        job_id = job["id"]
    except Exception as exc:
        users_collection.update_one(
            {"personas.id": persona_id},
            {"$set": {"personas.$.training_status": "error", "personas.$.error": str(exc)}}
        )
        raise

    # Step 2: Poll RunPod for status
    status_url = f"https://api.runpod.io/v2/{RUNPOD_ENDPOINT_ID}/status/{job_id}"
    poll_interval = 30  # seconds
    timeout = 60 * 60  # 1 hour
    waited = 0
    max_checks = timeout // poll_interval
    checks_done = 0

    while waited < timeout:
        try:
            checks_done += 1
            progress = min((checks_done / max_checks) * 100, 99)  # never report 100% until actually done
            status_res = requests.get(status_url, headers=HEADERS, timeout=15)
            job_status = status_res.json()
            phase = job_status.get("status", "--")

            self.update_state(
                state="PROGRESS",
                meta={
                    "stage": "training",
                    "status": phase,
                    "current": checks_done,
                    "total": max_checks,
                    "progress": round(progress, 2)
                }
            )
            if phase == "COMPLETED":
                output = job_status.get("output", {})
                model_s3_url = output.get("model_s3_url")
                users_collection.update_one(
                    {"personas.id": persona_id},
                    {"$set": {
                        "personas.$.training_status": "completed",
                        "personas.$.model_s3_url": model_s3_url,
                        "personas.$.completed_at": datetime.utcnow(),
                        }}
                )
                return {"persona_id": persona_id, "status": "completed", "model_s3_url": model_s3_url, "progress": 100}
            elif phase == "FAILED":
                users_collection.update_one(
                    {"personas.id": persona_id},
                    {"$set": {"personas.$.training_status": "failed", "personas.$.error": job_status.get("error", "")}}
                )
                return {"persona_id": persona_id, "status": "failed"}
        except Exception as e:
            pass  # Logging can be added here

        time.sleep(poll_interval)
        waited += poll_interval

    # Timeout reached
    users_collection.update_one(
        {"personas.id": persona_id},
        {"$set": {"personas.$.training_status": "timeout"}}
    )
    return {"persona_id": persona_id, "status": "timeout"}

