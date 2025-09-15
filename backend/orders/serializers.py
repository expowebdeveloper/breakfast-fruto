from rest_framework import serializers
from orders.models import (Order,
                    OrderItem,
                    OrderStatus,
                    Invoice,
                    ScheduledDelivery)
from product.serializers import ProductVariantSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"] 
        

class ContactInformationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    contact_number = serializers.CharField(max_length=15)


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductVariantSerializer()

    class Meta:
        model = OrderItem
        fields = ("quantity", "price", "product")


class OrderInvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for listing and retrieving invoices with additional fields.
    """

    class Meta:
        model = Invoice
        fields = [
            "invoice_number",
            "status",
            "pdf_file",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    invoice = OrderInvoiceSerializer(read_only=True)
    customer_type = serializers.CharField(source="user.customer.customer_type", read_only=True)

    user = UserSerializer(read_only=True)
    class Meta:
        model = Order
        fields = (
            "id",
            "user",
            "email",
            "customer_name",
            'customer_type',
            "delivery_date",
            "contact_number",
            "session_id",
            "payment_method",
            "total_amount",
            "discount_amount",
            "gift_wrap_price",
            "order_packaging_charge",
            "reasion_for_declined",
            "platform_fee",
            "delivery_fees",
            "taxes",
            "subtotal",
            "items",
            "order_id",
            "final_amount",
            "status",
            "created_at",
            "invoice",
            "address",
            "status_updated_at",
        )


class OrderApprovalStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=OrderStatus.choices(), required=True)


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for listing and retrieving invoices with additional fields.
    """

    order = OrderSerializer()
    username = serializers.SerializerMethodField()
    order_date = serializers.DateTimeField(source="order.created_at", read_only=True)
    customer_type = serializers.CharField(source="user.customer.customer_type", read_only=True)
    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "status",
            "username",
            "order",
            "order_date",
            "total_amount",
            "updated_at",
            "pdf_file",
            'customer_type'
        ]

    def get_username(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"


class InvoiceStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating the status of an invoice.
    """

    class Meta:
        model = Invoice
        fields = ["status"]


class ScheduledDeliverySerializer(serializers.ModelSerializer):
    holiday_reason = serializers.SerializerMethodField()

    class Meta:
        model = ScheduledDelivery
        fields = [
            "id",
            "user_basket",
            "delivery_type",
            "delivery_date",
            "next_delivery_time",
            "delivery_status",
            "holiday_reason",
        ]

    def get_holiday_reason(self, obj):
        return obj.check_for_holiday()


class InvoiceIDSerializer(serializers.Serializer):
    invoice_id = serializers.IntegerField()

    def validate_invoice_id(self, value):
        """
        Validate that the invoice ID exists.
        """
        if not Invoice.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invoice with this ID does not exist.")
        return value
