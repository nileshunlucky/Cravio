from fastapi import APIRouter, Form, HTTPException
from openai import OpenAI
from binance.client import Client
from db import users_collection, positions_collection
import os
import json
import re
import math
from datetime import datetime
from typing import Tuple, Dict, Any

router = APIRouter()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ==================== AURA MANAGEMENT ====================

def deduct_aura(email: str) -> None:
    """Deducts 1 aura credit from user. Raises HTTPException if insufficient."""
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("aura", 0) < 1:
        raise HTTPException(status_code=403, detail="Insufficient Aura credits")
    users_collection.update_one({"email": email}, {"$inc": {"aura": -1}})


def refund_aura(email: str) -> None:
    """Refunds 1 aura credit to user."""
    users_collection.update_one({"email": email}, {"$inc": {"aura": 1}})


# ==================== JSON PARSING ====================

def safe_json_parse(text: str) -> dict:
    """Extracts and parses JSON from AI response, handling markdown code blocks."""
    try:
        # Remove markdown code blocks
        clean_text = re.sub(r"```json\n?|\n?```", "", text).strip()
        # Find JSON object
        match = re.search(r"\{.*\}", clean_text, re.DOTALL)
        if not match:
            raise ValueError("No JSON object found in response")
        return json.loads(match.group())
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from AI: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JSON parsing error: {str(e)}")


# ==================== BINANCE CLIENT ====================

def get_binance_client(email: str) -> Client:
    """Returns authenticated Binance client for user."""
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    api_key = user.get("apiKey")
    api_secret = user.get("apiSecret")
    
    if not api_key or not api_secret:
        raise HTTPException(
            status_code=400, 
            detail="Binance API credentials not configured. Please add them in settings."
        )
    
    return Client(api_key, api_secret)


# ==================== SYMBOL INFO & PRECISION ====================

def get_symbol_info(client: Client, symbol: str) -> Dict[str, Any]:
    """Fetches symbol information from Binance."""
    try:
        info = client.get_symbol_info(symbol)
        if not info:
            raise HTTPException(status_code=400, detail=f"Symbol {symbol} not found")
        return info
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid symbol {symbol}: {str(e)}")


def get_lot_size_filter(symbol_info: Dict[str, Any]) -> dict:
    """Extracts LOT_SIZE filter from symbol info."""
    for f in symbol_info.get("filters", []):
        if f["filterType"] == "LOT_SIZE":
            return f
    return {"stepSize": "0.00001", "minQty": "0.00001"}


def round_step_size(quantity: float, step_size: str) -> float:
    """Rounds quantity down to match Binance step size precision."""
    step = float(step_size)
    if step == 0:
        return quantity
    decimals = max(0, int(round(-math.log10(step))))
    return float(f"{math.floor(quantity / step) * step:.{decimals}f}")


def format_price(price: float, tick_size: str = "0.01") -> str:
    """Formats price according to tick size without scientific notation."""
    tick = float(tick_size)
    decimals = max(0, int(round(-math.log10(tick))))
    return f"{price:.{decimals}f}"


def validate_tp_sl(entry_price: float, target: float, stop_loss: float) -> None:
    """Validates TP and SL levels for a LONG (BUY) position."""
    if not (stop_loss < entry_price < target):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid levels: Stop Loss ({stop_loss}) must be < Entry ({entry_price}) < Target ({target})"
        )


# ==================== PREDICTION ENDPOINT ====================

@router.post("/api/vibe-prediction")
async def prediction(email: str = Form(...), data: str = Form(...)):
    """
    Analyzes trading data using AI and returns prediction with TP/SL levels.
    Deducts 1 aura credit per call.
    """
    deduct_aura(email)
    
    try:
        analysis_prompt = """You are a professional trading analyst. Analyze the provided trading data and:

1. Determine market condition (bullish/bearish/ranging)
2. Predict trading decision: BUY
3. Provide probability percentage (0-97)
4. Calculate Stop Loss level
5. Calculate Take Profit Target

Return ONLY valid JSON in this exact format:
{
  "Prediction": "BUY",
  "Probability": 75,
  "StopLoss": 42500.50,
  "Target": 43500.75
}

Rules:
- Prediction: ALWAYS "BUY"
- Use realistic percentages for TP/SL (1-3% typical)
- No extra text, only JSON"""

        response = openai_client.responses.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a precise trading analyst. Always return valid JSON only."
                },
                {
                    "role": "user", 
                    "content": f"{analysis_prompt}\n\nTrading Data:\n{data}"
                }
            ],
            temperature=0.7
        )
        
        ai_content = response.choices[0].message.content
        labels = safe_json_parse(ai_content)
        
        # Validate response structure
        required_keys = ["Prediction", "Probability", "StopLoss", "Target"]
        if not all(k in labels for k in required_keys):
            raise HTTPException(
                status_code=500, 
                detail=f"AI response missing required fields: {required_keys}"
            )
        
        return {"status": "success", "data": labels}
    
    except HTTPException:
        refund_aura(email)
        raise
    except Exception as e:
        refund_aura(email)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ==================== PLACE ORDER ENDPOINT ====================

