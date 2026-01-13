import json
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


def safe_verify_signature(payload_body: bytes, received_signature: str) -> bool:
    """Safe signature verification with comprehensive error handling"""
    try:
        secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
        if not secret:
            print("⚠️ RAZORPAY_WEBHOOK_SECRET not found in environment")
            return False
            
        expected_signature = hmac.new(
            key=bytes(secret, 'utf-8'),
            msg=payload_body,
            digestmod=hashlib.sha256
        ).hexdigest()
        
        print(f"Expected signature: {expected_signature}")
        print(f"Received signature: {received_signature}")
        
        return hmac.compare_digest(expected_signature, received_signature)
    except Exception as e:
        print(f"❌ Error in signature verification: {e}")
        traceback.print_exc()
        return False

@router.post("/razorpay-webhook")
async def razorpay_webhook(request: Request):
    """
    Razorpay webhook handler with comprehensive debugging
    """
    print("🚀 Webhook handler started")
    
    try:
        # Step 1: Read request body
        print("📥 Reading request body...")
        try:
            body = await request.body()
            print(f"✅ Body read. Length: {len(body)} bytes")
            if len(body) == 0:
                print("❌ Empty body received")
                return {"error": "Empty request body"}
        except Exception as body_error:
            print(f"❌ Error reading body: {body_error}")
            traceback.print_exc()
            raise HTTPException(status_code=400, detail=f"Failed to read request body: {str(body_error)}")

        # Step 2: Get headers
        print("📋 Reading headers...")
        try:
            signature = request.headers.get('x-razorpay-signature')
            content_type = request.headers.get('content-type')
            print(f"Content-Type: {content_type}")
            print(f"Signature present: {bool(signature)}")
        except Exception as header_error:
            print(f"❌ Error reading headers: {header_error}")
            traceback.print_exc()

        # Step 3: Parse JSON
        print("🔍 Parsing JSON...")
        try:
            payload = json.loads(body.decode('utf-8'))
            event = payload.get("event", "unknown")
            print(f"✅ JSON parsed successfully")
            print(f"Event: {event}")
            print(f"Payload keys: {list(payload.keys())}")
        except json.JSONDecodeError as json_error:
            print(f"❌ JSON decode error: {json_error}")
            print(f"Raw body: {body}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(json_error)}")
        except Exception as parse_error:
            print(f"❌ Error parsing: {parse_error}")
            traceback.print_exc()
            raise HTTPException(status_code=400, detail=f"Parse error: {str(parse_error)}")

        # Step 4: Environment check
        print("🔐 Checking environment...")
        webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
        if webhook_secret:
            print(f"✅ Webhook secret found (length: {len(webhook_secret)})")
        else:
            print("⚠️ No webhook secret found - will skip signature verification")

        # Step 5: Signature verification (skip for testing)
        print("🔒 Signature verification...")
        if signature and webhook_secret and event != "test.event":
            try:
                is_valid = safe_verify_signature(body, signature)
                if not is_valid:
                    print("❌ Invalid signature")
                    raise HTTPException(status_code=400, detail="Invalid signature")
                print("✅ Signature verified")
            except Exception as sig_error:
                print(f"❌ Signature verification failed: {sig_error}")
                traceback.print_exc()
                raise HTTPException(status_code=400, detail=f"Signature verification error: {str(sig_error)}")
        else:
            print("⚠️ Skipping signature verification")

        # Step 6: Database connection test
        print("💾 Testing database connection...")
        try:
            # Simple database ping
            result = users_collection.find_one({}, {"_id": 1})
            print("✅ Database connection working")
        except Exception as db_error:
            print(f"❌ Database error: {db_error}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")

        # Step 7: Process events
        print(f"⚡ Processing event: {event}")
        
        if event == "payment.captured":
            return await handle_payment_captured(payload)
        elif event == "subscription.charged":
            return await handle_subscription_charged(payload)
        elif event == "subscription.cancelled":
            return await handle_subscription_cancelled(payload)
        elif event == "payment.failed":
            return await handle_payment_failed(payload)
        elif event == "test.event":
            print("🧪 Test event processed")
            return {"status": "test_ok", "message": "Test webhook processed successfully"}
        else:
            print(f"⚠️ Unhandled event: {event}")
            return {"status": "ignored", "event": event, "message": "Event not handled"}

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"💥 CRITICAL ERROR: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")

