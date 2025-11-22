from fastapi import FastAPI, HTTPException, Body, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel, EmailStr
from db import users_collection
from flow import flow_collection
from api.vibe import router as vibe_router
from api.lemon_webhook import router as lemon_webhook_router
from api.persona import router as persona_router
from api.persona2img import router as img2img_router
from api.opus import router as opus_router
from api.content import router as content_router
from binance.client import Client

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
app.include_router(vibe_router)
app.include_router(lemon_webhook_router)
app.include_router(persona_router)
app.include_router(img2img_router)
app.include_router(opus_router)
app.include_router(content_router)

@app.get("/api/balance/{email}")
async def get_balance(email: str):
    """
    If email is 'nileshinde001@gmail.com' -> return DB balance
    Else -> return Binance balance in USDT
    """
    try:
        # ✅ SPECIAL CASE: Use DB balance
        if email == "nileshinde001@gmail.com":
            user = users_collection.find_one({"email": email})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            db_balance = float(user.get("balance", 0))
            return { "balance": round(db_balance, 2) }

        # ✅ DEFAULT: Binance balance
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        api_key = user.get("apiKey")
        api_secret = user.get("apiSecret")

        if not api_key or not api_secret:
            raise HTTPException(
                status_code=400,
                detail="Binance API credentials missing. Please add them in settings."
            )

        client = Client(api_key, api_secret)
        account = client.get_account()

        total = 0.0

        for b in account.get("balances", []):
            amount = float(b.get("free", 0)) + float(b.get("locked", 0))
            if amount <= 0:
                continue

            asset = b.get("asset")

            # ✅ Direct USDT
            if asset == "USDT":
                total += amount
            else:
                try:
                    ticker = client.get_symbol_ticker(symbol=f"{asset}USDT")
                    price = float(ticker["price"])
                    total += amount * price
                except:
                    pass

        return { "balance": round(total, 2) }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== END OF FILE ====================

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

    # 3. If user doesn't exist, insert as new user and free 3 aura
    user_data = {
        "email": data.email,
        "aura": 3,
        "user_paid": False,
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

# save brokerage details in the database
class BrokerageDetails(BaseModel):
    brokerId: str
    apiKey: str
    email: EmailStr

@app.post("/api/save-brokerage")
def save_brokerage(details: BrokerageDetails):
    user = users_collection.find_one({"email": details.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    users_collection.update_one(
        {"email": details.email},
        {"$set": {"brokerId": details.brokerId, "apiKey": details.apiKey}}
    )
    return {"message": "Brokerage details saved successfully"}