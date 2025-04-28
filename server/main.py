from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from db import users_collection
from api.reddit_story import router as reddit_router
from api.split_screen import router as sp_router
from subscription import router as subscription_router
from delete_videos import router as delete_router
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
import pytz
import os
from typing import Optional

app = FastAPI()

# Allow CORS for your frontend (update this with your Next.js domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://cravioai.vercel.app"],  # or "https://your-frontend.vercel.app"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# add routers
app.include_router(reddit_router)
app.include_router(sp_router)
app.include_router(subscription_router)
app.include_router(delete_router)

# Get user by email
@app.get("/user/{email}")
def get_user(email: str):
    user = users_collection.find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
        return user
    raise HTTPException(status_code=404, detail="User not found")

class UserReferral(BaseModel):
    email: EmailStr
    referredBy: Optional[str] = None   

@app.post("/add-user")
def save_referral(data: UserReferral = Body(...)):  # Expect referral data in the body
    # 1. Check if the user already exists
    existing = users_collection.find_one({"email": data.email})
    if existing:
        return {"message": "User already exists"}

    user_data = {"email": data.email}

    # 2. Validate referredBy if provided
    if data.referredBy:
        # Check if referredBy is a valid ref_code in another user
        ref_user = users_collection.find_one({"ref_code": data.referredBy})
        if not ref_user:
            return {"message": "Invalid referral code"}

        user_data["referredBy"] = data.referredBy

    # 3. Insert the user
    users_collection.insert_one(user_data)
    return {"message": "User added successfully"}

class RefCodeRequest(BaseModel):
    ref_code: str

@app.post("/affiliate/custom-code")
async def set_custom_ref_code(request: Request, body: RefCodeRequest):
    # Get email from headers or token (adjust as per your auth method)
    email = request.headers.get("X-User-Email")
    if not email:
        raise HTTPException(status_code=400, detail="User email header missing")

    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user already has a ref_code
    if "ref_code" in user and user["ref_code"]:
        return {"success": False, "message": "Referral code already set and cannot be changed."}

    # Check if code is already taken
    existing = users_collection.find_one({"ref_code": body.ref_code})
    if existing:
        return {"success": False, "message": "Referral code already taken. Try a different one."}

    # Update user's ref_code
    users_collection.update_one({"email": email}, {"$set": {"ref_code": body.ref_code}})
    return {"success": True, "message": "Referral code set successfully."}

class ReferralRequest(BaseModel):
    email: EmailStr
    refferedBy: str

@app.post("/save-referral")
async def save_referral(data: ReferralRequest):
    try:
        # Check if user already exists
        existing = users_collection.find_one({"email": data.email})
        if existing:
            return {"success": False, "message": "User already exists"}

        # If referrer is provided, check validity
        user_data = {"email": data.email}
        if data.refferedBy:
            ref_user = users_collection.find_one({"ref_code": data.refferedBy})
            if not ref_user:
                return {"success": False, "message": "Invalid referrer code"}
            user_data["referredBy"] = data.refferedBy

        # Insert the new user
        users_collection.insert_one(user_data)
        return {"success": True, "message": "User with referral saved"}

    except Exception as e:
        print("Error saving referral:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

class PayPalEmailRequest(BaseModel):
    paypal_email: EmailStr

@app.post("/affiliate/add-paypal")
async def add_paypal(request: Request, body: PayPalEmailRequest):
    email = request.headers.get("X-User-Email")
    if not email:
        raise HTTPException(status_code=400, detail="User email header missing")

    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    users_collection.update_one({"email": email}, {"$set": {"paypal_email": body.paypal_email}})
    return {"success": True, "message": "PayPal email added successfully."}

# Function to send an email
def send_email(subject, body, receiver_email="cravio.ai@gmail.com"):
    try:
        sender_email = "nileshinde001@gmail.com"  # Use your email here
        password = os.getenv("GMAIL_PASSWORD")  # Use App Password if 2FA is enabled on your Gmail

        # Prepare the email content
        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = receiver_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Send the email using SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, msg.as_string())

        print("Email sent successfully")

    except Exception as e:
        print("Error sending email:", e)

# Endpoint for withdrawal
@app.post("/affiliate/withdraw")
async def withdraw_balance(request: Request):
    email = request.headers.get("X-User-Email")
    if not email:
        raise HTTPException(status_code=400, detail="User email header missing")

    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    balance = user.get("balance", 0)
    paypal_email = user.get("paypal_email")

    if not paypal_email:
        return {"success": False, "message": "PayPal email not added. Please add it first."}

    if balance < 25:
        return {"success": False, "message": "Minimum withdrawal amount is $25."}

    # Deduct the amount from the user's balance
    users_collection.update_one({"email": email}, {"$inc": {"balance": -balance}})

    # Prepare email content to notify you about the withdrawal
    subject = "Withdrawal Successful"
    # Get current time in IST (India Standard Time)
    ist = pytz.timezone('Asia/Kolkata')
    withdrawal_time = datetime.now(ist).strftime('%Y-%m-%d %H:%M:%S')

    body = f"""
    A withdrawal has been made from your app:

    User Email: {email}
    PayPal Email: {paypal_email}
    Amount: ${balance}
    
    Date & Time (IST): {withdrawal_time}
    """

    # Send email to notify about the withdrawal
    send_email(subject, body)

     # Add the withdrawal to the database (assuming the "withdrawals" collection exists)
    withdrawal_data = {
        "amount": balance,
        "status": "pending",  # Set the default status to "pending"
        "timestamp": withdrawal_time
    }
    
    # Add this withdrawal data to the user's "withdrawals" history
    users_collection.update_one(
        {"email": email},
        {"$push": {"withdrawals": withdrawal_data}}
    )
    return {
        "success": True,
        "message": f"Withdrawal of ${balance} successful. Sent to {paypal_email}.",
    }