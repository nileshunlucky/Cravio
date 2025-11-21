from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from celery_config import celery_app
import os
import boto3
import uuid
from datetime import datetime, timezone
from db import users_collection

router = APIRouter()

# Configure AWS S3
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

@router.post("/api/persona")
async def upload_persona(
    name: str = Form(...),
    email: str = Form(...),
    video: UploadFile = File(...)
):
    # Check if user has paid
    user = users_collection.find_one({"email": email})
    if not user or not user.get("user_paid", False):
        raise HTTPException(status_code=403, detail="User not paid")

    # Check if user already has 5 personas
    existing_personas = user.get("personas", [])
    if len(existing_personas) >= 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 personas allowed per user"
        )

    try:
        # Create a unique folder for this persona
        unique_id = uuid.uuid4().hex[:8]
        folder = f"personas/{name}_{unique_id}"

        # Read video content
        content = await video.read()

        # Upload video to S3
        s3_key = f"{folder}/{video.filename}"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=content,
            ContentType=video.content_type or "video/mp4"
        )
        s3_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"

        # Create persona object
        persona_doc = {
            "_id": uuid.uuid4().hex,
            "name": name,
            "url": s3_url,
            "created_at": datetime.now(timezone.utc),
        }

        # Save to DB
        users_collection.update_one(
            {"email": email},
            {"$push": {"personas": persona_doc}}
        )

        return {
            "status": "success",
            "message": "Persona uploaded successfully",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload persona: {str(e)}")

@router.get("/api/task-status/{task_id}")
async def get_task_status(task_id: str):
    """Get the status of a training task by Celery task ID"""
    try:
        result = celery_app.AsyncResult(task_id)
        
        if result.state == 'PENDING':
            return {
                "state": result.state,
                "status": "Task is waiting to be processed",
                "progress": 0
            }
        elif result.state == 'PROGRESS':
            return {
                "state": result.state,
                "current": result.info.get('current', 0),
                "total": result.info.get('total', 1),
                "status": result.info.get('status', ''),
                "progress": result.info.get('progress', 0)
            }
        elif result.state == 'SUCCESS':
            return {
                "state": result.state,
                "result": result.result,
                "progress": 100
            }
        elif result.state == 'FAILURE':
            return {
                "state": result.state,
                "error": str(result.info),
                "progress": 0
            }
        else:
            return {
                "state": result.state,
                "error": "Unknown state",
                "progress": 0
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking task status: {str(e)}")