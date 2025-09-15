from django.contrib import admin

from customer.models import Customer, CustomerAddress, CustomerOTP

# Register your models here.

admin.site.register(Customer)
admin.site.register(CustomerOTP)
admin.site.register(CustomerAddress)
