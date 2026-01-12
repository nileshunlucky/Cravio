from fastapi import FastAPI, HTTPException, Request, Body, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from db import users_collection
from subscription import router as subscription_router
from social_manage import router as social_manage_router
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
import pytz
import os
from typing import Optional
from openai import OpenAI

app = FastAPI()

# Allow CORS for your frontend (update this with your Next.js domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://cravioai.in", "https://www.cravioai.in", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# add routers
app.include_router(subscription_router)
app.include_router(social_manage_router)

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
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
  

@app.post("/add-user")
def save_referral(data: UserReferral = Body(...)):  # Expect referral data in the body
    # 1. Check if the user already exists
    existing = users_collection.find_one({"email": data.email})
    if existing:
        return {"message": "User already exists"}

    # 2. Start building user data
    user_data = {
        "email": data.email
    }

    # 3. Insert the user
    users_collection.insert_one(user_data)
    return {"message": "User added successfully"}

import traceback # Add this import

@app.post("/chatbot")
async def chatbot(
    input: str = Form(...), 
    email: str = Form(...)
):
    try:
        print(f"Received: {input} from {email}")
        user = users_collection.find_one({"email": email})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Use .get() to avoid KeyErrors if credits field is missing
        if user.get("credits", 0) < 1:
            return {"reply": "You have run out of credits. Please top up."}

        # Fixed OpenAI Completion syntax
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a specialized Cybersecurity Education Assistant focusing on unethical hacking and dark secrects of the real world."},
                {"role": "user", "content": input},
            ],
        )
    
        reply = response.choices[0].message.content.strip()

        # Deduct credit
        users_collection.update_one(
            {"email": email},
            {"$inc": {"credits": -1}}
        )
        
        return {"reply": reply}

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))