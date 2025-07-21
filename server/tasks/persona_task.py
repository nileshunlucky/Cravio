import logging
import time
import uuid
import os
import requests
import json
from datetime import datetime
from celery_config import celery_app
from db import users_collection

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configs (assumes your .env or system environments)
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
RUNPOD_ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID")
RUNPOD_API_URL = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/run"
HEADERS = {"Authorization": f"Bearer {RUNPOD_API_KEY}"}

logger.info(f"🔧 RunPod Configuration:")
logger.info(f"  - Endpoint ID: {RUNPOD_ENDPOINT_ID}")
logger.info(f"  - API URL: {RUNPOD_API_URL}")
logger.info(f"  - API Key configured: {'✅' if RUNPOD_API_KEY else '❌'}")

@celery_app.task(bind=True, time_limit=3600, soft_time_limit=3500)
def train_persona_lora(self, persona_name, s3_image_urls, email):
    """
    Celery task: Launches a serverless LoRA training job on RunPod,
    tracks job status, and updates user DB.
    """
    
    # Input validation with detailed logging
    logger.info(f"🎯 Starting LoRA training task for {email}")
    logger.info(f"  - Persona name: {persona_name}")
    logger.info(f"  - Number of images: {len(s3_image_urls) if s3_image_urls else 0}")
    
    if not persona_name or not s3_image_urls or not email:
        error_msg = "persona_name, s3_image_urls, and email are required."
        logger.error(f"❌ Validation failed: {error_msg}")
        raise ValueError(error_msg)

    if not (10 <= len(s3_image_urls) <= 20):
        error_msg = f"Invalid image count: {len(s3_image_urls)}. Must be between 10 and 20."
        logger.error(f"❌ {error_msg}")
        raise ValueError("You must provide between 10 and 20 training images.")

    # Generate IDs and setup
    persona_id = str(uuid.uuid4())
    user_doc = users_collection.find_one({"email": email})
    trigger_word = f"{persona_id}_{persona_name.lower().replace(' ', '_')}"

    logger.info(f"📝 Generated persona details:")
    logger.info(f"  - Persona ID: {persona_id}")
    logger.info(f"  - Trigger word: {trigger_word}")
    logger.info(f"  - User exists in DB: {'✅' if user_doc else '❌'}")

    persona_summary = {
        "id": persona_id,
        "persona_name": persona_name,
        "trigger_word": trigger_word,
        "uploaded_urls": s3_image_urls[0],  # Store first URL as sample
        "training_status": "pending",
        "created_at": datetime.utcnow(),
        "total_images": len(s3_image_urls)
    }

    # Create or update user record
    try:
        if user_doc:
            result = users_collection.update_one(
                {"email": email}, {"$push": {"personas": persona_summary}}
            )
            logger.info(f"📚 Updated existing user record: {result.modified_count} documents modified")
        else:
            result = users_collection.insert_one(
                {"email": email, "personas": [persona_summary], "created_at": datetime.utcnow()}
            )
            logger.info(f"📚 Created new user record: {result.inserted_id}")
    except Exception as e:
        logger.error(f"❌ Database operation failed: {str(e)}")
        raise

    # Step 1: Submit job to RunPod serverless
    logger.info("🚀 Submitting job to RunPod...")
    self.update_state(state="PROGRESS", meta={"stage": "posting", "status": "Submitting job to RunPod"})
    
    try:
        # Payload structure for RunPod serverless
        payload = {
            "input": {
                "s3_image_urls": s3_image_urls,
                "email": email,
                "persona_name": persona_name,
                "trigger_word": trigger_word,
            }
        }

        logger.info(f"📦 Payload prepared:")
        logger.info(f"  - Image URLs count: {len(s3_image_urls)}")
        logger.info(f"  - First 3 URLs: {s3_image_urls[:3]}")
        logger.info(f"  - Request URL: {RUNPOD_API_URL}")

        response = requests.post(
            RUNPOD_API_URL,
            headers={**HEADERS, "Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )
        
        logger.info(f"📡 RunPod response:")
        logger.info(f"  - Status code: {response.status_code}")
        logger.info(f"  - Headers: {dict(response.headers)}")
        
        response.raise_for_status()
        job = response.json()
        
        logger.info(f"📋 Job response: {json.dumps(job, indent=2)}")
        
        if "id" not in job:
            logger.error(f"❌ No job ID in response: {job}")
            raise ValueError("RunPod response missing job ID")
            
        job_id = job["id"]
        logger.info(f"✅ Job submitted successfully: {job_id}")
        
        # Update database with job ID
        result = users_collection.update_one(
            {"personas.id": persona_id},
            {"$set": {"personas.$.runpod_job_id": job_id}}
        )
        logger.info(f"📚 Updated persona with job ID: {result.modified_count} documents modified")
        
    except requests.exceptions.RequestException as e:
        error_msg = f"RunPod API request failed: {str(e)}"
        logger.error(f"❌ {error_msg}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
        
        users_collection.update_one(
            {"personas.id": persona_id},
            {"$set": {"personas.$.training_status": "error", "personas.$.error": error_msg}}
        )
        raise
    except Exception as exc:
        error_msg = f"Unexpected error during job submission: {str(exc)}"
        logger.error(f"❌ {error_msg}")
        users_collection.update_one(
            {"personas.id": persona_id},
            {"$set": {"personas.$.training_status": "error", "personas.$.error": error_msg}}
        )
        raise

    # Step 2: Poll RunPod for status
    status_url = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/status/{job_id}"
    logger.info(f"🔍 Starting status polling:")
    logger.info(f"  - Status URL: {status_url}")
    logger.info(f"  - Job ID: {job_id}")
    
    poll_interval = 30  # seconds
    timeout = 60 * 60  # 1 hour
    waited = 0
    max_checks = timeout // poll_interval
    checks_done = 0

    logger.info(f"⏱️  Polling configuration:")
    logger.info(f"  - Poll interval: {poll_interval}s")
    logger.info(f"  - Timeout: {timeout}s ({timeout//60}min)")
    logger.info(f"  - Max checks: {max_checks}")

    while waited < timeout:
        try:
            checks_done += 1
            progress = min((checks_done / max_checks) * 100, 99)  # never report 100% until actually done
            
            logger.info(f"🔍 Status check #{checks_done}/{max_checks} (waited {waited}s)")
            
            status_res = requests.get(status_url, headers=HEADERS, timeout=15)
            
            logger.info(f"📡 Status response:")
            logger.info(f"  - Status code: {status_res.status_code}")
            logger.info(f"  - Response headers: {dict(status_res.headers)}")
            
            # Check if request was successful
            if status_res.status_code != 200:
                logger.error(f"❌ Status request failed with code {status_res.status_code}")
                logger.error(f"Response content: {status_res.text}")
                raise requests.exceptions.HTTPError(f"Status request failed: {status_res.status_code}")
            
            job_status = status_res.json()
            logger.info(f"📋 Full job status response: {json.dumps(job_status, indent=2)}")
            
            # Extract phase with multiple fallbacks
            phase = None
            if "status" in job_status:
                phase = job_status["status"]
            elif "state" in job_status:
                phase = job_status["state"]
            elif "phase" in job_status:
                phase = job_status["phase"]
            else:
                logger.warning(f"⚠️  No status field found in response")
                phase = "UNKNOWN"
            
            logger.info(f"📊 Job phase: '{phase}'")

            # Update Celery task state
            meta = {
                "stage": "training",
                "status": phase,
                "current": checks_done,
                "total": max_checks,
                "progress": round(progress, 2),
                "job_id": job_id,
                "waited_seconds": waited
            }
            
            self.update_state(state="PROGRESS", meta=meta)
            
            # Update database
            db_update = {
                "personas.$.training_status": phase,
                "personas.$.progress": round(progress, 2),
                "personas.$.last_check": datetime.utcnow(),
                "personas.$.checks_completed": checks_done
            }
            
            result = users_collection.update_one(
                {"personas.id": persona_id},
                {"$set": db_update}
            )
            logger.info(f"📚 Updated DB status: {result.modified_count} documents modified")
            
            # Handle completion states
            if phase == "COMPLETED":
                logger.info("🎉 Job completed successfully!")
                output = job_status.get("output", {})
                logger.info(f"📤 Job output: {json.dumps(output, indent=2)}")
                
                model_s3_url = output.get("model_s3_url")
                if not model_s3_url:
                    logger.error("❌ Job completed but model_s3_url is missing")
                    raise ValueError("Job completed, but model_s3_url is missing in the output.")

                final_update = {
                    "personas.$.training_status": "completed",
                    "personas.$.model_s3_url": model_s3_url,
                    "personas.$.completed_at": datetime.utcnow(),
                    "personas.$.progress": 100
                }
                
                users_collection.update_one(
                    {"personas.id": persona_id},
                    {"$set": final_update}
                )
                
                logger.info(f"✅ Training completed successfully!")
                logger.info(f"  - Model URL: {model_s3_url}")
                
                return {
                    "persona_id": persona_id, 
                    "status": "completed", 
                    "model_s3_url": model_s3_url, 
                    "progress": 100,
                    "checks_completed": checks_done,
                    "total_time_seconds": waited
                }
                
            elif phase == "FAILED":
                logger.error("❌ Job failed!")
                error_info = job_status.get("error", "No error details provided")
                logger.error(f"Error details: {error_info}")
                
                users_collection.update_one(
                    {"personas.id": persona_id},
                    {"$set": {
                        "personas.$.training_status": "failed", 
                        "personas.$.error": str(error_info),
                        "personas.$.failed_at": datetime.utcnow()
                    }}
                )
                return {"persona_id": persona_id, "status": "failed", "error": error_info}
                
            elif phase in ["IN_QUEUE", "IN_PROGRESS", "RUNNING"]:
                logger.info(f"⏳ Job still running: {phase}")
            else:
                logger.warning(f"⚠️  Unknown phase: '{phase}'")

        except requests.exceptions.RequestException as e:
            logger.warning(f"🚨 Polling failed on check #{checks_done} for job {job_id}: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.warning(f"Response content: {e.response.text}")
        except Exception as e:
            logger.error(f"❌ Unexpected error during polling: {str(e)}")
            logger.exception("Full exception details:")

        # Wait before next check
        logger.info(f"😴 Sleeping for {poll_interval}s before next check...")
        time.sleep(poll_interval)
        waited += poll_interval

    # Timeout reached
    logger.error(f"⏰ Timeout reached after {waited}s ({waited//60}min)")
    users_collection.update_one(
        {"personas.id": persona_id},
        {"$set": {
            "personas.$.training_status": "timeout",
            "personas.$.timeout_at": datetime.utcnow(),
            "personas.$.total_checks": checks_done
        }}
    )
    return {
        "persona_id": persona_id, 
        "status": "timeout",
        "checks_completed": checks_done,
        "total_time_seconds": waited
    }