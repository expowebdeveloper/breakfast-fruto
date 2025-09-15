from django.db import models
import os
from contact.models import BaseModel
from dotenv import load_dotenv
from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework.response import Response

class WelcomePopup(BaseModel):
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(blank=True, null=True, upload_to="WelcomePopup")
    navigation_path = models.CharField(max_length=100, default=settings.FRONTEND_URL)
    button_text = models.CharField(max_length=50, default="Shop With Us")

    def clean(self):
        if WelcomePopup.objects.exists() and not self.pk:
            raise ValidationError("You can only add one Pop Up Message")

    def save(self, *args, **kwargs):
        if WelcomePopup.objects.exists() and not self.pk:
            raise ValidationError("You can only add one Pop Up Message")
        else:
            return super(WelcomePopup, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.title}"

