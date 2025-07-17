import os
import sys
import json
import tempfile
import requests
from pathlib import Path
from train import train_lora_model
from urllib.parse import urlparse
import logging
logging.basicConfig(level=logging.INFO)
import boto3


def run():
    print("🟢 LoRA Training process started...")
    logging.info("Starting LoRA training handler...")

    # ✅ Step 1: Read input from stdin (RunPod Serverless sends POST body here)
    try:
        raw_input = sys.stdin.read()
        data = json.loads(raw_input)
    except Exception as e:
        print(f"❌ Failed to read input from stdin: {e}")
        logging.error(f"Failed to read input from stdin: {e}")
        return {"status": "error", "message": str(e)}

    # ✅ Step 2: Extract required input fields
    persona_name = data.get("persona_name")
    email = data.get("email")
    trigger_word = data.get("trigger_word")
    s3_image_urls = data.get("s3_image_urls", [])

    if not persona_name or not email or not trigger_word or not s3_image_urls:
        error_msg = "Missing one or more required inputs: persona_name, email, trigger_word, s3_image_urls"
        print(f"❌ {error_msg}")
        logging.error(error_msg)
        return {"status": "error", "message": error_msg}

    print("🔍 Input payload received:")
    print(json.dumps(data, indent=2))
    logging.info("Input payload received successfully.")

    # ✅ Step 3: Download and save images locally
    with tempfile.TemporaryDirectory() as tmp_dir:
        data_dir = Path(tmp_dir)
        print(f"📁 Downloading {len(s3_image_urls)} images to {data_dir}...")
        logging.info(f"Downloading {len(s3_image_urls)} images to temporary directory: {data_dir}")

        for s3_url in s3_image_urls:
            filename = os.path.basename(urlparse(s3_url).path)
            local_path = data_dir / filename
            try:
                r = requests.get(s3_url, stream=True, timeout=60)
                r.raise_for_status()
                with open(local_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                print(f"✅ Downloaded: {filename}")
                logging.info(f"Downloaded image: {filename} from {s3_url}")
            except Exception as e:
                print(f"❌ Failed to download {s3_url}: {e}")
                logging.error(f"Failed to download {s3_url}: {e}")
                return {"status": "error", "message": f"Failed to download {s3_url}"}

        # ✅ Step 4: Run LoRA training
        output_model_path = Path("/workspace/output") / f"{trigger_word}.safetensors"
        output_model_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            print("🚀 Starting LoRA training...")
            train_lora_model(
                image_dir=str(data_dir),
                output_path=str(output_model_path),
                trigger_word=trigger_word
            )
        except Exception as e:
            print(f"❌ Training failed: {e}")
            logging.error(f"LoRA training failed: {e}")
            return {"status": "error", "message": f"LoRA training failed: {str(e)}"}
        
        # Step 5: Upload model to S3
        s3_bucket = os.getenv("S3_BUCKET_NAME")  # e.g., "my-trained-models"
        s3_region = os.getenv("AWS_REGION", "us-east-1")
        s3_key = f"loras/{trigger_word}.safetensors"

# Setup boto3 client using RunPod-compatible or AWS S3 credentials
        s3 = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=s3_region,
        )

        s3_model_url = f"https://{s3_bucket}.s3.{s3_region}.amazonaws.com/{s3_key}"

        try:
            print(f"⬆️ Uploading model to S3 bucket: {s3_bucket}")
            s3.upload_file(str(output_model_path), s3_bucket, s3_key)
            print("✅ Uploaded model to S3 successfully.")

    # ✅ Remove the local file to free up space
            os.remove(output_model_path)
            logging.info("Deleted local model file after upload.")

            result = {
                 "status": "success",
                 "email": email,
                 "trigger_word": trigger_word,
                 "model_s3_url": s3_model_url,
            }

        except Exception as s3e:
             print(f"❌ S3 upload failed: {s3e}")
             logging.error(f"S3 upload failed: {s3e}")
             result = {
                "status": "error",
                "message": f"Model training succeeded but S3 upload failed: {s3e}",
            }

    # ✅ Step 6: Save JSON to /output/output.json
    try:
        os.makedirs("/output", exist_ok=True)
        with open("/output/output.json", "w") as f:
            json.dump(result, f, indent=2)
        print("📤 Output written to /output/output.json")
    except Exception as e:
        print(f"❌ Failed to write output.json: {e}")
        logging.error(f"Failed to write output.json: {e}")
        # If writing JSON fails, return error
        result = {"status": "error", "message": f"Failed to write JSON: {e}"}

    return result

# 🔁 Trigger execution
if __name__ == "__main__":
    run()
