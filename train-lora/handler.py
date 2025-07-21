import os
import json
import tempfile
import requests
from pathlib import Path
from train import train_lora_model
from urllib.parse import urlparse
import logging
import boto3
import uuid

import runpod  # <-- THIS IS THE KEY FOR RUNPOD SERVERLESS

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def handler(job):
    """
    RunPod Serverless standard handler.
    Receives event/job with `job['input']` containing payload.
    """
    try:
        data = job['input']           # <-- RUNPOD sends inputs here!

        persona_name = data.get("persona_name")
        email = data.get("email")
        trigger_word = data.get("trigger_word")
        s3_image_urls = data.get("s3_image_urls", [])

        if not persona_name or not email or not trigger_word or not s3_image_urls:
            error_msg = "Missing one or more required inputs: persona_name, email, trigger_word, s3_image_urls"
            logging.error(error_msg)
            return {"status": "error", "message": error_msg}

        logging.info(f"Input payload received:")
        logging.info(f"  - persona_name: {persona_name}")
        logging.info(f"  - email: {email}")
        logging.info(f"  - trigger_word: {trigger_word}")
        logging.info(f"  - Number of image URLs: {len(s3_image_urls)}")

        # Generate unique identifier for this training session
        session_id = str(uuid.uuid4())[:8]
        model_name = f"{session_id}_{trigger_word.replace(' ', '_').lower()}"
        
        logging.info(f"Training session ID: {session_id}")
        logging.info(f"Model name: {model_name}")

        # Step 3: Download and save images locally
        with tempfile.TemporaryDirectory() as tmp_dir:
            data_dir = Path(tmp_dir)
            logging.info(f"Created temporary directory: {data_dir}")
            logging.info(f"Starting download of {len(s3_image_urls)} images...")

            downloaded_images = []
            for i, s3_url in enumerate(s3_image_urls, 1):
                try:
                    filename = os.path.basename(urlparse(s3_url).path)
                    if not filename:
                        filename = f"image_{i}.jpg"
                    
                    local_path = data_dir / filename
                    
                    logging.info(f"[{i}/{len(s3_image_urls)}] Downloading: {filename}")
                    logging.info(f"  URL: {s3_url}")
                    
                    r = requests.get(s3_url, stream=True, timeout=60)
                    r.raise_for_status()
                    
                    file_size = 0
                    with open(local_path, "wb") as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                            file_size += len(chunk)
                    
                    # Verify file was created and has content
                    if local_path.exists() and local_path.stat().st_size > 0:
                        downloaded_images.append(str(local_path))
                        logging.info(f"  ✅ Downloaded: {filename} ({file_size} bytes)")
                    else:
                        logging.error(f"  ❌ Failed to create valid file: {filename}")
                        
                except Exception as e:
                    err = f"Failed to download image {i} from {s3_url}: {str(e)}"
                    logging.error(err)
                    return {"status": "error", "message": err}

            # Verify we have images
            if not downloaded_images:
                error_msg = "No images were successfully downloaded"
                logging.error(error_msg)
                return {"status": "error", "message": error_msg}

            logging.info(f"Successfully downloaded {len(downloaded_images)} images")
            
            # List all files in the directory for debugging
            all_files = list(data_dir.glob("*"))
            logging.info(f"Files in training directory: {[f.name for f in all_files]}")

            # Step 4: Run LoRA training
            output_dir = Path("/workspace/output")
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Use the model_name for consistent naming
            expected_model_path = output_dir / f"{model_name}.safetensors"
            
            logging.info(f"Expected output model path: {expected_model_path}")

            try:
                logging.info("Starting LoRA training...")
                logging.info(f"  - Image directory: {data_dir}")
                logging.info(f"  - Output directory: {output_dir}")
                logging.info(f"  - Model name: {model_name}")
                logging.info(f"  - Trigger word: {trigger_word}")
                
                train_lora_model(
                    image_dir=str(data_dir),
                    output_dir=str(output_dir),
                    model_name=model_name,
                    trigger_word=trigger_word
                )
                
                logging.info("LoRA training completed successfully")
                
            except Exception as e:
                err = f"LoRA training failed: {str(e)}"
                logging.error(err)
                return {"status": "error", "message": err}

            # Step 5: Find the actual output file
            # List all files in output directory to see what was actually created
            output_files = list(output_dir.glob("*.safetensors"))
            logging.info(f"Files found in output directory: {[f.name for f in output_files]}")
            
            # Find the model file (there should be only one .safetensors file)
            model_file = None
            if output_files:
                # Use the most recently created file
                model_file = max(output_files, key=lambda x: x.stat().st_mtime)
                logging.info(f"Using model file: {model_file}")
            else:
                error_msg = "No .safetensors model file found after training"
                logging.error(error_msg)
                return {"status": "error", "message": error_msg}

            # Step 6: Upload model to S3
            s3_bucket = os.getenv("S3_BUCKET_NAME")  # e.g., "my-trained-models"
            s3_region = os.getenv("AWS_REGION", "us-east-1")
            s3_key = f"loras/{model_name}.safetensors"

            logging.info(f"S3 Configuration:")
            logging.info(f"  - Bucket: {s3_bucket}")
            logging.info(f"  - Region: {s3_region}")
            logging.info(f"  - Key: {s3_key}")

            try:
                s3 = boto3.client(
                    "s3",
                    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                    region_name=s3_region,
                )

                s3_model_url = f"https://{s3_bucket}.s3.{s3_region}.amazonaws.com/{s3_key}"

                logging.info(f"Uploading model to S3...")
                logging.info(f"  - Local file: {model_file}")
                logging.info(f"  - File size: {model_file.stat().st_size} bytes")
                
                s3.upload_file(str(model_file), s3_bucket, s3_key)
                logging.info("✅ Model uploaded to S3 successfully")
                
                # Verify upload
                try:
                    s3.head_object(Bucket=s3_bucket, Key=s3_key)
                    logging.info("✅ S3 upload verified")
                except Exception as e:
                    logging.warning(f"Could not verify S3 upload: {e}")

                # Clean up local file
                try:
                    os.remove(model_file)
                    logging.info("🗑️  Deleted local model file after upload")
                except Exception as e:
                    logging.warning(f"Could not delete local model file: {e}")

                result = {
                    "status": "success",
                    "email": email,
                    "persona_name": persona_name,
                    "trigger_word": trigger_word,
                    "model_name": model_name,
                    "model_s3_url": s3_model_url,
                    "images_processed": len(downloaded_images),
                    "session_id": session_id
                }
                
                logging.info("✅ Handler completed successfully")
                logging.info(f"Result: {json.dumps(result, indent=2)}")
                
            except Exception as s3e:
                err = f"Model training succeeded but S3 upload failed: {str(s3e)}"
                logging.error(err)
                result = {
                    "status": "error",
                    "message": err,
                    "model_file_exists": str(model_file.exists()) if model_file else "No model file found"
                }

    except Exception as e:
        err = f"Handler global error: {str(e)}"
        logging.exception(err)
        return {"status": "error", "message": err}

    return result


runpod.serverless.start({"handler": handler})
print("🚀 RunPod Serverless handler initialized successfully.")
logging.info("🚀 RunPod Serverless handler initialized successfully.")