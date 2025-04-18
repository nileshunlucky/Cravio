import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from db import users_collection
from reddit_story import router as reddit_router
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

@app.post("/add-user")
def add_user(user: UserEmail):
    existing = users_collection.find_one({"email": user.email})
    if existing:
        return {"message": "User already exists"}
    users_collection.insert_one({"email": user.email})
    return {"message": "User added successfully"}

app.include_router(reddit_router)
app.include_router(subscription_router)

# Add a check to use the port specified by Render
import uvicorn

if __name__ == "__main__":
    # Fetch port from environment variable or default to 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
