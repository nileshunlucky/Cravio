import os
import json
import requests
import tempfile
from pathlib import Path
from urllib.parse import urlparse
import boto3
from train import train_lora_model

def run():
    print("🟢 LoRA Training process started...")

    # Step 1: Load input payload from /input/input.json
    try:
        with open("/input/input.json", "r") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Failed to load input.json: {e}")
        return {"error": str(e)}

    # Required input values from RunPod payload
    persona_name = data.get("persona_name")
    email = data.get("email")
    trigger_word = data.get("trigger_word")
    s3_image_urls = data.get("s3_image_urls", [])  # List of S3 URLs

    if not persona_name or not email or not s3_image_urls:
        return {"error": "Missing persona_name, email or s3_image_urls in input"}

    print("🔍 Payload received:")
    print(json.dumps(data, indent=2))

    # AWS / S3 settings from ENV
    aws_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
    bucket = os.getenv("S3_BUCKET_NAME")
    region = os.getenv("AWS_REGION", "ap-south-1")

    session = boto3.Session(
        aws_access_key_id=aws_key,
        aws_secret_access_key=aws_secret,
        region_name=region
    )
    s3 = session.client("s3")

    # Step 2: Download User Images from URLs
    with tempfile.TemporaryDirectory() as tmp_dir:
        data_dir = Path(tmp_dir)
        print(f"📁 Downloading {len(s3_image_urls)} images from S3 URLs...")

        image_paths = []
        for s3_url in s3_image_urls:
            filename = os.path.basename(urlparse(s3_url).path)
            local_path = data_dir / filename

            try:
                # Download from URL (stream)
                r = requests.get(s3_url, stream=True, timeout=60)
                r.raise_for_status()
                with open(local_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                image_paths.append(local_path)
            except Exception as e:
                print(f"❌ Failed to download {s3_url}: {e}")
                return {"error": f"Failed to download {s3_url}: {e}"}

        # Step 3: Train LoRA
        output_model_path = Path("/workspace/output") / f"{trigger_word}.safetensors"
        output_model_path.parent.mkdir(parents=True, exist_ok=True)

        print("🚀 Starting LoRA training...")
        train_lora_model(
            image_dir=str(data_dir),
            output_path=str(output_model_path),
            trigger_word=trigger_word
        )

        # Step 4: Upload result to S3
        if output_model_path.exists():
            dest_key = f"trained-loras/{email}/{trigger_word}.safetensors"
            s3.upload_file(str(output_model_path), bucket, dest_key)
            model_url = f"https://{bucket}.s3.{region}.amazonaws.com/{dest_key}"
            print("✅ Training complete and model uploaded to:", model_url)

            return {
                "status": "success",
                "model_s3_url": model_url,
                "email": email,
                "trigger_word": trigger_word,
            }
        else:
            return {"error": "LoRA model file was not created"}

if __name__ == "__main__":
    output = run()
    # Save return dict for RunPod to read
    with open("/output/output.json", "w") as f:
        json.dump(output, f, indent=2)
