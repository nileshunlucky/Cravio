from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
import os
import requests
from dotenv import load_dotenv
from db import users_collection

load_dotenv()

router = APIRouter()

YOUTUBE_CLIENT_ID = os.getenv("YOUTUBE_CLIENT_ID")
YOUTUBE_CLIENT_SECRET = os.getenv("YOUTUBE_CLIENT_SECRET")
REDIRECT_URI = "https://cravioai.in/auth/youtube/callback"

# STEP 1: Redirect user to Google OAuth
@router.get("/auth/youtube")
async def auth_youtube():
    scope = (
        "https://www.googleapis.com/auth/youtube.upload "
        "https://www.googleapis.com/auth/userinfo.email"
    )
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={YOUTUBE_CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&scope={scope}"
    )
    return RedirectResponse(auth_url)

# STEP 2: Callback from Google with code → exchange for tokens
@router.get("/auth/youtube/callback")
async def youtube_callback(code: str, request: Request):
    try:
        token_res = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": YOUTUBE_CLIENT_ID,
                "client_secret": YOUTUBE_CLIENT_SECRET,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        token_res.raise_for_status()
        tokens = token_res.json()

        refresh_token = tokens.get("refresh_token")
        access_token = tokens.get("access_token")

        if not refresh_token:
            raise HTTPException(status_code=400, detail="Missing refresh token")

        # ✅ Optional: Get user email from access token
        user_info = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        ).json()

        user_email = user_info.get("email")

        if not user_email:
            raise HTTPException(status_code=400, detail="Missing user email")

        users_collection.update_one(
            {"email": user_email},
            {
                "$set": {
                    "social.youtube": {
                        "refresh_token": refresh_token,
                        "access_token": access_token,
                        "connected": True
                    }
                }
            },
            upsert=True
        )

        return {
            "message": "YouTube connected successfully",
            "email": user_email,
            "refresh_token": refresh_token,
            "access_token": access_token
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
