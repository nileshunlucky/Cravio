import logging
import uuid
import requests
import time
import os
import boto3
from datetime import datetime
from celery_config import celery_app
from db import users_collection

# RunPod Configuration
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
RUNPOD_BASE_URL = "https://rest.runpod.io/v1"

# S3 Configuration
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)

HEADERS = {
    "Authorization": f"Bearer {RUNPOD_API_KEY}",
    "Content-Type": "application/json",
}


class RunPodManager:
    """Manages RunPod pod lifecycle for training"""

    def __init__(self):
        self.base_url = RUNPOD_BASE_URL
        self.headers = HEADERS

    def create_pod(self, pod_name="fluxgym-training-pod"):
        """Create a new RunPod pod for training"""
        # Updated pod configuration with better GPU selection
        pod_config = {
            "name": pod_name,
            "imageName": "thelocallab/fluxgym-flux-lora-training",
            "gpuCount": 1,
            "gpuTypeIds": ["NVIDIA RTX A4500"],  # Multiple options
            "gpuTypePriority": "availability",
            "containerDiskInGb": 100,
            "volumeInGb": 100,
            "volumeMountPath": "/workspace",
            "ports": ["7860/http"],
            "env": {
                "GRADIO_SERVER_NAME": "0.0.0.0",
                "GRADIO_SERVER_PORT": "7860",
            },
            "cloudType": "SECURE",
            "dataCenterIds": [
                "EU-RO-1",
                "CA-MTL-1",
                "US-TX-1",
            ],  # More datacenter options
            "supportPublicIp": True,
            "dataCenterPriority": "availability",
            "computeType": "GPU",
            "interruptible": False,
            "locked": False,
        }

        try:
            response = requests.post(
                f"{self.base_url}/pods",
                headers=self.headers,
                json=pod_config,
                timeout=30,
            )

            logging.info(f"Pod creation response status: {response.status_code}")
            logging.info(f"Pod creation response body: {response.text}")

            if response.status_code != 201:
                logging.error(
                    f"Pod creation failed: {response.status_code} - {response.text}"
                )
                raise Exception(
                    f"Failed to create pod: {response.status_code} - {response.text}"
                )

            result = response.json()
            pod_id = result["id"]

            logging.info(f"Created pod: {pod_id}")
            return pod_id

        except requests.exceptions.RequestException as e:
            logging.error(f"Network error creating pod: {str(e)}")
            raise Exception(f"Network error creating RunPod pod: {str(e)}")
        except Exception as e:
            logging.error(f"Error creating pod: {str(e)}")
            raise Exception(f"Failed to create RunPod pod: {str(e)}")
        
    def wait_for_pod_ready(self, pod_id, max_wait_time=900):
        """
        Wait for pod to be RUNNING, then return the API URL using the standard RunPod DNS/port.
        """
        import time
        start_time = time.time()
        last_status = None
        consecutive_failures = 0
        max_consecutive_failures = 5

        while time.time() - start_time < max_wait_time:
            try:
                response = requests.get(
                    f"{self.base_url}/pods/{pod_id}",
                    headers=self.headers,
                    timeout=30
                )
                if response.status_code == 200:
                    pod_info = response.json()
                    desired_status = pod_info.get("desiredStatus")
                    if desired_status != last_status:
                        logging.info(f"Pod {pod_id} status changed: {last_status} -> {desired_status}")
                        last_status = desired_status

                    if desired_status == "RUNNING":
                        # Build the API URL using RunPod DNS and standard port 7860
                        api_url = f"https://{pod_id}-7860.proxy.runpod.net/run"
                        # Optionally, check if the API is up
                        for _ in range(30):  # Try for up to 5 minutes
                            try:
                                health_url = api_url.replace("/run", "/health")
                                resp = requests.get(health_url, timeout=5, verify=False)
                                if resp.status_code == 200:
                                    logging.info(f"Pod {pod_id} is ready. API URL: {api_url}")
                                    return api_url
                            except Exception:
                                pass
                            time.sleep(10)
                        # If /health never returns 200, just return the URL anyway
                        logging.warning(f"Pod {pod_id} RUNNING, but API not responding on /health. Returning URL anyway.")
                        return api_url

                    elif desired_status == "FAILED":
                        raise Exception(f"Pod {pod_id} failed to start")
                    else:
                        logging.info(f"Pod {pod_id} is {desired_status.lower()}...")

                else:
                    consecutive_failures += 1
                    logging.error(f"Failed to get pod status (attempt {consecutive_failures}): {response.status_code} - {response.text}")
                    if consecutive_failures >= max_consecutive_failures:
                        raise Exception(f"Failed to get pod status after {max_consecutive_failures} attempts")
                time.sleep(10)

            except requests.exceptions.RequestException as e:
                consecutive_failures += 1
                logging.error(f"Network error checking pod status (attempt {consecutive_failures}): {str(e)}")
                if consecutive_failures >= max_consecutive_failures:
                    raise Exception(f"Network errors after {max_consecutive_failures} attempts: {str(e)}")
                time.sleep(10)
            except Exception as e:
                if "Pod" in str(e) and "failed to start" in str(e):
                    raise  # Re-raise pod failure exceptions
                consecutive_failures += 1
                logging.error(f"Error checking pod status (attempt {consecutive_failures}): {str(e)}")
                if consecutive_failures >= max_consecutive_failures:
                    raise Exception(f"Errors after {max_consecutive_failures} attempts: {str(e)}")
                time.sleep(10)

        raise Exception(f"Pod {pod_id} failed to become ready within {max_wait_time} seconds")

    def terminate_pod(self, pod_id):
        """Terminate a RunPod pod"""
        try:
            response = requests.delete(
                f"{self.base_url}/pods/{pod_id}", headers=self.headers, timeout=30
            )

            logging.info(
                f"Terminate pod response: {response.status_code} - {response.text}"
            )

            if response.status_code in [200, 204]:
                logging.info(f"Pod {pod_id} terminated successfully")
                return True
            else:
                logging.error(
                    f"Failed to terminate pod {pod_id}: {response.status_code} - {response.text}"
                )
                return False

        except Exception as e:
            logging.error(f"Error terminating pod {pod_id}: {str(e)}")
            return False

    def get_pod_status(self, pod_id):
        """Get current status of a pod"""
        try:
            response = requests.get(
                f"{self.base_url}/pods/{pod_id}", headers=self.headers, timeout=30
            )

            if response.status_code == 200:
                return response.json()
            else:
                logging.error(
                    f"Failed to get pod status: {response.status_code} - {response.text}"
                )
                return None

        except Exception as e:
            logging.error(f"Error getting pod status: {str(e)}")
            return None

    def get_available_gpu_types(self):
        """Get available GPU types for debugging"""
        try:
            response = requests.get(
                f"{self.base_url}/gpus", headers=self.headers, timeout=30
            )

            if response.status_code == 200:
                return response.json()
            else:
                logging.error(
                    f"Failed to get GPU types: {response.status_code} - {response.text}"
                )
                return None

        except Exception as e:
            logging.error(f"Error getting GPU types: {str(e)}")
            return None


