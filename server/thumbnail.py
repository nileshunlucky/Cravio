from fastapi import APIRouter, Form
from fastapi.responses import JSONResponse
import uuid, boto3, os, requests, time
from db import users_collection
from PIL import Image
from io import BytesIO
import base64

router = APIRouter()

# S3 client
s3 = boto3.client('s3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

S3_BUCKET = os.getenv("S3_BUCKET_NAME")
COMFYUI_API_URL = os.getenv("COMFYUI_API_URL")  # https://your-comfyui-url
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
RUNPOD_POD_ID = os.getenv("RUNPOD_POD_ID")

def get_yt_thumbnail_url(video_url: str) -> str:
    """Extract YouTube video ID and return thumbnail URL."""
    import re
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11})", video_url)
    video_id = match.group(1) if match else None
    return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg" if video_id else None

def download_and_encode_image(image_url: str) -> str:
    """Download image from URL and return base64 encoded string."""
    response = requests.get(image_url)
    if response.status_code != 200:
        raise Exception(f"Unable to download image from {image_url}")
    
    # Convert to base64
    image_bytes = response.content
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    return image_b64

def upload_to_s3_from_url(image_url: str) -> str:
    """Download image from a URL and upload to S3 bucket."""
    response = requests.get(image_url)
    if response.status_code != 200:
        raise Exception("Unable to download thumbnail")

    ext = image_url.split('.')[-1].split("?")[0]
    filename = f"yt-thumbnails/{uuid.uuid4()}.{ext}"

    s3.upload_fileobj(BytesIO(response.content), S3_BUCKET, filename, ExtraArgs={'ACL': 'public-read'})
    return f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"


def wait_for_comfyui_result(prompt_id: str, max_wait: int = 60) -> dict:
    """Wait for ComfyUI to complete processing and return the result."""
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            history_response = requests.get(f"{COMFYUI_API_URL}/history/{prompt_id}")
            print("📦 Raw /history response content (first 500 chars):")
            print(history_response.text[:500])  # log raw response for debugging

            try:
                history_data = history_response.json()
            except Exception as json_err:
                print("❌ JSON decode error from ComfyUI:", str(json_err))
                print("⚠️ Full response (truncated):", history_response.text[:500])
                raise Exception(f"ComfyUI returned malformed JSON: {str(json_err)}")

            if prompt_id in history_data and history_data[prompt_id].get('status', {}).get('completed', False):
                return history_data[prompt_id]

            time.sleep(2)

        except Exception as e:
            print("🔥 Exception while polling ComfyUI history:", str(e))
            time.sleep(2)
    
    raise Exception("ComfyUI processing timeout")


def start_pod():
    """Start your RunPod instance if not already running."""
    status = requests.get(
        f"https://api.runpod.ai/v1/pod/{RUNPOD_POD_ID}",
        headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"}
    ).json()

    if status['data']['runtime']['uptimeInSeconds'] == 0:
        # Pod is off — start it
        print("🔁 Starting RunPod...")
        res = requests.post(
            f"https://api.runpod.ai/v1/pod/{RUNPOD_POD_ID}/start",
            headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"}
        )
        if res.status_code != 200:
            raise Exception("Failed to start RunPod")
        
        # Wait until pod becomes ready
        for _ in range(30):  # wait max 2–3 minutes
            time.sleep(6)
            status = requests.get(
                f"https://api.runpod.ai/v1/pod/{RUNPOD_POD_ID}",
                headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"}
            ).json()
            if status['data']['runtime']['uptimeInSeconds'] > 0:
                print("✅ RunPod is running.")
                return
        raise Exception("RunPod took too long to start")
    else:
        print("✅ RunPod already running.")

def stop_pod():
    """Stops the RunPod instance to save GPU cost."""
    res = requests.post(
        f"https://api.runpod.ai/v1/pod/{RUNPOD_POD_ID}/stop",
        headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"}
    )
    if res.status_code != 200:
        print("⚠️ Failed to stop RunPod pod")
    else:
        print("🛑 RunPod pod stopped")


