from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from celery_config import celery_app
import os
import boto3
import uuid
from db import users_collection
from tasks.persona_task import train_persona_lora

router = APIRouter()

# Configure AWS S3
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

@router.post("/api/train-persona")
async def upload_persona(
    persona_name: str = Form(...),
    email: str = Form(...),
    images: List[UploadFile] = File(...)
):
    if not persona_name:
        raise HTTPException(status_code=400, detail="Persona name is required.")
    if not (10 <= len(images) <= 20):
        raise HTTPException(status_code=400, detail="Upload between 10 and 20 images.")
    
    # Check if user has 250 aura or not
    user = users_collection.find_one({"email": email})
    if not user or user.get("aura", 0) < 250:
        raise HTTPException(status_code=403, detail="Not enough Aura")
    
    # Deduct aura
    users_collection.update_one({"email": email}, {"$inc": {"aura": -250}})
    
    # Create a unique folder for this persona
    unique_id = uuid.uuid4().hex[:8]
    folder = f"personas/{persona_name}_{unique_id}"
    uploaded_urls = []
    
    for image in images:
        try:
            content = await image.read()
            
            # Upload image to S3
            s3_key = f"{folder}/{image.filename}"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=content,
                ContentType=image.content_type or "image/jpeg"
            )
            
            s3_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
            uploaded_urls.append(s3_url)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process {image.filename}: {str(e)}")
    
    # Send task with both image URLs 
    task = train_persona_lora.delay(persona_name, uploaded_urls, email)
    
    return {
        "status": "success",
        "message": "Persona training queued successfully",
        "task_id": task.id,
    }

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