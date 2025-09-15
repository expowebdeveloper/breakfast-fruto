import os
import logging
from datetime import timedelta, date
import uuid
from account.models import CustomUser
from rest_framework import status
from django.conf import settings
import stripe
from datetime import time
from django.core.mail import send_mail

from io import BytesIO

from django.utils import timezone
from product.models import TimeSlotConfiguration
from holiday.models import Holiday
from django.db.models import Q, Value
from django.db.models.functions import Concat
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound

from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string

from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_yasg.utils import swagger_auto_schema
from account.permissions import IsAccountant, AllowGetOnlyIsAdminStockWorker, IsCustomer
from dashboard.models import ZipCodeConfig
from customer.models import CustomerAddress, Customer
from cart.models import CartItem, Cart, CartConfigrations
from orders.models import (
    Order, OrderItem,
    OrderStatus,
    Invoice, Note,
    ScheduledDelivery,
    ScheduledDeliveryDate,
    OneTimeDeliveryDate
)
from xhtml2pdf import pisa

from orders.serializers import (
    OrderApprovalStatusSerializer,
    OrderSerializer,
    InvoiceSerializer,
    InvoiceStatusUpdateSerializer,
    InvoiceIDSerializer
)
from orders.utils import (
    create_invoice_from_payment,
    get_available_delivery_days,
    generate_invoice_pdf
)
from django.db import transaction
from product.models import UserBasket
from datetime import datetime
from django.db.models import Q

logger = logging.getLogger(__name__)