@router.post("/api/generate-thumbnail")
async def generate_thumbnail(
    youtube_url: str = Form(...),
    persona: str = Form(...),   # Public URL of face image
    prompt: str = Form(""),
    email: str = Form(...),
):
    try:
        # Step 1: Get YouTube thumbnail URL
        yt_thumb_url = get_yt_thumbnail_url(youtube_url)
        if not yt_thumb_url:
            return JSONResponse(status_code=400, content={"error": "Invalid YouTube URL"})

        # Step 2: Download and encode images
        try:
            persona_b64 = download_and_encode_image(persona)
            yt_thumb_b64 = download_and_encode_image(yt_thumb_url)
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": f"Failed to download images: {str(e)}"})

        # Step 3: Compose prompt
        final_prompt = prompt or "Create an engaging YouTube thumbnail with the person's face, professional lighting, vibrant colors"

        # Step 4: Create ComfyUI workflow payload
        # This is a simplified workflow - adjust based on your actual ComfyUI setup
        workflow_payload = {
            "prompt": {
                "1": {
                    "class_type": "LoadImageFromB64",
                    "inputs": {
                        "image": persona_b64
                    }
                },
                "2": {
                    "class_type": "LoadImageFromB64", 
                    "inputs": {
                        "image": yt_thumb_b64
                    }
                },
                "3": {
                    "class_type": "LoadCheckpoint",
                    "inputs": {
                        "ckpt_name": "sd_xl_base_1.0.safetensors"  # Adjust to your model
                    }
                },
                "4": {
                    "class_type": "CLIPTextEncode",
                    "inputs": {
                        "text": final_prompt,
                        "clip": ["3", 1]
                    }
                },
                "5": {
                    "class_type": "CLIPTextEncode",
                    "inputs": {
                        "text": "blurry, low quality, distorted face",
                        "clip": ["3", 1]
                    }
                },
                "6": {
                    "class_type": "EmptyLatentImage",
                    "inputs": {
                        "width": 1280,
                        "height": 720,
                        "batch_size": 1
                    }
                },
                "7": {
                    "class_type": "KSampler",
                    "inputs": {
                        "seed": 42,
                        "steps": 25,
                        "cfg": 7.5,
                        "sampler_name": "euler",
                        "scheduler": "normal",
                        "denoise": 0.8,
                        "model": ["3", 0],
                        "positive": ["4", 0],
                        "negative": ["5", 0],
                        "latent_image": ["6", 0]
                    }
                },
                "8": {
                    "class_type": "VAEDecode",
                    "inputs": {
                        "samples": ["7", 0],
                        "vae": ["3", 2]
                    }
                },
                "9": {
                    "class_type": "SaveImage",
                    "inputs": {
                        "images": ["8", 0],
                        "filename_prefix": f"thumbnail_{email.replace('@', '_').replace('.', '_')}"
                    }
                }
            }
        }

        # BEFORE calling ComfyUI
        start_pod()

        # Step 5: Send to ComfyUI
        response = requests.post(f"{COMFYUI_API_URL}/prompt", json=workflow_payload, timeout=30)
        if response.status_code != 200:
            return JSONResponse(status_code=500, content={"error": f"ComfyUI API error: {response.text}"})

        result = response.json()
        prompt_id = result.get("prompt_id")
        
        if not prompt_id:
            return JSONResponse(status_code=500, content={"error": "No prompt ID returned from ComfyUI"})

        # Step 6: Wait for completion and get result
        try:
            completion_result = wait_for_comfyui_result(prompt_id)
            
            # Extract output image info
            if 'outputs' in completion_result and '9' in completion_result['outputs']:
                output_images = completion_result['outputs']['9']['images']
                if output_images:
                    image_filename = output_images[0]['filename']
                    output_url = f"{COMFYUI_API_URL}/view?filename={image_filename}"
                    
                    # Step 7: Save thumbnail link to DB
                    users_collection.update_one(
                        {"email": email}, 
                        {"$push": {"thumbnail_urls": output_url}},
                        upsert=True
                    )
                    # AFTER processing, stop the pod to save costs
                    stop_pod()

                    return {
                        "status": "success",
                        "generated_thumbnail": output_url,
                        "prompt_id": prompt_id
                    }

            
            return JSONResponse(status_code=500, content={"error": "No output image generated"})
            
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": f"ComfyUI processing failed: {str(e)}"})

    except Exception as e:
        print(f"Thumbnail generation error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Internal error: {str(e)}"})