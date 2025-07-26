import logging
import traceback
import zipfile
import io
import requests
import uuid
from datetime import datetime, timezone
from celery_config import celery_app
from db import users_collection
import fal_client
import boto3
import os


# Add S3 configuration (same as your API)
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

FAL_KEY = os.getenv("FAL_KEY") 
fal_client.api_key = FAL_KEY


def cleanup_s3_images(image_urls, persona_name):
    """
    Delete training images from S3 after LoRA training completes
    
    Args:
        image_urls: List of S3 URLs to delete
        persona_name: Name of persona (for logging)
    """
    deleted_count = 0
    failed_count = 0
    
    for url in image_urls:
        try:
            # Extract S3 key from URL
            # URL format: https://{bucket}.s3.amazonaws.com/{key}
            if not url.startswith(f"https://{S3_BUCKET}.s3.amazonaws.com/"):
                logger.warning(f"Skipping non-S3 URL: {url}")
                continue
                
            s3_key = url.replace(f"https://{S3_BUCKET}.s3.amazonaws.com/", "")
            
            # Delete from S3
            s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
            deleted_count += 1
            logger.info(f"Deleted S3 object: {s3_key}")
            
        except Exception as e:
            failed_count += 1
            logger.error(f"Failed to delete S3 object {url}: {str(e)}")
    
    logger.info(f"S3 cleanup for persona '{persona_name}': {deleted_count} deleted, {failed_count} failed")
    return deleted_count, failed_count


