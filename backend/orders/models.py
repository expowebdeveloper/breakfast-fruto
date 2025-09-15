from enum import Enum
from django.db import models
from decimal import Decimal
from account.models import BaseModel, CustomUser
from product.models import ProductVariant, UserBasket
import uuid
from account.models import CustomUser as User
from django.utils import timezone
from django.dispatch import Signal


order_status_changed = Signal()


class OrderStatus(Enum):
    PAYMENT_PENDING = "payment_pending"
    DELIVERED = "delivered"
    IN_PROGRESS = "in_progress"
    REJECTED = "rejected"
    CANCELED = "canceled"
    IN_TRANSIT = "in_transit"
    CONFIRMED = "confirmed"

    @classmethod
    def choices(cls):
        return [
            (status.value, status.name.replace("_", " ").capitalize()) for status in cls
        ]


class Order(BaseModel):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        related_name="order",
        null=True,
        blank=True,
    )
    order_id = models.CharField(max_length=50, unique=True, editable=False)
    session_id = models.CharField(
        max_length=1000, unique=True, editable=False, null=True, blank=True
    )
    payment_method = models.CharField(
        max_length=100, editable=False, null=True, blank=True
    )

    email = models.EmailField(null=True, blank=True)
    customer_name = models.CharField(max_length=15, blank=True, null=True)

    contact_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(null=True, blank=True)

    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices(),
        default=OrderStatus.PAYMENT_PENDING.value,
    )
    delivery_date = models.DateTimeField(null=True, blank=True)
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    final_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )

    gift_wrap_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    order_packaging_charge = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    platform_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )

    delivery_fees = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    taxes = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    subtotal = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    reasion_for_declined = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    status_updated_at = models.DateTimeField(null=True, blank=True)
    coupon_name = models.CharField(max_length=200, null=True, blank=True)
    payment_session_id = models.TextField(null=True, blank=True)
    

    def save(self, *args, **kwargs):
        if not self.order_id:
            self.order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"

        if not self.pk:
            self.created_at = timezone.now()
            self.status_updated_at = timezone.now()
        else:
            try:
                old_order = Order.objects.get(pk=self.pk)

                if old_order.status != self.status:
                    self.status_updated_at = timezone.now()
            except Order.DoesNotExist:
                pass

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.email}-{self.status}"


class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE,
                              related_name="items")
    product = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        related_name="order_items",
        null=True,
        blank=True,
    )
    basket = models.ForeignKey(
        UserBasket,
        on_delete=models.SET_NULL,
        related_name="basket_items",
        null=True,
        blank=True,
    )
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"OrderItem({self.order.order_id})"


class InvoiceStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    CANCELLED = "cancelled", "Cancelled"
    REFUNDED = "refunded", "Refunded"


class Invoice(BaseModel):
    invoice_number = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    order = models.OneToOneField("Order", on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    pdf_file = models.FileField(upload_to="invoices/", null=True, blank=True)
    status = models.CharField(
        ("Customer Get Types"),
        max_length=50,
        choices=InvoiceStatus.choices,
        null=True,
        blank=True,
        default=InvoiceStatus.PENDING.value,
    )

    def __str__(self):
        return f"Invoice {self.invoice_number} for Order {self.order.id}"


class Note(BaseModel):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="notes",
        null=True, blank=True
    )
    content = models.TextField()

    def __str__(self):
        return self.content


class ScheduledDelivery(BaseModel):
    """
    Handles both One-Time and Scheduled Orders.
    """

    DELIVERY_CHOICES = (
        ("one_time", "One Time Purchase"),
        ("scheduled", "Scheduled Order"),
    )

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]

    DELIVERY_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("out_for_delivery", "Out for Delivery"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.CASCADE)
    delivery_type = models.CharField(
        max_length=20, choices=DELIVERY_CHOICES, null=True, blank=True
    )
    delivery_status = models.CharField(
        max_length=50, choices=DELIVERY_STATUS_CHOICES, default="pending"
    )
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )
    stripe_payment_intent = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Scheduled Delivery for Order {self.order.id} - {self.delivery_type}"


class ScheduledDeliveryDate(BaseModel):
    """
    Stores scheduled delivery dates for users who select the 'Scheduled Order' option.
    """
    scheduled_delivery = models.ForeignKey(
        ScheduledDelivery,
        on_delete=models.CASCADE,
        related_name="delivery_dates",
        null=True,
        blank=True,
    )
    delivery_date = models.DateField()
    is_holiday = models.BooleanField(default=False)
    holiday_reason = models.CharField(max_length=100, blank=True, null=True)
    def __str__(self):
        return f"Scheduled on {self.delivery_date} - Holiday: {self.is_holiday}"


class OneTimeDeliveryDate(BaseModel):
    """
    Stores a single delivery date for users who choose 'One Time Purchase'.
    """
    scheduled_delivery = models.OneToOneField(
        ScheduledDelivery,
        on_delete=models.CASCADE,
        related_name="one_time_delivery",
        null=True,
        blank=True,
    )
    delivery_date = models.DateField()

    def __str__(self):
        return f"One-time delivery on {self.delivery_date}"
