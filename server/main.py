from fastapi import FastAPI, HTTPException, Request, Body
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

# add routers
app.include_router(reddit_router)
app.include_router(subscription_router)

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
    referredBy: str = None  

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