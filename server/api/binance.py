from fastapi import APIRouter, HTTPException
from db import users_collection
from binance.client import Client

router = APIRouter()

@router.post("/api/binance/connect")
async def connect_binance(apiKey: str, apiSecret: str, email: str):
    # Find user by email
    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user document
    users_collection.update_one(
        {"email": email},
        {"$set": {"binance_api_key": apiKey, "binance_api_secret": apiSecret}}
    )

    return {"message": "Binance keys saved successfully"}


@router.get("/api/binance-balance/{email}")
async def get_user_balance(email: str):
    # 1. Find user
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    api_key = user.get("binance_api_key")
    api_secret = user.get("binance_api_secret")

    if not api_key or not api_secret:
        raise HTTPException(status_code=400, detail="Binance keys not connected")

    try:
        # 2. Connect to Binance
        client = Client(api_key, api_secret)

        # 3. Fetch futures balance (USDT wallet)
        balance = client.futures_account_balance()

        # Optional: filter only assets with balance > 0
        filtered = [
            {
                "asset": b["asset"],
                "balance": b["balance"],
                "availableBalance": b["availableBalance"],
                "crossWalletBalance": b["crossWalletBalance"],
            }
            for b in balance if float(b["balance"]) > 0
        ]

        return {
            "balances": filtered
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
