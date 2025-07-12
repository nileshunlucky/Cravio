from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from celery_config import celery_app
import os
import boto3
import uuid
import json
from db import users_collection
from tasks.persona_task import train_lora_runpod_automated
from PIL import Image
import io
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch

router = APIRouter()

# Configure AWS S3
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

# Initialize BLIP model (load once at startup)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)

def generate_caption(image_content: bytes) -> str:
    """Generate caption for image using BLIP model"""
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_content))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Process image and generate caption
        inputs = blip_processor(image, return_tensors="pt").to(device)
        
        with torch.no_grad():
            out = blip_model.generate(**inputs, max_length=50, num_beams=5)
        
        caption = blip_processor.decode(out[0], skip_special_tokens=True)
        return caption
    except Exception as e:
        print(f"Error generating caption: {str(e)}")
        return "No caption available"

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
    
    # Check if user has 200 credits or not
    user = users_collection.find_one({"email": email})
    if not user or user.get("credits", 0) < 200:
        raise HTTPException(status_code=403, detail="Not enough credits")
    
    # Deduct credits
    users_collection.update_one({"email": email}, {"$inc": {"credits": -200}})
    
    # Create a unique folder for this persona
    unique_id = uuid.uuid4().hex[:8]
    folder = f"personas/{persona_name}_{unique_id}"
    uploaded_urls = []
    image_captions = []
    
    for image in images:
        try:
            content = await image.read()
            
            # Generate caption using BLIP
            caption = generate_caption(content)
            
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
            
            # Store caption with image info
            image_captions.append({
                "filename": image.filename,
                "url": s3_url,
                "caption": caption
            })
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process {image.filename}: {str(e)}")
    
    # Save captions to S3 as JSON file
    captions_data = {
        "persona_name": persona_name,
        "email": email,
        "unique_id": unique_id,
        "images": image_captions
    }
    
    try:
        captions_json = json.dumps(captions_data, indent=2)
        captions_key = f"{folder}/captions.json"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=captions_key,
            Body=captions_json,
            ContentType="application/json"
        )
        
        captions_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{captions_key}"
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save captions: {str(e)}")
    
    # Send task with both image URLs and captions
    task = train_lora_runpod_automated.delay(persona_name, uploaded_urls, email, image_captions)
    
    return {
        "status": "success",
        "message": "Persona training queued successfully",
        "task_id": task.id,
        "s3_folder": folder,
        "captions_url": captions_url,
        "total_images": len(uploaded_urls)
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
                "progress": (result.info.get('current', 0) / result.info.get('total', 1)) * 100
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