import logging
from celery_config import celery_app
from db import users_collection
import requests
import time
import os
import boto3
from datetime import datetime
from bson import ObjectId

RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
RUNPOD_ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID")
RUNPOD_API_URL = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/run"

# S3 Configuration
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

HEADERS = {
    "Authorization": f"Bearer {RUNPOD_API_KEY}",
    "Content-Type": "application/json"
}

def start_runpod_training(persona_name, image_urls):
    """Start training on RunPod using FluxGym template"""
    
    # Prepare input for FluxGym
    input_data = {
        "input": {
            "steps": 1000,
            "lora_rank": 16,
            "optimizer": "adamw8bit",
            "batch_size": 1,
            "learning_rate": 1e-4,
            "resolution": "512,768,1024",
            "trigger_word": persona_name.lower().replace(" ", "_"),
            "input_images": image_urls,
            "model_name": f"lora_{persona_name.lower().replace(' ', '_')}",
            "training_comment": f"LoRA training for {persona_name}",
            "max_train_epochs": 20,
            "save_every_n_epochs": 5,
            "mixed_precision": "fp16",
            "save_precision": "fp16",
            "caption_extension": ".txt",
            "shuffle_caption": True,
            "cache_latents": True,
            "cache_latents_to_disk": True,
            "enable_bucket": True,
            "min_bucket_reso": 256,
            "max_bucket_reso": 2048,
            "bucket_reso_steps": 64,
            "bucket_no_upscale": True
        }
    }
    
    try:
        response = requests.post(
            RUNPOD_API_URL,
            headers=HEADERS,
            json=input_data,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"RunPod API error: {response.status_code} - {response.text}")
        
        result = response.json()
        job_id = result.get("id")
        
        if not job_id:
            raise Exception(f"No job ID returned from RunPod: {result}")
        
        return job_id
        
    except Exception as e:
        raise Exception(f"Failed to start RunPod training: {str(e)}")

def check_runpod_status(job_id):
    """Check the status of a RunPod job"""
    status_url = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/status/{job_id}"
    
    try:
        response = requests.get(status_url, headers=HEADERS, timeout=30)
        
        if response.status_code != 200:
            return None
        
        return response.json()
        
    except Exception as e:
        print(f"Error checking RunPod status: {str(e)}")
        return None

def terminate_runpod_pod(job_id):
    """Terminate the RunPod pod after completion"""
    terminate_url = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/cancel/{job_id}"
    
    try:
        response = requests.post(terminate_url, headers=HEADERS, timeout=30)
        
        if response.status_code == 200:
            print(f"Successfully terminated RunPod job: {job_id}")
            return True
        else:
            print(f"Failed to terminate RunPod job: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error terminating RunPod job: {str(e)}")
        return False

def download_and_save_model(output_url, persona_name, persona_id):
    """Download the trained model and save to S3"""
    try:
        # Download the model file
        response = requests.get(output_url, timeout=300)  # 5 minute timeout
        response.raise_for_status()
        
        # Save to S3
        model_key = f"models/{persona_name}_{persona_id}.safetensors"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=model_key,
            Body=response.content,
            ContentType="application/octet-stream"
        )
        
        model_s3_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{model_key}"
        return model_s3_url
        
    except Exception as e:
        raise Exception(f"Failed to download and save model: {str(e)}")

def update_training_status(persona_id, status, **kwargs):
    """Update training status in database"""
    try:
        update_data = {
            "training_status": status
        }
        
        # Add any additional fields
        for key, value in kwargs.items():
            update_data[key] = value
        
        users_collection.update_one(
            {"personas._id": ObjectId(persona_id)},
            {"$set": {f"personas.$.{k}": v for k, v in update_data.items()}}
        )
        
        print(f"Updated training status for persona {persona_id}: {status}")
        
    except Exception as e:
        print(f"Error updating training status: {str(e)}")

