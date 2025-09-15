from django.db import models


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        abstract = True
        

class CustomerQuery(BaseModel):

    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    contact_no = models.CharField(max_length=255)
    message = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.email or "Query"