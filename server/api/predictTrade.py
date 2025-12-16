from fastapi import APIRouter, Form, HTTPException
from openai import OpenAI
import os
from dotenv import load_dotenv
import json
from binance.client import Client
from binance.enums import *
from db import users_collection
import re



load_dotenv()

router = APIRouter()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def safe_json_parse(text: str):
    """
    Extract the first JSON object in a string and parse it.
    Raises HTTPException if parsing fails.
    """
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="GPT did not return valid JSON.")
    try:
        return json.loads(match.group())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse JSON from GPT response: {e}")

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

        aura = user.get("aura", 0)

        # If user has no aura
        if aura < 1:
            raise HTTPException(status_code=403, detail="Insufficient auras")

        # Deduct 1 aura
        new_aura = aura - 1

        users_collection.update_one(
            {"email": email},
            {"$set": {"aura": new_aura}}
        )

        candles_data = json.loads(candles)


        # Compute entry price BEFORE prompt (important)
        entry_price = candles_data[-1]["close"]

        prompt = f"""
        You are a professional quantitative trading analyst used in an automated trading system.
        Your output will be executed live on Binance Futures. Accuracy and rule-compliance are mandatory.

        MARKET CONTEXT:
        - Symbol: {symbol}
        - Timeframe: {timeframe}
        - Current Entry Price: {entry_price}

        CANDLE DATA (last 100 candles, chronological):
        {json.dumps(candles_data, indent=2)}

        STRICT EXECUTION RULES (DO NOT VIOLATE):
        1. Output ONLY a valid JSON object. No explanations, no text, no markdown.
        2. "side" MUST be either "BUY" or "SELL".
        3. If side == "BUY":
           - stopLoss MUST be strictly BELOW entry price
           - target MUST be strictly ABOVE entry price
        4. If side == "SELL":
           - stopLoss MUST be strictly ABOVE entry price
           - target MUST be strictly BELOW entry price
        5. Minimum Risk–Reward ratio is 1:2; use 1:3 only if setup probability is STRONG, never below 1:2
        6. Prices must be realistic and derived from:
           - recent swing highs/lows
           - support/resistance
           - volatility (not random numbers)
        7. All numeric values MUST be numbers (not strings).
        8. If market conditions are unclear, still choose the MOST probable direction.
        9. Never return invalid or inverted levels.

        OUTPUT FORMAT (JSON ONLY):
        {{
          "side": "BUY",
          "stopLoss": number,
          "target": number
        }}
        """

        response = openai_client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": "You are a precise trading chart evaluator who predicts trades accurately."},
                {"role": "user", "content": prompt},
            ],
        )

        labels = safe_json_parse(response.output_text.strip())

        # Only return the prediction info
        return {"status": "success", "data": labels}

    except Exception as e:
        users_collection.update_one({"email": email}, {"$inc": {"aura": 1}})
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
