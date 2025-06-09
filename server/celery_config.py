from celery import Celery
import ssl

# Secure SSL context
ssl_context = {
    'ssl_cert_reqs': ssl.CERT_REQUIRED,  # Validate SSL certs in production
    'ssl_ca_certs': '/etc/ssl/certs/ca-certificates.crt',  # Adjust path if you're on a different OS or container
}

celery_app = Celery(
    "reddit_story_app",
    broker="rediss://default:AV_tAAIjcDFkYzYyMDY1ZmE1MTI0OTE4ODY3ZmIwZjNkMDY0MjJjMnAxMA@present-wren-24557.upstash.io:6379",
    backend="rediss://default:AV_tAAIjcDFkYzYyMDY1ZmE1MTI0OTE4ODY3ZmIwZjNkMDY0MjJjMnAxMA@present-wren-24557.upstash.io:6379",
    include=["tasks.opusclip_task"]
)

celery_app.conf.update(
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    broker_connection_timeout=30,
    broker_pool_limit=10,
    broker_heartbeat=30,
    broker_use_ssl=ssl_context,
    redis_backend_use_ssl=ssl_context,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_time_limit=300,
    task_soft_time_limit=240,
    result_expires=3600,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    redis_max_connections=20,
)
