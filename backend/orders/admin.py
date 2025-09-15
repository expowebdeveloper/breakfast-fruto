from django.contrib import admin

from orders.models import (
    Order, OrderItem, Invoice, Note, ScheduledDelivery,
    ScheduledDeliveryDate
)

# Register your models here.
admin.site.register(OrderItem)


class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "email",
        "customer_name",
        "contact_number",
        "session_id",
        "payment_method",
        "reasion_for_declined",
        "address",
        "delivery_date",
        "total_amount",
        "status",
        "order_id",
        "created_at",
        "status_updated_at",
    )


admin.site.register(Order, OrderAdmin)
admin.site.register(Invoice)
admin.site.register(Note)
admin.site.register(ScheduledDelivery)
admin.site.register(ScheduledDeliveryDate)

