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

    def create_pod(self, pod_name="fluxgym-training-pod", headless=True):
        """Create a new RunPod pod for training
        
        Args:
            pod_name: Name for the pod
            headless: If True, configures for headless training without web server
        """
        # Base pod configuration
        pod_config = {
            "name": pod_name,
            "imageName": "thelocallab/fluxgym-flux-lora-training",
            "gpuCount": 1,
            "gpuTypeIds": ["NVIDIA RTX A4500"],
            "gpuTypePriority": "availability",
            "containerDiskInGb": 100,
            "volumeInGb": 100,
            "volumeMountPath": "/workspace",
            "cloudType": "SECURE",
            "dataCenterIds": ["EU-RO-1", "CA-MTL-1", "US-TX-1"],
            "supportPublicIp": not headless,  # Only need public IP for web server mode
            "dataCenterPriority": "availability",
            "computeType": "GPU",
            "interruptible": False,
            "locked": False,
        }

        # Add port mapping and environment only for web server mode
        if not headless:
            pod_config.update({
                "ports": ["7860/http"],
                "env": {
                    "GRADIO_SERVER_NAME": "0.0.0.0",
                    "GRADIO_SERVER_PORT": "7860",
                },
            })

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

            logging.info(f"Created pod: {pod_id} (headless: {headless})")
            return pod_id

        except requests.exceptions.RequestException as e:
            logging.error(f"Network error creating pod: {str(e)}")
            raise Exception(f"Network error creating RunPod pod: {str(e)}")
        except Exception as e:
            logging.error(f"Error creating pod: {str(e)}")
            raise Exception(f"Failed to create RunPod pod: {str(e)}")

    def wait_for_pod_ready(self, pod_id, headless=True, max_wait_time=900):
        """Wait for pod to become ready
        
        Args:
            pod_id: ID of the pod to wait for
            headless: If True, only waits for RUNNING status, not web endpoints
            max_wait_time: Maximum time to wait in seconds
            
        Returns:
            dict: Pod information including status and connection details (if applicable)
        """
        start_time = time.time()
        last_status = None
        consecutive_failures = 0
        max_consecutive_failures = 5
        
        # For headless mode, we need less time to detect RUNNING status
        # For web server mode, we need more time for the service to start
        running_wait_time = 60 if headless else 180  # Time to wait after RUNNING status

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
                    
                    # Reset failure counter on successful API call
                    consecutive_failures = 0

                    # Log status changes
                    if desired_status != last_status:
                        logging.info(f"Pod {pod_id} status changed: {last_status} -> {desired_status}")
                        last_status = desired_status

                    # Check if pod is running
                    if desired_status == "RUNNING":
                        logging.info(f"Pod {pod_id} is RUNNING")
                        
                        if headless:
                            # For headless mode, just wait a bit to ensure pod is stable
                            logging.info(f"Headless mode: Waiting {running_wait_time}s for pod stability...")
                            time.sleep(running_wait_time)
                            
                            # Verify pod is still running after wait
                            verify_response = requests.get(
                                f"{self.base_url}/pods/{pod_id}", 
                                headers=self.headers, 
                                timeout=30
                            )
                            
                            if verify_response.status_code == 200:
                                verify_info = verify_response.json()
                                if verify_info.get("desiredStatus") == "RUNNING":
                                    logging.info(f"Pod {pod_id} is ready for headless training")
                                    return {
                                        "pod_id": pod_id,
                                        "status": "RUNNING",
                                        "mode": "headless",
                                        "ready": True
                                    }
                                else:
                                    logging.warning(f"Pod {pod_id} status changed during stability check")
                                    continue
                            else:
                                logging.error(f"Failed to verify pod status: {verify_response.status_code}")
                                continue
                        else:
                            # For web server mode, check for public IP and port mappings
                            port_mappings = pod_info.get("portMappings", {})
                            public_ip = pod_info.get("publicIp")
                            
                            logging.info(f"Pod {pod_id} port mappings: {port_mappings}")
                            logging.info(f"Pod {pod_id} public IP: {public_ip}")

                            # Check if we have both public IP and port mappings
                            if public_ip and port_mappings:
                                # Look for port 7860 mapping
                                mapped_port = None
                                for port_key, mapped_value in port_mappings.items():
                                    if "7860" in str(port_key):
                                        mapped_port = mapped_value
                                        break

                                if mapped_port:
                                    # Build the training API URL
                                    api_url = f"http://{public_ip}:{mapped_port}/run"
                                    
                                    # Test if the API is actually responding
                                    if self._test_api_endpoint(api_url):
                                        logging.info(f"Pod {pod_id} web server is ready. API URL: {api_url}")
                                        return {
                                            "pod_id": pod_id,
                                            "status": "RUNNING",
                                            "mode": "web_server",
                                            "api_url": api_url,
                                            "ready": True
                                        }
                                    else:
                                        logging.info(f"Pod {pod_id} API not responding yet, continuing to wait...")
                                else:
                                    logging.info(f"Pod {pod_id} running but port 7860 not mapped yet")
                            else:
                                logging.info(f"Pod {pod_id} running but missing public IP or port mappings")
                    
                    elif desired_status == "FAILED":
                        raise Exception(f"Pod {pod_id} failed to start")
                    
                    elif desired_status in ["STARTING", "PENDING"]:
                        logging.info(f"Pod {pod_id} is {desired_status.lower()}...")
                    
                    else:
                        logging.info(f"Pod {pod_id} status: {desired_status}")

                else:
                    consecutive_failures += 1
                    logging.error(f"Failed to get pod status (attempt {consecutive_failures}): {response.status_code} - {response.text}")
                    
                    if consecutive_failures >= max_consecutive_failures:
                        raise Exception(f"Failed to get pod status after {max_consecutive_failures} attempts")

                # Wait before next check
                time.sleep(20)

            except requests.exceptions.RequestException as e:
                consecutive_failures += 1
                logging.error(f"Network error checking pod status (attempt {consecutive_failures}): {str(e)}")
                
                if consecutive_failures >= max_consecutive_failures:
                    raise Exception(f"Network errors after {max_consecutive_failures} attempts: {str(e)}")
                
                time.sleep(20)
            except Exception as e:
                if "Pod" in str(e) and "failed to start" in str(e):
                    raise  # Re-raise pod failure exceptions
                    
                consecutive_failures += 1
                logging.error(f"Error checking pod status (attempt {consecutive_failures}): {str(e)}")
                
                if consecutive_failures >= max_consecutive_failures:
                    raise Exception(f"Errors after {max_consecutive_failures} attempts: {str(e)}")
                
                time.sleep(20)

        raise Exception(f"Pod {pod_id} failed to become ready within {max_wait_time} seconds")

    def _test_api_endpoint(self, api_url):
        """Test if the API endpoint is responding (only used in web server mode)"""
        try:
            # Test with a simple GET request to check if the service is up
            test_url = api_url.replace("/run", "/health")  # Try health endpoint first
            response = requests.get(test_url, timeout=10)
            
            if response.status_code == 200:
                return True
                
            # If health endpoint doesn't exist, try the main URL
            response = requests.get(api_url.replace("/run", ""), timeout=10)
            return response.status_code in [200, 404]  # 404 is fine, means service is up
            
        except Exception as e:
            logging.debug(f"API endpoint test failed: {str(e)}")
            return False

    def execute_headless_training(self, pod_id, training_config):
        """Execute training on a headless pod using RunPod's execution API
        
        Args:
            pod_id: ID of the pod to execute training on
            training_config: Dictionary containing training parameters
            
        Returns:
            dict: Execution result with job ID and status
        """
        try:
            # Prepare the training script/command
            training_script = self._prepare_training_script(training_config)
            
            # Execute the training script on the pod
            execution_payload = {
                "input": {
                    "script": training_script,
                    "args": training_config
                }
            }
            
            logging.info(f"Executing headless training on pod {pod_id}")
            logging.info(f"Training config: {training_config}")
            
            response = requests.post(
                f"{self.base_url}/pods/{pod_id}/run",
                headers=self.headers,
                json=execution_payload,
                timeout=60
            )
            
            if response.status_code != 200:
                logging.error(f"Training execution failed: {response.status_code} - {response.text}")
                raise Exception(f"Training execution failed: {response.status_code} - {response.text}")
            
            result = response.json()
            job_id = result.get("id")
            
            if not job_id:
                raise Exception(f"No job ID returned from training execution: {result}")
            
            logging.info(f"Headless training started with job ID: {job_id}")
            return {
                "job_id": job_id,
                "status": "started",
                "pod_id": pod_id
            }
            
        except Exception as e:
            logging.error(f"Error executing headless training: {str(e)}")
            raise Exception(f"Failed to execute headless training: {str(e)}")

    def _prepare_training_script(self, training_config):
        """Prepare the training script for headless execution"""
        # This would contain the actual training logic
        # For now, return a placeholder that matches your training requirements
        return f"""
        # FluxGym training script
        python train.py \\
            --steps {training_config.get('steps', 1000)} \\
            --lora_rank {training_config.get('lora_rank', 16)} \\
            --optimizer {training_config.get('optimizer', 'adamw8bit')} \\
            --batch_size {training_config.get('batch_size', 1)} \\
            --learning_rate {training_config.get('learning_rate', 1e-4)} \\
            --resolution {training_config.get('resolution', '512,768,1024')} \\
            --trigger_word "{training_config.get('trigger_word', '')}" \\
            --model_name "{training_config.get('model_name', 'lora_model')}" \\
            --max_train_epochs {training_config.get('max_train_epochs', 20)} \\
            --mixed_precision {training_config.get('mixed_precision', 'fp16')} \\
            --save_precision {training_config.get('save_precision', 'fp16')}
        """

    def check_headless_training_status(self, pod_id, job_id):
        """Check the status of a headless training job
        
        Args:
            pod_id: ID of the pod running the training
            job_id: ID of the training job
            
        Returns:
            dict: Job status information
        """
        try:
            response = requests.get(
                f"{self.base_url}/pods/{pod_id}/jobs/{job_id}",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code != 200:
                logging.error(f"Failed to get job status: {response.status_code} - {response.text}")
                return None
            
            result = response.json()
            logging.info(f"Job {job_id} status: {result.get('status')}")
            return result
            
        except Exception as e:
            logging.error(f"Error checking job status: {str(e)}")
            return None

    def get_job_output(self, pod_id, job_id):
        """Get the output from a completed training job
        
        Args:
            pod_id: ID of the pod that ran the training
            job_id: ID of the training job
            
        Returns:
            dict: Job output including model file locations
        """
        try:
            response = requests.get(
                f"{self.base_url}/pods/{pod_id}/jobs/{job_id}/output",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code != 200:
                logging.error(f"Failed to get job output: {response.status_code} - {response.text}")
                return None
            
            result = response.json()
            logging.info(f"Job {job_id} output: {result}")
            return result
            
        except Exception as e:
            logging.error(f"Error getting job output: {str(e)}")
            return None

    def terminate_pod(self, pod_id):
        """Terminate a RunPod pod"""
        try:
            response = requests.delete(
                f"{self.base_url}/pods/{pod_id}", 
                headers=self.headers, 
                timeout=30
            )

            logging.info(f"Terminate pod response: {response.status_code} - {response.text}")

            if response.status_code in [200, 204]:
                logging.info(f"Pod {pod_id} terminated successfully")
                return True
            else:
                logging.error(f"Failed to terminate pod {pod_id}: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            logging.error(f"Error terminating pod {pod_id}: {str(e)}")
            return False

    def get_pod_status(self, pod_id):
        """Get current status of a pod"""
        try:
            response = requests.get(
                f"{self.base_url}/pods/{pod_id}", 
                headers=self.headers, 
                timeout=30
            )

            if response.status_code == 200:
                return response.json()
            else:
                logging.error(f"Failed to get pod status: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logging.error(f"Error getting pod status: {str(e)}")
            return None

    def get_available_gpu_types(self):
        """Get available GPU types for debugging"""
        try:
            response = requests.get(
                f"{self.base_url}/gpus", 
                headers=self.headers, 
                timeout=30
            )

            if response.status_code == 200:
                return response.json()
            else:
                logging.error(f"Failed to get GPU types: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logging.error(f"Error getting GPU types: {str(e)}")
            return None


@celery_app.task(bind=True, time_limit=7200, soft_time_limit=7100)  # 2 hours total
def train_lora_runpod_automated(self, persona_name, uploaded_urls, email, headless=True):
    """Main task to train LoRA model with automated RunPod pod management
    
    Args:
        persona_name: Name of the persona to train
        uploaded_urls: List of image URLs for training
        email: User email for database updates
        headless: If True, uses headless training mode (recommended)
    """

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
            "training_mode": "headless" if headless else "web_server",
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
            meta={"current": 1, "total": 8, "status": f"Creating RunPod pod ({'headless' if headless else 'web server'} mode)..."},
        )

        # Step 1: Create RunPod pod
        pod_id = runpod_manager.create_pod(f"training-{persona_id}", headless=headless)
        update_training_status(persona_id, "creating_pod", pod_id=pod_id)

        # Step 2: Wait for pod to be ready
        self.update_state(
            state="PROGRESS",
            meta={"current": 2, "total": 8, "status": f"Waiting for pod to be ready ({'headless' if headless else 'web server'} mode)..."},
        )

        pod_info = runpod_manager.wait_for_pod_ready(pod_id, headless=headless)
        update_training_status(persona_id, "pod_ready", pod_info=pod_info)

        # Step 3: Prepare training data
        self.update_state(
            state="PROGRESS",
            meta={
                "current": 3,
                "total": 8,
                "status": "Pod ready! Preparing training data...",
            },
        )

        # Create caption files for training
        caption_urls = create_caption_files_for_fluxgym(uploaded_urls, persona_name)

        # Step 4: Start training based on mode
        self.update_state(
            state="PROGRESS",
            meta={
                "current": 4,
                "total": 8,
                "status": f"Starting training ({'headless' if headless else 'web server'} mode)...",
            },
        )

        if headless:
            # Headless training mode
            training_config = {
                "steps": 1000,
                "lora_rank": 16,
                "optimizer": "adamw8bit",
                "batch_size": 1,
                "learning_rate": 1e-4,
                "resolution": "512,768,1024",
                "trigger_word": trigger_word,
                "input_images": uploaded_urls,
                "caption_files": caption_urls,
                "model_name": f"lora_{persona_name.lower().replace(' ', '_')}",
                "max_train_epochs": 20,
                "mixed_precision": "fp16",
                "save_precision": "fp16",
            }

            training_result = runpod_manager.execute_headless_training(pod_id, training_config)
            job_id = training_result["job_id"]
            
            # Monitor headless training
            model_s3_url = monitor_headless_training(
                self, runpod_manager, pod_id, job_id, persona_id, persona_name
            )
        else:
            # Web server training mode (existing logic)
            api_url = pod_info["api_url"]
            job_id, caption_urls = start_runpod_training(
                api_url, persona_name, uploaded_urls, trigger_word
            )

            # Monitor web server training
            model_s3_url = monitor_web_server_training(
                self, api_url, job_id, persona_id, persona_name
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
            "training_mode": "headless" if headless else "web_server",
            "images_processed": len(uploaded_urls),
            "first_image_url": uploaded_urls[0] if uploaded_urls else None,
            "message": "LoRA model training completed successfully!",
        }

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

        # Only retry on transient errors, not configuration or validation errors
        if any(keyword in str(e).lower() for keyword in ["validation", "invalid", "failed to start"]):
            logging.error(f"Non-retryable error, not retrying: {str(e)}")
            raise  # Don't retry validation errors or pod start failures

        # Retry with exponential backoff for transient errors
        logging.info(f"Retrying task due to transient error: {str(e)}")
        raise self.retry(exc=e, countdown=min(60 * (2 ** self.request.retries), 300), max_retries=2)


def monitor_headless_training(task, runpod_manager, pod_id, job_id, persona_id, persona_name):
    """Monitor headless training progress and handle completion
    
    Args:
        task: Celery task instance for progress updates
        runpod_manager: RunPodManager instance
        pod_id: ID of the pod running training
        job_id: ID of the training job
        persona_id: ID of the persona being trained
        persona_name: Name of the persona
        
    Returns:
        str: S3 URL of the saved model
    """
    max_wait_time = 5400  # 1.5 hours for training
    poll_interval = 60  # Check every minute
    elapsed_time = 0
    
    update_training_status(persona_id, "training_started", job_id=job_id)

    while elapsed_time < max_wait_time:
        try:
            # Check job status
            job_status = runpod_manager.check_headless_training_status(pod_id, job_id)

            if job_status is None:
                logging.warning(f"Could not get training status for job {job_id}")
                time.sleep(poll_interval)
                elapsed_time += poll_interval
                continue

            status = job_status.get("status")
            logging.info(f"Headless training job {job_id} status: {status}")

            if status == "COMPLETED":
                # Get the job output
                job_output = runpod_manager.get_job_output(pod_id, job_id)
                
                if not job_output:
                    raise Exception("No output received from completed job")

                # Step 5: Download and save model
                task.update_state(
                    state="PROGRESS",
                    meta={
                        "current": 5,
                        "total": 8,
                        "status": "Training completed! Downloading model...",
                    },
                )

                model_url = job_output.get("model_url") or job_output.get("output_url")
                if not model_url:
                    # For headless mode, the model might be in the pod's file system
                    # We need to handle this differently
                    model_url = f"pod://{pod_id}/workspace/output/model.safetensors"

                model_s3_url = download_and_save_model_from_pod(
                    runpod_manager, pod_id, model_url, persona_name, persona_id
                )

                # Step 6: Update database
                task.update_state(
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

                return model_s3_url

            elif status == "FAILED":
                error_msg = job_status.get("error", "Unknown training error")
                update_training_status(persona_id, "failed", error_message=error_msg)
                raise Exception(f"Headless training job failed: {error_msg}")

            elif status in ["IN_PROGRESS", "IN_QUEUE", "RUNNING"]:
                progress_msg = f"Training in progress... Status: {status}"
                task.update_state(
                    state="PROGRESS",
                    meta={"current": 4, "total": 8, "status": progress_msg},
                )

                update_training_status(persona_id, "training_in_progress")

            time.sleep(poll_interval)
            elapsed_time += poll_interval

        except Exception as e:
            logging.error(f"Error during headless training monitoring: {str(e)}")
            time.sleep(poll_interval)
            elapsed_time += poll_interval

    # Training timed out
    update_training_status(persona_id, "timeout")
    raise Exception("Headless training timed out after 1.5 hours")


def monitor_web_server_training(task, api_url, job_id, persona_id, persona_name):
    """Monitor web server training progress (existing logic)"""
    max_wait_time = 5400  # 1.5 hours for training
    poll_interval = 60  # Check every minute
    elapsed_time = 0

    while elapsed_time < max_wait_time:
        try:
            status_result = check_runpod_training_status(api_url, job_id)
            
            if status_result and status_result.get("status") == "completed":
                # Training completed successfully
                task.update_state(
                    state="PROGRESS",
                    meta={
                        "current": 5,
                        "total": 8,
                        "status": "Training completed! Downloading model...",
                    },
                )

                # Download and save model
                model_s3_url = download_and_save_model_from_runpod(
                    api_url, job_id, persona_name, persona_id
                )

                # Update database
                task.update_state(
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

                return model_s3_url

            elif status_result and status_result.get("status") == "failed":
                error_msg = status_result.get("error", "Unknown training error")
                update_training_status(persona_id, "failed", error_message=error_msg)
                raise Exception(f"Web server training failed: {error_msg}")

            elif status_result and status_result.get("status") in ["running", "in_progress"]:
                progress_msg = f"Training in progress... Status: {status_result.get('status')}"
                task.update_state(
                    state="PROGRESS",
                    meta={"current": 4, "total": 8, "status": progress_msg},
                )

                update_training_status(persona_id, "training_in_progress")

            time.sleep(poll_interval)
            elapsed_time += poll_interval

        except Exception as e:
            logging.error(f"Error during web server training monitoring: {str(e)}")
            time.sleep(poll_interval)
            elapsed_time += poll_interval

    # Training timed out
    update_training_status(persona_id, "timeout")
    raise Exception("Web server training timed out after 1.5 hours")


def download_and_save_model_from_pod(runpod_manager, pod_id, model_url, persona_name, persona_id):
    """Download model from pod and save to S3
    
    Args:
        runpod_manager: RunPodManager instance
        pod_id: ID of the pod containing the model
        model_url: URL or path to the model file
        persona_name: Name of the persona
        persona_id: ID of the persona
        
    Returns:
        str: S3 URL of the saved model
    """
    try:
        # For headless mode, we need to get the model file from the pod's filesystem
        if model_url.startswith("pod://"):
            # Extract the file path from the pod URL
            file_path = model_url.replace(f"pod://{pod_id}", "")
            
            # Use RunPod's file download API to get the model
            response = requests.get(
                f"{RUNPOD_BASE_URL}/pods/{pod_id}/files{file_path}",
                headers=HEADERS,
                timeout=300  # 5 minutes for large model files
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to download model from pod: {response.status_code} - {response.text}")
            
            model_data = response.content
        else:
            # For web server mode, download from provided URL
            response = requests.get(model_url, timeout=300)
            if response.status_code != 200:
                raise Exception(f"Failed to download model from URL: {response.status_code}")
            model_data = response.content

        # Save model to S3
        model_filename = f"lora_models/{persona_id}_{persona_name.lower().replace(' ', '_')}.safetensors"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=model_filename,
            Body=model_data,
            ContentType="application/octet-stream"
        )

        model_s3_url = f"s3://{S3_BUCKET}/{model_filename}"
        logging.info(f"Model saved to S3: {model_s3_url}")
        return model_s3_url

    except Exception as e:
        logging.error(f"Error downloading and saving model: {str(e)}")
        raise Exception(f"Failed to save model to S3: {str(e)}")


def download_and_save_model_from_runpod(api_url, job_id, persona_name, persona_id):
    """Download model from RunPod web server and save to S3 (existing web server logic)
    
    Args:
        api_url: API URL of the RunPod web server
        job_id: Training job ID
        persona_name: Name of the persona
        persona_id: ID of the persona
        
    Returns:
        str: S3 URL of the saved model
    """
    try:
        # Get model download URL from RunPod web server
        model_url_response = requests.get(
            f"{api_url}/download/{job_id}",
            timeout=60
        )
        
        if model_url_response.status_code != 200:
            raise Exception(f"Failed to get model download URL: {model_url_response.status_code}")
        
        model_url = model_url_response.json().get("download_url")
        if not model_url:
            raise Exception("No model download URL received from RunPod")

        # Download the model file
        model_response = requests.get(model_url, timeout=300)
        if model_response.status_code != 200:
            raise Exception(f"Failed to download model: {model_response.status_code}")

        # Save model to S3
        model_filename = f"lora_models/{persona_id}_{persona_name.lower().replace(' ', '_')}.safetensors"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=model_filename,
            Body=model_response.content,
            ContentType="application/octet-stream"
        )

        model_s3_url = f"s3://{S3_BUCKET}/{model_filename}"
        logging.info(f"Model saved to S3: {model_s3_url}")
        return model_s3_url

    except Exception as e:
        logging.error(f"Error downloading and saving model from web server: {str(e)}")
        raise Exception(f"Failed to save model to S3: {str(e)}")


def start_runpod_training(api_url, persona_name, uploaded_urls, trigger_word):
    """Start training on RunPod web server (existing logic)
    
    Args:
        api_url: API URL of the RunPod web server
        persona_name: Name of the persona
        uploaded_urls: List of image URLs
        trigger_word: Trigger word for training
        
    Returns:
        tuple: (job_id, caption_urls)
    """
    try:
        training_payload = {
            "persona_name": persona_name,
            "images": uploaded_urls,
            "trigger_word": trigger_word,
            "steps": 1000,
            "lora_rank": 16,
            "optimizer": "adamw8bit",
            "batch_size": 1,
            "learning_rate": 1e-4,
            "resolution": "512,768,1024",
            "max_train_epochs": 20,
            "mixed_precision": "fp16",
            "save_precision": "fp16",
        }

        response = requests.post(
            api_url,
            json=training_payload,
            timeout=60
        )

        if response.status_code != 200:
            raise Exception(f"Failed to start training: {response.status_code} - {response.text}")

        result = response.json()
        job_id = result.get("job_id")
        caption_urls = result.get("caption_urls", [])

        if not job_id:
            raise Exception("No job ID received from training start")

        logging.info(f"Training started with job ID: {job_id}")
        return job_id, caption_urls

    except Exception as e:
        logging.error(f"Error starting RunPod training: {str(e)}")
        raise Exception(f"Failed to start training: {str(e)}")


def check_runpod_training_status(api_url, job_id):
    """Check training status on RunPod web server
    
    Args:
        api_url: API URL of the RunPod web server
        job_id: Training job ID
        
    Returns:
        dict: Training status information
    """
    try:
        response = requests.get(
            f"{api_url}/status/{job_id}",
            timeout=30
        )

        if response.status_code != 200:
            logging.error(f"Failed to get training status: {response.status_code} - {response.text}")
            return None

        result = response.json()
        logging.info(f"Training status for job {job_id}: {result.get('status')}")
        return result

    except Exception as e:
        logging.error(f"Error checking training status: {str(e)}")
        return None


def create_caption_files_for_fluxgym(uploaded_urls, persona_name):
    """Create caption files for FluxGym training
    
    Args:
        uploaded_urls: List of image URLs
        persona_name: Name of the persona
        
    Returns:
        list: List of caption file URLs
    """
    caption_urls = []
    
    try:
        for i, image_url in enumerate(uploaded_urls):
            # Create a simple caption for each image
            caption_text = f"a photo of {persona_name}"
            
            # Create caption filename (same as image but with .txt extension)
            image_filename = image_url.split('/')[-1]
            caption_filename = f"{image_filename.split('.')[0]}.txt"
            
            # Upload caption to S3
            caption_key = f"training_captions/{caption_filename}"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=caption_key,
                Body=caption_text.encode('utf-8'),
                ContentType="text/plain"
            )
            
            caption_url = f"s3://{S3_BUCKET}/{caption_key}"
            caption_urls.append(caption_url)
            
        logging.info(f"Created {len(caption_urls)} caption files")
        return caption_urls

    except Exception as e:
        logging.error(f"Error creating caption files: {str(e)}")
        raise Exception(f"Failed to create caption files: {str(e)}")


def delete_training_files_from_s3(uploaded_urls, caption_urls, keep_first_image=True):
    """Delete training files from S3 to clean up
    
    Args:
        uploaded_urls: List of image URLs to delete
        caption_urls: List of caption URLs to delete
        keep_first_image: If True, keeps the first image as a reference
    """
    try:
        # Delete caption files
        for caption_url in caption_urls:
            if caption_url.startswith("s3://"):
                key = caption_url.replace(f"s3://{S3_BUCKET}/", "")
                s3_client.delete_object(Bucket=S3_BUCKET, Key=key)

        # Delete training images (except first one if keep_first_image is True)
        start_index = 1 if keep_first_image else 0
        for image_url in uploaded_urls[start_index:]:
            if image_url.startswith("s3://"):
                key = image_url.replace(f"s3://{S3_BUCKET}/", "")
                s3_client.delete_object(Bucket=S3_BUCKET, Key=key)

        logging.info(f"Cleaned up {len(caption_urls)} caption files and {len(uploaded_urls) - start_index} training images")

    except Exception as e:
        logging.error(f"Error cleaning up training files: {str(e)}")
        # Don't raise exception for cleanup errors


def update_training_status(persona_id, status, **kwargs):
    """Update training status in database
    
    Args:
        persona_id: ID of the persona
        status: New status
        **kwargs: Additional fields to update
    """
    try:
        update_data = {
            "personas.$.training_status": status,
            "personas.$.updated_at": datetime.utcnow()
        }
        
        # Add any additional fields
        for key, value in kwargs.items():
            if key not in ['persona_id', 'status']:
                update_data[f"personas.$.{key}"] = value

        result = users_collection.update_one(
            {"personas.id": persona_id},
            {"$set": update_data}
        )

        if result.modified_count == 0:
            logging.warning(f"No persona found with ID {persona_id} to update")
        else:
            logging.info(f"Updated persona {persona_id} status to {status}")

    except Exception as e:
        logging.error(f"Error updating training status: {str(e)}")
        # Don't raise exception for database update errors