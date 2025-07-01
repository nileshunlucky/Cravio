from fastapi import APIRouter, UploadFile, Form, File
from fastapi.responses import JSONResponse
from typing import Optional
import os
import yt_dlp
import uuid
import httpx
import asyncio
from db import users_collection
from dotenv import load_dotenv
import boto3
import datetime
from PIL import Image, ImageDraw, ImageFont

load_dotenv()
router = APIRouter()

TEMP_DIR = "Faceswap"
os.makedirs(TEMP_DIR, exist_ok=True)

REMAKER_API_KEY = os.getenv("REMAKER_API_KEY")
REMAKER_CREATE_JOB_URL = "https://developer.remaker.ai/api/remaker/v1/face-swap/create-job"
REMAKER_FETCH_JOB_URL = "https://developer.remaker.ai/api/remaker/v1/face-swap"

# S3 configuration
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client('s3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

def add_watermark(image_path: str, output_path: str) -> str:
    """Add CRAVIOAI watermark to the center of the image"""
    try:
        # Open the image
        image = Image.open(image_path)
        
        # Convert to RGBA if not already (for transparency support)
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Create a transparent overlay
        overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Get image dimensions
        width, height = image.size
        
        # Watermark text
        watermark_text = "CRAVIOAI"
        
        # Try to load a bold font, fallback to default if not available
        try:
            # Try to find a bold font (adjust path as needed for your system)
            font_size = max(width, height) // 15  # Dynamic font size based on image size
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            try:
                # Fallback to other common font paths
                font_size = max(width, height) // 15
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                # Final fallback to default font
                font = ImageFont.load_default()
        
        # Get text bounding box for centering
        bbox = draw.textbbox((0, 0), watermark_text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Calculate center position
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        # Draw the watermark with 50% opacity white color
        # White color with 50% opacity (128 out of 255)
        text_color = (255, 255, 255, 128)
        draw.text((x, y), watermark_text, font=font, fill=text_color)
        
        # Composite the overlay onto the original image
        watermarked = Image.alpha_composite(image, overlay)
        
        # Convert back to RGB if needed (for JPEG saving)
        if watermarked.mode == 'RGBA':
            # Create a white background
            rgb_image = Image.new('RGB', watermarked.size, (255, 255, 255))
            rgb_image.paste(watermarked, mask=watermarked.split()[-1])  # Use alpha channel as mask
            watermarked = rgb_image
        
        # Save the watermarked image
        watermarked.save(output_path, 'JPEG', quality=95)
        
        return output_path
    except Exception as e:
        print(f"Watermark error: {str(e)}")
        # If watermarking fails, copy original file
        import shutil
        shutil.copy2(image_path, output_path)
        return output_path

async def poll_job_status(client: httpx.AsyncClient, job_id: str, max_attempts: int = 60, delay: int = 5):
    """Poll job status until completion or timeout"""
    headers = {
        "accept": "application/json",
        "Authorization": REMAKER_API_KEY
    }
    
    for attempt in range(max_attempts):
        try:
            response = await client.get(f"{REMAKER_FETCH_JOB_URL}/{job_id}", headers=headers)
            
            if response.status_code != 200:
                print(f"Polling attempt {attempt + 1}: Status {response.status_code}, Response: {response.text}")
                await asyncio.sleep(delay)
                continue
            
            job_data = response.json()
            print(f"Polling attempt {attempt + 1}: {job_data}")
            
            code = job_data.get("code")
            
            # Check if job is completed successfully
            if code == 100000:
                result = job_data.get("result", {})
                output_image_url = result.get("output_image_url")
                
                # If output_image_url exists and is not empty, job is completed
                if output_image_url and len(output_image_url) > 0:
                    return job_data, None
                else:
                    # Job is still processing, continue polling
                    print(f"Job {job_id} still processing (no output URL yet), waiting {delay} seconds...")
                    await asyncio.sleep(delay)
                    continue
            
            # Check if job is still in progress (these are the "in progress" codes)
            elif code in [300102, 300101, 300100]:  # Add other "in progress" codes as needed
                print(f"Job {job_id} still processing (code: {code}), waiting {delay} seconds...")
                await asyncio.sleep(delay)
                continue
            
            else:
                # Job failed or error occurred (any other code)
                message = job_data.get("message", {})
                error_msg = message.get("en", "Unknown error")
                return None, f"Job failed with code {code}: {error_msg}"
                
        except Exception as e:
            print(f"Polling error on attempt {attempt + 1}: {str(e)}")
            await asyncio.sleep(delay)
            continue
    
    return None, "Job timeout - processing took too long"

@router.post("/api/faceswap")
async def faceswap_endpoint(
    youtubeUrl: Optional[str] = Form(None),
    thumbnailImage: Optional[UploadFile] = File(None),
    faceImage: UploadFile = File(...),
    email: str = Form(...)
):
    thumbnail_path = None
    face_path = None
    local_result_path = None
    watermarked_path = None

    # ✅ Validate user
    user = users_collection.find_one({"email": email})
    if not user:
        return JSONResponse(content={"error": "User not found"}, status_code=400)
    if user.get("credits", 0) < 10:
        return JSONResponse(content={"error": "Not enough credits"}, status_code=402)

    # Get user payment status
    user_paid = user.get("user_paid", False)

    # Deduct credits
    users_collection.update_one({"email": email}, {"$inc": {"credits": -10}})

    try:
        # ✅ Handle thumbnail input
        if youtubeUrl:
            try:
                cookies_path = "/tmp/cookies.txt"
                if os.environ.get("COOKIES_TXT"):
                    with open(cookies_path, "w") as f:
                        f.write(os.environ["COOKIES_TXT"])

                ydl_opts = {
                    'skip_download': True,
                    'write_thumbnail': True,
                    'cookiefile': cookies_path if os.path.exists(cookies_path) else None,
                    'outtmpl': f'{TEMP_DIR}/%(id)s',
                    'quiet': True,
                }

                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(youtubeUrl, download=True)
                    video_id = info.get("id")
                    for ext in ['jpg', 'webp', 'png']:
                        candidate = os.path.join(TEMP_DIR, f"{video_id}.{ext}")
                        if os.path.exists(candidate):
                            thumbnail_path = candidate
                            break
                            
                if not thumbnail_path or not os.path.exists(thumbnail_path):
                    raise Exception("Thumbnail file not found after download")
                    
            except Exception as e:
                # Refund credits on error
                users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
                return JSONResponse(status_code=500, content={"error": f"YouTube thumbnail error: {str(e)}"})
                
        elif thumbnailImage:
            filename = f"{uuid.uuid4().hex}_{thumbnailImage.filename}"
            thumbnail_path = os.path.join(TEMP_DIR, filename)
            content = await thumbnailImage.read()
            with open(thumbnail_path, "wb") as f:
                f.write(content)
        else:
            # Refund credits on error
            users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
            return JSONResponse(status_code=400, content={"error": "Provide either YouTube URL or thumbnail image."})

        # ✅ Save face image
        face_filename = f"{uuid.uuid4().hex}_{faceImage.filename}"
        face_path = os.path.join(TEMP_DIR, face_filename)
        face_content = await faceImage.read()
        with open(face_path, "wb") as f:
            f.write(face_content)

        # Verify files exist and are readable
        if not os.path.exists(thumbnail_path) or not os.path.exists(face_path):
            raise Exception("Input files not properly saved")

        # ✅ Call Remaker API
        async with httpx.AsyncClient(timeout=300.0) as client:
            # Step 1: Submit the face swap job
            try:
                with open(thumbnail_path, "rb") as thumb_file, open(face_path, "rb") as face_file:
                    files = {
                        "target_image": ("target.jpg", thumb_file, "image/jpeg"),  # Face to be replaced
                        "swap_image": ("swap.jpg", face_file, "image/jpeg")       # Your face
                    }
                    headers = {
                        "accept": "application/json",
                        "Authorization": REMAKER_API_KEY
                    }
                    
                    print(f"Submitting job to Remaker API...")
                    response = await client.post(REMAKER_CREATE_JOB_URL, headers=headers, files=files)
                    print(f"Remaker API response status: {response.status_code}")
                    print(f"Remaker API response: {response.text}")

                    if response.status_code != 200:
                        # Refund credits on API error
                        users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
                        return JSONResponse(
                            status_code=500, 
                            content={
                                "error": "Failed to submit face swap job", 
                                "details": response.text,
                                "status_code": response.status_code
                            }
                        )

                    job_response = response.json()
                    
                    # Check if job creation was successful
                    if job_response.get("code") != 100000:
                        message = job_response.get("message", {})
                        error_msg = message.get("en", "Unknown error")
                        # Refund credits on job creation failure
                        users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
                        return JSONResponse(
                            status_code=500, 
                            content={
                                "error": f"Job creation failed: {error_msg}",
                                "code": job_response.get("code"),
                                "response": job_response
                            }
                        )
                    
                    # Extract job_id from result
                    result = job_response.get("result", {})
                    job_id = result.get("job_id")
                    
                    if not job_id:
                        # Refund credits if no job ID
                        users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
                        return JSONResponse(
                            status_code=500, 
                            content={
                                "error": "No job ID returned from Remaker", 
                                "response": job_response
                            }
                        )
                    
                    print(f"Job created successfully with ID: {job_id}")

            except Exception as e:
                # Refund credits on exception
                users_collection.update_one({"email": email}, {"$inc": {"credits": 10}})
                return JSONResponse(
                    status_code=500, 
                    content={"error": f"Failed to submit job: {str(e)}"}
                )

            # Step 2: Poll for job completion
            print(f"Starting to poll job status for job_id: {job_id}")
            job_result, error = await poll_job_status(client, job_id)
            
            if error:
                # Note: Don't refund credits here as the job was successfully submitted
                # The user should still be charged for API usage even if polling fails
                return JSONResponse(status_code=500, content={"error": error})
            
            if not job_result:
                return JSONResponse(status_code=500, content={"error": "Failed to get job result"})

            # Step 3: Get the output URL from the response
            result = job_result.get("result", {})
            output_image_urls = result.get("output_image_url", [])
            
            if not output_image_urls or len(output_image_urls) == 0:
                return JSONResponse(
                    status_code=500, 
                    content={
                        "error": "No output image URL in job result", 
                        "job_result": job_result
                    }
                )
            
            # Get the first output image URL
            output_url = output_image_urls[0]
            print(f"Got output URL: {output_url}")

            # ✅ Download result image
            try:
                result_filename = f"{uuid.uuid4().hex}_faceswap_output.jpg"
                local_result_path = os.path.join(TEMP_DIR, result_filename)

                result_response = await client.get(output_url)
                if result_response.status_code != 200:
                    return JSONResponse(
                        status_code=500, 
                        content={"error": f"Failed to download result image: {result_response.status_code}"}
                    )
                
                with open(local_result_path, "wb") as f:
                    f.write(result_response.content)
                    
                print(f"Downloaded result image to: {local_result_path}")
                
            except Exception as e:
                return JSONResponse(
                    status_code=500, 
                    content={"error": f"Failed to download result: {str(e)}"}
                )

            # ✅ Handle watermarking and S3 upload based on user payment status
            s3_urls = {}
            
            try:
                if user_paid:
                    # User is paid - no watermark, upload original
                    s3_key = f"faceswap_results/{result_filename}"
                    s3_client.upload_file(
                        local_result_path, 
                        S3_BUCKET, 
                        s3_key, 
                        ExtraArgs={'ACL': 'public-read', 'ContentType': 'image/jpeg'}
                    )
                    s3_urls['original'] = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
                    
                    # Save in DB
                    users_collection.update_one(
                        {"email": email},
                        {"$push": {"thumbnail": {
                            "model": "faceswap",
                            "original_url": s3_urls['original'],
                            "job_id": job_id,
                            "watermarked": False,
                            "created_at": datetime.datetime.utcnow()
                        }}}
                    )
                    
                    main_url = s3_urls['original']
                    
                else:
                    # User is not paid - create and upload both versions
                    
                    # 1. Upload original (without watermark)
                    original_s3_key = f"faceswap_results/original_{result_filename}"
                    s3_client.upload_file(
                        local_result_path, 
                        S3_BUCKET, 
                        original_s3_key, 
                        ExtraArgs={'ACL': 'public-read', 'ContentType': 'image/jpeg'}
                    )
                    s3_urls['original'] = f"https://{S3_BUCKET}.s3.amazonaws.com/{original_s3_key}"
                    
                    # 2. Create watermarked version
                    watermarked_filename = f"{uuid.uuid4().hex}_watermarked_faceswap_output.jpg"
                    watermarked_path = os.path.join(TEMP_DIR, watermarked_filename)
                    add_watermark(local_result_path, watermarked_path)
                    
                    # 3. Upload watermarked version
                    watermarked_s3_key = f"faceswap_results/watermarked_{watermarked_filename}"
                    s3_client.upload_file(
                        watermarked_path, 
                        S3_BUCKET, 
                        watermarked_s3_key, 
                        ExtraArgs={'ACL': 'public-read', 'ContentType': 'image/jpeg'}
                    )
                    s3_urls['watermarked'] = f"https://{S3_BUCKET}.s3.amazonaws.com/{watermarked_s3_key}"
                    
                    # Save both versions in DB
                    users_collection.update_one(
                        {"email": email},
                        {"$push": {"thumbnail": {
                            "model": "faceswap",
                            "watermarked_url": s3_urls['watermarked'],  # Return watermarked version to free user
                            "original_url": s3_urls['original'],  # Keep original for potential upgrade
                            "job_id": job_id,
                            "watermarked": True,
                            "created_at": datetime.datetime.utcnow()
                        }}}
                    )
                    
                    main_url = s3_urls['watermarked']  # Return watermarked version to free user
                    
            except Exception as e:
                return JSONResponse(
                    status_code=500, 
                    content={"error": f"Failed to upload to S3: {str(e)}"}
                )

            print(f"Successfully processed face swap. Main URL: {main_url}")

            return JSONResponse(content={
                "success": True,
                "msg": "Face swap completed successfully",
                "thumbnailUrl": main_url,
                "user_paid": user_paid,
                "watermarked": not user_paid,
                "job_id": job_id
            })

    except Exception as e:
        
        print(f"Face swap process failed: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Face swap process failed: {str(e)}"})
    
    finally:
        # ✅ Clean up temporary files
        cleanup_files = [thumbnail_path, face_path, local_result_path, watermarked_path]
        for file_path in cleanup_files:
            try:
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"Cleaned up: {file_path}")
            except Exception as cleanup_error:
                print(f"Cleanup error for {file_path}: {cleanup_error}")