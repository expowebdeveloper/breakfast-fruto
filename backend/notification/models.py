from django.db import models
from django.utils.translation import gettext_lazy as _

from account.models import BaseModel, CustomUser


class Notification(models.Model):

    class NOTIFICATION_TYPES(models.TextChoices):
        message = "message", "Message"
        reminder = "reminder", "Reminder"
        alert = "alert", "Alert"

    recipient = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="notifications"
    )
    sender = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )
    notification_type = models.CharField(
        _("Coupon Type"),
        max_length=100,
        choices=NOTIFICATION_TYPES.choices,
        default=NOTIFICATION_TYPES.message,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    meta_data = models.JSONField(null=True, blank=True)

    def __str__(self):
        status = "Read" if self.is_read else "Unread"
        return f"{self.notification_type} to {self.recipient}-{status}"

    class Meta:
        ordering = ["-created_at"]


class AdminNotification(BaseModel):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    low_stock = models.BooleanField(default=True)
    order_placed = models.BooleanField(default=True)
    alert_notification = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email}"


class EmailNotification(BaseModel):
    email = models.CharField(max_length=255)
    subscription = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.email}"
