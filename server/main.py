from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from db import users_collection
from api.lemon_webhook import router as lemon_webhook_router
from api.thumb2title import router as thumb2title_router
from api.persona import router as persona_router

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
app.include_router(lemon_webhook_router)
app.include_router(thumb2title_router)
app.include_router(persona_router)

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

@app.get("/users-full")
def get_users_full():
    try:
        # Fetch all users with all fields
        users = list(users_collection.find({}))
        
        # Convert ObjectId to string for JSON serialization
        for user in users:
            if '_id' in user and hasattr(user['_id'], '__str__'):
                user['_id'] = str(user['_id'])
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching user data")

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "OK"}

class UserReferral(BaseModel):
    email: EmailStr   
    deviceId: str

@app.post("/add-user")
def save_referral(data: UserReferral = Body(...)):

    # 1. Check if user exists with email
    user = users_collection.find_one({"email": data.email})

    if user:
        # If user has no deviceId, update it
        if "deviceId" not in user or not user["deviceId"]:
            users_collection.update_one(
                {"email": data.email},
                {"$set": {"deviceId": data.deviceId}}
            )
            return {"message": "Device ID added to existing user"}
        else:
            return {"message": "User already exists"}

    # 3. If user doesn't exist, insert as new user
    user_data = {
        "email": data.email,
        "deviceId": data.deviceId,
        "user_paid": False,
    }
    users_collection.insert_one(user_data)
    return {"message": "User added successfully"}