def save_persona_to_db(persona_name, email, uploaded_urls, model_s3_url):
    """Save persona information to database"""
    try:
        # Find or create user document
        user_doc = users_collection.find_one({"email": email})
        
        persona_id = str(ObjectId())
        persona_data = {
            "_id": ObjectId(persona_id),
            "persona_name": persona_name,
            "trigger_word": persona_name.lower().replace(" ", "_"),
            "uploaded_urls": uploaded_urls[0] if uploaded_urls else None,
            "model_s3_url": model_s3_url,
            "training_status": "completed",
            "created_at": datetime.utcnow(),
        }
        
        if user_doc:
            # Add persona to existing user
            users_collection.update_one(
                {"email": email},
                {"$push": {"personas": persona_data}}
            )
        else:
            # Create new user with persona
            new_user = {
                "email": email,
                "personas": [persona_data],
                "created_at": datetime.utcnow(),
            }
            users_collection.insert_one(new_user)
        
        return persona_id
        
    except Exception as e:
        raise Exception(f"Failed to save persona to database: {str(e)}")

@celery_app.task(bind=True)
def train_lora_runpod(self, persona_name, uploaded_urls, email):
    """Main task to train LoRA model on RunPod"""
    
    # Validate inputs
    if not persona_name or not uploaded_urls or not email:
        raise ValueError("persona_name, uploaded_urls, and email are required")
    
    if len(uploaded_urls) < 10 or len(uploaded_urls) > 20:
        raise ValueError("Number of uploaded URLs must be between 10 and 20")
    
    persona_id = None
    job_id = None
    
    try:
        # Create initial persona record in database
        persona_id = str(ObjectId())
        user_doc = users_collection.find_one({"email": email})

        # unique trigger word for each persona db id + persona name
        trigger_word = f"{persona_id}_{persona_name.lower().replace(' ', '_')}"
        
        initial_persona_data = {
            "_id": ObjectId(persona_id),
            "persona_name": persona_name,
            "trigger_word": trigger_word,
            "uploaded_urls": uploaded_urls[0] if uploaded_urls else None,
            "model_s3_url": None,
            "training_status": "initializing",
            "created_at": datetime.utcnow(),
        }
        
        if user_doc:
            users_collection.update_one(
                {"email": email},
                {"$push": {"personas": initial_persona_data}}
            )
        else:
            new_user = {
                "email": email,
                "personas": [initial_persona_data],
                "created_at": datetime.utcnow()
            }
            users_collection.insert_one(new_user)
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'current': 1, 'total': 5, 'status': 'Starting RunPod training...'}
        )
        
        # Start training on RunPod
        job_id = start_runpod_training(persona_name, uploaded_urls)
        
        # Update database with job ID
        update_training_status(persona_id, "training_started", job_id=job_id)
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'current': 2, 'total': 5, 'status': f'Training started. Job ID: {job_id}'}
        )
        
        # Poll for completion
        max_wait_time = 3600  # 1 hour max wait time
        poll_interval = 30  # Check every 30 seconds
        elapsed_time = 0
        
        while elapsed_time < max_wait_time:
            status_result = check_runpod_status(job_id)
            
            if status_result is None:
                time.sleep(poll_interval)
                elapsed_time += poll_interval
                continue
            
            job_status = status_result.get("status")
            
            if job_status == "COMPLETED":
                # Get the output
                output = status_result.get("output")
                if not output:
                    raise Exception("No output received from completed job")
                
                # Update task progress
                self.update_state(
                    state='PROGRESS',
                    meta={'current': 3, 'total': 5, 'status': 'Training completed. Downloading model...'}
                )
                
                # Download and save model
                model_url = output.get("model_url") or output.get("output_url")
                if not model_url:
                    raise Exception("No model URL in job output")
                
                model_s3_url = download_and_save_model(model_url, persona_name, persona_id)
                
                # Update task progress
                self.update_state(
                    state='PROGRESS',
                    meta={'current': 4, 'total': 5, 'status': 'Model saved. Updating database...'}
                )
                
                # Update database with final results
                update_training_status(
                    persona_id, 
                    "completed", 
                    model_s3_url=model_s3_url,
                    completed_at=datetime.utcnow()
                )
                
                # Update task progress
                self.update_state(
                    state='PROGRESS',
                    meta={'current': 5, 'total': 5, 'status': 'Terminating pod...'}
                )
                
                # Terminate the pod
                terminate_runpod_pod(job_id)
                
                return {
                    "status": "success",
                    "persona_id": persona_id,
                    "persona_name": persona_name,
                    "model_s3_url": model_s3_url,
                    "job_id": job_id,
                    "message": "LoRA model training completed successfully"
                }
            
            elif job_status == "FAILED":
                error_msg = status_result.get("error", "Unknown error")
                update_training_status(persona_id, "failed", error_message=error_msg)
                terminate_runpod_pod(job_id)
                raise Exception(f"RunPod job failed: {error_msg}")
            
            elif job_status in ["IN_PROGRESS", "IN_QUEUE"]:
                # Update progress based on job status
                progress_msg = f"Training in progress... Status: {job_status}"
                self.update_state(
                    state='PROGRESS',
                    meta={'current': 2, 'total': 5, 'status': progress_msg}
                )
                
                # Update database status
                update_training_status(persona_id, "training_in_progress")
                
                time.sleep(poll_interval)
                elapsed_time += poll_interval
            
            else:
                # Unknown status, continue polling
                time.sleep(poll_interval)
                elapsed_time += poll_interval
        
        # If we exit the loop, it means timeout
        update_training_status(persona_id, "timeout")
        terminate_runpod_pod(job_id)
        raise Exception("Training timed out after 1 hour")
    
    except Exception as e:
        # Update database with error status
        if persona_id:
            update_training_status(persona_id, "failed", error_message=str(e))
        
        # Terminate pod if it was started
        if job_id:
            terminate_runpod_pod(job_id)
        
        # update the user's 200 credits if the task fails
        user_doc = users_collection.find_one({"email": email})
        if user_doc:
            users_collection.update_one(
                {"email": email},
                {"$inc": {"credits": 200}}  # Refund the 200 credits
            )
        # Log the error
        logging.error(f"Error occurred for user {email}: {e}")

        # Re-raise the exception
        raise self.retry(exc=e, countdown=60, max_retries=3)
    

