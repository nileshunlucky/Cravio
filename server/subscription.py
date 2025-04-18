from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
import razorpay
import os
from pydantic import BaseModel
import traceback
from bson.objectid import ObjectId
from db import users_collection 

load_dotenv()

router = APIRouter()

# Subscription Request Model
class SubscriptionRequest(BaseModel):
    plan_id: str

# Update Credits Request Model
class UpdateCreditsRequest(BaseModel):
    user_email: str
    credits: int

# Razorpay client initialization
razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
)


# Create Subscription Route
@router.post("/create-subscription")
async def create_subscription(request: SubscriptionRequest):
    try:
        print("Creating subscription with plan ID:", request.plan_id)
        subscription = razorpay_client.subscription.create({
            "plan_id": request.plan_id,
            "total_count": 12,  # Example: 12 months subscription
        })
        return subscription
    except Exception as e:
        print("Error creating subscription:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Update Credits Route
@router.post("/update-credits")
async def update_credits(request: UpdateCreditsRequest):
    try:
        # Find the user by email
        user = users_collection.find_one({"email": request.user_email})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update the user's credits
        new_credits = user.get("credits", 0) + request.credits
        users_collection.update_one({"email": request.user_email}, {"$set": {"credits": new_credits}})
        
        return {"success": True, "message": "Credits updated successfully", "credits": new_credits}
    
    except Exception as e:
        print("Error updating credits:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