# Update the Celery task with better error handling and increased time limits
@celery_app.task(bind=True, time_limit=7200, soft_time_limit=7100)  # 2 hours total
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
        persona_id = str(uuid.uuid4())
        user_doc = users_collection.find_one({"email": email})

        # Unique trigger word for each persona
        trigger_word = f"{persona_id}_{persona_name.lower().replace(' ', '_')}"

        initial_persona_data = {
            "id": persona_id,
            "persona_name": persona_name,
            "trigger_word": trigger_word,
            "uploaded_urls": uploaded_urls[0] if uploaded_urls else None,
            "model_s3_url": None,
            "training_status": "initializing",
            "created_at": datetime.utcnow(),
        }

        if user_doc:
            users_collection.update_one(
                {"email": email}, {"$push": {"personas": initial_persona_data}}
            )
        else:
            new_user = {
                "email": email,
                "personas": [initial_persona_data],
                "created_at": datetime.utcnow(),
            }
            users_collection.insert_one(new_user)

        # Update task progress
        self.update_state(
            state="PROGRESS",
            meta={"current": 1, "total": 8, "status": "Creating RunPod pod..."},
        )

        # Step 1: Create RunPod pod
        pod_id = runpod_manager.create_pod(f"training-{persona_id}")
        update_training_status(persona_id, "creating_pod", pod_id=pod_id)

        # Step 2: Wait for pod to be ready (this is the critical step)
        self.update_state(
            state="PROGRESS",
            meta={
                "current": 2,
                "total": 8,
                "status": "Waiting for pod to be ready (this may take 5-15 minutes)...",
            },
        )

        api_url = runpod_manager.wait_for_pod_ready(pod_id)
        update_training_status(persona_id, "pod_ready", api_url=api_url)

        # Step 3: Create caption files and start training
        self.update_state(
            state="PROGRESS",
            meta={
                "current": 3,
                "total": 8,
                "status": "Pod ready! Creating caption files and starting training...",
            },
        )

        job_id, caption_urls = start_runpod_training(
            api_url, persona_name, uploaded_urls, trigger_word
        )

        update_training_status(persona_id, "training_started", job_id=job_id)

        # Step 4: Poll for training completion
        self.update_state(
            state="PROGRESS",
            meta={
                "current": 4,
                "total": 8,
                "status": f"Training started successfully! Job ID: {job_id}",
            },
        )

        max_wait_time = 5400  # 1.5 hours for training
        poll_interval = 60  # Check every minute
        elapsed_time = 0

        while elapsed_time < max_wait_time:
            try:
                status_result = check_runpod_training_status(api_url, job_id)

                if status_result is None:
                    logging.warning(f"Could not get training status for job {job_id}")
                    time.sleep(poll_interval)
                    elapsed_time += poll_interval
                    continue

                job_status = status_result.get("status")
                logging.info(f"Training job {job_id} status: {job_status}")

                if job_status == "COMPLETED":
                    # Get the output
                    output = status_result.get("output")
                    if not output:
                        raise Exception("No output received from completed job")

                    # Step 5: Download and save model
                    self.update_state(
                        state="PROGRESS",
                        meta={
                            "current": 5,
                            "total": 8,
                            "status": "Training completed! Downloading model...",
                        },
                    )

                    model_url = output.get("model_url") or output.get("output_url")
                    if not model_url:
                        raise Exception("No model URL in job output")

                    model_s3_url = download_and_save_model(
                        model_url, persona_name, persona_id
                    )

                    # Step 6: Update database
                    self.update_state(
                        state="PROGRESS",
                        meta={
                            "current": 6,
                            "total": 8,
                            "status": "Model saved successfully! Updating database...",
                        },
                    )

                    update_training_status(
                        persona_id,
                        "completed",
                        model_s3_url=model_s3_url,
                        completed_at=datetime.utcnow(),
                    )

                    # Step 7: Clean up training files
                    self.update_state(
                        state="PROGRESS",
                        meta={
                            "current": 7,
                            "total": 8,
                            "status": "Cleaning up training files...",
                        },
                    )

                    delete_training_files_from_s3(
                        uploaded_urls, caption_urls, keep_first_image=True
                    )

                    # Step 8: Terminate pod
                    self.update_state(
                        state="PROGRESS",
                        meta={"current": 8, "total": 8, "status": "Terminating pod..."},
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
                        "message": "LoRA model training completed successfully!",
                    }

                elif job_status == "FAILED":
                    error_msg = status_result.get("error", "Unknown training error")
                    update_training_status(
                        persona_id, "failed", error_message=error_msg
                    )
                    raise Exception(f"Training job failed: {error_msg}")

                elif job_status in ["IN_PROGRESS", "IN_QUEUE"]:
                    progress_msg = f"Training in progress... Status: {job_status}"
                    self.update_state(
                        state="PROGRESS",
                        meta={"current": 4, "total": 8, "status": progress_msg},
                    )

                    update_training_status(persona_id, "training_in_progress")

                time.sleep(poll_interval)
                elapsed_time += poll_interval

            except Exception as e:
                logging.error(f"Error during training monitoring: {str(e)}")
                time.sleep(poll_interval)
                elapsed_time += poll_interval

        # Training timed out
        update_training_status(persona_id, "timeout")
        raise Exception("Training timed out after 1.5 hours")

    except Exception as e:
        logging.error(f"Error in training task: {str(e)}")

        # Update database with error status
        if persona_id:
            update_training_status(persona_id, "failed", error_message=str(e))

        # Terminate pod if it was created
        if pod_id:
            try:
                runpod_manager.terminate_pod(pod_id)
            except Exception as cleanup_error:
                logging.error(f"Error cleaning up pod {pod_id}: {str(cleanup_error)}")

        # Clean up any created caption files on failure
        if caption_urls:
            try:
                delete_training_files_from_s3(
                    uploaded_urls, caption_urls, keep_first_image=True
                )
            except Exception as cleanup_error:
                logging.error(f"Error cleaning up S3 files: {str(cleanup_error)}")

        # Don't retry on certain errors
        if "Pod" in str(e) and "failed to start" in str(e):
            raise  # Don't retry pod creation failures
        if "validation" in str(e).lower() or "invalid" in str(e).lower():
            raise  # Don't retry validation errors

        # Retry with exponential backoff for other errors
        raise self.retry(
            exc=e, countdown=min(60 * (2**self.request.retries), 300), max_retries=2
        )


