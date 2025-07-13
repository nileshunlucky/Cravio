import logging
import requests
import time
import os
import boto3
from datetime import datetime
from bson import ObjectId
from celery_config import celery_app
from db import users_collection

# RunPod Configuration
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
RUNPOD_BASE_URL = "https://api.runpod.io/v1"

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

class RunPodManager:
    """Manages RunPod pod lifecycle for training"""
    
    def __init__(self):
        self.base_url = RUNPOD_BASE_URL
        self.headers = HEADERS
    
    def create_pod(self, pod_name="fluxgym-training-pod"):
        """Create a new RunPod pod for training"""
        pod_config = {
            "name": pod_name,
            "imageName": "thelocallab/fluxgym-flux-lora-training",  # Replace with your actual FluxGym image
            "gpuTypeId": "nvidia-rtx-a4500",  # Or your preferred GPU type
            "gpuCount": 1,
            "containerDiskInGb": 50,
            "volumeInGb": 30,
            "ports": "7860/http",  # Expose port 7860 for HTTP
            "env": [
                {"key": "GRADIO_SERVER_NAME", "value": "0.0.0.0"},
                {"key": "GRADIO_SERVER_PORT", "value": "7860"}
            ]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/pods",
                headers=self.headers,
                json=pod_config,
                timeout=30
            )
            
            if response.status_code != 201:
                raise Exception(f"Failed to create pod: {response.status_code} - {response.text}")
            
            result = response.json()
            pod_id = result["id"]
            
            logging.info(f"Created pod: {pod_id}")
            return pod_id
            
        except Exception as e:
            raise Exception(f"Failed to create RunPod pod: {str(e)}")
    
    def wait_for_pod_ready(self, pod_id, max_wait_time=600):
        """Wait for pod to become ready and return connection info"""
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            try:
                response = requests.get(
                    f"{self.base_url}/pod/{pod_id}",
                    headers=self.headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    pod_info = response.json()
                    status = pod_info.get("status")
                    
                    if status == "RUNNING":
                        # Get the proxy URL
                        proxy_url = pod_info.get("proxyUrl")
                        if proxy_url:
                            # Build the training API URL
                            api_url = f"{proxy_url}/run"
                            logging.info(f"Pod {pod_id} is ready. API URL: {api_url}")
                            return api_url
                    
                    elif status == "FAILED":
                        raise Exception(f"Pod {pod_id} failed to start")
                    
                    logging.info(f"Pod {pod_id} status: {status}. Waiting...")
                
                time.sleep(15)  # Check every 15 seconds
                
            except Exception as e:
                logging.error(f"Error checking pod status: {str(e)}")
                time.sleep(15)
        
        raise Exception(f"Pod {pod_id} failed to become ready within {max_wait_time} seconds")
    
    def terminate_pod(self, pod_id):
        """Terminate a RunPod pod"""
        try:
            response = requests.post(
                f"{self.base_url}/pod/terminate",
                headers=self.headers,
                json={"podId": pod_id},
                timeout=30
            )
            
            if response.status_code == 200:
                logging.info(f"Pod {pod_id} terminated successfully")
                return True
            else:
                logging.error(f"Failed to terminate pod {pod_id}: {response.text}")
                return False
                
        except Exception as e:
            logging.error(f"Error terminating pod {pod_id}: {str(e)}")
            return False
    
    def get_pod_status(self, pod_id):
        """Get current status of a pod"""
        try:
            response = requests.get(
                f"{self.base_url}/pod/{pod_id}",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            logging.error(f"Error getting pod status: {str(e)}")
            return None

def create_caption_files_for_fluxgym(image_urls, persona_name):
    """Create individual caption .txt files for each image and upload to S3"""
    caption_urls = []
    
    # Simple caption for all images
    caption_content = f"photo of {persona_name}"
    
    for image_url in image_urls:
        try:
            # Extract the S3 key from the image URL
            image_key = image_url.split(f"{S3_BUCKET}.s3.amazonaws.com/")[-1]
            caption_key = os.path.splitext(image_key)[0] + '.txt'
            
            # Upload caption file to S3
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=caption_key,
                Body=caption_content.encode('utf-8'),
                ContentType="text/plain"
            )
            
            caption_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{caption_key}"
            caption_urls.append(caption_url)
            
            logging.info(f"Created caption file: {caption_key}")
            
        except Exception as e:
            logging.error(f"Error creating caption file for {image_url}: {str(e)}")
            continue
    
    return caption_urls

def start_runpod_training(api_url, persona_name, image_urls, trigger_word):
    """Start training on RunPod using the dynamic API URL"""
    
    # Create caption files for FluxGym
    caption_urls = create_caption_files_for_fluxgym(image_urls, persona_name)

    # Prepare input for FluxGym
    input_data = {
        "input": {
            "steps": 1000,
            "lora_rank": 16,
            "optimizer": "adamw8bit",
            "batch_size": 1,
            "learning_rate": 1e-4,
            "resolution": "512,768,1024",
            "trigger_word": trigger_word,
            "input_images": image_urls,
            "caption_files": caption_urls,
            "model_name": f"lora_{persona_name.lower().replace(' ', '_')}",
            "training_comment": f"LoRA training for {persona_name}",
            "pretrained_model_name_or_path": "frankjoshua/realvisxlV50_v50LightningBakedvae",
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
            "bucket_no_upscale": True,
            "use_blip_captions": True,
            "caption_dropout_rate": 0.1,
            "caption_tag_dropout_rate": 0.1
        }
    }
    
    try:
        response = requests.post(
            api_url,
            headers={"Content-Type": "application/json"},
            json=input_data,
            timeout=60
        )
        
        if response.status_code != 200:
            raise Exception(f"Training API error: {response.status_code} - {response.text}")
        
        result = response.json()
        job_id = result.get("id")
        
        if not job_id:
            raise Exception(f"No job ID returned from training API: {result}")
        
        return job_id, caption_urls
        
    except Exception as e:
        raise Exception(f"Failed to start training: {str(e)}")

def check_runpod_training_status(api_url, job_id):
    """Check the status of a training job"""
    # Remove '/run' and add '/status/{job_id}'
    base_url = api_url.replace('/run', '')
    status_url = f"{base_url}/status/{job_id}"
    
    try:
        response = requests.get(
            status_url,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code != 200:
            return None
        
        return response.json()
        
    except Exception as e:
        logging.error(f"Error checking training status: {str(e)}")
        return None

def download_and_save_model(output_url, persona_name, persona_id):
    """Download the trained model and save to S3"""
    try:
        # Download the model file
        response = requests.get(output_url, timeout=600)  # 10 minute timeout
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
        update_data = {"training_status": status}
        
        # Add any additional fields
        for key, value in kwargs.items():
            update_data[key] = value
        
        users_collection.update_one(
            {"personas._id": ObjectId(persona_id)},
            {"$set": {f"personas.$.{k}": v for k, v in update_data.items()}}
        )
        
        logging.info(f"Updated training status for persona {persona_id}: {status}")
        
    except Exception as e:
        logging.error(f"Error updating training status: {str(e)}")

def delete_training_files_from_s3(uploaded_urls, caption_urls, keep_first_image=True):
    """Delete all S3 uploaded images and caption files, keeping only the first image"""
    
    # Delete images (keep first one if specified)
    images_to_delete = uploaded_urls[1:] if keep_first_image else uploaded_urls
    
    for url in images_to_delete:
        try:
            key = url.split(f"{S3_BUCKET}.s3.amazonaws.com/")[-1]
            s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
            logging.info(f"Deleted S3 image: {key}")
        except Exception as e:
            logging.error(f"Error deleting S3 image {url}: {str(e)}")
    
    # Delete all caption files
    for caption_url in caption_urls:
        try:
            key = caption_url.split(f"{S3_BUCKET}.s3.amazonaws.com/")[-1]
            s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
            logging.info(f"Deleted S3 caption file: {key}")
        except Exception as e:
            logging.error(f"Error deleting S3 caption file {caption_url}: {str(e)}")

@celery_app.task(bind=True)
def train_lora_runpod_automated(self, persona_name, uploaded_urls, email):
    """Main task to train LoRA model with automated RunPod pod management"""
    
    # Validate inputs
    if not persona_name or not uploaded_urls or not email:
        raise ValueError("persona_name, uploaded_urls, and email are required")
    
    if len(uploaded_urls) < 10 or len(uploaded_urls) > 20:
        raise ValueError("Number of uploaded URLs must be between 10 and 20")
    
    persona_id = None
    pod_id = None
    job_id = None
    caption_urls = []
    runpod_manager = RunPodManager()
    
    try:
        # Create initial persona record in database
        persona_id = str(ObjectId())
        user_doc = users_collection.find_one({"email": email})
        
        # Unique trigger word for each persona
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
            meta={'current': 1, 'total': 8, 'status': 'Creating RunPod pod...'}
        )
        
        # Step 1: Create RunPod pod
        pod_id = runpod_manager.create_pod(f"training-{persona_id}")
        update_training_status(persona_id, "creating_pod", pod_id=pod_id)
        
        # Step 2: Wait for pod to be ready
        self.update_state(
            state='PROGRESS',
            meta={'current': 2, 'total': 8, 'status': 'Waiting for pod to be ready...'}
        )
        
        api_url = runpod_manager.wait_for_pod_ready(pod_id)
        update_training_status(persona_id, "pod_ready", api_url=api_url)
        
        # Step 3: Create caption files and start training
        self.update_state(
            state='PROGRESS',
            meta={'current': 3, 'total': 8, 'status': 'Creating caption files and starting training...'}
        )
        
        job_id, caption_urls = start_runpod_training(
            api_url, persona_name, uploaded_urls, trigger_word
        )
        
        update_training_status(persona_id, "training_started", job_id=job_id)
        
        # Step 4: Poll for training completion
        self.update_state(
            state='PROGRESS',
            meta={'current': 4, 'total': 8, 'status': f'Training started. Job ID: {job_id}'}
        )
        
        max_wait_time = 3600  # 1 hour max wait time
        poll_interval = 30  # Check every 30 seconds
        elapsed_time = 0
        
        while elapsed_time < max_wait_time:
            status_result = check_runpod_training_status(api_url, job_id)
            
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
                
                # Step 5: Download and save model
                self.update_state(
                    state='PROGRESS',
                    meta={'current': 5, 'total': 8, 'status': 'Training completed. Downloading model...'}
                )
                
                model_url = output.get("model_url") or output.get("output_url")
                if not model_url:
                    raise Exception("No model URL in job output")
                
                model_s3_url = download_and_save_model(model_url, persona_name, persona_id)
                
                # Step 6: Update database
                self.update_state(
                    state='PROGRESS',
                    meta={'current': 6, 'total': 8, 'status': 'Model saved. Updating database...'}
                )
                
                update_training_status(
                    persona_id, 
                    "completed", 
                    model_s3_url=model_s3_url,
                    completed_at=datetime.utcnow()
                )
                
                # Step 7: Clean up training files
                self.update_state(
                    state='PROGRESS',
                    meta={'current': 7, 'total': 8, 'status': 'Cleaning up training files...'}
                )
                
                delete_training_files_from_s3(uploaded_urls, caption_urls, keep_first_image=True)
                
                # Step 8: Terminate pod
                self.update_state(
                    state='PROGRESS',
                    meta={'current': 8, 'total': 8, 'status': 'Terminating pod...'}
                )
                
                runpod_manager.terminate_pod(pod_id)
                
                return {
                    "status": "success",
                    "persona_id": persona_id,
                    "persona_name": persona_name,
                    "trigger_word": trigger_word,
                    "model_s3_url": model_s3_url,
                    "job_id": job_id,
                    "pod_id": pod_id,
                    "images_processed": len(uploaded_urls),
                    "first_image_url": uploaded_urls[0] if uploaded_urls else None,
                    "message": "LoRA model training completed successfully with automated pod management"
                }
            
            elif job_status == "FAILED":
                error_msg = status_result.get("error", "Unknown error")
                update_training_status(persona_id, "failed", error_message=error_msg)
                raise Exception(f"Training job failed: {error_msg}")
            
            elif job_status in ["IN_PROGRESS", "IN_QUEUE"]:
                progress_msg = f"Training in progress... Status: {job_status}"
                self.update_state(
                    state='PROGRESS',
                    meta={'current': 4, 'total': 8, 'status': progress_msg}
                )
                
                update_training_status(persona_id, "training_in_progress")
                time.sleep(poll_interval)
                elapsed_time += poll_interval
            
            else:
                time.sleep(poll_interval)
                elapsed_time += poll_interval
        
        # Training timed out
        update_training_status(persona_id, "timeout")
        raise Exception("Training timed out after 1 hour")
    
    except Exception as e:
        # Update database with error status
        if persona_id:
            update_training_status(persona_id, "failed", error_message=str(e))
        
        # Terminate pod if it was created
        if pod_id:
            runpod_manager.terminate_pod(pod_id)
        
        # Clean up any created caption files on failure
        if caption_urls:
            delete_training_files_from_s3(uploaded_urls, caption_urls, keep_first_image=True)
        
        # Refund the user's 200 credits if the task fails
        user_doc = users_collection.find_one({"email": email})
        if user_doc:
            users_collection.update_one(
                {"email": email},
                {"$inc": {"credits": 200}}
            )
        
        logging.error(f"Error occurred for user {email}: {e}")
        raise self.retry(exc=e, countdown=60, max_retries=3)

# Helper function to start training from API endpoint
def start_automated_lora_training(persona_name, uploaded_urls, email):
    """Helper function to start the automated training task"""
    
    # Validate inputs
    if not persona_name or not uploaded_urls or not email:
        return {"error": "persona_name, uploaded_urls, and email are required"}
    
    if len(uploaded_urls) < 10 or len(uploaded_urls) > 20:
        return {"error": "Number of uploaded URLs must be between 10 and 20"}
    
    # Start the Celery task
    task = train_lora_runpod_automated.delay(persona_name, uploaded_urls, email)
    
    return {
        "task_id": task.id,
        "status": "started",
        "message": "LoRA training task started with automated pod management"
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