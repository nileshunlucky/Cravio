import hashlib
import hmac
import json
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Header
from db import users_collection
import os

router = APIRouter()

LEMON_SQUEEZING_WEBHOOK_SECRET = os.getenv("LEMON_SQUEEZING_WEBHOOK_SECRET")

# Plan configs
PLANS = {
    883365: 80,   # starter
    883368: 200,  # pro  
    883371: 500,  # premium
    883809: 80    # test
}

# Free trial credits
FREE_TRIAL_CREDITS = 10

def verify_signature(payload: bytes, signature: str) -> bool:
    expected = hmac.new(
        LEMON_SQUEEZING_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    if signature.startswith('sha256='):
        signature = signature[7:]
    
    return hmac.compare_digest(expected, signature)

async def grant_free_credits(email: str, device_id: str = None):
    """Grant free trial credits to user if they haven't used trial yet"""
    # Find user by email and optionally device_id
    user = await users_collection.find_one({"email": email})
    if not user:
     return {"status": "error", "message": "User not found"}

    if device_id:
        duplicate_device = await users_collection.find_one({
            "deviceId": device_id,
            "email": {"$ne": email}
        })
        if duplicate_device:
            return {"status": "error", "message": "Device already used for trial"}
    
    # Check if trial already used
    if user.get("trial_used", False):
        return {"status": "error", "message": "Trial already used"}
    
    # Grant free trial credits
    await users_collection.update_one(
        {"email": email},
        {
            "$inc": {"credits": FREE_TRIAL_CREDITS},
            "$set": {
                "trial_used": True,
                "trial_granted_at": datetime.utcnow(),
            }
        }
    )
    
    return {"status": "success", "message": f"Granted {FREE_TRIAL_CREDITS} free trial credits"}

@router.post("/api/lemon-webhook")
async def lemon_webhook(request: Request, x_signature: str = Header(None)):
    body = await request.body()
    
    # Verify signature
    if not verify_signature(body, x_signature or ""):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload = json.loads(body)
    event = payload.get("meta", {}).get("event_name")
    data = payload.get("data", {})
    attributes = data.get("attributes", {})
    
    email = attributes.get("user_email")
    variant_id = attributes.get("variant_id")
    
    if not email:
        return {"status": "error", "message": "No email"}
    
    # Handle subscription events
    if event == "subscription_created":
        user = await users_collection.find_one({"email": email})
        device_id = user.get("deviceId") if user else None
        
        if not user:
            # If user doesn't exist, try to grant free credits first
            free_credits_result = await grant_free_credits(email, device_id)
            if free_credits_result["status"] == "error":
                return free_credits_result
            
            # Try to find user again after granting credits
            user = await users_collection.find_one({"email": email})
            if not user:
                return {"status": "error", "message": "User not found after granting credits"}
        
        # Check if user already has a paid subscription
        if user.get("subscription_status") == "active":
            return {"status": "error", "message": "User already has active subscription"}
        
        # Grant free trial credits if not already used
        if not user.get("trial_used", False):
            await grant_free_credits(email, device_id)
        
        # Add plan credits
        if variant_id in PLANS:
            credits_to_add = PLANS[variant_id]
            
            # Update user with subscription and credits
            await users_collection.update_one(
                {"email": email},
                {
                    "$inc": {"credits": credits_to_add},
                    "$set": {
                        "subscription_status": "active",
                        "plan_variant_id": variant_id,
                        "subscription_started_at": datetime.utcnow(),
                    }
                }
            )
            
            return {"status": "success", "message": f"Added {credits_to_add} credits"}
    
    elif event == "subscription_cancelled":
        user = await users_collection.find_one({"email": email})
        
        if not user:
            return {"status": "error", "message": "User not found"}
        
        # Update subscription status to cancelled
        await users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription_status": "cancelled",
                    "subscription_cancelled_at": datetime.utcnow(),
                },
                "$unset": {
                    "plan_variant_id": "",  # Remove plan variant
                }
            }
        )
        
        return {"status": "success", "message": "Subscription cancelled"}
    
    elif event == "subscription_expired":
        user = await users_collection.find_one({"email": email})
        
        if not user:
            return {"status": "error", "message": "User not found"}
        
        # Update subscription status to expired
        await users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "subscription_status": "expired",
                    "subscription_expired_at": datetime.utcnow(),
                },
                "$unset": {
                    "plan_variant_id": "",  # Remove plan variant
                }
            }
        )
        
        return {"status": "success", "message": "Subscription expired"}
    
    elif event == "user_registered":
        # Handle new user registration - grant free trial credits
        if email:
            free_credits_result = await grant_free_credits(email, device_id)
            return free_credits_result
    
    return {"status": "success"}