async def handle_payment_captured(payload):
    """Handle payment.captured event"""
    print("💳 Processing payment.captured...")
    
    try:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        email = payment_entity.get("email")
        amount = payment_entity.get("amount", 0) / 100  # Convert paise to rupees
        
        print(f"Payment details: email={email}, amount=₹{amount}")
        
        if not email:
            print("❌ No email found in payment")
            return {"status": "error", "message": "No email in payment"}
            
        # Check if it's the trial amount (₹86 = $1)
        if int(amount) == 86:
            print(f"🧪 Trial payment detected for {email}")
            
            # Find user
            user = users_collection.find_one({"email": email})
            if not user:
                print(f"❌ User not found: {email}")
                return {"status": "error", "message": "User not found"}
            
            # Check if trial already claimed
            if user.get("trial_claimed"):
                print(f"⚠️ Trial already claimed for {email}")
                return {"status": "already_claimed", "message": "Trial already claimed"}
            
            # Credit trial
            update_result = users_collection.update_one(
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
            
            print(f"✅ Trial credits updated. Modified: {update_result.modified_count}")
            return {"status": "trial_credited", "credits": 60, "email": email}
        else:
            print(f"💰 Non-trial payment: ₹{amount}")
            return {"status": "non_trial_payment", "amount": amount}
            
    except Exception as e:
        print(f"❌ Error in payment.captured: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

async def handle_subscription_charged(payload):
    """Handle subscription.charged event"""
    print("🔄 Processing subscription.charged...")
    
    try:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        subscription_entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})
        
        subscription_id = payment_entity.get("subscription_id")
        email = payment_entity.get("email")
        amount = payment_entity.get("amount", 0) / 100
        
        notes = subscription_entity.get("notes", {})
        billing_cycle = notes.get("billing_cycle", "monthly")
        plan_name = notes.get("plan_name", "Unknown")
        
        print(f"Subscription: {subscription_id}, email: {email}, amount: ₹{amount}")
        print(f"Billing: {billing_cycle}, Plan: {plan_name}")
        
        if not email or not subscription_id:
            return {"status": "error", "message": "Missing required fields"}
        
        # Credit map
        monthly_credits = {19: 300, 49: 800, 69: 1200}
        yearly_credits = {114: 3600, 294: 9600, 414: 14400}
        
        credits = yearly_credits.get(int(amount)) if billing_cycle == "yearly" else monthly_credits.get(int(amount))
        
        if not credits:
            print(f"⚠️ No credits found for amount: ₹{amount}")
            return {"status": "no_credits", "amount": amount}
        
        # Find user
        user = users_collection.find_one({"email": email})
        if not user:
            return {"status": "error", "message": "User not found"}
            
        # Check if cancelled
        if user.get("subscription_status") == "cancelled":
            return {"status": "cancelled_skipped"}
        
        # Credit logic with date checking
        now = datetime.utcnow()
        last_credited_str = user.get("last_credited")
        
        should_credit = True
        if last_credited_str:
            try:
                last_credited = datetime.fromisoformat(last_credited_str.replace('Z', '+00:00') if 'Z' in last_credited_str else last_credited_str)
                days_since = (now - last_credited).days
                threshold = 365 if billing_cycle == "yearly" else 30
                should_credit = days_since >= threshold
                print(f"Days since last credit: {days_since}, threshold: {threshold}")
            except:
                should_credit = True
        
        if should_credit:
            update_result = users_collection.update_one(
                {"email": email},
                {
                    "$inc": {"credits": credits},
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
            print(f"✅ Subscription credited: {credits} credits to {email}")
            return {"status": "credited", "credits": credits, "email": email}
        else:
            return {"status": "already_credited"}
            
    except Exception as e:
        print(f"❌ Error in subscription.charged: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

async def handle_subscription_cancelled(payload):
    """Handle subscription.cancelled event"""
    print("🚫 Processing subscription.cancelled...")
    
    try:
        subscription_entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})
        subscription_id = subscription_entity.get("id")
        
        # Find user by subscription ID
        user = users_collection.find_one({"active_subscription_id": subscription_id})
        if not user:
            return {"status": "user_not_found", "subscription_id": subscription_id}
        
        email = user.get("email")
        
        users_collection.update_one(
            {"email": email},
            {"$set": {"subscription_status": "cancelled"}}
        )
        
        print(f"✅ Subscription cancelled for {email}")
        return {"status": "cancelled", "email": email}
        
    except Exception as e:
        print(f"❌ Error in subscription.cancelled: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

async def handle_payment_failed(payload):
    """Handle payment.failed event"""
    print("❌ Processing payment.failed...")
    
    try:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        print(f"Payment failed: {payment_entity}")
        return {"status": "payment_failed_logged"}
        
    except Exception as e:
        print(f"❌ Error in payment.failed: {e}")
        return {"status": "error", "message": str(e)}

# Test endpoint
@router.get("/webhook-health")
async def webhook_health():
    """Health check endpoint"""
    try:
        # Test DB
        users_collection.find_one({}, {"_id": 1})
        
        return {
            "status": "healthy",
            "database": "connected",
            "webhook_secret": bool(os.getenv("RAZORPAY_WEBHOOK_SECRET")),
            "razorpay_key": bool(os.getenv("RAZORPAY_KEY_ID")),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }