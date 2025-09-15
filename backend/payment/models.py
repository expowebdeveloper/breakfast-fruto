from django.db import models
from django.conf import settings


class StripeInvoice(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="invoices",
        null=True,
        blank=True,
    )
    invoice_id = models.CharField(max_length=255, unique=True)
    customer_id = models.CharField(max_length=255, null=True, blank=True)
    amount_due = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    currency = models.CharField(max_length=10, null=True, blank=True)
    status = models.CharField(max_length=50, null=True, blank=True)
    payment_intent = models.CharField(max_length=255, null=True, blank=True)
    pdf_file = models.FileField(upload_to="invoices/", null=True, blank=True)

    def __str__(self):
        return f"Invoice {self.invoice_id} - {self.status}"
