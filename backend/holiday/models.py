from django.db import models
from account.models import BaseModel
from datetime import datetime


class Holiday(BaseModel):
    date = models.DateField()
    day = models.CharField(max_length=9, blank=True, null=True)
    holiday = models.CharField(max_length=100)
    restricted = models.BooleanField(default=False)


    def save(self, *args, **kwargs):
        if isinstance(self.date, str):
            self.date = datetime.strptime(self.date, "%Y-%m-%d").date()

        if not self.day:
            self.day = self.date.strftime("%A")  # ✅ Auto-fill day from date

        super(Holiday, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.holiday} on {self.date} ({self.day})"
