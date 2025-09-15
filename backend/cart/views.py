from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from product.serializers import UserBasketSerializer
from cart.models import Cart, CartItem
from cart.serializers import (
    CartItemSerializer,
    CartSerializer,
    ProductVariantSerializer,
    CartConfigrations,
    CartItemInputSerializer,
    CartConfigrationsSerializer
)
from product.models import ProductVariant, UserBasket, Inventory
from django.db import transaction

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.db.models import Sum
from decimal import Decimal
from .models import Cart, CartItem, CartConfigrations
from .serializers import CartSerializer, CartUpdateSerializer


class CartAPIView(APIView):
    """
    This view handles creating a cart and retrieving the cart's items.
    """

    def get(self, request):
        """
        Get the current cart (either for the logged-in user or based on session).
        """
        user = request.user if request.user.is_authenticated else None
        session_id = request.session.session_key
        if not session_id:
            request.session.save()
            session_id = request.session.session_key

        if user:
            try:
                cart = Cart.objects.filter(user=user).last()
                if not cart:
                    cart = Cart.objects.create(user=user)
            except Cart.DoesNotExist:
                cart = Cart.objects.filter(session_id=session_id).last()
                if cart:
                    cart.user = user
                    cart.save()
                else:
                    cart = Cart.objects.create(user=user)

            session_cart = Cart.objects.filter(session_id=session_id).last()

            if session_cart:
                for item in session_cart.items.all():
                    user_cart_item = CartItem.objects.filter(
                        cart=cart, product_variant=item.product_variant
                    ).first()

                    if user_cart_item:
                        user_cart_item.quantity += item.quantity
                        user_cart_item.save()
                    else:
                        CartItem.objects.create(
                            cart=cart,
                            product_variant=item.product_variant,
                            quantity=item.quantity,
                        )

                session_cart.delete()
        else:
            if session_id:
                cart_queryset = Cart.objects.filter(session_id=session_id)
                if cart_queryset.exists():
                    cart = cart_queryset.last()
                else:
                    cart = Cart.objects.create(session_id=session_id)

        # ✅ Ensure total is 0 if cart is empty
        if not cart.items.exists():
            cart.vat_amount = Decimal("0.00")
            cart.total_with_vat = Decimal("0.00")
            cart.applied_coupon = None  # Remove coupon if cart is empty
            cart.save()

        cart_config = CartConfigrations.objects.first()

        if cart_config:
            base_gift_wrap_price = (
                cart_config.gift_wrap_price if cart.is_gift_wrap else Decimal("0.00")
            )
            order_packaging_charge = cart_config.order_packaging_charge
            platform_fee = cart_config.platform_fee
            tax_amount = cart_config.tax_amount
        else:
            base_gift_wrap_price = Decimal("0.00")
            order_packaging_charge = Decimal("0.00")
            platform_fee = Decimal("0.00")
            tax_amount = Decimal("0.00")

        # Update cart fields and save
        cart.gift_wrap_price = base_gift_wrap_price
        cart.order_packaging_charge = order_packaging_charge
        cart.platform_fee = platform_fee
        cart.save()

        # ✅ If the cart has items, recalculate total
        if cart.items.exists():
            cart.calculate_vat(vat_percentage=tax_amount)

        # Serialize response
        serializer = CartSerializer(cart)
        response_data = serializer.data
        # print("Response Data: ", response_data)
        return Response(response_data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Check if the user has a cart
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({"detail": "Cart not found."}, status=status.HTTP_404_NOT_FOUND)

        # Serialize and update the 'is_gift_wrap' flag
        serializer = CartUpdateSerializer(cart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class CartItemAPIView(APIView):

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        session_id = request.session.session_key
        product_variant_id = request.data.get("product_variant")
        user_basket_id = request.data.get("user_basket_id")
        quantity = request.data.get("quantity", 1)

        print("User basket ID:", user_basket_id)
        print("Product variant ID:", product_variant_id)
        print("Quantity:", quantity)

        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response(
                    {"message": "Quantity must be a positive integer."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except ValueError:
            return Response(
                {"message": "Invalid quantity value."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not product_variant_id and not user_basket_id:
            return Response(
                {"message": "Either 'product_variant' or 'user_basket_id' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Retrieve or create cart
        if user:
            cart, created = Cart.objects.get_or_create(user=user)
            if session_id:
                cart.session_id = None
                cart.save()
        else:
            cart, created = Cart.objects.get_or_create(session_id=session_id, user=None)

        # Handle product variant addition
        if product_variant_id:
            try:
                product_variant = ProductVariant.objects.get(id=product_variant_id)
            except ProductVariant.DoesNotExist:
                return Response(
                    {"message": "Product variant not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():  
                try:
                    inventory = Inventory.objects.select_for_update().get(product_variant=product_variant)
                except Inventory.DoesNotExist:
                    return Response(
                        {"message": "No inventory record found for this product variant."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if inventory.total_quantity < quantity:
                    return Response(
                        {"message": "Sorry! we are out of stock"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Check if the cart item already exists
                cart_item, created = CartItem.objects.get_or_create(
                    cart=cart,
                    product_variant=product_variant,
                    defaults={"quantity": quantity},
                )
                if not created:
                    if inventory.total_quantity < (cart_item.quantity + quantity):
                        return Response(
                            {"message": "Sorry! we are out of stock"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    cart_item.quantity += quantity


                cart_item.save()

            cart_item_serializer = CartItemSerializer(cart_item)
            response_data = cart_item_serializer.data
            response_data["message"] = "Product variant added to the cart."
            return Response(response_data, status=status.HTTP_201_CREATED)

        # Handle user basket addition
        if user_basket_id:
            try:
                user_basket = UserBasket.objects.get(id=user_basket_id, user=user)
                print("User Basket:", user_basket)
            except UserBasket.DoesNotExist:
                print("User Basket Not Found")
                return Response({"message": "User basket not found."}, status=status.HTTP_400_BAD_REQUEST)

            print("User Basket:", user_basket)
            # ✅ Ensure basket is not empty
            if not user_basket.items.exists():
                return Response({"message": "User basket is empty."}, status=status.HTTP_400_BAD_REQUEST)


            # ✅ Store the entire basket in the cart (instead of adding its variants)
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                user_basket=user_basket,  # ✅ Link the basket directly to the cart
                defaults={"quantity": 1},  # Treat basket as a single unit
            )
            print("Cart Item:", cart_item)
            print("Created:", created)
            if not created:
                cart_item.quantity += 1
            cart_item.save()

            cart_item_serializer = CartItemSerializer(cart_item)
            response_data = cart_item_serializer.data
            response_data["message"] ="Previous baskets were removed. Added the new basket to the cart."

            return Response(response_data, status=status.HTTP_201_CREATED)


    def get(self, request):
        """
        Retrieve all cart details, including product variants and user baskets.
        """
        user = request.user if request.user.is_authenticated else None
        session_id = request.session.session_key

        if not session_id and not user:
            return Response(
                {"detail": "Session not found. Please log in or create a session."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if user:
                cart = Cart.objects.get(user=user)
            else:
                cart = Cart.objects.get(session_id=session_id, user=None)
        except Cart.DoesNotExist:
            return Response(
                {"detail": "Cart not found."},
                status=status.HTTP_200_OK,
            )

        cart_items = CartItem.objects.filter(cart=cart)

        cart_items_data = []
        for item in cart_items:
            item_data = CartItemSerializer(item).data

            if item.product_variant:
                product_variant = ProductVariant.objects.filter(
                    id=item.product_variant.id
                ).first()
                item_data["product_variant_details"] = (
                    ProductVariantSerializer(product_variant).data
                    if product_variant
                    else None
                )

            if item.user_basket:
                user_basket = UserBasket.objects.filter(id=item.user_basket.id).first()
                item_data["user_basket_details"] = (
                    UserBasketSerializer(user_basket).data if user_basket else None
                )

            cart_items_data.append(item_data)

        response_data = {
            "cart_id": cart.id,
            "user": cart.user.id if cart.user else None,
            "session_id": cart.session_id,
            "cart_items": cart_items_data,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    @swagger_auto_schema(request_body=CartItemSerializer)
    def patch(self, request):
        """
        Update the quantity of a specific cart item.
        """
        cart_item_id = request.query_params.get("cart_item_id")
        if not cart_item_id:
            return Response(
                {"detail": "cart_item_id is required in query parameters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        quantity = request.data.get("quantity")
        if not quantity:
            return Response(
                {"detail": "Quantity is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
            if quantity <= 0:
                raise ValueError("Quantity must be greater than 0.")
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cart_item = CartItem.objects.get(id=cart_item_id)
        except CartItem.DoesNotExist:
            return Response(
                {"detail": "Cart item not found."},
                status=status.HTTP_200_OK,
            )

        cart_item.quantity = quantity
        cart_item.save()

        updated_cart_item = CartItemSerializer(cart_item)

        return Response(
            {
                "message": "Cart item updated successfully.",
                "cart_item": updated_cart_item.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        """
        Remove an item from the cart.
        """
        try:
            cart_item = CartItem.objects.get(id=pk)
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Cart item not found."}, status=status.HTTP_200_OK
            )

        cart_item.delete()
        return Response(
            {"message": "Item removed from the cart."},
            status=status.HTTP_204_NO_CONTENT,
        )



class ReOrderCartItemAPIView(APIView):
    """
    API view for bulk cart item operations.

    Methods:
    - POST: Add multiple items to cart at once
        - Validates each item individually
        - Handles quantity limits per item
        - Updates existing items if present

    Features:
    - Bulk item addition
    - Quantity validation
    - Stock checking

    Authentication:
    - Optional JWT authentication
    - Works with both authenticated and anonymous users
    """

    @swagger_auto_schema(request_body=CartItemInputSerializer(many=True))
    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        session_id = request.session.session_key or request.session.create()

        print("Received Data:", request.data)

        if not isinstance(request.data, list):
            return Response({"error": "Expected a list of items."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CartItemInputSerializer(data=request.data, many=True)
        if not serializer.is_valid():
            print("Serializer Errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        cart, _ = Cart.objects.get_or_create(user=user) if user else Cart.objects.get_or_create(session_id=session_id)

        response_data = []

        for item in validated_data:
            product_variant = item.get("product_variant")
            user_basket_id = item.get("user_basket_id")
            quantity = item.get("quantity", 1)

            if product_variant:
                try:
                    product_variant = ProductVariant.objects.get(id=product_variant.id)
                except ProductVariant.DoesNotExist:
                    return Response({"error": f"Product variant {product_variant} not found."},
                                    status=status.HTTP_400_BAD_REQUEST)

                try:
                    inventory = Inventory.objects.get(product_variant=product_variant)
                    if inventory.total_quantity < quantity:
                        return Response(
                            {"error": f"Not enough stock for {product_variant}. Available: {inventory.total_quantity}"},
                            status=status.HTTP_400_BAD_REQUEST)
                except Inventory.DoesNotExist:
                    return Response({"error": f"No inventory record found for {product_variant}."},
                                    status=status.HTTP_400_BAD_REQUEST)

                cart_item, created = CartItem.objects.get_or_create(
                    cart=cart, product_variant=product_variant,
                    defaults={"quantity": quantity}
                )

            
                cart_item.save()
                response_data.append(CartItemSerializer(cart_item).data)

            if user_basket_id:
                try:
                    user_basket = UserBasket.objects.get(id=user_basket_id, user=user)
                except UserBasket.DoesNotExist:
                    return Response({"error": "User basket not found."},
                                    status=status.HTTP_400_BAD_REQUEST)

                basket_cart_item, created = CartItem.objects.get_or_create(
                    cart=cart, user_basket=user_basket,
                    defaults={"quantity": quantity}
                )


                basket_cart_item.save()
                response_data.append(CartItemSerializer(basket_cart_item).data)

        return Response(response_data, status=status.HTTP_200_OK)


class CartConfigrationsView(APIView):
    def get(self, request):
        """Fetch CartConfigrations (assuming there's only one config)"""
        config = CartConfigrations.objects.first()  # Fetch the first configuration
        if config:
            serializer = CartConfigrationsSerializer(config)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"detail": "No configuration found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        """Create or update CartConfigrations"""
        config, created = CartConfigrations.objects.get_or_create()

        serializer = CartConfigrationsSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


@api_view(['delete'])
def empty_cart_for_user(request, cart_id):
    items = CartItem.objects.filter(cart=cart_id)
    for i in items:
        i.delete()
    return Response({'message': "Cart is empty now"}, status=200)