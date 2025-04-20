from celery import Celery
import os
import ssl
import logging

REDIS_URL = os.getenv("REDIS_URL")  # e.g., rediss://default:<password>@<host>:6379

celery_app = Celery(
    "reddit_story_app",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks.reddit_story_task"]
)

logging.basicConfig(level=logging.INFO)

celery_app.conf.update(
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    broker_connection_timeout=10,
    broker_pool_limit=10,
    broker_heartbeat=30,
    task_track_started=True,
    redis_max_connections=20,
    worker_prefetch_multiplier=1,
    task_time_limit=300,
    task_soft_time_limit=240,
    result_expires=3600,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Only add SSL config if using `rediss://`
if REDIS_URL.startswith("rediss://"):
    celery_app.conf.broker_use_ssl = {
        "ssl_cert_reqs": ssl.CERT_NONE  # or CERT_REQUIRED if needed, usually NONE is okay for Render
    }
    celery_app.conf.redis_backend_use_ssl = {
        "ssl_cert_reqs": ssl.CERT_NONE
    }
