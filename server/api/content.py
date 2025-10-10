from fastapi import APIRouter, Form, HTTPException
from db import users_collection
from tasks.content_task import content
from typing import Optional
router = APIRouter()


def deduct_aura_by_model(email: str):
    # Fetch user
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user has enough aura
    if user.get("aura", 0) < 40:
        raise HTTPException(status_code=403, detail="Not enough Aura")

    # Deduct aura (subtract 40)
    users_collection.update_one({"email": email}, {"$inc": {"aura": -40}})

    return {"message": f"40 Aura deducted for model"}


@router.post("/api/content")
async def persona_image(
    email: str = Form(...),
    prompt: str = Form(...),
    persona: str = Form(...),
    option: Optional[str] = Form(None),
):
    # Check if user has enough aura
    deduct_aura_by_model(email)

    try:

        task = content.delay(prompt=prompt, email=email, persona=persona, option=option)

        return {
            "status": "success",
            "message": f"Content generation queued.",
            "task_id": task.id,
        }

    except Exception as e:
        # Refund aura if task creation fails (add back 40)
        users_collection.update_one({"email": email}, {"$inc": {"aura": 40}})
        raise HTTPException(
            status_code=500, detail=f"Failed to queue generation: {str(e)}"
        )
