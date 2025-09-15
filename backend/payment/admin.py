from django.contrib import admin
from payment.models import StripeInvoice

admin.site.register(StripeInvoice)
