from django.db import models
from django.core.validators import RegexValidator

from account.models import BaseModel


class ClientData(BaseModel):
    satisfied_clients = models.IntegerField(default=0)
    expert_team = models.IntegerField(default=0)
    activate_products = models.IntegerField(default=0)
    award_winning = models.IntegerField(default=0)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=15,
        validators=[
            RegexValidator(
                r"^\d{10,15}$",
                message="Enter a valid contact number with 10-15 digits.",
            )
        ],
    )

    address = models.TextField()

    def __str__(self):
        return f"{self.email}"


class Subscriber(BaseModel):
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email
