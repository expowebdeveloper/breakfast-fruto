from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.core.mail import send_mail
import os
import re
from breakfast_backend.settings import BASE_DIR
from notification.models import Notification

from string import Template
def send_notification_email(
    subject,
    message,
    recipients=None,
    email_body_html=None,
):
    """
    Sends an email notification.

    Parameters:
    - subject (str): The subject of the email.
    - message (str): The body of the email.
    - recipient (str, optional): The recipient's email address.
      Defaults to ADMIN_EMAIL in settings.

    """

    if email_body_html is None:
        template_path = os.path.join(BASE_DIR, "templates", "emails", "admin_notification.html")
        with open(template_path, "r") as template_file:
            email_body_html = template_file.read()
    else:
        template_path = os.path.join(BASE_DIR, "templates", "emails", "admin_notification.html")
        with open(template_path, "r") as template_file:
            email_body_html = message

    template = Template(email_body_html)

    # Extract order ID and statuses using regex
    order_id_match = re.search(r'ID:\s*(ORD-[A-Z0-9]+)', message)
    status_match = re.search(r"from '([^']+)' to '([^']+)'", message)

    # Get values
    name_match = re.search(r"Dear\s+([A-Za-z]+),", message)
    customer_name = name_match.group(1) if name_match else "Customer"
    order_id = order_id_match.group(1) if order_id_match else None
    previous_status = status_match.group(1) if status_match else None
    current_status = status_match.group(2) if status_match else None

    html_message = email_body_html.replace(
        "{{ customer_name }}", customer_name,
    )
    html_message = html_message.replace(
        "{{ order_id }}", order_id,
    )
    html_message = html_message.replace(
        "{{ previous_status }}", previous_status,
    )
    html_message = html_message.replace(
        "{{ current_status }}", current_status,
    )
    if recipients is None:
        recipients = [settings.ADMIN_EMAIL]
    elif isinstance(recipients, str):
        recipients = [recipients]

    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        recipients,
        fail_silently=False,
        html_message=html_message,
    )

    return f"Email sent to {recipients} with subject '{subject}'"


def send_push_notification(
    user, title, message, notification_type="alert", context=None
):
    Notification.objects.create(
        recipient=user,
        title=title,
        message=message,
        notification_type=notification_type,
        meta_data=context,
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notifications_{user.id}",
        {
            "type": "send_notification",
            "title": title,
            "message": message,
            "notification_type": notification_type,
        },
    )
