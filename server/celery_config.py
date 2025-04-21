from celery import Celery
import os
import ssl
import logging

logging.basicConfig(level=logging.INFO)

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL")  # Example: rediss://:<password>@<host>:<port>

# Initialize Celery app
celery_app = Celery(
    "reddit_story_app",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["api.tasks.reddit_story_task"]
)

# Update Celery configuration for production settings
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

# SSL configuration for secure production connection
celery_app.conf.broker_use_ssl = {
    'ssl_cert_reqs': ssl.CERT_REQUIRED,  # Ensure the certificate is required
    'ssl_ca_certs': '/path/to/ca.pem',   # Path to CA certificate
    'ssl_certfile': '/path/to/client_cert.pem',  # Path to client certificate
    'ssl_keyfile': '/path/to/client_key.pem',    # Path to client private key
    'ssl_version': ssl.PROTOCOL_TLSv1_2  # Force TLSv1.2 (more secure)
}

celery_app.conf.redis_backend_use_ssl = {
    'ssl_cert_reqs': ssl.CERT_REQUIRED,  # Require certificate
    'ssl_ca_certs': '/path/to/ca.pem',   # Path to CA certificate
    'ssl_certfile': '/path/to/client_cert.pem',  # Path to client certificate
    'ssl_keyfile': '/path/to/client_key.pem',    # Path to client private key
    'ssl_version': ssl.PROTOCOL_TLSv1_2  # Ensure TLSv1.2 is used
}

