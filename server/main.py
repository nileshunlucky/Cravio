from fastapi import FastAPI, HTTPException, Body, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel, EmailStr
from db import users_collection
from flow import flow_collection
from api.lemon_webhook import router as lemon_webhook_router
from api.persona import router as persona_router
from api.persona2img import router as img2img_router
from api.opus import router as opus_router
from api.content import router as content_router
from api.predictTrade import router as predictTrade_router
from api.binance import router as binance_router

app = FastAPI()

# Allow CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mellvitta.com","https://www.mellvitta.com", "http://localhost:3000", "https://*.replit.dev", "https://*.repl.co"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# add routers
app.include_router(lemon_webhook_router)
app.include_router(persona_router)
app.include_router(img2img_router)
app.include_router(opus_router)
app.include_router(predictTrade_router)
app.include_router(binance_router)
app.include_router(content_router)

# Get user by email
@app.get("/user/{email}")
def get_user(email: str):
    user = users_collection.find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
        return user
    raise HTTPException(status_code=404, detail="User not found")

# get all users data
@app.get("/users")
def get_users():
    users = list(users_collection.find({}, {"_id": 0}))
    return users

# get users email
@app.get("/users-emails")
def get_users_emails():
    users = list(users_collection.find({}, {"_id": 0, "email": 1}))
    return users

# get all flows collection
@app.get("/flows")
def get_flows():
    flows = list(flow_collection.find({}))
    return flows

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
        return {"message": "User already exists"}

    # 3. If user doesn't exist, insert as new user and give 10 credits
    user_data = {
        "email": data.email,
        "credit": 10,
        "active": False,
    }

    users_collection.insert_one(user_data)
    return {"message": "User added successfully"}

@app.get("/proxy-image")
async def proxy_image(url: str):
    """Proxy endpoint to fetch images and avoid CORS issues"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "image/jpeg")
            
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=3600"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch image: {str(e)}")

@app.get("/proxy-video")
async def proxy_video(url: str):
    """Proxy endpoint to fetch videos and avoid CORS issues"""
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minute timeout for videos
            response = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "video/mp4")
            
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=7200",  # 2 hours cache
                    "Content-Disposition": "attachment; filename=video.mp4"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch video: {str(e)}")

