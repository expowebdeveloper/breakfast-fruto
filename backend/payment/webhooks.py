from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import stripe
import os
import logging
from django.conf import settings
from django.db import transaction
from account.models import *
from cart.models import Cart
from customer.models import CustomerAddress
from datetime import datetime
from orders.models import ScheduledDelivery, Order, OrderItem, OneTimeDeliveryDate, ScheduledDeliveryDate, Invoice
from orders.utils import generate_invoice_pdf


stripe.api_key = settings.STRIPE_API_KEY
LOG_FILE_PATH = os.path.join(settings.BASE_DIR, "logs", "stripe_webhook.log")

logging.basicConfig(
    filename=LOG_FILE_PATH,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

@csrf_exempt
def stripe_webhook(request):
    """Handles Stripe payment confirmation and creates the order."""
    logger.info("🔔 Stripe webhook received!")

    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        logger.error("❌ Invalid Stripe signature")
        return JsonResponse({"error": "Invalid webhook signature"}, status=400)

    logger.info(f"Stripe event received: {event['type']}")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})

        logger.info(f"📦 Metadata extracted: {metadata}")  # ✅ Debug metadata

        # Retrieve metadata safely
        order_type = metadata.get("order_type")
        user_id = metadata.get("user_id")
        cart_id = metadata.get("cart_id")
        address_id = metadata.get("address_id")
        time_slot_id = metadata.get("time_slot_id", None)
        session_id = session["id"]
        scheduled_dates_str = metadata.get("scheduled_dates", "")

        # ✅ Improved error handling for missing metadata
        missing_fields = [key for key, value in metadata.items() if not value]
        if missing_fields:
            logger.error(f"⚠️ Missing metadata fields: {missing_fields}")
            return JsonResponse({"error": f"Missing metadata fields: {missing_fields}"}, status=400)

        try:
            with transaction.atomic():
                user = CustomUser.objects.get(id=user_id)
                cart = Cart.objects.get(id=cart_id)
                address = CustomerAddress.objects.get(id=address_id)

                cart_items = cart.items.all()
                if not cart_items.exists():
                    logger.error("⚠️ Cart is empty, order not created.")
                    return JsonResponse({"error": "Cart is empty, order not created."}, status=400)

                # Construct order details
                customer_name = f"{user.first_name} {user.last_name}".strip()
                shipping_address_str = (
                    f"{address.address}, {address.city}, {address.state}, {address.country}, {address.zipcode}"
                )

                # ✅ Create Order
                order = Order.objects.create(
                    user=user,
                    email=user.email,
                    contact_number=user.customer.contact_no,
                    address=shipping_address_str,
                    final_amount=cart.total_with_vat,
                    total_amount=cart.total_price,
                    gift_wrap_price=cart.gift_wrap_price,
                    order_packaging_charge=cart.order_packaging_charge,
                    delivery_fees=cart.delivery_fees,
                    customer_name=customer_name,
                    status="confirmed",
                    platform_fee=cart.platform_fee,
                    payment_session_id=session_id
                )

                logger.info(f"✅ Order {order.id} created!")
                # ✅ Handle One-Time Purchase
                if order_type == "one_time":
                    logger.info(f"📦 Handling One-Time Order {order.id}")
                    s = ScheduledDelivery.objects.create(
                        user=user,
                        order=order,
                        delivery_type="one_time",
                        delivery_status="confirmed",
                        payment_status="paid"
                        
                    )
                # ✅ Handle Scheduled Purchase
                elif order_type == "scheduled":
                    logger.info(f"📦 Handling Scheduled Order {order.id}")
                    scheduled_delivery = ScheduledDelivery.objects.create(
                        user=user,
                        order=order,
                        delivery_type="scheduled",
                        delivery_status="confirmed",
                        payment_status="paid"
                    )

                    scheduled_dates = scheduled_dates_str.split(",")

                    for delivery_date_str in scheduled_dates:
                        try:
                            delivery_date = datetime.strptime(delivery_date_str, "%Y-%m-%d").date()
                            ScheduledDeliveryDate.objects.create(
                                scheduled_delivery=scheduled_delivery,
                                delivery_date=delivery_date,
                                is_holiday=False,
                            )
                        except ValueError:
                            logger.warning(f"⚠️ Invalid date format: {delivery_date_str}")

                # ✅ Add Order Items
                for cart_item in cart_items:
                    print("Cart Item: ", cart_item)

                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product_variant,
                        basket=cart_item.user_basket,
                        quantity=cart_item.quantity,
                        price=cart_item.item_price,
                    )

                logger.info(f"✅ {cart_items.count()} items added to order {order.id}")

                # ✅ Clear Cart
                cart_items.delete()
                print("Cart Items: ", cart_items)
                cart.applied_coupon = None
                cart.save()
                invoice = Invoice.objects.get(order=order.id)
                pdf_file = generate_invoice_pdf(invoice)
                
                invoice.status='paid'
                invoice.save()
                invoice.pdf_file.save(f"{invoice.invoice_number}.pdf", pdf_file)

                return JsonResponse({"message": "Order created successfully", "order_id": order.id}, status=200)

        except CustomUser.DoesNotExist:
            logger.error(f"User {user_id} not found")
            return JsonResponse({"error": "User not found"}, status=400)
        except Cart.DoesNotExist:
            logger.error(f"Cart {cart_id} not found")
            return JsonResponse({"error": "Cart not found"}, status=400)
        except CustomerAddress.DoesNotExist:
            logger.error(f"Address {address_id} not found")
            return JsonResponse({"error": "Address not found"}, status=400)
        except Exception as e:
            logger.error(f"Order creation failed: {str(e)}")
            return JsonResponse({"error": "Error creating order", "detail": str(e)}, status=500)

    return JsonResponse({"message": "Event received"}, status=200)
