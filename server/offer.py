from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
import razorpay
from datetime import datetime
import os
import hmac
import hashlib

# Import your existing database connection
from db import users_collection

# Initialize router
router = APIRouter(tags=["payments"])

# Razorpay client initialization
razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
)

# Models
class OfferRequest(BaseModel):
    email: EmailStr

class PaymentVerification(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    email: EmailStr

# Routes
@router.post("/create-order")
async def create_order(request: OfferRequest):
    """Create a Razorpay order for the ₹86 limited time offer that adds 100 credits"""
    try:
        # Check if user exists
        user = users_collection.find_one({"email": request.email})
        
        # Create a new Razorpay order
        amount_in_rupees = 86
        amount_in_paise = amount_in_rupees * 100  # Razorpay expects amount in paise
        
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"receipt_{request.email}_{datetime.now().timestamp()}",
            "notes": {
                "email": request.email,
                "offer": "limited-time-offer",
                "credits": 100
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        # Return order details to frontend
        return {
            "order_id": order["id"],
            "amount": amount_in_rupees,
            "currency": "INR",
            "key_id": os.getenv("RAZORPAY_KEY_ID")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-payment")
async def verify_payment(payment: PaymentVerification):
    """Verify the payment and add credits to user account if successful"""
    try:
        # Verify the payment signature
        params_dict = {
            "razorpay_payment_id": payment.razorpay_payment_id,
            "razorpay_order_id": payment.razorpay_order_id,
        }
        
        # Verify the signature
        razorpay_client.utility.verify_payment_signature(
            params_dict | {"razorpay_signature": payment.razorpay_signature}
        )
        
        # Get payment details to ensure it's completed
        payment_details = razorpay_client.payment.fetch(payment.razorpay_payment_id)
        
        if payment_details["status"] != "captured":
            raise HTTPException(
                status_code=400,
                detail="Payment not completed"
            )
        
        # Update user's credits and mark offer as claimed
        result = users_collection.update_one(
            {"email": payment.email},
            {
                "$inc": {"credits": 100},
                "$set": {
                    "claimed_limited_offer": True,
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=400,
                detail="Failed to update user credits"
            )
        
        return {
            "success": True,
            "message": "Payment verified and 100 credits added to your account",
        }
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(
            status_code=400,
            detail="Invalid payment signature"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))