from fastapi import FastAPI, HTTPException, Request, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from db import users_collection
from subscription import router as subscription_router
from limited_offer import router as limited_offer_router
from api.opusclip import router as opusclip_router
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
    allow_origins=["https://cravioai.in", "https://www.cravioai.in"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# add routers
app.include_router(subscription_router)
app.include_router(limited_offer_router)
app.include_router(opusclip_router)

# Get user by email
@app.get("/user/{email}")
def get_user(email: str):
    user = users_collection.find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
        return user
    raise HTTPException(status_code=404, detail="User not found")

# get users email
@app.get("/users-emails")
def get_users():
    users = list(users_collection.find({}, {"_id": 0, "email": 1}))
    return users

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "OK"}

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
def send_email(subject, body, receiver_email):
    try:
        sender_email = "cravio.ai@gmail.com"  # Use your email here
        password = os.getenv("GMAIL_PASSWORD")  # Use App Password if 2FA is enabled on your Gmail

        # Prepare the email content
        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = receiver_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        # Send the email using SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, msg.as_string())

        print("Email sent successfully")

    except Exception as e:
        print("Error sending email:", e)

def send_offer_emails():
    subject = "🚀 LIMITED TIME OFFER: 100 Credits for just ₹86!"
    body = """
    <html>
    <body>
        <p>Hello!</p>
        <p>We're excited to offer you <b>100 credits for just ₹86</b>! This is a <b>limited-time offer only available for the next 3 days</b>.</p>
        <p>
            <a href="https://cravioai.vercel.app" style="padding:10px 15px;background-color:#3B82F6;color:white;text-decoration:none;border-radius:6px;">
                Claim Now
            </a>
        </p>
        <p>Best regards,<br>Cravio Team</p>
    </body>
    </html>
    """

    users = users_collection.find({}, {"email": 1})
    for user in users:
        if "email" in user:
            send_email(subject, body, user["email"])

@app.get("/send-email")
async def trigger_bulk_offer_email(background_tasks: BackgroundTasks):
    background_tasks.add_task(send_offer_emails)
    return {"message": "Emails are being sent in the background to all users."}


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
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #DC2626;">Withdrawal Notification</h2>
    <p>A withdrawal has been made from your app with the following details:</p>
    <table style="border-collapse: collapse;">
      <tr>
        <td style="padding: 8px;"><strong>User Email:</strong></td>
        <td style="padding: 8px;">{email}</td>
      </tr>
      <tr>
        <td style="padding: 8px;"><strong>PayPal Email:</strong></td>
        <td style="padding: 8px;">{paypal_email}</td>
      </tr>
      <tr>
        <td style="padding: 8px;"><strong>Amount:</strong></td>
        <td style="padding: 8px;">${balance}</td>
      </tr>
      <tr>
        <td style="padding: 8px;"><strong>Date & Time (IST):</strong></td>
        <td style="padding: 8px;">{withdrawal_time}</td>
      </tr>
    </table>
    <p style="margin-top: 20px;">Please process this withdrawal accordingly.</p>
  </body>
</html>
"""

    receiver_email="cravio.ai@gmail.com"
    # Send email to notify about the withdrawal
    send_email(subject, body, receiver_email)

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