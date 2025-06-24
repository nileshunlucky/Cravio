from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse
import uuid, boto3, os, requests, time
from db import users_collection
from PIL import Image
from io import BytesIO
import base64
import json

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
    try:
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Convert to base64
        image_bytes = response.content
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        return image_b64
    except Exception as e:
        raise Exception(f"Unable to download image from {image_url}: {str(e)}")

def upload_to_s3_from_url(image_url: str) -> str:
    """Download image from a URL and upload to S3 bucket."""
    try:
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()

        ext = image_url.split('.')[-1].split("?")[0]
        filename = f"yt-thumbnails/{uuid.uuid4()}.{ext}"

        s3.upload_fileobj(BytesIO(response.content), S3_BUCKET, filename, ExtraArgs={'ACL': 'public-read'})
        return f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"
    except Exception as e:
        raise Exception(f"Unable to upload to S3: {str(e)}")

def safe_json_parse(response):
    """Safely parse JSON response with better error handling."""
    try:
        return response.json()
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {str(e)}")
        print(f"⚠️ Response content: {response.text[:500]}")
        print(f"⚠️ Response status: {response.status_code}")
        print(f"⚠️ Response headers: {dict(response.headers)}")
        raise Exception(f"Invalid JSON response from API: {str(e)}")

def wait_for_comfyui_result(prompt_id: str, max_wait: int = 120) -> dict:
    """Wait for ComfyUI to complete processing and return the result."""
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            print(f"🔍 Checking ComfyUI status for prompt_id: {prompt_id}")
            history_response = requests.get(f"{COMFYUI_API_URL}/history/{prompt_id}", timeout=10)
            
            if history_response.status_code != 200:
                print(f"❌ ComfyUI history API returned status {history_response.status_code}")
                print(f"Response: {history_response.text[:200]}")
                time.sleep(3)
                continue

            history_data = safe_json_parse(history_response)

            if prompt_id in history_data:
                status = history_data[prompt_id].get('status', {})
                if status.get('completed', False):
                    print("✅ ComfyUI processing completed")
                    return history_data[prompt_id]
                elif 'status_str' in status:
                    print(f"🔄 ComfyUI status: {status['status_str']}")
            else:
                print(f"⏳ Prompt {prompt_id} not found in history yet")

            time.sleep(3)

        except Exception as e:
            print(f"🔥 Exception while polling ComfyUI history: {str(e)}")
            time.sleep(3)
    
    raise Exception(f"ComfyUI processing timeout after {max_wait} seconds")

def start_pod():
    """Start your RunPod instance if not already running."""
    try:
        print("🔍 Checking RunPod status...")
        status_response = requests.get(
            f"https://api.runpod.ai/v1/pod/{RUNPOD_POD_ID}",
            headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"},
            timeout=10
        )
        
        if status_response.status_code != 200:
            raise Exception(f"Failed to get RunPod status: {status_response.status_code}")
        
        status = safe_json_parse(status_response)

        if status.get('data', {}).get('runtime', {}).get('uptimeInSeconds', 0) == 0:
            print("🔁 Starting RunPod...")
            start_response = requests.post(
                f"https://api.runpod.ai/v1/pod/{RUNPOD_POD_ID}/start",
                headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"},
                timeout=10
            )
            
            if start_response.status_code not in [200, 202]:
                raise Exception(f"Failed to start RunPod: {start_response.status_code} - {start_response.text}")
            
            # Wait until pod becomes ready
            for attempt in range(30):  # wait max 3 minutes
                time.sleep(6)
                try:
                    status_response = requests.get(
                        f"https://api.runpod.ai/v1/pod/{RUNPOD_POD_ID}",
                        headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"},
                        timeout=10
                    )
                    
                    if status_response.status_code == 200:
                        status = safe_json_parse(status_response)
                        uptime = status.get('data', {}).get('runtime', {}).get('uptimeInSeconds', 0)
                        if uptime > 0:
                            print("✅ RunPod is running.")
                            return
                        print(f"⏳ RunPod starting... (attempt {attempt + 1}/30)")
                    else:
                        print(f"⚠️ Status check failed: {status_response.status_code}")
                except Exception as e:
                    print(f"⚠️ Status check error: {str(e)}")
                    
            raise Exception("RunPod took too long to start")
        else:
            print("✅ RunPod already running.")
            
    except Exception as e:
        print(f"❌ RunPod start error: {str(e)}")
        raise Exception(f"Failed to start RunPod: {str(e)}")

