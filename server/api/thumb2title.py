from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import base64, os
import openai

router = APIRouter()
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # Or hardcode it

@router.post("/api/thumb2title")
async def thumb_to_title(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        image_url = f"data:image/png;base64,{base64_image}"

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text":
                            "You're a YouTube strategist. Look at this thumbnail and write 3 viral YouTube titles. Keep them short, emotional, and curiosity-driven."
                        },
                        { "type": "image_url", "image_url": { "url": image_url } }
                    ]
                }
            ],
            max_tokens=150,
            temperature=0.9,
        )

        content = response.choices[0].message.content
        titles = [line.strip("-•.123) ") for line in content.strip().split('\n') if line.strip()]

        return JSONResponse(content={"titles": titles[:3]})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
