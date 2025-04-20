from celery import Celery
import os
import logging
import ssl

REDIS_URL = os.getenv("REDIS_URL")  # should be rediss://....

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

# In your Celery configuration
celery_app.conf.broker_use_ssl = {
    'ssl_cert_reqs': ssl.CERT_REQUIRED,
    'ssl_ca_certs': '/path/to/ca/cert.pem',  # Path to CA certificate
}

# Similar for result backend
celery_app.conf.redis_backend_use_ssl = {
    'ssl_cert_reqs': ssl.CERT_REQUIRED,
    'ssl_ca_certs': '/path/to/ca/cert.pem',
}