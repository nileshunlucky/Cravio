from celery import Celery
import os

# Get Redis URL from environment variable or use a default
REDIS_URL = os.getenv("REDIS_URL")

# Create Celery app
celery_app = Celery(
    "reddit_story_app",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['tasks.reddit_story_task']  # Include the task modules here
)

# Optional: Configure Celery with additional settings
celery_app.conf.update(
    task_time_limit=300,  # Give tasks up to 5 minutes
    task_soft_time_limit=240 ,
    result_expires=3600,  # Results expire after 1 hour
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)