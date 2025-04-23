from fastapi import APIRouter, HTTPException, Request
from dotenv import load_dotenv
import razorpay
import os
from pydantic import BaseModel
from typing import Union, Optional
import traceback
from bson.objectid import ObjectId
from db import users_collection 
from datetime import datetime, timedelta
import hmac, hashlib

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
    status: Optional[str] = "active"
    last_credited: Optional[str] = None

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
            "purchases": updated_purchases,
            "active_subscription_id": request.subscription_id,
            "subscription_status": request.status,
            "last_credited": request.last_credited or datetime.utcnow().isoformat()
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

def verify_signature(payload_body: bytes, received_signature: str) -> bool:
    secret = os.getenv("RAZORPAY_KEY_SECRET")  # Set this in your dashboard & .env
    expected_signature = hmac.new(
        key=bytes(secret, 'utf-8'),
        msg=payload_body,
        digestmod=hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_signature, received_signature)


@router.post("/razorpay-webhook")
async def razorpay_webhook(request: Request):
    try:
        # Get request body and signature from headers
        body = await request.body()
        signature = request.headers.get('x-razorpay-signature')

        # Verify the signature to ensure the request is from Razorpay
        if not signature or not verify_signature(body, signature):
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Parse the JSON payload from Razorpay
        payload = await request.json()
        event = payload.get("event")
        print("Webhook event received:", event)

        if event == "subscription.charged":
            payment_entity = payload["payload"]["payment"]["entity"]
            subscription_id = payment_entity["subscription_id"]
            email = payment_entity["email"]
            amount = payment_entity["amount"] / 100  # ₹

            # Determine plan credits based on the amount charged
            credit_map = {
                860: 250,
                2150: 700,
                4300: 1500
            }
            plan_credits = credit_map.get(amount, 0)

            user = users_collection.find_one({"email": email})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Don't credit if the user has canceled the subscription
            if user.get("subscription_status") == "cancelled":
                print("⚠️ Subscription was cancelled — skipping crediting.")
                return {"status": "cancelled_skipped"}

            # Check last credited date to avoid multiple credits in a short period
            last_credited_str = user.get("last_credited")
            now = datetime.utcnow()

            give_credits = False
            if not last_credited_str:
                give_credits = True
            else:
                last_credited = datetime.fromisoformat(last_credited_str)
                if now - last_credited >= timedelta(days=30):
                    give_credits = True

            if give_credits:
                # Update the user's credits and subscription status
                users_collection.update_one(
                    {"email": email},
                    {
                        "$inc": {"credits": plan_credits},
                        "$set": {
                            "last_credited": now.isoformat(),
                            "active_subscription_id": subscription_id,
                            "subscription_status": "active"
                        },
                        "$push": {
                            "purchases": {
                                "subscription_id": subscription_id,
                                "price": amount,
                                "date": now
                            }
                        }
                    }
                )
                print(f"✅ Credited {plan_credits} credits to {email}")
            else:
                print(f"🕒 User {email} already credited in the last 30 days.")

            # Handle referral reward if the user was referred by someone
            referred_by_code = user.get("referredBy")
            if referred_by_code:
                commission_inr = round(0.2 * amount, 2)
                usd_rate = 85
                commission_usd = round(commission_inr / usd_rate, 2)

                referrer = users_collection.find_one({"ref_code": referred_by_code})
                if referrer:
                    users_collection.update_one(
                        {"ref_code": referred_by_code},
                        {"$inc": {"balance": commission_usd}}
                    )
                    print(f"🎁 Referrer credited ${commission_usd} (₹{commission_inr})")

        elif event == "subscription.cancelled":
            # Subscription was canceled
            subscription_id = payload["payload"]["subscription"]["entity"]["id"]
            email = payload["payload"]["subscription"]["entity"]["email"]

            user = users_collection.find_one({"email": email})
            if user:
                # Update subscription status to 'cancelled'
                users_collection.update_one(
                    {"email": email},
                    {
                        "$set": {
                            "subscription_status": "cancelled",
                            "active_subscription_id": subscription_id
                        }
                    }
                )
                print(f"⚠️ Subscription for {email} has been cancelled.")
            else:
                print(f"⚠️ User with email {email} not found during cancellation event.")

        elif event == "payment.failed":
            # Handle failed payment event
            print("❌ Payment failed:", payload["payload"]["payment"]["entity"])

        return {"status": "ok"}

    except Exception as e:
        print("Webhook error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Webhook error")
