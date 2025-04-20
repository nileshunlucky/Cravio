from celery import Celery
import os
import logging
# Get Redis URL from environment variable or use a default
REDIS_URL = os.getenv("REDIS_URL")

# Create Celery app
celery_app = Celery(
    "reddit_story_app",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['tasks.reddit_story_task']  # Include the task modules here
)

logging.basicConfig(level=logging.INFO)

# Optional: Configure Celery with additional settings
celery_app.conf.update(
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    broker_connection_timeout=10,
    broker_pool_limit=10,
    broker_heartbeat=30,
    task_track_started=True,
    redis_max_connections=20,
    worker_prefetch_multiplier=1,
    task_time_limit=300,  # Give tasks up to 5 minutes
    task_soft_time_limit=240 ,
    result_expires=3600,  # Results expire after 1 hour
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Add this after your celery_app creation
celery_app.conf.broker_transport_options = {
    'retry_policy': {
        'timeout': 5.0,
        'max_retries': 3,
        'interval_start': 0.2,
        'interval_step': 0.5,
        'interval_max': 3.0,
    }
}