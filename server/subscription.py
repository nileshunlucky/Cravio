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


def verify_signature(payload_body: bytes, received_signature: str) -> bool:
    secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")  # Set this in your dashboard & .env
    expected_signature = hmac.new(
        key=bytes(secret, 'utf-8'),
        msg=payload_body,
        digestmod=hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_signature, received_signature)


# SubscriptionX Request Models
class SubscriptionRequest(BaseModel):
    plan_id: str

class MonthlySubscriptionRequest(BaseModel):
    plan_id: str


class YearlySubscriptionRequest(BaseModel):
    plan_id: str


# Create Monthly Subscription Route
@router.post("/create-monthly-subscription")
async def create_monthly_subscription(request: MonthlySubscriptionRequest):
    try:
        print(f"Creating monthly subscription with plan ID: {request.plan_id}")
        subscription = razorpay_client.subscription.create({
            "plan_id": request.plan_id,
            "total_count": 12, 
        })
        return subscription
    except Exception as e:
        print("Error creating monthly subscription:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Create Yearly Subscription Route
@router.post("/create-yearly-subscription")
async def create_yearly_subscription(request: YearlySubscriptionRequest):
    try:
        print(f"Creating yearly subscription with plan ID: {request.plan_id}")
        subscription = razorpay_client.subscription.create({
            "plan_id": request.plan_id,
            "total_count": 1,
        })
        return subscription
    except Exception as e:
        print("Error creating yearly subscription:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Update Credits Request Model
class UpdateCreditsRequest(BaseModel): 
    user_email: str
    credits: int
    subscription_id: str
    price: Union[int, float] 
    billing_cycle: Optional[str] = "monthly"  # New field
    plan_name: Optional[str] = None  # New field
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
            "billing_cycle": request.billing_cycle,
            "plan_name": request.plan_name,
            "date": datetime.utcnow()
        })

        update_fields = {
            "credits": new_credits,
            "purchases": updated_purchases,
            "active_subscription_id": request.subscription_id,
            "subscription_status": request.status,
            "billing_cycle": request.billing_cycle,  # Track billing cycle
            "plan_name": request.plan_name,  # Track plan name
            "last_credited": request.last_credited or datetime.utcnow().isoformat()
        }

        # 3. Reward referrer (20% of price)
        referred_by_code = user.get("referredBy")
        if referred_by_code:
            commission = round(0.2 * request.price, 2)

            referrer = users_collection.find_one({"ref_code": referred_by_code})
            if referrer:
                today = datetime.now().strftime("%Y-%m-%d")  # '2025-04-26'
                users_collection.update_one(
                {"ref_code": referred_by_code},
                {
                    "$inc": {
                        "balance": commission,
                        f"dailyRevenue.{today}": commission
                    }
                }
            )

        # 4. Final user update
        users_collection.update_one(
            {"email": request.user_email},
            {"$set": update_fields}
        )

        return {
            "success": True,
            "message": f"Credits updated for {request.billing_cycle} subscription and referral processed.",
            "credits": new_credits,
            "billing_cycle": request.billing_cycle,
            "plan_name": request.plan_name
        }

    except Exception as e:
        print("Error updating credits:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

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
        import json
        payload = json.loads(body.decode('utf-8'))  # Parse from raw body instead of request.json()
        event = payload.get("event")
        print("Webhook event received:", event)
        print("Full payload:", json.dumps(payload, indent=2))  # Debug log

        if event == "subscription.charged":
            try:
                # Safe access to nested data with error handling
                payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
                subscription_entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})
                
                subscription_id = payment_entity.get("subscription_id")
                email = payment_entity.get("email")
                amount = payment_entity.get("amount", 0) / 100  # Convert paise to rupees

                # Validate required fields
                if not subscription_id or not email or not amount:
                    print(f"Missing required fields: subscription_id={subscription_id}, email={email}, amount={amount}")
                    return {"status": "missing_required_fields"}

                # Get subscription details to determine billing cycle
                notes = subscription_entity.get("notes", {})
                billing_cycle = notes.get("billing_cycle", "monthly")
                plan_name = notes.get("plan_name", "Unknown")

                print(f"Processing subscription: {subscription_id}, email: {email}, amount: {amount}")
                print(f"Billing cycle: {billing_cycle}, Plan name: {plan_name}")

                # Updated credit map for both monthly and yearly plans
                monthly_credit_map = {
                    19: 300,    # Basic monthly
                    49: 800,    # Pro monthly  
                    69: 1200    # Premium monthly
                }
                
                yearly_credit_map = {
                    114: 3600,   # Basic yearly (9.5 * 12)
                    294: 9600,   # Pro yearly (24.5 * 12)
                    414: 14400   # Premium yearly (34.5 * 12)
                }

                # Determine credits based on billing cycle and amount
                if billing_cycle == "yearly":
                    plan_credits = yearly_credit_map.get(int(amount), 0)
                else:
                    plan_credits = monthly_credit_map.get(int(amount), 0)

                print(f"Credits to be added: {plan_credits}")

                if plan_credits == 0:
                    print(f"Warning: No credits found for amount {amount} and billing cycle {billing_cycle}")
                    return {"status": "no_credits_found", "amount": amount, "billing_cycle": billing_cycle}

                # Find user by email
                user = users_collection.find_one({"email": email})
                if not user:
                    print(f"User not found with email: {email}")
                    raise HTTPException(status_code=404, detail="User not found")

                # Don't credit if the user has canceled the subscription
                if user.get("subscription_status") == "cancelled":
                    print("⚠️ Subscription was cancelled — skipping crediting.")
                    return {"status": "cancelled_skipped"}

                # Check last credited date based on billing cycle
                last_credited_str = user.get("last_credited")
                now = datetime.utcnow()

                give_credits = False
                if not last_credited_str:
                    give_credits = True
                    print("No previous credit record found - will give credits")
                else:
                    try:
                        # Handle both ISO format and other formats
                        if 'T' in last_credited_str:
                            last_credited = datetime.fromisoformat(last_credited_str.replace('Z', '+00:00'))
                        else:
                            last_credited = datetime.fromisoformat(last_credited_str)
                        
                        # For yearly: check if 365 days passed, for monthly: 30 days
                        days_threshold = 365 if billing_cycle == "yearly" else 30
                        days_since_last = (now - last_credited).days
                        print(f"Days since last credit: {days_since_last}, threshold: {days_threshold}")
                        
                        if days_since_last >= days_threshold:
                            give_credits = True
                        else:
                            print(f"User was credited {days_since_last} days ago, threshold is {days_threshold} days")
                    except ValueError as ve:
                        print(f"Error parsing last_credited date: {ve}")
                        give_credits = True  # Give credits if we can't parse the date

                if give_credits:
                    # Update the user's credits and subscription status
                    update_result = users_collection.update_one(
                        {"email": email},
                        {
                            "$inc": {"credits": plan_credits},
                            "$set": {
                                "last_credited": now.isoformat(),
                                "active_subscription_id": subscription_id,
                                "subscription_status": "active",
                                "billing_cycle": billing_cycle,
                                "plan_name": plan_name
                            },
                            "$push": {
                                "purchases": {
                                    "subscription_id": subscription_id,
                                    "price": amount,
                                    "billing_cycle": billing_cycle,
                                    "plan_name": plan_name,
                                    "date": now
                                }
                            }
                        }
                    )
                    print(f"✅ Update result: {update_result.modified_count} documents modified")
                    print(f"✅ Credited {plan_credits} credits to {email} for {billing_cycle} plan")

                    # Handle referral reward if the user was referred by someone
                    referred_by_code = user.get("referredBy")
                    if referred_by_code:
                        try:
                            commission_inr = round(0.2 * amount, 2)
                            usd_rate = 85
                            commission_usd = round(commission_inr / usd_rate, 2)

                            referrer = users_collection.find_one({"ref_code": referred_by_code})
                            if referrer:
                                today = datetime.now().strftime("%Y-%m-%d")
                                referrer_update = users_collection.update_one(
                                    {"ref_code": referred_by_code},
                                    {
                                        "$inc": {
                                            "balance": commission_usd,
                                            f"dailyRevenue.{today}": commission_usd
                                        }
                                    }
                                )
                                print(f"🎁 Referrer update result: {referrer_update.modified_count} documents modified")
                                print(f"🎁 Referrer credited ${commission_usd} (₹{commission_inr}) for {billing_cycle} plan")
                            else:
                                print(f"Referrer not found for code: {referred_by_code}")
                        except Exception as ref_error:
                            print(f"Error processing referral: {ref_error}")
                            # Don't fail the entire webhook for referral errors
                else:
                    threshold_days = 365 if billing_cycle == "yearly" else 30
                    print(f"🕒 User {email} already credited in the last {threshold_days} days.")

            except Exception as sub_error:
                print(f"Error processing subscription.charged: {sub_error}")
                traceback.print_exc()
                raise
        
        elif event == "payment.captured":
            try:
                payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
                email = payment_entity.get("email")
                amount = payment_entity.get("amount", 0) / 100  # INR

                print(f"Payment captured: email={email}, amount={amount}")

                # Check if it's the trial amount (₹86 = $1)
                if int(amount) == 86:
                    print(f"🧪 Trial payment detected for {email} - Crediting 60 credits")

                    user = users_collection.find_one({"email": email})
                    if not user:
                        print(f"User not found for trial payment: {email}")
                        raise HTTPException(status_code=404, detail="User not found")

                    trial_update = users_collection.update_one(
                        {"email": email},
                        {
                            "$inc": {"credits": 60},
                            "$set": {
                                "trial_claimed": True,
                                "trial_claimed_at": datetime.utcnow().isoformat(),
                            },
                            "$push": {
                                "purchases": {
                                    "price": amount,
                                    "credits": 60,
                                    "type": "trial",
                                    "date": datetime.utcnow()
                                }
                            }
                        }
                    )
                    print(f"✅ Trial update result: {trial_update.modified_count} documents modified")
                    print(f"✅ 60 trial credits added to {email}")
            except Exception as payment_error:
                print(f"Error processing payment.captured: {payment_error}")
                traceback.print_exc()
                raise

        elif event == "subscription.cancelled":
            try:
                subscription_entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})
                subscription_id = subscription_entity.get("id")
                
                # Try to get email from subscription entity or find user by subscription_id
                email = subscription_entity.get("email")
                
                if not email:
                    # If email is not in subscription entity, find user by subscription_id
                    user = users_collection.find_one({"active_subscription_id": subscription_id})
                    if user:
                        email = user.get("email")

                print(f"Subscription cancelled: id={subscription_id}, email={email}")

                if email:
                    cancel_update = users_collection.update_one(
                        {"email": email},
                        {
                            "$set": {
                                "subscription_status": "cancelled",
                                "active_subscription_id": subscription_id
                            }
                        }
                    )
                    print(f"⚠️ Cancel update result: {cancel_update.modified_count} documents modified")
                    print(f"⚠️ Subscription for {email} has been cancelled.")
                else:
                    print(f"⚠️ Could not find user for cancelled subscription: {subscription_id}")
            except Exception as cancel_error:
                print(f"Error processing subscription.cancelled: {cancel_error}")
                traceback.print_exc()
                raise

        elif event == "payment.failed":
            try:
                payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
                print("❌ Payment failed:", payment_entity)
            except Exception as failed_error:
                print(f"Error processing payment.failed: {failed_error}")

        return {"status": "ok", "event": event}

    except json.JSONDecodeError as je:
        print(f"JSON decode error: {je}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        print("Webhook error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Webhook error: {str(e)}")