import hashlib
import hmac
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Header
from db import users_collection
import os

router = APIRouter()

# Ensure you have your webhook secret in your environment variables
LEMON_SQUEEZING_WEBHOOK_SECRET = os.getenv("LEMON_SQUEEZING_WEBHOOK_SECRET")

# --- Configuration ---

# Map your Lemon Squeezy plan variant IDs to the number of credits
PLANS = {
    883365: 80,   # starter
    883368: 200,  # pro
    883371: 500,  # premium
    883809: 80    # test plan
}

# Credits to grant for a free trial
FREE_TRIAL_CREDITS = 10

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
        return {"status": "error", "message": "User email not found in webhook payload."}

    user = users_collection.find_one({"email": email})
    if not user:
        # A user should be registered in your system before they can subscribe.
        return {"status": "error", "message": f"User with email {email} not found."}

    # --- Event Handling ---

    # Event: A new subscription is created (could be a trial or direct payment)
    if event == "subscription_created":
        is_trial = attributes.get("trial_ends_at") is not None
        
        if is_trial:
            # ---> Scenario: User starts a 1-day free trial.
            
            # Anti-abuse: Check if email or device has already used a trial
            if user.get("trial_used"):
                return {"status": "info", "message": "Trial already used for this email."}
            
            device_id = user.get("deviceId")
            if device_id:
                device_in_use = users_collection.find_one({"deviceId": device_id, "trial_used": True})
                if device_in_use:
                    return {"status": "error", "message": "Device has already been used for a free trial."}

            # Grant 10 free trial credits and set status to "trialing"
            users_collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "trial_used": True,
                        "subscription_status": "trialing",
                        "plan_variant_id": variant_id,
                        "subscription_id": data.get("id"),
                        "trial_granted_at": datetime.now(timezone.utc)
                    },
                    "$inc": {"credits": FREE_TRIAL_CREDITS}
                }
            )
            return {"status": "success", "message": f"Granted {FREE_TRIAL_CREDITS} free trial credits."}
            
        else:
            # ---> Scenario: User pays for a plan directly without a trial.
            credits_to_add = PLANS.get(variant_id)
            if not credits_to_add:
                return {"status": "error", "message": f"Invalid plan variant ID: {variant_id}"}
            
            users_collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "subscription_status": "active",
                        "plan_variant_id": variant_id,
                        "subscription_id": data.get("id"),
                        "subscription_started_at": datetime.now(timezone.utc)
                    },
                    "$inc": {"credits": credits_to_add}
                }
            )
            return {"status": "success", "message": f"Granted {credits_to_add} credits for new subscription."}

    # Event: A subscription is updated (e.g., trial converts to paid)
    elif event == "subscription_updated":
        # ---> Scenario: Trial ends and user is successfully charged.
        is_trialing_in_db = user.get("subscription_status") == "trialing"
        is_now_active = attributes.get("status") == "active"

        if is_trialing_in_db and is_now_active:
            credits_to_add = PLANS.get(variant_id)
            if not credits_to_add:
                return {"status": "error", "message": f"Invalid plan ID on trial conversion: {variant_id}"}
            
            users_collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "subscription_status": "active",
                        "subscription_started_at": datetime.now(timezone.utc)
                    },
                    "$inc": {"credits": credits_to_add}
                }
            )
            return {"status": "success", "message": f"Trial converted. Granted {credits_to_add} credits."}

    # Event: Subscription is cancelled by the user or admin
    elif event == "subscription_cancelled":
        # ---> Scenario: User cancels their subscription.
        users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription_status": "cancelled",
                    "subscription_cancelled_at": datetime.now(timezone.utc),
                },
                "$unset": {"plan_variant_id": ""}
            }
        )
        return {"status": "success", "message": "Subscription successfully cancelled."}

    # Event: Subscription expires (e.g., payment fails)
    elif event == "subscription_expired":
        users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription_status": "expired",
                    "subscription_expired_at": datetime.now(timezone.utc),
                },
                "$unset": {"plan_variant_id": ""}
            }
        )
        return {"status": "success", "message": "Subscription has expired."}

    return {"status": "info", "message": f"Webhook event '{event}' received but not handled."}