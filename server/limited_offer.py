from fastapi import HTTPException, APIRouter
from pydantic import BaseModel
import razorpay
from db import users_collection
import os
import logging
import sys
import traceback
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger("limited-offer-api")

# Load environment variables
load_dotenv()
logger.info("Environment variables loaded")

# Initialize FastAPI router
router = APIRouter()
logger.info("Router initialized")

# Log Razorpay configuration
logger.info(f"Razorpay Key ID exists: {bool(os.getenv('RAZORPAY_KEY_ID'))}")
logger.info(f"Razorpay Key Secret exists: {bool(os.getenv('RAZORPAY_KEY_SECRET'))}")

# Razorpay client
try:
    razorpay_client = razorpay.Client(
        auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
    )
    logger.info("Razorpay client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Razorpay client: {str(e)}")
    logger.error(traceback.format_exc())

# Price settings
OFFER_PRICE = 860  # INR
CREDIT_AMOUNT = 100  # 100 credits
logger.info(f"Offer price set to {OFFER_PRICE} INR for {CREDIT_AMOUNT} credits")

# Request models
class OrderRequest(BaseModel):
    email: str

class PaymentVerificationRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    email: str

@router.post("/create-order")
async def create_order(request: OrderRequest):
    """Create a new Razorpay order"""
    logger.info(f"Creating order for email: {request.email}")
    try:
        # Check if user exists
        user = users_collection.find_one({"email": request.email})
        if not user:
            logger.info(f"User {request.email} not found. Creating new user.")
            # Create user if doesn't exist
            users_collection.insert_one({
                "email": request.email,
                "credits": 0
            })
        else:
            logger.info(f"User {request.email} found in database")
        
        # Create order in Razorpay (amount in paise for INR)
        order_amount = int(OFFER_PRICE * 100)  # Convert to paise
        order_currency = "INR"
        logger.info(f"Creating Razorpay order for {order_amount} paise ({OFFER_PRICE} INR)")
        
        # Create Razorpay order
        order_data = {
            "amount": order_amount,
            "currency": order_currency,
            "receipt": f"receipt_for_{request.email}",
            "notes": {
                "email": request.email,
                "credits": CREDIT_AMOUNT
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        logger.info(f"Razorpay order created successfully: {order['id']}")
        
        # Return order details to frontend
        return {
            "order_id": order["id"],
            "amount": OFFER_PRICE,
            "currency": order_currency,
            "key_id": os.getenv("RAZORPAY_KEY_ID")
        }
    
    except Exception as e:
        error_msg = f"Error creating order: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/verify-payment")
async def verify_payment(request: PaymentVerificationRequest):
    """Verify Razorpay payment and credit user account"""
    logger.info(f"Verifying payment for order: {request.razorpay_order_id}, payment: {request.razorpay_payment_id}")
    try:
        # Create signature verification data
        params_dict = {
            "razorpay_payment_id": request.razorpay_payment_id,
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_signature": request.razorpay_signature
        }
        
        # Verify signature
        logger.info("Verifying Razorpay signature")
        razorpay_client.utility.verify_payment_signature(params_dict)
        logger.info("Signature verification successful")
        
        # Get payment details
        logger.info(f"Fetching payment details for payment ID: {request.razorpay_payment_id}")
        payment = razorpay_client.payment.fetch(request.razorpay_payment_id)
        logger.info(f"Payment status: {payment['status']}")
        
        # Check payment status
        if payment["status"] == "captured":
            logger.info("Payment successfully captured")
            
            # Check if user exists
            user = users_collection.find_one({"email": request.email})
            if not user:
                error_msg = f"User not found with email: {request.email}"
                logger.error(error_msg)
                raise HTTPException(status_code=404, detail=error_msg)
            
            logger.info(f"Updating credits for user: {request.email}")
            # Update user credits in database
            result = users_collection.update_one(
                {"email": request.email},
                {"$inc": {"credits": CREDIT_AMOUNT}}
            )
            
            logger.info(f"Credits updated. Modified count: {result.modified_count}")
            
            # Return success response
            return {"success": True, "credits": CREDIT_AMOUNT}
        else:
            error_msg = f"Payment not captured. Status: {payment['status']}"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
    
    except razorpay.errors.SignatureVerificationError as e:
        error_msg = f"Invalid payment signature: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=error_msg)
    
    except Exception as e:
        error_msg = f"Error verifying payment: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)