@router.post("/api/vibe-place-order")
async def place_order(email: str = Form(...), data: str = Form(...)):
    """
    Places SPOT market order with OCO exit (TP + SL).
    Only supports BUY entries (long positions).
    """
    try:
        trade_data = json.loads(data)
        
        # Extract and validate fields
        current_price = float(trade_data.get("currentPrice"))
        symbol = str(trade_data.get("symbol")).upper()
        amount = float(trade_data.get("amount"))
        prediction = str(trade_data.get("prediction")).upper()
        target = float(trade_data.get("target"))
        stop_loss = float(trade_data.get("stopLoss"))
        
        if not all([current_price, symbol, amount, prediction, target, stop_loss]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Validate prediction type
        if prediction not in ["BUY"]:
            raise HTTPException(status_code=400, detail="Prediction must be BUY")
        
        # Validate TP/SL levels
        validate_tp_sl(current_price, target, stop_loss)
        
        # Get Binance client
        client = get_binance_client(email)
        
        # Get symbol info and precision
        symbol_info = get_symbol_info(client, symbol)
        base_asset = symbol_info.get("baseAsset")
        lot_filter = get_lot_size_filter(symbol_info)
        step_size = lot_filter.get("stepSize", "0.00001")
        min_qty = float(lot_filter.get("minQty", "0.00001"))
        
        # Calculate quantity
        raw_qty = amount / current_price
        qty = round_step_size(raw_qty, step_size)
        
        if qty < min_qty:
            raise HTTPException(
                status_code=400,
                detail=f"Quantity {qty} below minimum {min_qty} for {symbol}"
            )
        
        print(f"📊 Placing {prediction} order: {symbol} | Qty: {qty} | Entry: ~{current_price}")
        
        # Step 1: Place Market Entry Order
        entry_order = client.create_order(
            symbol=symbol,
            side="BUY",
            type="MARKET",
            quantity=qty
        )
        
        print(f"✅ Entry order placed: {entry_order.get('orderId')}")
        
        # Step 2: Save position to database
        position_doc = {
            "user_email": email,
            "symbol": symbol,
            "side": "BUY",
            "entry_price": current_price,
            "qty": qty,
            "target": target,
            "stop_loss": stop_loss,
            "entry_order_id": entry_order.get("orderId"),
            "status": "open",
            "created_at": datetime.utcnow()
        }
        
        try:
            positions_collection.insert_one(position_doc)
        except Exception as e:
            print(f"⚠️ Failed to save position to DB: {e}")
        
        # Step 3: Place OCO Exit Order (TP + SL)
        try:
            oco_order = client.create_oco_order(
                symbol=symbol,
                side="SELL",  # Exit by selling
                quantity=qty,
                price=format_price(target),
                stopPrice=format_price(stop_loss),
                stopLimitPrice=format_price(stop_loss * 0.995),  # Slightly below to ensure fill
                stopLimitTimeInForce="GTC"
            )
            print(f"✅ OCO exit order placed: TP={target}, SL={stop_loss}")
            
            return {
                "status": "success",
                "message": "Order placed successfully",
                "entry_order": entry_order,
                "oco_order": oco_order,
                "qty": qty,
                "symbol": symbol
            }
            
        except Exception as oco_error:
            print(f"⚠️ OCO placement failed: {oco_error}")
            return {
                "status": "partial_success",
                "message": "Entry placed but OCO failed. Please set manual exit.",
                "entry_order": entry_order,
                "oco_error": str(oco_error),
                "qty": qty,
                "symbol": symbol
            }
    
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in data parameter")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid number format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order placement failed: {str(e)}")