# Keep the rest of your existing functions (create_caption_files_for_fluxgym, start_runpod_training, etc.)
# They remain the same...


def create_caption_files_for_fluxgym(image_urls, persona_name):
    """Create individual caption .txt files for each image and upload to S3"""
    caption_urls = []

    # Simple caption for all images
    caption_content = f"photo of {persona_name}"

    for image_url in image_urls:
        try:
            # Extract the S3 key from the image URL
            image_key = image_url.split(f"{S3_BUCKET}.s3.amazonaws.com/")[-1]
            caption_key = os.path.splitext(image_key)[0] + ".txt"

            # Upload caption file to S3
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=caption_key,
                Body=caption_content.encode("utf-8"),
                ContentType="text/plain",
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
            "caption_tag_dropout_rate": 0.1,
        }
    }

    try:
        logging.info(f"Starting training at URL: {api_url}")
        logging.info(f"Training input data: {input_data}")

        response = requests.post(
            api_url,
            headers={"Content-Type": "application/json"},
            json=input_data,
            timeout=60,
        )

        logging.info(
            f"Training start response: {response.status_code} - {response.text}"
        )

        if response.status_code != 200:
            logging.error(
                f"Training API error: {response.status_code} - {response.text}"
            )
            raise Exception(
                f"Training API error: {response.status_code} - {response.text}"
            )

        result = response.json()
        job_id = result.get("id")

        if not job_id:
            raise Exception(f"No job ID returned from training API: {result}")

        logging.info(f"Training job started with ID: {job_id}")
        return job_id, caption_urls

    except requests.exceptions.RequestException as e:
        logging.error(f"Network error starting training: {str(e)}")
        raise Exception(f"Network error starting training: {str(e)}")
    except Exception as e:
        logging.error(f"Error starting training: {str(e)}")
        raise Exception(f"Failed to start training: {str(e)}")


