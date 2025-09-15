from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.timezone import now

from account.models import CustomUser
from cart.models import Cart
from coupon.models import UserCoupon
from product.models import Inventory
from notification.models import AdminNotification, Notification
from notification.tasks import send_order_notification_to_admin
from notification.utils import send_notification_email
from orders.models import Invoice, Order, OrderItem, OrderStatus, order_status_changed
from orders.utils import generate_invoice_number, generate_invoice_pdf

User = get_user_model()


@receiver(post_save, sender=Order)
def SendOrderCreatedNotification(sender, instance, **kwargs):
    send_order_notification_to_admin(instance.id)


@receiver(post_save, sender=OrderItem)
def UpdateProductQuantityWithOrder(sender, instance, created, **kwargs):
    print(f"🚀 Signal Triggered: created={created}, instance={instance}")

    if created:
        with transaction.atomic():
            if instance.product:
                product_variant = instance.product

                if not hasattr(product_variant, "inventory_items") or not product_variant.inventory_items:
                    print("⚠️ Error: Product has no inventory items!")
                    return

                # Lock the inventory row to prevent race conditions
                inventory = product_variant.inventory_items
                inventory = Inventory.objects.select_for_update().get(id=inventory.id)

                print(f"Before Update: {inventory.total_quantity}")

                if inventory.total_quantity >= instance.quantity:
                    inventory.total_quantity -= instance.quantity
                    inventory.save()
                    print(f"✅ Updated Quantity: {inventory.total_quantity}")
                else:
                    inventory.total_quantity = 0
                    inventory.save()
            elif instance.basket:
                basket = instance.basket

                for basket_item in basket.items.all():
                    try:
                        # ✅ Lock inventory row for each item
                        inventory = Inventory.objects.select_for_update().get(product_variant=basket_item.product_variant)
                    except Inventory.DoesNotExist:
                        print(f"⚠️ Error: No inventory found for product variant {basket_item.product_variant}")
                        continue  # Skip this item but continue with others

                    print(f"Before Update (Basket Item): {inventory.total_quantity}")

                    if inventory.total_quantity >= basket_item.quantity:
                        inventory.total_quantity -= basket_item.quantity
                    else:
                        inventory.total_quantity = 0  # **Prevent negative inventory**
                    
                    inventory.save()
                    print(f"✅ Updated Quantity (Basket Item): {inventory.total_quantity}")


# @receiver(post_save, sender=Order)
# def RedeemUserCoupon(sender, instance, created, **kwargs):

#     if created:
#         cart = Cart.objects.filter(user=instance.user).last()
#         try:
#             applied_coupon = UserCoupon.objects.get(
#                 user=instance.user, coupon=cart.applied_coupon
#             )
#         except UserCoupon.DoesNotExist:
#             pass
#         else:
#             if applied_coupon:
#                 applied_coupon.redeemed = True
#                 applied_coupon.redemption_date = timezone.now()
#                 if applied_coupon.maximum_usage > 1:
#                     applied_coupon.maximum_usage -= 1

#                 applied_coupon.save()
#                 coupon = applied_coupon.coupon
#                 if coupon.maximum_usage_value > 1:
#                     coupon.maximum_usage_value -= 1
#                     coupon.save()


@receiver(post_save, sender=Order)
def create_invoice(sender, instance, created, **kwargs):

    if instance.status == OrderStatus.PAYMENT_PENDING.value and not hasattr(
        instance, "invoice"
    ):

        invoice = Invoice.objects.create(
            invoice_number=generate_invoice_number(),
            user=instance.user,
            order=instance,
            total_amount=instance.final_amount,
        )
        pdf_file = generate_invoice_pdf(invoice)
        invoice.pdf_file.save(f"{invoice.invoice_number}.pdf", pdf_file)

    elif not hasattr(instance, "invoice"):
        invoice = Invoice.objects.create(
            invoice_number=generate_invoice_number(),
            user=instance.user,
            order=instance,
            total_amount=instance.final_amount,
        )
        pdf_file = generate_invoice_pdf(invoice)
        invoice.pdf_file.save(f"{invoice.invoice_number}.pdf", pdf_file)

@receiver(order_status_changed)
def send_order_status_update_email(sender, instance, old_status, **kwargs):
    subject = f"Order #{instance.order_id} Status Update"
    message = (
        f"Dear {instance.user.first_name},\n\n"
        f"The status of your order (ID: {instance.order_id}) \
         has been updated from '{old_status}' to '{instance.status}'.\n\n"
        "Thank you for shopping with us.\n\n"
        "Best regards,\n"
        "The Bakery Team"
    )
    admin_users = CustomUser.objects.filter(is_superuser=True, role="accountant")
    if not admin_users.exists():
        return "No admin users found."
    admin_notifications = AdminNotification.objects.filter(user__in=admin_users)
    for admin_notification in admin_notifications:
        if admin_notification.order_placed:
            Notification.objects.create(
                recipient=admin_notification.user,
                title=subject,
                message=message,
                notification_type=Notification.NOTIFICATION_TYPES.alert,
            )
    admin_emails = list(admin_users.values_list("email", flat=True))

    send_notification_email(
        subject,
        message,
        admin_emails,
    )

    Notification.objects.create(
        recipient=instance.user,
        title=subject,
        message=message,
        notification_type=Notification.NOTIFICATION_TYPES.alert,
    )
    send_notification_email(
        subject,
        message,
        [instance.email],
    )


@receiver(pre_save, sender=Order)
def track_status_change(sender, instance, **kwargs):
    try:
        # Get the previous version of the order
        previous = sender.objects.get(pk=instance.pk)
        if (
            previous.status == OrderStatus.PAYMENT_PENDING.value
            and instance.status == OrderStatus.IN_PROGRESS.value
        ):
            subject = f"Order #{instance.order_id} Status Update"
            message = (
                f"Dear {instance.user.first_name},\n\n"
                f"The status of your order (ID: {instance.order_id}) \
                has been updated from '{previous.status}' to '{instance.status}'.\n\n"
                "Thank you for shopping with us.\n\n"
                "Best regards,\n"
                "The Bakery Team"
            )
            # Trigger the custom signal
            print("Subject: ", subject)
            print("Message: ", message)

            send_notification_email(
                subject,
                message,
                [instance.email],
            )
    except sender.DoesNotExist:
        pass


@receiver(pre_save, sender=Invoice)
def update_updated_at_on_status_change(sender, instance, **kwargs):
    if instance.pk:  # Ensure it's an update, not a new creation
        previous_invoice = Invoice.objects.filter(pk=instance.pk).first()
        if previous_invoice and previous_invoice.status != instance.status:
            # Update the updated_at field when the status changes
            instance.updated_at = now()