# ==================== CLOSE ORDER ENDPOINT ====================

@router.post("/api/close-order")
async def close_order(email: str = Form(...), data: str = Form(...)):
    """
    Closes open SPOT position:
    1. Cancels all open orders for symbol
    2. Sells entire position at market price
    """
    try:
        trade_data = json.loads(data)
        symbol = str(trade_data.get("symbol")).upper()
        original_side = str(trade_data.get("side", "BUY")).upper()
        
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol is required")
        
        client = get_binance_client(email)
        
        # Step 1: Cancel all open orders
        print(f"📊 Closing position for {symbol}")
        try:
            open_orders = client.get_open_orders(symbol=symbol)
            for order in open_orders:
                try:
                    client.cancel_order(symbol=symbol, orderId=order["orderId"])
                    print(f"❌ Cancelled order: {order['orderId']}")
                except Exception as e:
                    print(f"⚠️ Failed to cancel order {order['orderId']}: {e}")
        except Exception as e:
            print(f"⚠️ Error fetching open orders: {e}")
        
        # Step 2: Get symbol info
        symbol_info = get_symbol_info(client, symbol)
        base_asset = symbol_info.get("baseAsset")
        lot_filter = get_lot_size_filter(symbol_info)
        step_size = lot_filter.get("stepSize", "0.00001")
        
        # Step 3: Determine quantity to close
        qty = None
        
        # Try to get qty from saved position
        try:
            position = positions_collection.find_one(
                {"user_email": email, "symbol": symbol, "status": "open"},
                sort=[("created_at", -1)]
            )
            if position:
                qty = float(position.get("qty", 0))
                print(f"📦 Found saved position: {qty} {base_asset}")
        except Exception as e:
            print(f"⚠️ Error reading position from DB: {e}")
        
        # Fallback: get qty from wallet balance
        if not qty or qty <= 0:
            try:
                balance = client.get_asset_balance(asset=base_asset)
                qty = float(balance.get("free", 0))
                print(f"💰 Using wallet balance: {qty} {base_asset}")
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to get balance for {base_asset}: {str(e)}"
                )
        
        if qty <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"No {base_asset} balance to close. Position may be already closed."
            )
        
        # Step 4: Apply precision
        qty = round_step_size(qty, step_size)
        
        if qty <= 0:
            raise HTTPException(status_code=400, detail="Quantity too small after rounding")
        
        # Step 5: Close position with market order
        close_side = "SELL" if original_side == "BUY" else "BUY"
        
        close_order_result = client.create_order(
            symbol=symbol,
            side=close_side,
            type="MARKET",
            quantity=qty
        )
        
        print(f"✅ Position closed: {close_side} {qty} {symbol}")
        
        # Step 6: Update position status in DB
        try:
            positions_collection.update_many(
                {"user_email": email, "symbol": symbol, "status": "open"},
                {
                    "$set": {
                        "status": "closed",
                        "closed_at": datetime.utcnow(),
                        "close_order_id": close_order_result.get("orderId")
                    }
                }
            )
        except Exception as e:
            print(f"⚠️ Failed to update position status: {e}")
        
        return {
            "status": "success",
            "message": f"Position closed successfully",
            "symbol": symbol,
            "closed_qty": qty,
            "action": close_side,
            "details": close_order_result
        }
    
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in data parameter")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to close order: {str(e)}")
    
# ==================== BALANCE ENDPOINT ====================
@router.get("/api/balance/{email}")
async def get_balance(email: str):
    """
    If email is 'nileshinde001@gmail.com' -> return DB balance
    Else -> return Binance balance in USDT
    """
    try:
        # ✅ SPECIAL CASE
        if email == "nileshinde001@gmail.com":
            user = users_collection.find_one({"email": email})
            db_balance = float(user.get("balance", 0))
            return { "balance": round(db_balance, 2) }

        # ✅ DEFAULT: Binance balance
        client = get_binance_client(email)
        account = client.get_account()

        total = 0.0

        for b in account.get("balances", []):
            amount = float(b.get("free", 0)) + float(b.get("locked", 0))
            if amount <= 0:
                continue

            asset = b.get("asset")

            if asset == "USDT":
                total += amount
            else:
                try:
                    price = float(client.get_symbol_ticker(symbol=f"{asset}USDT")["price"])
                    total += amount * price
                except:
                    pass

        return { "balance": round(total, 2) }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== END OF FILE ====================