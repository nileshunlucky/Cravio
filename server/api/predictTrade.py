from fastapi import APIRouter, Form, HTTPException
from openai import OpenAI
import os
from dotenv import load_dotenv
import json
from binance.client import Client
from binance.enums import *
from db import users_collection


load_dotenv()

router = APIRouter()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/api/predict")
async def predict_trade(
    email: str = Form(...),
    symbol: str = Form(...),
    timeframe: str = Form(...),
    candles: str = Form(...),
):
    try:
        user = users_collection.find_one({"email": email})
        if not user:
         raise HTTPException(status_code=404, detail="User not found")

        credit = user.get("credit", 0)

        # If user has no credit
        if credit < 1:
            raise HTTPException(status_code=403, detail="Insufficient credits")

        # Deduct 1 credit
        new_credit = credit - 1

        users_collection.update_one(
            {"email": email},
            {"$set": {"credit": new_credit}}
        )

        candles_data = json.loads(candles)

        prompt = f"""
You are a professional trading analyst. Analyze the following candlestick data and provide a trading signal.

Token {symbol},
Time Frame {timeframe},
Candles (past 100):
{json.dumps(candles_data, indent=2)}

Instructions:
- Predict only one action: "BUY" or "SELL"
- Suggest a realistic Stop Loss
- Suggest a realistic Target price
- Return ONLY JSON in this exact format:
{{"side": "BUY", "stopLoss": 0.0, "target": 0.0}}
Do not add any extra text or explanation.
"""

        response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a precise trading chart evaluator who predicts trades accurately."},
                {"role": "user", "content": prompt},
            ],
        )

        # The actual text output from GPT
        result_text = response.output_text.strip()

        # Convert GPT's JSON string into Python dict
        trade_data = json.loads(result_text)

        # Only return the prediction info
        return {"status": "success", "data": trade_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trade prediction failed: {str(e)}")

@router.post("/api/trade")
async def place_trade(
    symbol: str = Form(...),
    side: str = Form(...),
    qty: str = Form(...),
    stopLoss: str = Form(...),
    target: str = Form(...),
    email: str = Form(...),
):
    try:
        qty = float(qty)
        stopLoss = float(stopLoss)
        target = float(target)

        # Initialize Binance client with API key and secret from user db   
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")


        # 2. Extract Binance keys from user record
        user_binance_key = user.get("binance_api_key")
        user_binance_secret = user.get("binance_api_secret")

        if not user_binance_key or not user_binance_secret:
               raise HTTPException(status_code=403, detail="User Binance keys not found")

        # 3. Create Binance client with user's keys
        client = Client(api_key=user_binance_key, api_secret=user_binance_secret)

        # Normalize side
        side = side.upper()
        if side not in ["BUY", "SELL"]:
            raise HTTPException(status_code=400, detail="Side must be BUY or SELL")

        # Place main market order
        order = client.futures_create_order(
            symbol=symbol,
            side=side,
            type="MARKET",
            quantity=qty
        )

        # Determine opposite side for stop loss and take profit orders
        opposite_side = "SELL" if side == "BUY" else "BUY"

        # Place stop loss order
        stop_loss_order = client.futures_create_order(
            symbol=symbol,
            side=opposite_side,
            type="STOP_MARKET",
            stopPrice=stopLoss,
            closePosition=True
        )

        # Place take profit / target order
        take_profit_order = client.futures_create_order(
            symbol=symbol,
            side=opposite_side,
            type="TAKE_PROFIT_MARKET",
            stopPrice=target,
            closePosition=True

        )

        return {
            "status": "success",
            "order": order,
            "stop_loss_order": stop_loss_order,
            "take_profit_order": take_profit_order
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to place trade: {str(e)}")

@router.post("/api/exit")
async def exit_trade(
    symbol: str = Form(...),
    email: str = Form(...),
):
    try:
        symbol = symbol.upper()

         # Initialize Binance client with API key and secret from user db   
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 2. Extract Binance keys from user record
        user_binance_key = user.get("binance_api_key")
        user_binance_secret = user.get("binance_api_secret")

        if not user_binance_key or not user_binance_secret:
               raise HTTPException(status_code=400, detail="User Binance keys not found")

        # 3. Create Binance client with user's keys
        client = Client(api_key=user_binance_key, api_secret=user_binance_secret)

        # Fetch all positions
        positions = client.futures_position_information(symbol=symbol)

        if not positions or len(positions) == 0:
            raise HTTPException(status_code=404, detail="No position data found")

        pos = positions[0]
        position_amt = float(pos["positionAmt"])  # Positive = LONG, Negative = SHORT

        if position_amt == 0:
            return {"status": "no_position", "message": "No active position to close"}

        # Determine exit side
        side = "SELL" if position_amt > 0 else "BUY"

        qty = abs(position_amt)

        # Close the position using MARKET order
        close_order = client.futures_create_order(
            symbol=symbol,
            side=side,
            type="MARKET",
            quantity=qty,
            reduceOnly=True    # prevents opening new position
        )

        return {
            "status": "success",
            "message": "Position exited successfully",
            "close_order": close_order
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to exit trade: {str(e)}")
