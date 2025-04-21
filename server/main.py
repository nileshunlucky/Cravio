import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from db import users_collection
from api.reddit_story import router as reddit_router
from subscription import router as subscription_router

app = FastAPI()

# Allow CORS for your frontend (update this with your Next.js domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://cravioai.vercel.app"],  # or "https://your-frontend.vercel.app"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserEmail(BaseModel):
    email: EmailStr

# Get user by email
@app.get("/user/{email}")
def get_user(email: str):
    user = users_collection.find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
        return user
    raise HTTPException(status_code=404, detail="User not found")

from fastapi import Query

@app.post("/add-user")
def add_user(user: UserEmail, referredBy: str = Query(default=None)):
    # 1. Check if the user already exists
    existing = users_collection.find_one({"email": user.email})
    if existing:
        return {"message": "User already exists"}

    user_data = {"email": user.email}

    # 2. Validate referredBy if provided
    if referredBy:
        # Check if referredBy is a valid ref_code in another user
        ref_user = users_collection.find_one({"ref_code": referredBy})
        if not ref_user:
            return {"message": "Invalid referral code"}

        user_data["referredBy"] = referredBy

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