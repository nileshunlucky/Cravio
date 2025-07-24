from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import base64, os
import openai
import re  # Import the regular expression module
from db import users_collection

router = APIRouter()
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@router.post("/api/post2caption")
async def post_to_caption(file: UploadFile = File(...), email: str = Form(...)):
    try:
        # check user exists and has enough 5 aura
        user = users_collection.find_one({"email": email})
        if not user:
            return JSONResponse(content={"error": "User not found"}, status_code=400)
        if user.get("aura", 0) < 5:
            return JSONResponse(
                content={"error": "Not enough aura"}, status_code=403
            )

        # Deduct aura
        users_collection.update_one({"email": email}, {"$inc": {"aura": -5}})

        # --- ORIGINAL CODE ---
        image_bytes = await file.read()
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        image_url = f"data:image/png;base64,{base64_image}"

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                """You are a professional Instagram strategist for viral content creators.
                                Analyze this post and generate 1 long, highly attractive, and creative Instagram caption (up to 300 words) that:
                                - Tells a story or evokes strong emotion matching the post’s visual and mood;
                                - Uses a playful, bold, or inspirational tone as fits the image;
                                - Is unique and avoids generic, overused phrases;
                                - Flows naturally for readers scrolling Instagram.
                                At the end, add 5 relevant, trending hashtags that match the post and can boost reach.
                                Output format:
                                Caption text [return] #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
                                Return only the caption and hashtags — no extra explanations, greetings, or numbers."""
                            ),
                        },
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
            max_tokens=150,
            temperature=0.9,
        )

        content = response.choices[0].message.content

        # --- MODIFIED PARSING LOGIC ---
        # Regex to find lines starting with a number, a period, and a space,
        # then capture the rest of the line.
        # This is more robust against extra conversational text from the model.
        title_pattern = re.compile(r"^\s*[\d\.\-\•]+\s*(.*)$", re.MULTILINE)
        extracted_titles = []
        for line in content.strip().split("\n"):
            match = title_pattern.match(line)
            if match:
                title = match.group(1).strip()
                if title:  # Ensure the extracted title is not empty
                    extracted_titles.append(title)

        # Ensure we only take the first 3 titles, as requested.
        titles = extracted_titles[:3]
        # If the model didn't return 3, we might want to handle that,
        # but for now, just return what we got.
        # --- END MODIFIED PARSING LOGIC ---

        if not titles:  # Handle case where no titles were extracted
            raise HTTPException(
                status_code=500,
                detail="Failed to extract titles from OpenAI response. Please try again.",
            )

        return JSONResponse(content={"Captions": titles})

    except Exception as e:
        # It's good to log the full exception for debugging, not just convert to string
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
