import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "breakfast_backend.settings")

app = Celery("breakfast_backend")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.conf.beat_schedule = {
    "send-low-stock-notifications-every-minute": {
        "task": "notification.tasks.send_low_stock_notifications",
        "schedule": crontab(minute="*/1"),
    },
}

app.conf.timezone = "UTC"

app.autodiscover_tasks()
