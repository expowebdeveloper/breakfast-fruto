from celery import shared_task
from django.utils.timezone import now
from orders.models import ScheduledDelivery, ScheduledDeliveryDate
from django.core.mail import send_mail

from celery import shared_task
from django.utils.timezone import now
from .models import ScheduledDelivery, ScheduledDeliveryDate
from django.core.mail import send_mail


@shared_task
def process_scheduled_deliveries():
    """
    This task checks all scheduled deliveries for today and marks them as 'Out for Delivery'.
    """
    today = now().date()
    deliveries = ScheduledDelivery.objects.filter(
        delivery_status="pending", delivery_type="scheduled"
    ).filter(
        delivery_dates__delivery_date=today
    ).distinct()

    for delivery in deliveries:
        delivery.delivery_status = "out_for_delivery"
        delivery.save()

        # Send notification (Example: Email)
        send_mail(
            "Your Delivery is on the Way!",
            f"Hello {delivery.user.username}, your scheduled delivery is out for delivery today!",
            "support@yourstore.com",
            [delivery.user.email],
            fail_silently=True,
        )

    return f"{deliveries.count()} deliveries processed for {today}."


@shared_task
def complete_deliveries():
    """
    This task marks deliveries as 'Delivered' after a certain time.
    """
    from datetime import timedelta

    check_time = now() - timedelta(hours=6)
    deliveries = ScheduledDelivery.objects.filter(
        delivery_status="out_for_delivery", updated_at__lte=check_time
    )

    for delivery in deliveries:
        delivery.delivery_status = "delivered"
        delivery.save()

    return f"{deliveries.count()} deliveries marked as 'Delivered'."


