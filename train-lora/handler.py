import os
import json
import tempfile
import requests
from pathlib import Path
from train import train_lora_model
from urllib.parse import urlparse
import logging
import boto3

import runpod  # <-- THIS IS THE KEY FOR RUNPOD SERVERLESS

logging.basicConfig(level=logging.INFO)

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

        logging.info(f"Input payload received: {json.dumps(data, indent=2)}")

        # Step 3: Download and save images locally
        with tempfile.TemporaryDirectory() as tmp_dir:
            data_dir = Path(tmp_dir)
            logging.info(f"Downloading {len(s3_image_urls)} images to {data_dir}")

            for s3_url in s3_image_urls:
                filename = os.path.basename(urlparse(s3_url).path)
                local_path = data_dir / filename
                try:
                    r = requests.get(s3_url, stream=True, timeout=60)
                    r.raise_for_status()
                    with open(local_path, "wb") as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                    logging.info(f"Downloaded image: {filename} from {s3_url}")
                except Exception as e:
                    err = f"Failed to download {s3_url}: {e}"
                    logging.error(err)
                    return {"status": "error", "message": err}

            # Step 4: Run LoRA training
            output_model_path = Path("/workspace/output") / f"{trigger_word}.safetensors"
            output_model_path.parent.mkdir(parents=True, exist_ok=True)

            try:
                logging.info("Starting LoRA training...")
                train_lora_model(
                    image_dir=str(data_dir),
                    output_path=str(output_model_path),
                    trigger_word=trigger_word
                )
            except Exception as e:
                err = f"LoRA training failed: {e}"
                logging.error(err)
                return {"status": "error", "message": err}

            # Step 5: Upload model to S3
            s3_bucket = os.getenv("S3_BUCKET_NAME")  # e.g., "my-trained-models"
            s3_region = os.getenv("AWS_REGION", "us-east-1")
            s3_key = f"loras/{trigger_word}.safetensors"

            s3 = boto3.client(
                "s3",
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=s3_region,
            )

            s3_model_url = f"https://{s3_bucket}.s3.{s3_region}.amazonaws.com/{s3_key}"

            try:
                logging.info(f"Uploading model to S3 bucket: {s3_bucket}")
                s3.upload_file(str(output_model_path), s3_bucket, s3_key)
                logging.info("Uploaded model to S3 successfully.")
                # Optionally remove local file
                os.remove(output_model_path)
                logging.info("Deleted local model file after upload.")

                result = {
                    "status": "success",
                    "email": email,
                    "trigger_word": trigger_word,
                    "model_s3_url": s3_model_url,
                }
            except Exception as s3e:
                err = f"Model training succeeded but S3 upload failed: {s3e}"
                logging.error(err)
                result = {
                    "status": "error",
                    "message": err,
                }

    except Exception as e:
        err = f"Handler global error: {e}"
        logging.exception(err)
        return {"status": "error", "message": err}

    # Removed writing to /output/output.json to avoid file system errors

    return result


runpod.serverless.start({"handler": handler})
print("RunPod Serverless handler initialized successfully.")
logging.info("RunPod Serverless handler initialized successfully.")
