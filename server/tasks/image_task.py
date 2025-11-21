import logging
import traceback
import requests
import uuid
from datetime import datetime, timezone
from celery_config import celery_app
from db import users_collection
import fal_client
import boto3
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configure FAL.ai API
FAL_KEY = os.getenv("FAL_KEY")
fal_client.api_key = FAL_KEY

# Configure AWS S3
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)


def cleanup_temp_image(image_url, email):
    """
    Delete temporary uploaded image from S3

    Args:
        image_url: S3 URL of temporary image
        email: User email for logging
    """
    try:
        if image_url and image_url.startswith(f"https://{S3_BUCKET}.s3.amazonaws.com/"):
            s3_key = image_url.replace(f"https://{S3_BUCKET}.s3.amazonaws.com/", "")
            s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
            logger.info(f"Deleted temporary image: {s3_key}")
    except Exception as e:
        logger.error(f"Failed to delete temporary image for {email}: {str(e)}")


@celery_app.task(bind=True, time_limit=300, soft_time_limit=270)
def image2image(self, lora_url, prompt, image_url, email):
    """
    Generate image-to-image using FAL.ai with LoRA model

    Args:
        lora_url: URL to the trained LoRA model
        prompt: Text prompt for generation
        image_url: Input image URL (from S3)
        email: User email
    """

    try:
        # Update initial progress
        self.update_state(
            state="PROGRESS",
            meta={"status": "Starting image-to-image generation", "progress": 0},
        )

        logger.info(f"Starting image-to-image generation for {email}")
        logger.info(f"Prompt: {prompt}")
        logger.info(f"LoRA URL: {lora_url}")
        logger.info(f"Input image: {image_url}")

        # Update progress
        self.update_state(
            state="PROGRESS", meta={"status": "Calling FAL.ai API", "progress": 10}
        )

        # Call FAL.ai image-to-image API
        result = fal_client.subscribe(
            "fal-ai/flux-lora",  # Image-to-image endpoint
            arguments={
                "image_url": image_url,
                "prompt": prompt,
                "loras": [{"path": lora_url, "scale": 1.0}],
                "strength": 0.8,
                "num_inference_steps": 28,
                "guidance_scale": 3.5,
            },
            with_logs=True,
            on_queue_update=lambda update: logger.info(
                f"FAL.ai status: {update.status if hasattr(update, 'status') else 'Processing'}"
            ),
        )

        logger.info(f"FAL.ai generation completed for {email}")

        # Get generated image URL
        generated_image_url = result["images"][0]["url"]

        # Update progress
        self.update_state(
            state="PROGRESS", meta={"status": "Updating database", "progress": 90}
        )

        # Update user document with generated image info
        users_collection.update_one(
            {"email": email},
            {
                "$push": {
                    "posts": {
                        "post_url": generated_image_url,
                        "caption": prompt,
                        "created_at": datetime.now(timezone.utc),
                    }
                }
            },
        )

        # Cleanup temporary input image
        cleanup_temp_image(image_url, email)

        # Final success state
        self.update_state(
            state="SUCCESS",
            meta={"status": "Generation completed successfully", "progress": 100},
        )

        logger.info(f"Image-to-image generation completed successfully for {email}")

        return {
            "status": "success",
            "generated_image_url": generated_image_url,
        }

    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()

        logger.error(f"Image-to-image generation failed for {email}: {error_msg}")
        logger.error(f"Error traceback: {error_trace}")

        # Cleanup temporary input image on failure
        if "image_url" in locals():
            cleanup_temp_image(image_url, email)

        # Refund aura on failure
        try:
            users_collection.update_one({"email": email}, {"$inc": {"aura": 10}})
            logger.info(f"Refunded 10 aura to user {email} due to generation failure")
        except Exception as refund_error:
            logger.error(f"Failed to refund aura to user {email}: {str(refund_error)}")

        # Update task state
        self.update_state(
            state="FAILURE",
            meta={"status": "Generation failed", "error": error_msg, "progress": 0},
        )

        return {"status": "error", "error": error_msg}


@celery_app.task(bind=True, time_limit=300, soft_time_limit=270)
def text2image(self, lora_url, prompt, email):
    """
    Generate text-to-image using FAL.ai with LoRA model

    Args:
        lora_url: URL to the trained LoRA model
        prompt: Text prompt for generation
        email: User email
    """

    try:
        # Update initial progress
        self.update_state(
            state="PROGRESS",
            meta={"status": "Starting text-to-image generation", "progress": 0},
        )

        logger.info(f"Starting text-to-image generation for {email}")
        logger.info(f"Prompt: {prompt}")
        logger.info(f"LoRA URL: {lora_url}")

        # Update progress
        self.update_state(
            state="PROGRESS", meta={"status": "Calling FAL.ai API", "progress": 10}
        )

        # Call FAL.ai text-to-image API
        result = fal_client.subscribe(
            "fal-ai/flux-lora",  # Text-to-image endpoint
            arguments={
                "prompt": prompt,
                "loras": [{"path": lora_url, "scale": 1.0}],
                "num_inference_steps": 28,
                "guidance_scale": 3.5,
                "width": 1024,
                "height": 1024,
            },
            with_logs=True,
            on_queue_update=lambda update: logger.info(
                f"FAL.ai status: {update.status if hasattr(update, 'status') else 'Processing'}"
            ),
        )

        logger.info(f"FAL.ai generation completed for {email}")

        # Get generated image URL
        generated_image_url = result["images"][0]["url"]

        # Update progress
        self.update_state(
            state="PROGRESS", meta={"status": "Updating database", "progress": 90}
        )

        # Update user document with generated image info
        users_collection.update_one(
            {"email": email},
            {
                "$push": {
                    "posts": {
                        "post_url": generated_image_url,
                        "caption": prompt,
                        "created_at": datetime.now(timezone.utc),
                    }
                }
            },
        )

        # Final success state
        self.update_state(
            state="SUCCESS",
            meta={"status": "Generation completed successfully", "progress": 100},
        )

        logger.info(f"Text-to-image generation completed successfully for {email}")

        return {
            "status": "success",
            "generated_image_url": generated_image_url,
        }

    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()

        logger.error(f"Text-to-image generation failed for {email}: {error_msg}")
        logger.error(f"Error traceback: {error_trace}")

        # Refund aura on failure
        try:
            users_collection.update_one({"email": email}, {"$inc": {"aura": 10}})
            logger.info(f"Refunded 10 aura to user {email} due to generation failure")
        except Exception as refund_error:
            logger.error(f"Failed to refund aura to user {email}: {str(refund_error)}")

        # Update task state
        self.update_state(
            state="FAILURE",
            meta={"status": "Generation failed", "error": error_msg, "progress": 0},
        )

        return {"status": "error", "error": error_msg}
