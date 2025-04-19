from celery import Celery
import os

# Get Redis URL from environment variable or use a default
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "reddit_story_app",
    broker=redis_url,
    backend=redis_url,
    include=['tasks.reddit_story_task']  # Include the task modules here
)

# Optional: Configure Celery with additional settings
celery_app.conf.update(
    result_expires=3600,  # Results expire after 1 hour
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)