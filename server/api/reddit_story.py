from fastapi import APIRouter, UploadFile, Form, BackgroundTasks
from fastapi.responses import JSONResponse
import os
from tasks.reddit_story_task import create_reddit_post_task, generate_script, generate_title, generate_caption
from celery_config import celery_app
import tempfile
import shutil
import uuid
import traceback
from fastapi import HTTPException
from db import users_collection

router = APIRouter()
OUTPUT_FOLDER = "output"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# make post request for title and script by ai
@router.post("/generate-content")
async def generate_content(prompt: str  = Form(...)):
    try:
        title = generate_title(prompt)
        script = generate_script(title)
        return {"title": title, "script": script}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-reddit-post")
async def create_reddit_post(
    avatar: UploadFile = None,
    username: str = Form(...),
    title: str = Form(...),
    script: str = Form(...),
    voice: str = Form(...),
    video: str = Form(...),
    font: str = Form(...),
    user_email: str = Form(...)
):
    # check user have 10 credits or not
    user = users_collection.find_one({"email": user_email}) 
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("credits", 0) < 10:
        raise HTTPException(status_code=400, detail="Not enough credits")
    # deduct 10 credits
    users_collection.update_one({"email": user_email}, {"$inc": {"credits": -10}})
    """
    Handles the creation of a Reddit post asynchronously using Celery.
    It immediately returns a task ID and processes the job in the background.
    """
    avatar_path = None

    try:

        # Save avatar if present
        if avatar:
            tmp_dir = tempfile.mkdtemp()
            extension = os.path.splitext(avatar.filename)[1] if avatar.filename else ".png"
            avatar_path = os.path.join(tmp_dir, f"avatar_{uuid.uuid4()}{extension}")

            with open(avatar_path, "wb") as buffer:
                shutil.copyfileobj(avatar.file, buffer)

            print(f"✅ Avatar saved at: {avatar_path}")

        # Generate caption for the post
        caption = generate_caption(title)
        print("🧠 Caption generated:", caption)

        # Enqueue the task
        task = create_reddit_post_task.delay(
            avatar_path=avatar_path,
            username=username,
            title=title,
            script=script,
            caption=caption,
            voice=voice,
            video=video,
            font=font,
            user_email=user_email
        )

        print("📦 Task queued:", task.id)

        return JSONResponse(content={
            "task_id": task.id,
            "status": "processing",
            "message": "Your Reddit post is being created. You will be notified via email when it's ready."
        })

    except Exception as e:
        # Clean up avatar file if it exists
        if avatar_path and os.path.exists(avatar_path):
            shutil.rmtree(os.path.dirname(avatar_path), ignore_errors=True)

        print("❌ Exception occurred in /create-reddit-post:")
        traceback.print_exc()  # Shows full traceback in logs

        raise HTTPException(status_code=500, detail={
            "error": str(e),
            "detail": "Internal server error occurred."
        })

@router.get("/task-status/{task_id}")
async def get_task_status(task_id: str):
    try:
        task = celery_app.AsyncResult(task_id)
        
        # Initialize response structure
        response = {
            'status': task.state.lower(),
            'task_id': task_id,
            'percent_complete': 0
        }

        print(f"Task state: {task.state}, info: {task.info}")

        # Check active workers
        print(celery_app.control.inspect().active())
        
        if task.state == 'PENDING':
            response.update({
                'message': 'Task is waiting for execution'
            })
        
        elif task.state in ['STARTED', 'PROGRESS']:
            # Extract the meta information provided by update_state
            if isinstance(task.info, dict):
                # Get the status message
                message = task.info.get('status', 'Task is in progress')
                # Get percent complete
                percent_complete = task.info.get('percent_complete', 0)
                # Add any additional metadata
                for key, value in task.info.items():
                    if key not in ['status', 'percent_complete']:
                        response[key] = value
            else:
                message = 'Task is in progress'
                percent_complete = 0
            
            response.update({
                'message': message,
                'percent_complete': percent_complete
            })
        
        elif task.state == 'FAILURE':
            response.update({
                'message': str(task.info) if task.info else 'Task failed'
            })
        
        elif task.state == 'SUCCESS':
            # When task is successful, set percent_complete to 100
            if isinstance(task.info, dict):
                result = task.info
                percent_complete = task.info.get('percent_complete', 100)
            else:
                result = task.info
                percent_complete = 100
            
            response.update({
                'result': result,
                'percent_complete': percent_complete
            })
        
        else:
            # Handle any other states
            if isinstance(task.info, dict):
                message = task.info.get('status', '')
                percent_complete = task.info.get('percent_complete', 0)
                # Include all other fields from task.info
                for key, value in task.info.items():
                    if key not in ['status', 'percent_complete']:
                        response[key] = value
            else:
                message = str(task.info) if task.info else ''
                percent_complete = 0
            
            response.update({
                'message': message,
                'percent_complete': percent_complete
            })
        
        return JSONResponse(content=response)
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})