def save_lora_to_s3(final_result, persona_name, persona_id):
    """
    Download LoRA model from FAL.ai and save to S3 bucket
    
    Args:
        final_result: FAL.ai training result
        persona_name: Name of persona
        persona_id: Unique persona identifier
        
    Returns:
        str: S3 URL for the saved LoRA model file
    """
    try:
        # Get LoRA file info from FAL result
        lora_file = final_result.get("diffusers_lora_file", {})
        if not lora_file.get("url"):
            logger.error("No LoRA file URL found in training result")
            return None
        
        # Download LoRA model from FAL.ai
        logger.info(f"Downloading LoRA model from FAL.ai: {lora_file['url']}")
        response = requests.get(lora_file["url"], timeout=120)
        response.raise_for_status()
        
        # Save to S3
        s3_key = f"models/{persona_name}_{persona_id}/pytorch_lora_weights.safetensors"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=response.content,
            ContentType="application/octet-stream",
            Metadata={
                'persona_name': persona_name,
                'persona_id': persona_id,
                'original_filename': lora_file.get('file_name', 'pytorch_lora_weights.safetensors'),
                'file_size': str(lora_file.get('file_size', len(response.content)))
            }
        )
        
        s3_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
        logger.info(f"Successfully saved LoRA model to S3: {s3_key}")
        logger.info(f"LoRA model size: {len(response.content)} bytes")
        
        return s3_url
        
    except Exception as e:
        logger.error(f"Failed to save LoRA model to S3: {str(e)}")
        return None


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
    Train a LoRA model using FAL.ai API - Stores persona in user's personas array
    
    Args:
        persona_name: Name of the persona
        image_urls: List of image URLs to use for training
        email: User email
    """
    
    # Create persona object
    persona_doc = {
        "persona_name": persona_name,
        "image_url": image_urls[0],
        "status": "started",
        "progress": 0,
        "created_at": datetime.now(timezone.utc),
        "fal_request_id": None,
        "model": None,
    }
    
    try:
        # Check if user exists
        user = users_collection.find_one({"email": email})
        if not user:
            raise Exception(f"User with email '{email}' not found")
        
        # Add persona to user's personas array
        users_collection.update_one(
            {"email": email},
            {"$push": {"personas": persona_doc}}
        )
        
        logger.info(f"Created persona '{persona_name}' with ID: {persona_id} for user {email}")
        
        # Update initial state
        self.update_state(state='PROGRESS', meta={'status': 'Training started', 'progress': 0})
        
        logger.info(f"Starting training for persona '{persona_name}' with {len(image_urls)} images for email '{email}'")
        
        # Update progress - Creating zip file
        self.update_state(state='PROGRESS', meta={'status': 'Creating training data', 'progress': 5})
        users_collection.update_one(
            {"email": email, "personas.persona_id": persona_id},
            {"$set": {
                "personas.$.status": "processing", 
                "personas.$.progress": 5, 
                "personas.$.updated_at": datetime.now(timezone.utc)
            }}
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
            {"email": email, "personas.persona_id": persona_id},
            {"$set": {
                "personas.$.status": "processing", 
                "personas.$.progress": 10, 
                "personas.$.updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # Upload zip to FAL storage
        try:
            uploaded_url = fal_client.upload(zip_content, "application/zip")
            logger.info(f"Uploaded zip file to FAL storage: {uploaded_url}")
        except Exception as e:
            logger.error(f"Failed to upload zip to FAL storage: {str(e)}")
            raise Exception(f"Failed to upload training data: {str(e)}")
        
        # Update progress - Submitting training request
        self.update_state(state='PROGRESS', meta={'status': 'Submitting to FAL.ai', 'progress': 15})
        users_collection.update_one(
            {"email": email, "personas.persona_id": persona_id},
            {"$set": {
                "personas.$.status": "processing", 
                "personas.$.progress": 15, 
                "personas.$.updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # Submit training request to FAL.ai
        result = fal_client.subscribe(
            "fal-ai/flux-lora-fast-training",
            arguments={
                "images_data_url": uploaded_url,
                "trigger_word": persona_name
            },
            with_logs=True,
            on_queue_update=on_queue_update,
        )
        
        fal_request_id = result.get('request_id')
        logger.info(f"Training started for persona '{persona_name}' with email '{email}'. Request ID: {fal_request_id}")
        
        # Update database with FAL request ID
        users_collection.update_one(
            {"email": email, "personas.persona_id": persona_id},
            {"$set": {
                "personas.$.fal_request_id": fal_request_id,
                "personas.$.status": "processing",
                "personas.$.progress": 20,
                "personas.$.updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'status': 'Training in progress', 'progress': 20})
        
        # Wait for completion and get final result
        final_result = fal_client.result("fal-ai/flux-lora-fast-training", fal_request_id)
        
        # Update progress - Saving model to S3
        self.update_state(state='PROGRESS', meta={'status': 'Saving model to S3', 'progress': 90})
        users_collection.update_one(
            {"email": email, "personas.persona_id": persona_id},
            {"$set": {
                "personas.$.status": "processing", 
                "personas.$.progress": 90, 
                "personas.$.updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # Save LoRA model to S3
        s3_model_url = save_lora_to_s3(final_result, persona_name, persona_id)
        
        # Update final state
        self.update_state(state='SUCCESS', meta={'status': 'Training completed', 'progress': 100})
        
        # Save final result to database
        users_collection.update_one(
            {"email": email, "personas.persona_id": persona_id},
            {"$set": {
                "personas.$.status": "completed",
                "personas.$.progress": 100,
                "personas.$.model": s3_model_url,
            }}
        )
        
        logger.info(f"Training completed successfully for persona '{persona_name}'")

        # ✅ CLEANUP: Delete S3 training images after successful training
        try:
            cleanup_s3_images(image_urls, persona_name)
        except Exception as cleanup_error:
            logger.error(f"S3 cleanup failed after successful training for persona '{persona_name}': {str(cleanup_error)}")
            # Don't fail the task if cleanup fails
        
        return {
            "status": "success",
            "message": f"Training completed for persona '{persona_name}' with email '{email}'.",
            "persona_id": persona_id,
            "fal_request_id": fal_request_id,
            "model_url": s3_model_url,  # ✅ Return S3 URL
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
        
        # Update database with error (if persona was created)
        if 'persona_id' in locals():
            users_collection.update_one(
                {"email": email, "personas.persona_id": persona_id},
                {"$set": {
                    "personas.$.status": "failed",
                    "personas.$.error": error_msg,
                    "personas.$.error_traceback": error_trace,
                    "personas.$.updated_at": datetime.now(timezone.utc),
                }}
            )

        # ✅ CLEANUP: Delete S3 training images after training failure
        try:
            cleanup_s3_images(image_urls, persona_name)
        except Exception as cleanup_error:
            logger.error(f"S3 cleanup failed after training failure for persona '{persona_name}': {str(cleanup_error)}")
            # Don't fail the task if cleanup fails
        
        # Refund aura to user if training failed
        try:
            users_collection.update_one({"email": email}, {"$inc": {"aura": 250}})
            logger.info(f"Refunded 250 aura to user {email} due to training failure")
        except Exception as refund_error:
            logger.error(f"Failed to refund aura to user {email}: {str(refund_error)}")
        
        return {
            "status": "error",
            "message": f"Training failed for persona '{persona_name}': {error_msg}",
            "error": error_msg
        }
