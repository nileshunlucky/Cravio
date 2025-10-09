from celery import Celery
import ssl

# Secure SSL context
ssl_context = {
    'ssl_cert_reqs': ssl.CERT_REQUIRED,  # Validate SSL certs in production
    'ssl_ca_certs': '/etc/ssl/certs/ca-certificates.crt',  # Adjust path if you're on a different OS or container
}

celery_app = Celery(
    "reddit_story_app",
    broker="rediss://default:Ae3dAAIjcDE1ODgwYTk0MjZlOWY0ZTIzOGY1ZTJlY2EzODYyYTZlYXAxMA@rested-chow-60893.upstash.io:6379",
    backend="rediss://default:Ae3dAAIjcDE1ODgwYTk0MjZlOWY0ZTIzOGY1ZTJlY2EzODYyYTZlYXAxMA@rested-chow-60893.upstash.io:6379",
    include=["tasks.persona_task", "tasks.image_task", "tasks.opus_task", "tasks.content_task"],
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
    task_time_limit=7200,  # 2 hours
    task_soft_time_limit=7100,
    result_expires=3600,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    redis_max_connections=20,
)
