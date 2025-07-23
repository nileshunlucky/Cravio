import logging
import traceback
import zipfile
import io
import requests
from datetime import datetime, timezone
from celery_config import celery_app
from db import users_collection
import fal_client
import os

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

FAL_KEY = os.getenv("FAL_KEY") 
fal_client.api_key = FAL_KEY

def on_queue_update(update):
    """Handle queue updates from FAL.ai"""
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
            logger.info(log["message"])

def create_zip_from_urls(image_urls, persona_name):
    """
    Create a zip file from a list of image URLs
    
    Args:
        image_urls: List of image URLs
        persona_name: Name of the persona (for logging)
        
    Returns:
        bytes: Zip file content
    """
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for i, url in enumerate(image_urls):
            try:
                # Download image
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                
                # Get filename from URL or create one
                filename = url.split('/')[-1]
                if not filename or '.' not in filename:
                    filename = f"image_{i+1}.jpg"
                
                # Add to zip
                zip_file.writestr(filename, response.content)
                logger.info(f"Added {filename} to zip for persona '{persona_name}'")
                
            except Exception as e:
                logger.error(f"Failed to download image {url}: {str(e)}")
                # Continue with other images instead of failing completely
                continue
    
    zip_buffer.seek(0)
    return zip_buffer.getvalue()

@celery_app.task(bind=True, time_limit=3600, soft_time_limit=3500)
def train_persona_lora(self, persona_name, image_urls, email):
    """
    Train a LoRA model using FAL.ai API
    
    Args:
        persona_name: Name of the persona
        image_urls: List of image URLs to use for training
        email: User email
    """
    
    # Create persona record in database
    persona_doc = {
        "persona_name": persona_name,
        "image_urls": image_urls[0],
        "status": "started",
        "progress": 0,
        "created_at": datetime.now(timezone.utc),
        "fal_request_id": None,
        "model": None,
    }
    
    try:
        # Save initial persona record
        persona_result = users_collection.insert_one(persona_doc)
        persona_id = str(persona_result.inserted_id)
        logger.info(f"Created persona record with ID: {persona_id}")
        
        # Update initial state
        self.update_state(state='PROGRESS', meta={'status': 'Training started', 'progress': 0})
        
        # Check if user exists
        user = users_collection.find_one({"email": email})
        if not user:
            raise Exception(f"User with email '{email}' not found")
        
        logger.info(f"Starting training for persona '{persona_name}' with {len(image_urls)} images for email '{email}'")
        
        # Update progress - Creating zip file
        self.update_state(state='PROGRESS', meta={'status': 'Creating training data', 'progress': 5})
        users_collection.update_one(
            {"_id": persona_result.inserted_id},
            {"$set": {"status": "preparing", "progress": 5, "updated_at": datetime.now(timezone.utc)}}
        )
        
        # Create zip file from image URLs
        logger.info(f"Creating zip file from {len(image_urls)} images")
        zip_content = create_zip_from_urls(image_urls, persona_name)
        
        if not zip_content:
            raise Exception("Failed to create zip file - no images were processed")
        
        logger.info(f"Created zip file with size: {len(zip_content)} bytes")
        
        # Update progress - Uploading to FAL
        self.update_state(state='PROGRESS', meta={'status': 'Uploading training data', 'progress': 10})
        users_collection.update_one(
            {"_id": persona_result.inserted_id},
            {"$set": {"status": "uploading", "progress": 10, "updated_at": datetime.now(timezone.utc)}}
        )
        
        # Upload zip to FAL storage
        try:
            zip_file_obj = io.BytesIO(zip_content)
            zip_file_obj.name = f"{persona_name}_training_images.zip"
            uploaded_url = fal_client.upload(zip_file_obj, "application/zip")
            logger.info(f"Uploaded zip file to FAL storage: {uploaded_url}")
        except Exception as e:
            logger.error(f"Failed to upload zip to FAL storage: {str(e)}")
            raise Exception(f"Failed to upload training data: {str(e)}")
        
        # Update progress - Submitting training request
        self.update_state(state='PROGRESS', meta={'status': 'Submitting to FAL.ai', 'progress': 15})
        users_collection.update_one(
            {"_id": persona_result.inserted_id},
            {"$set": {"status": "submitting", "progress": 15, "updated_at": datetime.now(timezone.utc)}}
        )
        
        # Submit training request to FAL.ai
        result = fal_client.subscribe(
            "fal-ai/flux-lora-fast-training",
            arguments={
                "images_data_url": uploaded_url
            },
            with_logs=True,
            on_queue_update=on_queue_update,
        )
        
        fal_request_id = result.get('request_id')
        logger.info(f"Training started for persona '{persona_name}' with email '{email}'. Request ID: {fal_request_id}")
        
        # Update database with FAL request ID
        users_collection.update_one(
            {"_id": persona_result.inserted_id},
            {"$set": {
                "fal_request_id": fal_request_id,
                "training_data_url": uploaded_url,
                "status": "training",
                "progress": 20,
            }}
        )
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'status': 'Training in progress', 'progress': 20})
        
        # Wait for completion and get final result
        final_result = fal_client.result("fal-ai/flux-lora-fast-training", fal_request_id)
        
        # Update final state
        self.update_state(state='SUCCESS', meta={'status': 'Training completed', 'progress': 100})
        
        # Save final result to database
        users_collection.update_one(
            {"_id": persona_result.inserted_id},
            {"$set": {
                "status": "completed",
                "progress": 100,
                "result": final_result,
                "completed_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        logger.info(f"Training completed successfully for persona '{persona_name}'")
        
        return {
            "status": "success",
            "message": f"Training completed for persona '{persona_name}' with email '{email}'.",
            "persona_id": persona_id,
            "fal_request_id": fal_request_id,
            "result": final_result,
        }
        
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        logger.error(f"Training failed for persona '{persona_name}': {error_msg}")
        logger.error(f"Error traceback: {error_trace}")
        
        # Update task state
        self.update_state(
            state='FAILURE',
            meta={
                'status': 'Training failed',
                'error': error_msg,
                'progress': 0
            }
        )
        
        # Update database with error
        if 'persona_result' in locals():
            users_collection.update_one(
                {"_id": persona_result.inserted_id},
                {"$set": {
                    "status": "failed",
                    "error": error_msg,
                    "error_traceback": error_trace,
                    "created_at": datetime.now(timezone.utc),
                }}
            )
        
        # Refund credits to user if training failed
        try:
            users_collection.update_one({"email": email}, {"$inc": {"credits": 200}})
            logger.info(f"Refunded 200 credits to user {email} due to training failure")
        except Exception as refund_error:
            logger.error(f"Failed to refund credits to user {email}: {str(refund_error)}")
        
        return {
            "status": "error",
            "message": f"Training failed for persona '{persona_name}': {error_msg}",
            "error": error_msg
        }