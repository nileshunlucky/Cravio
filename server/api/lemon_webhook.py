import hashlib
import hmac
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Header
from db import users_collection
import os
import boto3

router = APIRouter()

# Configure AWS S3
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "my-video-bucket")
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)


def delete_persona_assets_from_s3(personas):
    deleted_count = 0
    for persona in personas:
        # Delete model file
        model_url = persona.get("model")
        if model_url and model_url.startswith(f"https://{S3_BUCKET}.s3.amazonaws.com/"):
            s3_key = model_url.replace(f"https://{S3_BUCKET}.s3.amazonaws.com/", "")
            try:
                s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
                deleted_count += 1
                print(f"Deleted model from S3: {s3_key}")
            except Exception as e:
                print(f"Failed to delete model from S3: {s3_key}, Error: {str(e)}")

        # Delete training image file (image_url)
        image_url = persona.get("image_url")
        if image_url and image_url.startswith(f"https://{S3_BUCKET}.s3.amazonaws.com/"):
            s3_key = image_url.replace(f"https://{S3_BUCKET}.s3.amazonaws.com/", "")
            try:
                s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
                deleted_count += 1
                print(f"Deleted training image from S3: {s3_key}")
            except Exception as e:
                print(f"Failed to delete image from S3: {s3_key}, Error: {str(e)}")

    return deleted_count

# Ensure you have your webhook secret in your environment variables
LEMON_SQUEEZING_WEBHOOK_SECRET = os.getenv("LEMON_SQUEEZING_WEBHOOK_SECRET")

# --- Configuration ---

# Map your Lemon Squeezy plan variant IDs to the number of aura
PLANS = {
    908443: 1000,  # Classic /m
    908458: 2400,  # Premium /m
    908445: 5000,  # Platinum /m
    908463: 12000,  # Classic /y
    908475: 28800,  # Premium /y
    908476: 60000,  # Platinum /y
}

# --- Helper Functions ---


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify the webhook signature from Lemon Squeezy."""
    if not signature:
        return False

    secret = LEMON_SQUEEZING_WEBHOOK_SECRET.encode()
    computed_hash = hmac.new(secret, payload, hashlib.sha256).hexdigest()

    return hmac.compare_digest(computed_hash, signature)


# --- Webhook Endpoint ---


@router.post("/api/lemon-webhook")
async def lemon_webhook(request: Request, x_signature: str = Header(None)):
    """
    Handles webhooks from Lemon Squeezy for subscription management.
    """
    body = await request.body()

    # 1. Verify the request signature
    if not verify_signature(body, x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(body)
    event = payload.get("meta", {}).get("event_name")
    data = payload.get("data", {})
    attributes = data.get("attributes", {})

    email = attributes.get("user_email")
    variant_id = attributes.get("variant_id")

    if not email:
        return {
            "status": "error",
            "message": "User email not found in webhook payload.",
        }

    user = users_collection.find_one({"email": email})
    if not user:
        # A user should be registered in your system before they can subscribe.
        return {"status": "error", "message": f"User with email {email} not found."}

    # --- Event Handling ---

    # Event: A new subscription is created
    if event == "subscription_created":
        aura_to_add = PLANS.get(variant_id)
        if not aura_to_add:
            return {
                "status": "error",
                "message": f"Invalid plan variant ID: {variant_id}",
            }

        users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription_status": "active",
                    "plan_variant_id": variant_id,
                    "subscription_id": data.get("id"),
                    "subscription_started_at": datetime.now(timezone.utc),
                },
                "$set": {"aura": aura_to_add},
                "$set": {"user_paid": True},
            },
        )
        return {
            "status": "success",
            "message": f"Granted {aura_to_add} aura for new subscription.",
        }

    # Event: A subscription is updated
    elif event == "subscription_updated":
        return {"status": "info", "message": "Subscription updated."}

    # Event: Subscription is cancelled by the user or admin
    elif event == "subscription_cancelled":
        personas = user.get("personas", [])
        delete_persona_assets_from_s3(personas)

        users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription_status": "cancelled",
                    "subscription_cancelled_at": datetime.now(timezone.utc),
                    "aura": "",
                    "personas": [],
                    "user_paid": False,
                },
                "$unset": {"plan_variant_id": ""},
            },
        )

        return {"status": "success", "message": "Subscription successfully cancelled."}

    # Event: Subscription expires (e.g., payment fails)
    elif event == "subscription_expired":
        personas = user.get("personas", [])
        delete_persona_assets_from_s3(personas)

        users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription_status": "expired",
                    "subscription_expired_at": datetime.now(timezone.utc),
                    "aura": "",
                    "personas": [],
                    "user_paid": False,
                },
                "$unset": {"plan_variant_id": ""},
            },
        )
        return {"status": "success", "message": "Subscription has expired."}

    return {
        "status": "info",
        "message": f"Webhook event '{event}' received but not handled.",
    }