def stop_pod():
    """Stops the RunPod instance to save GPU cost."""
    try:
        print("🛑 Stopping RunPod...")
        response = requests.post(
            f"https://api.runpod.ai/v1/pod/{RUNPOD_POD_ID}/stop",
            headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"},
            timeout=10
        )
        
        if response.status_code not in [200, 202]:
            print(f"⚠️ Failed to stop RunPod: {response.status_code} - {response.text}")
        else:
            print("✅ RunPod stop request sent")
            
    except Exception as e:
        print(f"⚠️ Error stopping RunPod: {str(e)}")

@router.post("/api/generate-thumbnail")
async def generate_thumbnail(
    youtube_url: str = Form(...),
    persona: str = Form(...),   # Public URL of face image
    prompt: str = Form(""),
    email: str = Form(...),
):
    try:
        print(f"🎬 Starting thumbnail generation for: {email}")
        
        # Validate required environment variables
        required_vars = [COMFYUI_API_URL, RUNPOD_API_KEY, RUNPOD_POD_ID]
        if not all(required_vars):
            raise Exception("Missing required environment variables")

        # Step 1: Get YouTube thumbnail URL
        yt_thumb_url = get_yt_thumbnail_url(youtube_url)
        if not yt_thumb_url:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")

        print(f"📸 YouTube thumbnail URL: {yt_thumb_url}")

        # Step 2: Download and encode images
        try:
            print("⬇️ Downloading persona image...")
            persona_b64 = download_and_encode_image(persona)
            print("⬇️ Downloading YouTube thumbnail...")
            yt_thumb_b64 = download_and_encode_image(yt_thumb_url)
            print("✅ Images downloaded and encoded")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to download images: {str(e)}")

        # Step 3: Compose prompt
        final_prompt = prompt or "Create an engaging YouTube thumbnail with the person's face, professional lighting, vibrant colors"

        # Step 4: Create ComfyUI workflow payload
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
                    "class_type": "CheckpointLoaderSimple",
                    "inputs": {
                        "ckpt_name": "sd_xl_base_1.0.safetensors"
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

        # Step 5: Start RunPod before ComfyUI call
        start_pod()

        # Step 6: Send to ComfyUI
        print("🎨 Sending request to ComfyUI...")
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        comfyui_response = requests.post(
            f"{COMFYUI_API_URL}/prompt", 
            json=workflow_payload, 
            headers=headers,
            timeout=30
        )
        
        print(f"📡 ComfyUI response status: {comfyui_response.status_code}")
        print(f"📡 ComfyUI response content: {comfyui_response.text[:200]}")
        
        if comfyui_response.status_code != 200:
            stop_pod()  # Stop pod on error
            raise Exception(f"ComfyUI API error {comfyui_response.status_code}: {comfyui_response.text}")

        result = safe_json_parse(comfyui_response)
        prompt_id = result.get("prompt_id")
        
        if not prompt_id:
            stop_pod()  # Stop pod on error
            raise Exception("No prompt ID returned from ComfyUI")

        print(f"🆔 Prompt ID: {prompt_id}")

        # Step 7: Wait for completion and get result
        try:
            completion_result = wait_for_comfyui_result(prompt_id, max_wait=180)
            
            # Extract output image info
            if 'outputs' in completion_result and '9' in completion_result['outputs']:
                output_images = completion_result['outputs']['9']['images']
                if output_images:
                    image_filename = output_images[0]['filename']
                    output_url = f"{COMFYUI_API_URL}/view?filename={image_filename}"
                    
                    print(f"🖼️ Generated image: {output_url}")
                    
                    # Step 8: Save thumbnail link to DB
                    try:
                        users_collection.update_one(
                            {"email": email}, 
                            {"$push": {"thumbnail_urls": output_url}},
                            upsert=True
                        )
                        print("💾 Saved to database")
                    except Exception as db_error:
                        print(f"⚠️ Database save error: {str(db_error)}")
                    
                    # Stop the pod to save costs
                    stop_pod()

                    return JSONResponse(
                        status_code=200,
                        content={
                            "status": "success",
                            "generated_thumbnail": output_url,
                            "prompt_id": prompt_id
                        }
                    )
            
            stop_pod()  # Stop pod on error
            raise Exception("No output image generated by ComfyUI")
            
        except Exception as e:
            stop_pod()  # Stop pod on error
            raise Exception(f"ComfyUI processing failed: {str(e)}")

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        error_msg = f"Thumbnail generation error: {str(e)}"
        print(f"❌ {error_msg}")
        
        # Ensure pod is stopped on any error
        try:
            stop_pod()
        except:
            pass
            
        return JSONResponse(
            status_code=500, 
            content={"error": error_msg}
        )