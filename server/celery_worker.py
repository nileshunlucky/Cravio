from celery_config import celery_app
import warnings
from celery.platforms import SecurityWarning

# This file is used to start the Celery worker
# Run it with: celery -A celery_worker worker --loglevel=info

# Suppress the root user warning
warnings.filterwarnings("ignore", category=SecurityWarning)

if __name__ == '__main__':
    celery_app.start()