# Helper function to start training from API endpoint
def start_lora_training(persona_name, uploaded_urls, email):
    """Helper function to start the training task"""
    
    # Validate inputs
    if not persona_name or not uploaded_urls or not email:
        return {"error": "persona_name, uploaded_urls, and email are required"}
    
    if len(uploaded_urls) < 10 or len(uploaded_urls) > 20:
        return {"error": "Number of uploaded URLs must be between 10 and 20"}
    
    # Start the Celery task
    task = train_lora_runpod.delay(persona_name, uploaded_urls, email)
    
    return {
        "task_id": task.id,
        "status": "started",
        "message": "LoRA training task started successfully"
    }

# Helper function to check training status
def check_training_status(task_id):
    """Check the status of a training task"""
    try:
        result = celery_app.AsyncResult(task_id)
        
        if result.state == 'PENDING':
            return {
                "state": result.state,
                "status": "Task is waiting to be processed"
            }
        elif result.state == 'PROGRESS':
            return {
                "state": result.state,
                "current": result.info.get('current', 0),
                "total": result.info.get('total', 1),
                "status": result.info.get('status', '')
            }
        elif result.state == 'SUCCESS':
            return {
                "state": result.state,
                "result": result.result
            }
        else:
            return {
                "state": result.state,
                "error": str(result.info)
            }
    except Exception as e:
        return {
            "state": "ERROR",
            "error": str(e)
        }