class CheckoutAPIView(APIView):
    """
    Checkout page with payement integration
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    pagination_class = PageNumberPagination

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        session_id = request.session.session_key
        cart = None

        print("USer: ", user)

        if user:
            try:
                cart = Cart.objects.get(user=user)
                print("Cart: ", cart)
            except Cart.DoesNotExist:
                print("Cart Doesn't exist")
                return Response(
                    {"detail": "Cart does not exist."}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            if not session_id:
                session_id = request.session.session_key
            cart, created = Cart.objects.get_or_create(session_id=session_id)
        if not cart.items.exists():
            return Response(
                {"detail": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST
            )
        
        print("Session ID: ", session_id)

        address_id = request.data.get("address_id")
        if not address_id:
            return Response(
                {"detail": "Address ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            address = CustomerAddress.objects.get(id=address_id, customer__user=user)
            print("Address: ", address)
        except CustomerAddress.DoesNotExist:
            print("Address Not found")
            return Response(
                {"detail": "Address not found."}, status=status.HTTP_404_NOT_FOUND
            )

        state = address.state
        # x = []
        # for i in ZipCodeConfig.objects.all():
        #     x.append(i.state)
        # print("All states: ", x)
        # print("Client State: ", state)
        if not ZipCodeConfig.objects.filter(state=state).exists():

            return Response(
                {"detail": "Address is not available for delivery."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        scheduled_delivery_data = request.data.get("delivery_dates", None)
        one_time_purchase_data = request.data.get("time_slot_id", None)
        current_time = timezone.now().time()

        start_time = time(6, 0)
        end_time = time(14, 0)
        order_status = (
            OrderStatus.IN_TRANSIT.value
            if start_time <= current_time <= end_time
            else OrderStatus.PAYMENT_PENDING.value
        )

        if scheduled_delivery_data:
            s = self.handle_scheduled_delivery(
                request,
                cart,
                address,
                scheduled_delivery_data,
                order_status=order_status,
            )
            return self.handle_null_values(request, cart, address)

        elif one_time_purchase_data:
            s = self.handle_one_time_purchase(
                request,
                cart,
                address,
                one_time_purchase_data,
                order_status=order_status,
            )
            print("One Time Purchase: ", s)
            if s.status_code == 201:
                session_url = s.data.get("session_url")
                if session_url:
                    return self.handle_null_values(request, cart, address)
                    # return Response(
                    #     {
                    #         "message": "Checkout session created successfully.",
                    #         "session_url": session_url,
                    #     },
                    #     status=status.HTTP_201_CREATED,
                    # )
                
            
        return self.handle_null_values(request, cart, address)

    def create_stripe_customer(self, user):
        """
        Creates a Stripe customer for the given user if they don't have one.
        """
        if user.stripe_customer_id:
            try:
                stripe.Customer.retrieve(user.stripe_customer_id)
                return user.stripe_customer_id
            except stripe.error.InvalidRequestError:
                user.stripe_customer_id = None
                user.save()

        customer = stripe.Customer.create(
            email=user.email,
            name=f"{user.first_name} {user.last_name}",
            metadata={"user_id": user.id},
        )

        user.stripe_customer_id = customer.id
        user.save()
        return customer.id
    
    def handle_one_time_purchase(self, request, cart, address, time_slot_id, order_status=None):
        """
        Handles checkout for one-time purchases and integrates Stripe payment session.
        Ensures delivery is scheduled only after successful payment.
        """
        try:
            # Get Stripe API Key
            stripe_api_key = os.getenv("STRIPE_API_KEY", settings.STRIPE_API_KEY)
            print("Stripe Api key: ", stripe_api_key)
            stripe.api_key = stripe_api_key

            user = request.user
            print("User: ", user)
            
            stripe_customer_id = self.create_stripe_customer(user)

            cart_items = cart.items.all()
            print("Cart Item: ", cart_items)

            if not time_slot_id:
                return Response({"detail": "Time slot is required for one-time purchase."}, status=400)

            with transaction.atomic():
                # Construct customer and shipping details
                customer_name = f"{user.first_name} {user.last_name}".strip()
                shipping_address_str = (
                    f"{address.address}, {address.city}, {address.state}, {address.country}, {address.zipcode}"
                )

                # Calculate total amount
                total_amount = int(cart.total_with_vat * 100)  # Convert to cents
                print("Total Amount: ", total_amount)

                success_url = f"http://breakfast.rexett.com/home/order-confirmation/?success=true&session_id={{CHECKOUT_SESSION_ID}}&user_id={request.user.id}"
                cancel_url = f"http://breakfast.rexett.com/home/checkout/?canceled=true"

                # Create Stripe Checkout Session
                checkout_session = stripe.checkout.Session.create(
                    customer=stripe_customer_id,
                    payment_method_types=["card"],
                    line_items=[
                        {
                            "price_data": {
                                "currency": "sek",
                                "unit_amount": total_amount,
                                "product_data": {
                                    "name": f"Order for {user.email}",
                                },
                            },
                            "quantity": 1,
                        },
                    ],
                    metadata={
                        "order_type": "one_time",
                        "user_id": str(user.id),
                        "cart_id": str(cart.id),
                        "address_id": str(address.id),
                        "time_slot_id": str(time_slot_id)
                        
                    },
                    mode="payment",
                    payment_intent_data={
                        "capture_method": "automatic",
                        "setup_future_usage": "off_session",
                    },
                    success_url=success_url,
                    cancel_url=cancel_url,
                    invoice_creation={"enabled": True},
                )
                # **🛑 Fix: Don't try to retrieve payment intent before payment completion**
                if checkout_session.payment_status != "unpaid":
                    print("Payment Not Initialized")

                    return Response(
                        {"error": "Payment not initialized. Order was not created."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # **✅ Order should only be created after successful payment via Webhook**
                return Response(
                    {
                        "message": "Checkout session created successfully.",
                        "session_url": checkout_session.url,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            print("Error creating Stripe session: ", e)
            return Response(
                {"error": "Error creating Stripe session", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )



    def create_note(self, order, content):
        """
        Create a note for the order if the note content is provided.
        If content is None or empty, it will not create the note.
        """
        if content:
            note = Note.objects.create(order=order, content=content)
            return note
        return None

    def handle_scheduled_delivery(self, request, cart, address, scheduled_delivery_data, order_status=None):
        """
        Handles checkout for scheduled delivery orders.
        Only creates the order AFTER payment is confirmed via Webhook.
        """
        user = request.user
        cart_items = cart.items.all()

        if not scheduled_delivery_data or not isinstance(scheduled_delivery_data, list):
            return Response({"detail": "Delivery dates must be provided as a list."}, status=400)

        try:
            stripe_customer_id = self.create_stripe_customer(user)
            total_amount = int(cart.total_with_vat * 100)  # Convert to cents

            success_url = f"http://breakfast.rexett.com/home/order-confirmation/?success=true&session_id={{CHECKOUT_SESSION_ID}}&user_id={request.user.id}"
            cancel_url = f"http://breakfast.rexett.com/home/checkout/?canceled=true"

            # ✅ Only pass metadata. Order will be created in webhook
            checkout_session = stripe.checkout.Session.create(
                customer=stripe_customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "sek",
                            "unit_amount": total_amount,
                            "product_data": {"name": f"Scheduled Order for {user.email}"},
                        },
                        "quantity": 1,
                    },
                ],
                metadata={
                    "order_type": "schedule",
                    "user_id": str(user.id),
                    "cart_id": str(cart.id),
                    "address_id": str(address.id),
                    "scheduled_dates": ",".join(scheduled_delivery_data),
                },
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                invoice_creation={"enabled": True},
            )
         
            return Response(
                {
                    "message": "Checkout session created successfully.",
                    "session_url": checkout_session.url,
                },
                status=status.HTTP_201_CREATED,
            ) 

        except stripe.error.StripeError as e:
            return Response(
                {"error": f"Stripe error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def handle_null_values(self, request, cart, address):
        """
        Handle the case where neither scheduled delivery nor one-time purchase is selected.
        Ensures safe handling of null values while proceeding with the order.
        """
        try:
       
            user = request.user
            cart_items = CartItem.objects.filter(cart=cart, cart__user=user)

            if not cart_items.exists():
                return Response({"error": "Cart is empty. Cannot proceed with checkout."}, status=400)

            with transaction.atomic():
                # Construct customer and shipping details
                # customer_name = f"{user.first_name} {user.last_name}".strip()
                # shipping_address_str = (
                #     f"{address.address}, {address.city}, {address.state}, {address.country}, {address.zipcode}"
                # )

                # Fetch customer details if available
                order_name = uuid.uuid4()

                # Create ScheduledDelivery only if needed
                scheduled_delivery = None
                

                # Stripe Payment Processing
                total_amount = int(cart.total_with_vat * 100)  # Convert to cents
                success_url = f"http://breakfast.rexett.com/home/order-confirmation/?success=true&order_id={order_name}&session_id={{CHECKOUT_SESSION_ID}}&user_id={user.id}&address={address.id}"
                cancel_url = f"http://breakfast.rexett.com/home/checkout/?canceled=true"

                stripe_customer_id = self.create_stripe_customer(user)
                print("Stripe Customer ID: ", stripe_customer_id)

                checkout_session = stripe.checkout.Session.create(
                    customer=stripe_customer_id,
                    payment_method_types=["card"],
                    line_items=[
                        {
                            "price_data": {
                                "currency": "sek",
                                "unit_amount": total_amount,
                                "product_data": {"name": f"Order-{order_name}"},
                            },
                            "quantity": 1,
                        },
                    ],
                    metadata={"order_id": order_name, "user_id": user.id},
                    mode="payment",
                    payment_intent_data={
                        "capture_method": "automatic",
                        "setup_future_usage": "off_session",
                    },
                    success_url=success_url,
                    cancel_url=cancel_url,
                    invoice_creation={"enabled": True},
                )

                invoice = create_invoice_from_payment(checkout_session.id)

                return Response(
                    {
                        "message": "Checkout session created successfully.",
                        "session_url": checkout_session.url,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            print("Error creating checkout session  : ", e)
            return Response(
                {"error": "Error creating checkout session", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["POST"])
def OrderAfterBooking(request):
    """
        Handle the case where neither scheduled delivery nor one-time purchase is selected.
        Ensures safe handling of null values while proceeding with the order.
    """
    try:
        user_id = request.data.get('user')
        order_id = request.data.get('order_id')
        address = request.data.get('address')

        user = CustomUser.objects.get(id=user_id)
        address = CustomerAddress.objects.filter(id=address).first()
        cart = Cart.objects.get(user__id=user_id)
        cart_items = CartItem.objects.filter(cart=cart, cart__user=user)
        if not cart_items.exists():
            return Response({"error": "Cart is empty. Cannot proceed with checkout."}, status=400)

        if Order.objects.filter(payment_session_id=order_id).exists():
            return Response(
                    {
                        "message": "Already Booked with this Session ID.",
                        "order_id": order.id,
                        "session_url": order_id,
                    },
                    status=400,
                )
        else:
            with transaction.atomic():
                # Construct customer and shipping details
                customer_name = f"{user.first_name} {user.last_name}".strip()
                shipping_address_str = (
                    f"{address.address}, {address.city}, {address.state}, {address.country}, {address.zipcode}"
                )

                # Fetch customer details if available
                customer = Customer.objects.filter(user=user).first()

                # Create Order
                order = Order.objects.create(
                    user=user,
                    email=user.email if user else request.data.get("email", ""),
                    contact_number=customer.contact_no if customer else request.data.get("contact_number", ""),
                    address=shipping_address_str,
                    total_amount=cart.total_price,
                    final_amount=cart.total_with_vat,
                    gift_wrap_price=cart.gift_wrap_price,
                    platform_fee=cart.platform_fee,
                    order_packaging_charge=cart.order_packaging_charge,
                    delivery_fees=cart.delivery_fees,
                    customer_name=customer_name,
                    status="in_progress",
                    payment_session_id = order_id
                )

                # Create ScheduledDelivery only if needed
                scheduled_delivery = None
                if order:
                    scheduled_delivery = ScheduledDelivery.objects.create(
                        user=user,
                        order=order,
                        delivery_type="not_selected",
                        delivery_status="pending",
                    )

                # Process Order Items
                for cart_item in cart_items:
                    product_variant = cart_item.product_variant
                    user_basket = cart_item.user_basket

                    if product_variant:
                        try:
                            product_variant.inventory_items.total_quantity = int(product_variant.inventory_items.total_quantity)
                        except ValueError:
                            product_variant.inventory_items.total_quantity = 0
                        print("Product varient: ", product_variant)

                        product_variant.inventory_items.total_quantity -= cart_item.quantity
                        product_variant.save()

                    OrderItem.objects.create(
                        order=order,
                        product=product_variant,
                        quantity=cart_item.quantity,
                        basket=user_basket,
                        price=cart_item.item_price,
                    )

                    # Delete basket item after adding to order
                    if user_basket:
                        user_basket.delete()

                # Clear cart after order placement
            
                # order.session_id = checkout_session.id
                

                cart_items.delete()
                cart.save()

                invoice = create_invoice_from_payment(order_id)

                return Response(
                    {
                        "message": "Checkout session created successfully.",
                        "order_id": order.id,
                        "session_url": order_id,
                    },
                    status=status.HTTP_201_CREATED,
                )

    except Exception as e:
        print("Error : ", e)
        return Response(
            {"error": "Error: ", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class CheckoutAPIForCompanyView(APIView):
    """
    Checkout For Company without Payment Integration
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    pagination_class = PageNumberPagination

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        session_id = request.session.session_key
        cart = None

        print("USer: ", user)

        if user:
            try:
                cart = Cart.objects.get(user=user)
                print("Cart: ", cart)
            except Cart.DoesNotExist:
                print("Cart Doesn't exist")
                return Response(
                    {"detail": "Cart does not exist."}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            if not session_id:
                session_id = request.session.session_key
            cart, created = Cart.objects.get_or_create(session_id=session_id)
        if not cart.items.exists():
            return Response(
                {"detail": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST
            )
        
        print("Session ID: ", session_id)

        address_id = request.data.get("address_id")
        if not address_id:
            return Response(
                {"detail": "Address ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            address = CustomerAddress.objects.get(id=address_id, customer__user=user)
            print("Address: ", address)
        except CustomerAddress.DoesNotExist:
            print("Address Not found")
            return Response(
                {"detail": "Address not found."}, status=status.HTTP_404_NOT_FOUND
            )

        state = address.state
        if not ZipCodeConfig.objects.filter(state=state).exists():
            return Response(
                {"detail": "Address is not available for delivery."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        scheduled_delivery_data = request.data.get("delivery_dates", None)
        one_time_purchase_data = request.data.get("time_slot_id", None)
        current_time = timezone.now().time()

        start_time = time(6, 0)
        end_time = time(14, 0)
        order_status = (
            OrderStatus.IN_TRANSIT.value
            if start_time <= current_time <= end_time
            else OrderStatus.PAYMENT_PENDING.value
        )

        if scheduled_delivery_data:
            s = self.handle_scheduled_delivery(
                request,
                cart,
                address,
                scheduled_delivery_data,
                order_status=order_status,
            )
            return self.handle_null_values(request, cart, address)

        elif one_time_purchase_data:
            s = self.handle_one_time_purchase(
                request,
                cart,
                address,
                one_time_purchase_data,
                order_status=order_status,
            )
            print("One Time Purchase: ", s)
            return self.handle_null_values(request, cart, address)
        return self.handle_null_values(request, cart, address)


    def handle_one_time_purchase(self, request, cart, address, time_slot_id, order_status=None):
        """
        Handles checkout for one-time purchases and integrates Stripe payment session.
        Ensures delivery is scheduled only after successful payment.
        """
        try:
            user = request.user
            print("User: ", user)
            
            cart_items = cart.items.all()
            print("Cart Item: ", cart_items)

            if not time_slot_id:
                return Response({"detail": "Time slot is required for one-time purchase."}, status=400)

            with transaction.atomic():
                # Construct customer and shipping details
                customer_name = f"{user.first_name} {user.last_name}".strip()
                shipping_address_str = (
                    f"{address.address}, {address.city}, {address.state}, {address.country}, {address.zipcode}"
                )

                # Calculate total amount
                total_amount = int(cart.total_with_vat * 100)  # Convert to cents
                print("Total Amount: ", total_amount)

                success_url = f"http://breakfast.rexett.com/home/order-confirmation/?success=true&session_id={{CHECKOUT_SESSION_ID}}&user_id={request.user.id}"
                cancel_url = f"http://breakfast.rexett.com/home/checkout/?canceled=true"

            
                # **✅ Order should only be created after successful payment via Webhook**
                return Response(
                    {
                        "message": "Checkout session created successfully.",
                        "session_url": None,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            print("Error creating Stripe session: ", e)
            return Response(
                {"error": "Error creating Stripe session", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )



    def create_note(self, order, content):
        """
        Create a note for the order if the note content is provided.
        If content is None or empty, it will not create the note.
        """
        if content:
            note = Note.objects.create(order=order, content=content)
            return note
        return None

    def handle_scheduled_delivery(self, request, cart, address, scheduled_delivery_data, order_status=None):
        """
        Handles checkout for scheduled delivery orders.
        Only creates the order AFTER payment is confirmed via Webhook.
        """
        user = request.user
        cart_items = cart.items.all()

        if not scheduled_delivery_data or not isinstance(scheduled_delivery_data, list):
            return Response({"detail": "Delivery dates must be provided as a list."}, status=400)

        try:
            stripe_customer_id = self.create_stripe_customer(user)
            total_amount = int(cart.total_with_vat * 100)  # Convert to cents

            success_url = f"http://breakfast.rexett.com/home/order-confirmation/?success=true&session_id={{CHECKOUT_SESSION_ID}}&user_id={request.user.id}"
            cancel_url = f"http://breakfast.rexett.com/home/checkout/?canceled=true"

            # ✅ Only pass metadata. Order will be created in webhook
            checkout_session = stripe.checkout.Session.create(
                customer=stripe_customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "sek",
                            "unit_amount": total_amount,
                            "product_data": {"name": f"Scheduled Order for {user.email}"},
                        },
                        "quantity": 1,
                    },
                ],
                metadata={
                    "order_type": "schedule",
                    "user_id": str(user.id),
                    "cart_id": str(cart.id),
                    "address_id": str(address.id),
                    "scheduled_dates": ",".join(scheduled_delivery_data),
                },
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                invoice_creation={"enabled": True},
            )

            return Response(
                {
                    "message": "Checkout session created successfully.",
                    "session_url": checkout_session.url,
                },
                status=status.HTTP_201_CREATED,
            )

        except stripe.error.StripeError as e:
            return Response(
                {"error": f"Stripe error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def handle_null_values(self, request, cart, address):
        """
        Handle the case where neither scheduled delivery nor one-time purchase is selected.
        Ensures safe handling of null values while proceeding with the order.
        """
        try:
            print("Going to pay")
            print("Request: ", request.data)
            user = request.user
            cart_items = CartItem.objects.filter(cart=cart, cart__user=user)

            if not cart_items.exists():
                return Response({"error": "Cart is empty. Cannot proceed with checkout."}, status=400)

            with transaction.atomic():
                # Construct customer and shipping details
                customer_name = f"{user.first_name} {user.last_name}".strip()
                shipping_address_str = (
                    f"{address.address}, {address.city}, {address.state}, {address.country}, {address.zipcode}"
                )

                # Fetch customer details if available
                customer = Customer.objects.filter(user=user).first()

                # Create Order
                order = Order.objects.create(
                    user=user,
                    email=user.email if user else request.data.get("email", ""),
                    contact_number=customer.contact_no if customer else request.data.get("contact_number", ""),
                    address=shipping_address_str,
                    total_amount=cart.total_price,
                    final_amount=cart.total_with_vat,
                    gift_wrap_price=cart.gift_wrap_price,
                    platform_fee=cart.platform_fee,
                    order_packaging_charge=cart.order_packaging_charge,
                    delivery_fees=cart.delivery_fees,
                    customer_name=customer_name,
                    status="payment_pending",
                )

                # Create ScheduledDelivery only if needed
                scheduled_delivery = None
                if order:
                    scheduled_delivery = ScheduledDelivery.objects.create(
                        user=user,
                        order=order,
                        delivery_type="not_selected",
                        delivery_status="pending",
                    )
                    print("order: ", order)

                # Process Order Items
                for cart_item in cart_items:
                    product_variant = cart_item.product_variant
                    user_basket = cart_item.user_basket

                    if product_variant:
                        try:
                            product_variant.inventory_items.total_quantity = int(product_variant.inventory_items.total_quantity)
                        except ValueError:
                            product_variant.inventory_items.total_quantity = 0
                        print("Product varient: ", product_variant)

                        product_variant.inventory_items.total_quantity -= cart_item.quantity
                        product_variant.save()

                    OrderItem.objects.create(
                        order=order,
                        product=product_variant,
                        quantity=cart_item.quantity,
                        basket=user_basket,
                        price=cart_item.item_price,
                    )

                    # Delete basket item after adding to order
                    if user_basket:
                        user_basket.delete()

                # Clear cart after order placement
                cart_items.delete()
                cart.save()

                # Stripe Payment Processing
                total_amount = int(order.final_amount * 100)  # Convert to cents
                success_url = f"http://breakfast.rexett.com/home/order-confirmation/?success=true&order_id={order.id}&session_id={{CHECKOUT_SESSION_ID}}&user_id={request.user.id}"
                cancel_url = f"http://breakfast.rexett.com/home/checkout/?canceled=true"

                return Response(
                    {
                        "message": "Checkout session created successfully.",
                        "session_url": None,
                        "order_id": order.id,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            print("Error creating checkout session  : ", e)
            return Response(
                {"error": "Error creating checkout session", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrderListAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    pagination_class = PageNumberPagination

    def get(self, request, pk=None):
        status_filter = request.query_params.get("status", None)
        order_type = request.query_params.get("type", None)
        sort_by = request.query_params.get("sort_by", "asc")
        search_query = request.query_params.get("search", None)
        if pk:
            try:
                order = Order.objects.get(pk=pk)
                serializer = OrderSerializer(order)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Order.DoesNotExist:
                return Response(
                    {"message": "Order not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Fetch specific orders
        orders = Order.objects.filter(user__id=request.user.id)

        # Filter by status
        if status_filter:
            status_filter = status_filter.lower()
            valid_statuses = [status[0] for status in OrderStatus.choices()]
            if status_filter in valid_statuses:
                orders = orders.filter(status=status_filter)

        # Filter by order type
        if order_type:
            orders = orders.filter(type=order_type)

        # Search filter
        if search_query:
            orders = orders.filter(
                Q(order_id__icontains=search_query)
                | Q(customer_name__icontains=search_query)
                | Q(status__icontains=search_query)
                | Q(payment_session_id=search_query)
            )

        # Sorting by date or status
        if sort_by:
            if sort_by == "status_asc":
                orders = orders.order_by("status", "-created_at")
            elif sort_by == "status_desc":
                orders = orders.order_by("-status", "-created_at")
            elif sort_by == "asc":
                orders = orders.order_by("-created_at")
            else:
                orders = orders.order_by("created_at")


        paginator = self.pagination_class()
        paginated_orders = paginator.paginate_queryset(orders, request, view=self)

        serializer = OrderSerializer(paginated_orders, many=True)
        return paginator.get_paginated_response(serializer.data)


class ApproveOrderAPIView(APIView):
    permission_classes = [IsAccountant]
    authentication_classes = [JWTAuthentication]
    pagination_class = PageNumberPagination

    def get(self, request):
        status_filter = request.query_params.get("status", None)
        order_type = request.query_params.get("type", None)
        sort_by = request.query_params.get("sort_by", "asc")
        customer_type = request.query_params.get("customer_type", None)
        search_query = request.query_params.get("search", None)

        orders = Order.objects.all()

        # Filter by status
        if status_filter:
            status_filter = status_filter.lower()
            valid_statuses = [status[0] for status in OrderStatus.choices()]
            if status_filter in valid_statuses:
                orders = orders.filter(status=status_filter)

        # Filter by order type
        if order_type:
            orders = orders.filter(type=order_type)

        if customer_type:
            # Find Customer using the user
            orders = orders.filter(user__customer__customer_type=customer_type)

        # Search filter
        if search_query:
            orders = orders.filter(
                Q(order_id__icontains=search_query)
                | Q(customer_name__icontains=search_query)
                | Q(status__icontains=search_query)
            )

        # Sorting by date or status
        if sort_by:
            if sort_by == "status_asc":
                orders = orders.order_by("status", "-created_at")
            elif sort_by == "status_desc":
                orders = orders.order_by("-status", "-created_at")
            elif sort_by == "asc":
                orders = orders.order_by("-created_at")
            else:
                orders = orders.order_by("created_at")

        # Apply pagination
        paginator = self.pagination_class()
        paginated_orders = paginator.paginate_queryset(orders, request)

        # Serialize the paginated orders
        serializer = OrderSerializer(paginated_orders, many=True)
        return paginator.get_paginated_response(serializer.data)

    @swagger_auto_schema(request_body=OrderApprovalStatusSerializer)
    def patch(self, request, pk):
        serializer = OrderApprovalStatusSerializer(data=request.data)
        if serializer.is_valid():
            order_status = serializer.validated_data.pop("status")
            try:
                order = Order.objects.get(id=pk)
            except Order.DoesNotExist:
                return Response(
                    {"message": "Order not found"}, status=status.HTTP_404_NOT_FOUND
                )
            else:
                order.status = order_status
                order.save()
        else:
            return Response(
                {"detail": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {"message": "Updated status successfully"}, status=status.HTTP_200_OK
        )


class OrderDetailView(APIView):
    """
    Get an order's details based on session_id and order_id.
    """

    def get(self, request, *args, **kwargs):
        session_id = request.query_params.get("session_id", None)
        order_id = request.query_params.get("order_id", None)

        if not session_id or not order_id:
            return Response(
                {"detail": "Both session_id and order_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(session_id=session_id, order_id=order_id)
            order_serializer = OrderSerializer(order)
            response_data = {
                "order": order_serializer.data,
            }
            return Response(response_data, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )


class OrderSortAPI(APIView):
    pagination_class = PageNumberPagination

    def get(self, request, *args, **kwargs):
        sort_field = request.query_params.get("sort_field", "created_at")
        sort_order = request.query_params.get("sort_order", "desc")
        status_filter = request.query_params.get("status", None)

        valid_sort_fields = ["order_id", "total_amount", "created_at", "status"]
        if sort_field not in valid_sort_fields:
            return Response(
                {
                    "detail": f'Invalid sort field. Valid options are: {", ".join(valid_sort_fields)}.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_status_values = [status.value for status in OrderStatus]
        if status_filter and status_filter not in valid_status_values:
            return Response(
                {
                    "detail": f'Invalid status. Valid statuses are: {", ".join(valid_status_values)}.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if sort_order == "asc":
            order_by_field = sort_field
        elif sort_order == "desc":
            order_by_field = f"-{sort_field}"
        else:
            return Response(
                {"detail": "Invalid sort order. Use 'asc' or 'desc'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orders = Order.objects.all()
        if status_filter:
            orders = orders.filter(status=status_filter)

        orders = orders.order_by(order_by_field)

        paginator = self.pagination_class()
        paginated_orders = paginator.paginate_queryset(orders, request)

        order_serializer = OrderSerializer(paginated_orders, many=True)

        return paginator.get_paginated_response(order_serializer.data)


class ListInvoicesAPIView(APIView):
    """
    API to list all invoices with pagination, search by ID, and status.
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    pagination_class = PageNumberPagination

    def get(self, request):
        invoices = Invoice.objects.all()

        search_term = request.query_params.get("search")
        status = request.query_params.get("status")
        ordering = request.query_params.get("sort_by", "asc")

        if search_term:
            invoices = invoices.filter(
                Q(invoice_number__regex=search_term)
                | Q(user__first_name__regex=search_term)
                | Q(user__email__regex=search_term)
                | Q(status__regex=search_term)
            )
        if status:
            invoices = invoices.filter(status=status)

        if ordering == "asc":
            invoices = invoices.order_by("-created_at")
        else:
            invoices = invoices.order_by("created_at")

        paginator = self.pagination_class()
        paginated_invoices = paginator.paginate_queryset(invoices, request)
        serializer = InvoiceSerializer(paginated_invoices, many=True)

        return paginator.get_paginated_response(serializer.data)


class GetInvoiceAPIView(APIView):
    """
    API to retrieve a single invoice by ID.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            invoice = Invoice.objects.get(pk=pk)
            serializer = InvoiceSerializer(invoice)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Invoice.DoesNotExist:
            return Response(
                {"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, pk):
        try:
            invoice = Invoice.objects.get(pk=pk)
        except Invoice.DoesNotExist:
            return Response(
                {"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = InvoiceStatusUpdateSerializer(
            instance=invoice, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            pdf_file = generate_invoice_pdf(invoice)
            invoice.pdf_file.save(f"{invoice.invoice_number}.pdf", pdf_file)
            return Response(
                {"message": "Invoice Status Updated successfully"},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetUserInvoiceAPIView(APIView):
    """
    API to retrieve a single invoice by ID.
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    pagination_class = PageNumberPagination

    def get(self, request, pk=None):

        if pk is not None:
            try:
                invoice = Invoice.objects.get(pk=pk, user=request.user)
            except Invoice.DoesNotExist:
                return Response(
                    {"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND
                )
            serializer = InvoiceSerializer(invoice)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            invoices = Invoice.objects.all()
            invoice_id = request.query_params.get("id")
            invoice_status = request.query_params.get("status")
            search_term = request.query_params.get("search")

            if invoice_id:
                invoices = invoices.filter(invoice_number=invoice_id, user=request.user)

            if invoice_status:
                invoices = invoices.filter(status=invoice_status)

            if search_term:
                invoices = invoices.filter(
                    Q(invoice_number__regex=search_term)
                    | Q(user__first_name__regex=search_term)
                    | Q(user__email__regex=search_term)
                    | Q(status__regex=search_term)
                )
            sort_by = request.query_params.get("sort_by", "asc")

            if sort_by:
                if sort_by == "desc":
                    invoices = invoices.order_by("updated_at")
                else:
                    invoices = invoices.order_by("-updated_at")

            paginator = self.pagination_class()
            paginated_invoices = paginator.paginate_queryset(invoices, request)

            serializer = InvoiceSerializer(paginated_invoices, many=True)

        return paginator.get_paginated_response(serializer.data)


class OneTimePurchaseOrderView(APIView):
    def post(self, request):
        """
        Place an order for One Time Purchase.
        """
        user = request.user
        data = request.data

        basket_id = request.query_params.get("basket_id")
        time_slot_id = data.get("time_slot_id")
        delivery_date = data.get("delivery_date", str(date.today()))

        try:
            time_slot = TimeSlotConfiguration.objects.get(id=time_slot_id)
        except TimeSlotConfiguration.DoesNotExist:
            return Response({"detail": "Invalid time slot ID."}, status=400)

        if time_slot.orders_left <= 0:
            return Response({"detail": "This time slot is fully booked."}, status=400)

        if time_slot.book_order():
            if not basket_id:
                return Response(
                    {"detail": "Basket ID must be provided for One Time Purchase."},
                    status=400,
                )

            try:
                user_basket = user.user_baskets.get(id=basket_id)
            except UserBasket.DoesNotExist:
                return Response(
                    {"detail": "Invalid or inactive basket for the user."}, status=400
                )

            existing_delivery = ScheduledDelivery.objects.filter(user=user).first()

            if existing_delivery:
                existing_delivery.delete()

            scheduled_delivery = ScheduledDelivery.objects.create(
                user=user,
                user_basket=user_basket,
                delivery_type="one_time",
                delivery_status="Confirmed",
            )

            ScheduledDeliveryDate.objects.create(
                scheduled_delivery=scheduled_delivery,
                delivery_date=delivery_date,
                is_holiday=False,
            )

            return Response({"message": "Order placed successfully."}, status=201)
        else:
            return Response(
                {"detail": "This time slot is no longer available."}, status=400
            )


class ScheduledDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        API to schedule orders for multiple dates.
        """
        user = request.user
        data = request.data
        delivery_dates = data.get("delivery_dates", [])

        if not delivery_dates:
            return Response({"detail": "No delivery dates provided."}, status=400)

        if not isinstance(delivery_dates, list):
            return Response(
                {
                    "detail": "delivery_dates must be a list of dates in YYYY-MM-DD format."
                },
                status=400,
            )

        user_basket_id = data.get("user_basket")
        if not user_basket_id:
            return Response({"detail": "User basket is required."}, status=400)

        try:
            user_basket = UserBasket.objects.get(id=user_basket_id, user=user)
        except UserBasket.DoesNotExist:
            return Response(
                {
                    "detail": "Invalid user basket ID or the basket does not belong to the user."
                },
                status=400,
            )

        scheduled_delivery = ScheduledDelivery.objects.filter(
            user=user, user_basket=user_basket
        ).first()

        if scheduled_delivery:
            scheduled_delivery.delivery_dates.all().delete()

            scheduled_delivery.user_basket = user_basket
            scheduled_delivery.delivery_type = "scheduled"
            scheduled_delivery.save()

        else:
            scheduled_delivery = ScheduledDelivery.objects.create(
                user=user,
                user_basket=user_basket,
                delivery_type="scheduled",
                delivery_status="Confirmed",
            )

        parsed_dates = [
            datetime.strptime(d, "%Y-%m-%d").date() for d in delivery_dates if d
        ]
        holiday_dates = Holiday.objects.filter(date__in=parsed_dates)
        holiday_map = {holiday.date: holiday for holiday in holiday_dates}

        valid_dates = []
        invalid_dates = []
        holidays = []

        for date_str in delivery_dates:
            try:
                delivery_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                holiday = holiday_map.get(delivery_date)
                is_holiday = bool(holiday)

                if is_holiday:
                    holidays.append(
                        {
                            "date": delivery_date,
                            "holiday_reason": holiday.holiday,
                        }
                    )
                else:
                    existing_date = scheduled_delivery.delivery_dates.filter(
                        delivery_date=delivery_date
                    ).first()
                    if existing_date:
                        continue

                    valid_dates.append({"date": delivery_date})
            except ValueError:
                invalid_dates.append(date_str)

        if not valid_dates:
            return Response(
                {
                    "error": "All selected dates are holidays or invalid.",
                    "holidays": holidays,
                    "invalid_dates": invalid_dates,
                },
                status=400,
            )

        for date in valid_dates:
            ScheduledDeliveryDate.objects.get_or_create(
                scheduled_delivery=scheduled_delivery,
                delivery_date=date["date"],
                defaults={"is_holiday": False},
            )

        return Response(
            {
                "message": "Scheduled delivery updated successfully.",
                "scheduled_dates": valid_dates,
                "holidays": holidays,
                "invalid_dates": invalid_dates,
            },
            status=201,
        )

    def get_available_days(self, request):
        """
        Fetch the available delivery days from tomorrow and mark holidays.
        """
        start_date = datetime.today() + timedelta(days=1)
        start_date = start_date.date()

        days = int(request.query_params.get("days", 7))

        delivery_days = get_available_delivery_days(start_date=start_date, days=days)

        return Response(delivery_days, status=200)

    def get(self, request):
        return self.get_available_days(request)

class ListInvoicesAPIView(APIView):
    """
    API view for listing and filtering invoices.

    Methods:
    - GET: List all invoices with filters:
        - search: Search across invoice number, user details, status
        - status: Filter by invoice status
        - sort_by: Various sorting options (created_at, order_id, total_amount, etc.)
        - start_date/end_date: Filter by date range

    Authentication:
    - Requires JWT authentication
    - Admin or stock worker access required
    """

    permission_classes = [AllowGetOnlyIsAdminStockWorker]
    authentication_classes = [JWTAuthentication]
    pagination_class = PageNumberPagination

    def get(self, request):
        invoices = Invoice.objects.all()

        # Search parameters
        search_term = request.query_params.get("search")
        status = request.query_params.get("status")
        sort_by = request.query_params.get("sort_by", "-created_at")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        customer_type = request.query_params.get("customer_type")

        # Regex search for invoice number if provided

        if start_date and end_date:
            invoices = invoices.filter(date__range=[start_date, end_date])
        if search_term:
            # Use regex for case-sensitive search
            invoices = invoices.annotate(
                full_name=Concat("user__first_name", Value(" "), "user__last_name")
            ).filter(
                Q(invoice_number__regex=search_term)
                | Q(user__first_name__regex=search_term)
                | Q(user__last_name__regex=search_term)
                | Q(user__email__regex=search_term)
                | Q(full_name__regex=search_term)
                | Q(status__regex=search_term)
                | Q(order__order_id__regex=search_term)
            )
        if status:
            invoices = invoices.filter(status=status)

        if customer_type:

            invoices = invoices.filter(user__customer__customer_type=customer_type)

        # Ordering logic
        if sort_by:
            if sort_by == "desc":
                invoices = invoices.order_by("created_at")
            elif sort_by == "asc":
                invoices = invoices.order_by("-created_at")
            if sort_by == "order_id":
                invoices = invoices.order_by("order_id")
            elif sort_by == "-order_id":
                invoices = invoices.order_by("-order_id")
            elif sort_by == "-total_amount":
                invoices = invoices.order_by("-total_amount")
            elif sort_by == "total_amount":
                invoices = invoices.order_by("total_amount")
            elif sort_by == "a_to_z":
                invoices = invoices.order_by("user__first_name")
            elif sort_by == "z_to_a":
                invoices = invoices.order_by("-user__first_name")
            elif sort_by == "invoice_number":
                invoices = invoices.order_by("invoice_number")
            elif sort_by == "-invoice_number":
                invoices = invoices.order_by("-invoice_number")
            elif sort_by == "status":
                invoices = invoices.order_by("status")
            elif sort_by == "-status":
                invoices = invoices.order_by("-status")

        paginator = self.pagination_class()
        paginated_invoices = paginator.paginate_queryset(invoices, request)
        serializer = InvoiceSerializer(paginated_invoices, many=True)

        return paginator.get_paginated_response(serializer.data)


class GetInvoiceAPIView(APIView):
    """
    API view for managing individual invoices.

    Methods:
    - GET: Retrieve a specific invoice by ID
    - PATCH: Update invoice status
        - Automatically regenerates PDF after status update

    Authentication:
    - Requires JWT authentication
    - Admin or stock worker access required
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowGetOnlyIsAdminStockWorker]

    def get(self, request, pk):
        try:
            invoice = Invoice.objects.get(pk=pk)
            serializer = InvoiceSerializer(invoice)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Invoice.DoesNotExist:
            return Response(
                {"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, pk):
        try:
            invoice = Invoice.objects.get(pk=pk)
        except Invoice.DoesNotExist:
            return Response(
                {"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = InvoiceStatusUpdateSerializer(
            instance=invoice, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            pdf_file = generate_invoice_pdf(invoice)
            invoice.pdf_file.save(f"{invoice.invoice_number}.pdf", pdf_file)
            return Response(
                {"message": "Invoice Status Updated successfully"},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetUserInvoiceAPIView(APIView):
    """
    API view for managing user-specific invoices.

    Methods:
    - GET: List/retrieve user invoices
        - With ID: Get specific invoice
        - Without ID: List all user invoices with filters:
            - status: Filter by invoice status
            - search: Search across invoice fields
            - start_date/end_date: Filter by date range
            - sort_by: Various sorting options

    Authentication:
    - Requires JWT authentication
    - Must be a bakery user
    """

    permission_classes = [IsCustomer]
    authentication_classes = [JWTAuthentication]
    pagination_class = PageNumberPagination

    def get(self, request, pk=None):

        if pk is not None:
            try:
                invoice = Invoice.objects.get(pk=pk, user=request.user)
            except Invoice.DoesNotExist:
                return Response(
                    {"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND
                )
            serializer = InvoiceSerializer(invoice)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            invoices = Invoice.objects.filter(user=request.user)
            invoice_status = request.query_params.get("status")
            search_term = request.query_params.get("search")
            start_date = request.query_params.get("start_date")
            end_date = request.query_params.get("end_date")
            # Regex search for invoice number if provided

            if start_date and end_date:
                invoices = invoices.filter(date__range=[start_date, end_date])
            if invoice_status:
                invoices = invoices.filter(status=invoice_status)

            if search_term:
                invoices = invoices.annotate(
                    full_name=Concat("user__first_name", Value(" "), "user__last_name")
                ).filter(
                    Q(invoice_number__regex=search_term)
                    | Q(user__first_name__regex=search_term)
                    | Q(user__last_name__regex=search_term)
                    | Q(user__email__regex=search_term)
                    | Q(full_name__regex=search_term)
                    | Q(status__regex=search_term)
                    | Q(order__order_id__regex=search_term)
                )
            sort_by = request.query_params.get("sort_by", "asc")

            if sort_by:
                if sort_by == "desc":
                    invoices = invoices.order_by("created_at")
                elif sort_by == "asc":
                    invoices = invoices.order_by("-created_at")
                if sort_by == "order_id":
                    invoices = invoices.order_by("order_id")
                elif sort_by == "-order_id":
                    invoices = invoices.order_by("-order_id")
                elif sort_by == "-total_amount":
                    invoices = invoices.order_by("-total_amount")
                elif sort_by == "total_amount":
                    invoices = invoices.order_by("total_amount")
                elif sort_by == "a_to_z":
                    invoices = invoices.order_by("user__first_name")
                elif sort_by == "z_to_a":
                    invoices = invoices.order_by("-user__first_name")
                elif sort_by == "invoice_number":
                    invoices = invoices.order_by("invoice_number")
                elif sort_by == "-invoice_number":
                    invoices = invoices.order_by("-invoice_number")
                elif sort_by == "status":
                    invoices = invoices.order_by("status")
                elif sort_by == "-status":
                    invoices = invoices.order_by("-status")

            paginator = self.pagination_class()
            paginated_invoices = paginator.paginate_queryset(invoices, request)

            serializer = InvoiceSerializer(paginated_invoices, many=True)

        return paginator.get_paginated_response(serializer.data)


class NotifyInvoiceStatusUpdateView(APIView):
    """
    API view for sending invoice status update notifications.

    Methods:
    - POST: Send email notification about invoice status update
        Required fields:
        - invoice_id: ID of the updated invoice

    Features:
    - Sends HTML email with status update details
    - Includes invoice details in the notification

    Authentication:
    - Requires user authentication
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InvoiceIDSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        invoice_id = serializer.validated_data["invoice_id"]

        try:
            # Fetch the invoice
            invoice = Invoice.objects.get(id=invoice_id)

            # Get user email
            user_email = (
                invoice.user.email
            )  # Assuming 'user' is a ForeignKey in Invoice

            # Compose the email
            subject = f"Invoice #{invoice.invoice_number} Status Update"
            message = (
                f"Dear {invoice.user.first_name},\n\n"
                f"Your invoice with ID #{invoice.invoice_number} has been updated. "
                f"The current status is: {invoice.status}.\n\n"
                f"Thank you,\nYour Company Name"
            )
            context = {
                "user_first_name": invoice.user.first_name,
                "order_id": invoice.order.order_id,
                "new_status": invoice.status,
                "old_status": "",
                "invoice": invoice,
            }
            html_message = render_to_string(
                "emails/invoice_status_update.html", context
            )

            # Send the email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user_email],
                fail_silently=False,
                html_message=html_message,
            )

            return Response(
                {"success": f"Email sent to {user_email} for status update."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to send email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DownloadOrderAPIView(APIView):
    """
    API view for downloading order details as PDF.

    Methods:
    - GET: Generate and download order PDF by order ID
        - Includes order details, items, and pricing

    Returns:
    - PDF file response
    - 404 if order not found

    Authentication:
    - Requires JWT authentication
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, order_id, *args, **kwargs):
        try:
            # Fetch the order from the database using the order_id
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            raise NotFound("Order not found")

        # Prepare order data for rendering
        order_data = {
            "order_id": order.order_id,
            "customer_name": f"{order.user.first_name} {order.user.last_name}",
            "order_date": order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "items": [
                {
                    "name": item.product.variant_name,
                    "quantity": item.quantity,
                    "price": item.price,
                }
                for item in order.items.all()
            ],
            "total_amount": order.total_amount,
        }

        html_content = render_to_string("orders.html", order_data)
        buffer = BytesIO()
        pisa_status = pisa.CreatePDF(html_content.encode("utf-8"), dest=buffer)

        if pisa_status.err:
            logger.error("Error: %s" % pisa_status.err)
        pdf = buffer.getvalue()
        buffer.close()
        return HttpResponse(pdf, content_type="application/pdf")


class GetOrderByIdAPIView(APIView):
    """
    API view for retrieving specific order details.

    Methods:
    - GET: Retrieve detailed information for a specific order
        - Includes order items, status, and pricing details

    Returns:
    - 200: Order details
    - 404: Order not found

    Authentication:
    - Requires JWT authentication
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, order_id):
        # Fetch the order using the provided order_id
        order = get_object_or_404(Order, order_id=order_id)

        # Serialize the order
        serializer = OrderSerializer(order)

        # Return the serialized data
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotifyInvoiceStatusUpdateView(APIView):
    """
    API view for sending invoice status update notifications.

    Methods:
    - POST: Send email notification about invoice status update
        Required fields:
        - invoice_id: ID of the updated invoice

    Features:
    - Sends HTML email with status update details
    - Includes invoice details in the notification

    Authentication:
    - Requires user authentication
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InvoiceIDSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        invoice_id = serializer.validated_data["invoice_id"]

        try:
            # Fetch the invoice
            invoice = Invoice.objects.get(id=invoice_id)

            # Get user email
            user_email = (
                invoice.user.email
            )  # Assuming 'user' is a ForeignKey in Invoice

            # Compose the email
            subject = f"Invoice #{invoice.invoice_number} Status Update"
            message = (
                f"Dear {invoice.user.first_name},\n\n"
                f"Your invoice with ID #{invoice.invoice_number} has been updated. "
                f"The current status is: {invoice.status}.\n\n"
                f"Thank you,\nYour Company Name"
            )
            context = {
                "user_first_name": invoice.user.first_name,
                "order_id": invoice.order.order_id,
                "new_status": invoice.status,
                "old_status": "",
                "invoice": invoice,
            }
            html_message = render_to_string(
                "emails/invoice_status_update.html", context
            )

            # Send the email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user_email],
                fail_silently=False,
                html_message=html_message,
            )

            return Response(
                {"success": f"Email sent to {user_email} for status update."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to send email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )



class DownloadInvoiceAPIView(APIView):
    """
    API view for downloading order invoices.

    Methods:
    - GET: Download invoice PDF file by invoice number

    Returns:
    - PDF file response
    - 404 if invoice not found

    Authentication:
    - Requires JWT authentication
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, invoice_number):
        invoice = get_object_or_404(Invoice, invoice_number=invoice_number)
        return FileResponse(
            invoice.pdf_file, as_attachment=True, filename=f"{invoice_number}.pdf"
        )
