from celery_config import celery_app

# This file is used to start the Celery worker
# Run it with: celery -A celery_worker worker --loglevel=info

if __name__ == '__main__':
    celery_app.start()