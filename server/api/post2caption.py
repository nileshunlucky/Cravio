from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import base64, os
import openai
import re
from db import users_collection

router = APIRouter()
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/api/post2caption")
async def post_to_caption(file: UploadFile = File(...), email: str = Form(...)):
    try:
        # Check user exists and has enough aura
        user = users_collection.find_one({"email": email})
        if not user:
            return JSONResponse(content={"error": "User not found"}, status_code=400)
        if user.get("aura", 0) < 5:
            return JSONResponse(content={"error": "Not enough Aura"}, status_code=403)

        # Deduct aura
        users_collection.update_one({"email": email}, {"$inc": {"aura": -5}})

        # Process image
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
                                Analyze this image and generate exactly 3 different Instagram captions, each with a unique style and tone:

                                1. A storytelling/emotional caption (narrative-driven, evokes feelings)
                                2. A motivational/inspirational caption (uplifting, empowering)  
                                3. A trendy/playful caption (fun, relatable, current)

                                Each caption should be 50-150 words and end with exactly 5 relevant, trending hashtags.

                                Format your response EXACTLY like this:
                                1. [Caption 1 text here] #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5

                                2. [Caption 2 text here] #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5

                                3. [Caption 3 text here] #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5

                                Return only the numbered captions with hashtags — no extra text, explanations, or additional content."""
                            ),
                        },
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
            max_tokens=600,  # Increased for 3 captions
            temperature=0.8,
        )

        content = response.choices[0].message.content
        print(f"OpenAI Response: {content}")  # Debug log

        # Parse the numbered captions
        captions = []
        
        # Split content by numbered lines and clean up
        lines = content.strip().split('\n')
        current_caption = ""
        
        for line in lines:
            line = line.strip()
            if not line:  # Skip empty lines
                continue
                
            # Check if line starts with number (1., 2., 3.)
            match = re.match(r'^(\d+)\.\s*(.+)$', line)
            if match:
                # If we have a previous caption, save it
                if current_caption:
                    captions.append(current_caption.strip())
                # Start new caption
                current_caption = match.group(2)
            else:
                # Continue building current caption
                if current_caption:
                    current_caption += " " + line
        
        # Don't forget the last caption
        if current_caption:
            captions.append(current_caption.strip())

        # Fallback parsing if numbered approach fails
        if len(captions) < 3:
            captions = []
            # Try splitting by numbers at the beginning of lines
            parts = re.split(r'\n(?=\d+\.)', content.strip())
            for part in parts:
                if part.strip():
                    # Remove leading number and clean up
                    cleaned = re.sub(r'^\d+\.\s*', '', part.strip())
                    # Replace newlines within caption with spaces
                    cleaned = re.sub(r'\n+', ' ', cleaned)
                    if cleaned:
                        captions.append(cleaned)

        # Final fallback: split by double newlines
        if len(captions) < 3:
            parts = content.strip().split('\n\n')
            captions = []
            for part in parts:
                part = part.strip()
                if part:
                    # Remove any leading numbers
                    part = re.sub(r'^\d+\.\s*', '', part)
                    # Clean up newlines
                    part = re.sub(r'\n+', ' ', part)
                    captions.append(part)

        # Ensure we have exactly 3 captions
        captions = captions[:3]
        
        # Validate we have at least one caption
        if not captions:
            raise HTTPException(
                status_code=500,
                detail="Failed to extract captions from OpenAI response. Please try again.",
            )

        # If we have fewer than 3, duplicate the available ones
        while len(captions) < 3:
            captions.append(captions[0] if captions else "Unable to generate caption.")

        return JSONResponse(content={"Captions": captions})

    except Exception as e:
        print(f"An error occurred: {e}")
        # Log the actual response for debugging
        if 'response' in locals():
            print(f"OpenAI response: {response.choices[0].message.content if response.choices else 'No choices'}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
