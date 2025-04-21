from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
import razorpay
import os
from pydantic import BaseModel
from typing import Union
import traceback
from bson.objectid import ObjectId
from db import users_collection 
from datetime import datetime

load_dotenv()

router = APIRouter()

# Subscription Request Model
class SubscriptionRequest(BaseModel):
    plan_id: str


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


# Update Credits Request Model
class UpdateCreditsRequest(BaseModel):
    user_email: str
    credits: int
    subscription_id: str
    price: Union[int, float] 

@router.post("/update-credits")
async def update_credits(request: UpdateCreditsRequest):
    try:
        # Find the user by email
        user = users_collection.find_one({"email": request.user_email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 1. Update user's credits
        new_credits = user.get("credits", 0) + request.credits

        # 2. Add the subscription ID to user's purchases
        updated_purchases = user.get("purchases", [])
        updated_purchases.append({
            "subscription_id": request.subscription_id,
            "price": request.price,
            "date": datetime.utcnow()
        })

        update_fields = {
            "credits": new_credits,
            "purchases": updated_purchases
        }

        # 3. Reward referrer (20% of price)
        referred_by_code = user.get("referredBy")
        if referred_by_code:
            commission = round(0.2 * request.price, 2)

            referrer = users_collection.find_one({"ref_code": referred_by_code})
            if referrer:
                ref_balance = referrer.get("balance", 0) + commission
                users_collection.update_one(
                    {"ref_code": referred_by_code},
                    {"$set": {"balance": ref_balance}}
                )

        # 4. Final user update
        users_collection.update_one(
            {"email": request.user_email},
            {"$set": update_fields}
        )

        return {
            "success": True,
            "message": "Credits updated and referral processed.",
            "credits": new_credits
        }

    except Exception as e:
        print("Error updating credits:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
