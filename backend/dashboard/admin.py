from django.contrib import admin

from dashboard.models import (
    ZipCodeConfig,
    AdminConfiguration,
    AdminInvoiceConfiguration,
)

admin.site.register(ZipCodeConfig)
admin.site.register(AdminConfiguration)
admin.site.register(AdminInvoiceConfiguration)


