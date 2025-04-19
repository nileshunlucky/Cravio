from fastapi import APIRouter, UploadFile, Form, BackgroundTasks
from fastapi.responses import JSONResponse
import os
from tasks.reddit_story_task import create_reddit_post_task, generate_script, generate_title, generate_caption
from celery_config import celery_app
import tempfile
import shutil
import uuid

router = APIRouter()
OUTPUT_FOLDER = "output"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@router.post("/generate-content")
async def generate_content(prompt: str = Form(...)):
    print(f"Received prompt: {prompt}")
    """
    This endpoint generates a title and a script based on the provided prompt.
    It first uses GPT-3.5-turbo to generate a title, then uses the title to generate a script.
    """
    try:
        # Generate title
        title = generate_title(prompt)
        
        # Generate script using the title
        script = generate_script(title)
        
        # Return the title and script as a JSON response
        return JSONResponse(content={"title": title, "script": script})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/create-reddit-post")
async def create_reddit_post(
    background_tasks: BackgroundTasks,
    avatar: UploadFile = None,
    username: str = Form(...),
    title: str = Form(...),
    script: str = Form(...),
    voice: str = Form(...),
    video: str = Form(...),
    font: str = Form(...),
    user_email: str = Form(...)
):
    """
    Handles the creation of a Reddit post asynchronously using Celery.
    It immediately returns a task ID and processes the job in the background.
    """
    try:
        # Save avatar file temporarily if provided
        avatar_path = None
        if avatar:
            # Create a temp file for the avatar
            tmp_dir = tempfile.mkdtemp()
            avatar_path = os.path.join(tmp_dir, "avatar_" + str(uuid.uuid4()) + os.path.splitext(avatar.filename)[1])
            
            # Save the avatar file
            with open(avatar_path, "wb") as buffer:
                shutil.copyfileobj(avatar.file, buffer)
        
        # Generate caption for the post
        caption = generate_caption(title)
        
        # Queue the task in Celery
        task = create_reddit_post_task.delay(
            username=username,
            title=title,
            script=script,
            caption=caption,
            voice=voice,
            video=video,
            font=font,
            avatar_path=avatar_path,
            user_email=user_email
        )
        
        return JSONResponse(content={
            "task_id": task.id,
            "status": "processing",
            "message": "Your Reddit post is being created. You will be notified via email when it's ready."
        })
        
    except Exception as e:
        if avatar_path and os.path.exists(avatar_path):
            # Clean up temp files if they exist
            shutil.rmtree(os.path.dirname(avatar_path))
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/task-status/{task_id}")
async def get_task_status(task_id: str):
    """
    Get the status of a task by its ID.
    """
    try:
        task = celery_app.AsyncResult(task_id)
        
        if task.state == 'PENDING':
            response = {
                'status': 'pending',
                'message': 'Task is waiting for execution'
            }
        elif task.state == 'FAILURE':
            response = {
                'status': 'failed',
                'message': str(task.info)
            }
        else:
            response = {
                'status': task.state.lower(),
                'message': task.info.get('status', '') if isinstance(task.info, dict) else '',
                'result': task.info.get('result', '') if isinstance(task.info, dict) else task.info
            }
        
        return JSONResponse(content=response)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.delete("/cancel-task/{task_id}")
async def cancel_task(task_id: str):
    """
    Cancel a running task by its ID.
    """
    try:
        celery_app.control.revoke(task_id, terminate=True)
        return JSONResponse(content={"status": "cancelled", "message": f"Task {task_id} has been cancelled"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})