from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
import cloudinary
import cloudinary.uploader
import os
from tasks.reddit_story_task import process_split_screen_task

# Initialize FastAPI
app = FastAPI()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET")
)

@app.post("/create-split-screen")
async def create_split_screen(
    video: str = Form(...),
    font: str = Form(...),
    user_email: str = Form(...),
    user_video: UploadFile = File(...)
):
    try:
        # Upload the user video to Cloudinary
        upload_result = cloudinary.uploader.upload(
            user_video.file, 
            resource_type="video",
            folder="Cravio"
        )
        
        # Get the URL of the uploaded video
        user_video_url = upload_result['secure_url']
        
        # Send task to Celery
        task = process_split_screen_task.apply_async(kwargs={
            "video_url": video,
            "user_video_url": user_video_url,
            "font_color": font,
            "user_email": user_email
        })
        
        return JSONResponse(content={
            "task_id": task.id,
            "status": "processing",
            "message": "Your split-screen video creation is in progress"
        })
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"An error occurred: {str(e)}"
            }
        )