def check_runpod_training_status(api_url, job_id):
    """Check the status of a training job"""
    # Remove '/run' and add '/status/{job_id}'
    base_url = api_url.replace("/run", "")
    status_url = f"{base_url}/status/{job_id}"

    try:
        logging.info(f"Checking training status at: {status_url}")

        response = requests.get(
            status_url, headers={"Content-Type": "application/json"}, timeout=30
        )

        logging.info(f"Status check response: {response.status_code} - {response.text}")

        if response.status_code != 200:
            logging.error(
                f"Status check failed: {response.status_code} - {response.text}"
            )
            return None

        return response.json()

    except Exception as e:
        logging.error(f"Error checking training status: {str(e)}")
        return None


def download_and_save_model(output_url, persona_name, persona_id):
    """Download the trained model and save to S3"""
    try:
        logging.info(f"Downloading model from: {output_url}")

        # Download the model file
        response = requests.get(output_url, timeout=600)  # 10 minute timeout
        response.raise_for_status()

        # Save to S3
        model_key = f"models/{persona_name}_{persona_id}.safetensors"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=model_key,
            Body=response.content,
            ContentType="application/octet-stream",
        )

        model_s3_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{model_key}"
        logging.info(f"Model saved to S3: {model_s3_url}")
        return model_s3_url

    except Exception as e:
        logging.error(f"Error downloading/saving model: {str(e)}")
        raise Exception(f"Failed to download and save model: {str(e)}")


def update_training_status(persona_id, status, **kwargs):
    """Update training status in database"""
    try:
        update_data = {"training_status": status}

        # Add any additional fields
        for key, value in kwargs.items():
            update_data[key] = value

        # Fixed the database update query
        users_collection.update_one(
            {"personas.id": persona_id},
            {"$set": {f"personas.$.{k}": v for k, v in update_data.items()}},
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
        "message": "LoRA training task started with automated pod management",
    }


# Helper function to check training status
def check_training_status(task_id):
    """Check the status of a training task"""
    try:
        result = celery_app.AsyncResult(task_id)

        if result.state == "PENDING":
            return {"state": result.state, "status": "Task is waiting to be processed"}
        elif result.state == "PROGRESS":
            return {
                "state": result.state,
                "current": result.info.get("current", 0),
                "total": result.info.get("total", 1),
                "status": result.info.get("status", ""),
            }
        elif result.state == "SUCCESS":
            return {"state": result.state, "result": result.result}
        else:
            return {"state": result.state, "error": str(result.info)}
    except Exception as e:
        return {"state": "ERROR", "error": str(e)}


# Debug function to test RunPod connection
def debug_runpod_connection(email):
    """Debug function to test RunPod API connection and available resources"""
    runpod_manager = RunPodManager()

    try:
        # Test API connection by getting GPU types
        gpu_types = runpod_manager.get_available_gpu_types()

        if gpu_types:
            logging.info("Successfully connected to RunPod API")
            logging.info(f"Available GPU types: {gpu_types}")
            # add to user's persona
            users_collection.update_one(
                {"email": email},
                {"$set": {"runpod_gpu_types": gpu_types}},
            )
            return {"status": "success", "gpu_types": gpu_types}
        else:
            logging.error("Failed to get GPU types from RunPod API")
            users_collection.update_one(
                {"email": email},
                {"$set": {"runpod_gpu_types": []}},
            )
            return {"status": "error", "message": "Failed to connect to RunPod API"}

    except Exception as e:
        logging.error(f"RunPod connection test failed: {str(e)}")
        return {"status": "error", "message": str(e)}
