# views.py
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from account.permissions import IsAdmin, IsCustomer
from customer.models import CustomerAddress
from cart.models import Cart, CartItem
from coupon.models import Coupon, State, UserCoupon
from coupon.serializers import (
    BulkCouponSerializer,
    CouponSerializer,
    StateSerializer,
    UserCouponSerializer,
    UpdateCouponSerializer
)
from product.models import ProductVariant
from product.utils import CustomPagination


class StateListCreateAPIView(generics.ListCreateAPIView):
    queryset = State.objects.all()
    serializer_class = StateSerializer


class CouponListCreateAPIView(APIView):
    """
    API view for managing coupons with filtering, searching, and sorting capabilities.

    Methods:
    - GET: List all coupons with optional filters:
        - status: publish/draft/trash/all
        - search: Search by code or coupon type
        - sort: asc/desc
        - sort_by: code/is_active/coupon_type/created_at
    - POST: Create a new coupon

    Authentication:
    - Requires JWT authentication
    - Only admin users can access
    """

    permission_classes = [IsAdmin]
    authentication_classess = [JWTAuthentication]
    pagination_class = CustomPagination

    def get(self, request):
        search_query = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        sort_order = request.query_params.get("sort", "asc")
        sort_field = request.query_params.get("sort_by", "created_at")

        # Start with all coupons
        coupons = Coupon.objects.all()

        if search_query:
            coupons = coupons.filter(
                Q(code__icontains=search_query) | Q(coupon_type__icontains=search_query)
            )

        # Updated status filter logic
        if status_filter:
            if status_filter == "publish":
                coupons = coupons.filter(is_active=True, is_deleted=False)
            elif status_filter == "draft":
                coupons = coupons.filter(is_active=False, is_deleted=False)
            elif status_filter == "trash":
                coupons = coupons.filter(is_deleted=True)
            elif status_filter == "all":
                coupons = coupons.filter(is_deleted=False)
        else:
            coupons = coupons.filter(is_deleted=False)

        valid_sort_fields = [
            "code",
            "is_active",
            "coupon_type",
            "created_at",
        ]

        if sort_field not in valid_sort_fields:
            sort_field = "created_at"
        if sort_order == "desc":
            sort_field = f"-{sort_field.lstrip('-')}"
        coupons = coupons.order_by(sort_field)

        paginator = self.pagination_class()
        paginated_tasks = paginator.paginate_queryset(coupons, request, view=self)

        serializer = CouponSerializer(paginated_tasks, many=True)
        return paginator.get_paginated_response(serializer.data)

    @swagger_auto_schema(request_body=CouponSerializer)
    def post(self, request):
        serializer = CouponSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CouponDetailAPIView(APIView):
    permission_classes = [IsAdmin]
    authentication_classess = [JWTAuthentication]

    def get_object(self, pk):
        return get_object_or_404(Coupon, pk=pk)

    def get(self, request, pk):
        coupon = self.get_object(pk)
        serializer = CouponSerializer(coupon)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(request_body=UpdateCouponSerializer)
    def put(self, request, pk):
        coupon = self.get_object(pk)
        serializer = CouponSerializer(coupon, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        coupon = self.get_object(pk)
        coupon.delete()
        return Response(status=status.HTTP_200_OK)


class AssignCouponView(APIView):
    permission_classes = [IsAdmin]
    authentication_classess = [JWTAuthentication]

    def post(self, request):
        serializer = UserCouponSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            coupon = serializer.validated_data["coupon"]

            if UserCoupon.objects.filter(user=user, coupon=coupon).exists():
                return Response(
                    {"detail": "Coupon already assigned to the user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAssignedCouponsView(APIView):
    permission_classes = [IsCustomer]
    pagination_class = PageNumberPagination
    authentication_classess = [JWTAuthentication]

    def get(self, request):
        user = request.user
        today = date.today()

        user_coupons = UserCoupon.objects.filter(
            Q(user_id=user.id)
            | Q(
                coupon__customer_eligibility=Coupon.CustomerEligibilityType.ALL_CUSTOMER
            )
        ).exclude(coupon__end_date__lt=today)
        paginator = self.pagination_class()
        paginated_tasks = paginator.paginate_queryset(user_coupons, request, view=self)
        serializer = UserCouponSerializer(paginated_tasks, many=True)
        return paginator.get_paginated_response(serializer.data)


class RedeemCouponView(APIView):
    permission_classes = [IsCustomer]
    authentication_classess = [JWTAuthentication]

    def post(self, request, coupon_id):
        user = request.user

        user_coupon = get_object_or_404(UserCoupon, coupon=coupon_id, user=user)
        if user_coupon.redeemed and user_coupon.coupon.usage_count:
            return Response(
                {"detail": "Coupon has already been redeemed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_coupon.redeemed = True
        user_coupon.redemption_date = timezone.now()
        if user_coupon.coupon.usage_count > 0:
            user_coupon.coupon.usage_count -= 1
        if user_coupon.maximum_usage > 0:
            user_coupon.maximum_usage -= 1
        user_coupon.save()

        return Response(
            {"detail": "Coupon redeemed successfully."},
            status=status.HTTP_200_OK
        )


class ApplyCouponAPIView(APIView):
    permission_classes = [IsCustomer]
    authentication_classes = [JWTAuthentication]
    """
    This view handles will apply the coupon on the
    """

    def post(self, request):
        user = request.user
        coupon_code = request.data.get("coupon_code")
        if not coupon_code:
            return Response(
                {"error": "Coupon code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            # Get coupon and cart details
            try:
                # Fetch the UserCoupon instance
                user_coupon = UserCoupon.objects.select_related("coupon").get(
                    coupon__code=coupon_code, user=user
                )
                coupon = user_coupon.coupon
            except UserCoupon.DoesNotExist:
                coupon = Coupon.objects.filter(code=coupon_code).last()
                if coupon:
                    if (
                        coupon.customer_eligibility
                        == Coupon.CustomerEligibilityType.SPECIFIC_CUSTOMER
                    ):

                        return Response(
                            {"error": "This coupon is not available for this user."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

            if coupon:

                Coupon.objects.filter(id=coupon.id).update(
                    usage_count=F("usage_count") + 1
                )
            else:
                return Response(
                    {"error": "This coupon is not available for this user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if (
                coupon.maximum_discount_usage
                == Coupon.MaximumDiscountUsage.LIMIT_DISCOUNT_USAGE_TIME
            ):
                # Check total usage limit
                if coupon.maximum_usage_value <= coupon.usage_count:
                    return Response(
                        {"error": "This coupon can no longer be used."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            elif (
                coupon.maximum_discount_usage
                == Coupon.MaximumDiscountUsage.PER_CUSTOMER
            ):

                if user_coupon.maximum_usage > 0:
                    # user_coupon.maximum_usage -= 1
                    # user_coupon.redeemed = True
                    user_coupon.redemption_date = timezone.now()
                    user_coupon.save()
                else:
                    return Response(
                        {
                            "detail": "You have already used this \
                                coupon the maximum allowed times."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            cart = Cart.objects.filter(user=user).last()
            cart_items = cart.cart_items.all()
            if not cart_items:
                return Response(
                    {"detail": "Your cart is empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Coupon eligibility check
            if (
                user_coupon.coupon.customer_eligibility
                == Coupon.CustomerEligibilityType.SPECIFIC_CUSTOMER
            ):
                if not user_coupon:
                    return Response(
                        {"detail": "Coupon not available for this user."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Minimum purchase requirement check
            if (
                user_coupon.coupon.minimum_purchase_requirement
                == Coupon.MinimumPurchaseType.MINIMUM_PURCHASE_AMOUNT
            ):
                if cart.total_price < user_coupon.coupon.minimum_purchase_value:
                    min_purchase = user_coupon.coupon.minimum_purchase_value
                    return Response(
                        {
                            "detail": f"Minimum purchase amount\
                                of {min_purchase} not met."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            if (
                user_coupon.coupon.minimum_purchase_requirement
                == Coupon.MinimumPurchaseType.MINIMUM_QUANTITY_OF_ITEMS
            ):
                total_items = sum(item.quantity for item in cart.cart_items.all())
                if total_items < user_coupon.coupon.buy_products_quantity:
                    buy_qunatity = user_coupon.coupon.buy_products_quantity
                    return Response(
                        {
                            "detail": f"Minimum quantity of\
                            {buy_qunatity} items not met."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if total_items < user_coupon.coupon.minimum_item_value:
                    buy_qunatity = user_coupon.coupon.minimum_item_value
                    return Response(
                        {
                            "detail": f"Minimum quantity of\
                            {buy_qunatity} items not met."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            # Apply redeem logic based on coupon type
            user_coupon = UserCoupon.objects.filter(
                user=user, coupon=user_coupon.coupon
            ).first()

            if user_coupon:
                if user_coupon.redeemed:
                    return Response(
                        {"detail": "Coupon has already been redeemed."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Apply the coupon logic based on the coupon type
            if user_coupon.coupon.coupon_type == Coupon.CouponType.BUY_X_GET_Y:
                return self.apply_buy_x_get_y_coupon(user_coupon.coupon, cart)
            elif user_coupon.coupon.coupon_type == Coupon.CouponType.FREE_SHIPPING:
                return self.apply_free_shipping_coupon(user_coupon.coupon, cart)
            elif user_coupon.coupon.coupon_type == Coupon.CouponType.AMOUNT_OFF_ORDER:
                return self.apply_amount_off_order_coupon(
                    user_coupon.coupon, cart, user_coupon
                )
            elif user_coupon.coupon.coupon_type == Coupon.CouponType.AMOUNT_OFF_PRODUCT:
                return self.apply_amount_off_products_coupon(
                    user_coupon.coupon, cart, user_coupon
                )

            # Save the applied coupon to the cart and return success
            cart.applied_coupon = user_coupon.coupon
            cart.save()

            return Response(
                {"detail": "Coupon applied successfully."}, status=status.HTTP_200_OK
            )

        except Coupon.DoesNotExist:
            return Response(
                {"detail": "Invalid coupon code."}, status=status.HTTP_404_NOT_FOUND
            )
        except Cart.DoesNotExist:
            return Response(
                {"detail": "Invalid cart ID."}, status=status.HTTP_404_NOT_FOUND
            )

    def apply_buy_x_get_y_coupon(self, coupon, cart):

        if cart.applied_coupon and cart.applied_coupon.id == coupon.id:
            return Response(
                {"detail": "This coupon is already applied."},
                status=status.HTTP_200_OK,
            )
        buy_products = coupon.buy_products.all()
        buy_products_value = coupon.buy_products_quantity
        cart.applied_coupon = coupon
        if buy_products:
            if (
                cart
                and CartItem.objects.filter(
                    cart=cart, product_variant__in=buy_products
                ).exists()
            ):
                cart_item_count = CartItem.objects.filter(
                    cart=cart, product_variant__in=buy_products
                ).count()
                if cart_item_count >= buy_products_value:

                    products_get = coupon.customer_get_products.all()
                    affected_items = []
                    other_products = []
                    for product in products_get:

                        item, created = CartItem.objects.get_or_create(
                            cart=cart,
                            product_variant=product,
                            defaults={"quantity": coupon.customer_gets_quantity},
                        )

                        if not created:
                            item.quantity += coupon.customer_gets_quantity

                        if coupon.customer_gets_types == Coupon.CustomerGetsType.FREE:
                            item.discounted_price = 0
                            item.save()
                            affected_items.append(item)

                        elif (
                            coupon.customer_gets_types
                            == Coupon.CustomerGetsType.AMOUNT_OFF_EACH
                        ):
                            item.discounted_price = 0
                            item.save()
                            other_products.append(item)

                        elif (
                            coupon.customer_gets_types
                            == Coupon.CustomerGetsType.PERCENTAGE
                        ):
                            percentage_discount = coupon.customer_gets_discount_value
                            item_discounted_price = item.item_price * (
                                1 - (Decimal(percentage_discount) / 100)
                            )
                            item.discounted_price = item_discounted_price
                            item.save()
                            other_products.append(item)

                    discounted_total = cart.calculate_discounted_total(
                        free_items=affected_items, products=other_products
                    )
                    cart.save()

                return Response(
                    {
                        "detail": "Buy X Get Y coupon applied successfully.",
                        "discounted_total": discounted_total,
                    },
                    status=status.HTTP_200_OK,
                )

            else:
                remaining_count = buy_products_value - cart_item_count
                return Response(
                    {
                        "message": f"Offer will be applicable \
                            after adding {remaining_count} more product."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        buy_basket_products = coupon.buy_baskets.all()
        buy_products_value = coupon.buy_basket_quantity

        if (
            cart
            and CartItem.objects.filter(
                cart=cart, user_basket__basket__in=buy_basket_products
            ).exists()
        ):
            cart_item_count = CartItem.objects.filter(
                cart=cart, user_basket__basket__in=buy_basket_products
            ).count()

            if cart_item_count >= buy_products_value:

                products_get = coupon.customer_get_basket.all()
                basket_affected = []
                baskets = []
                for product in products_get:

                    item, created = CartItem.objects.get_or_create(
                        cart=cart,
                        user_basket__basket=product,
                        defaults={"quantity": coupon.customer_get_quantity},
                    )

                    if not created:
                        item.quantity += coupon.customer_get_quantity

                    if coupon.customer_gets_types == Coupon.CustomerGetsType.FREE:
                        item.discounted_price = 0
                        item.save()
                        basket_affected.append(item)

                    elif (
                        coupon.customer_gets_types
                        == Coupon.CustomerGetsType.AMOUNT_OFF_EACH
                    ):
                        item.discounted_price = 0
                        item.save()
                        baskets.append(item)

                    elif (
                        coupon.customer_gets_types == Coupon.CustomerGetsType.PERCENTAGE
                    ):
                        percentage_discount = coupon.customer_gets_discount_value
                        item_discounted_price = item.item_price * (
                            1 - (Decimal(percentage_discount) / 100)
                        )
                        item.discounted_price = item_discounted_price
                        item.save()
                        baskets.append(item)

                discounted_total = cart.calculate_discounted_total(
                    free_basket=basket_affected, baskets=baskets
                )
                cart.save()

                return Response(
                    {
                        "detail": "Buy X Get Y coupon applied successfully.",
                        "discounted_total": discounted_total,
                    },
                    status=status.HTTP_200_OK,
                )

            else:
                remaining_count = buy_products_value - cart_item_count
                return Response(
                    {
                        "message": f"Offer will be applicable \
                            after adding {remaining_count} more product."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(
            {"error": "Products not found in the cart for Buy X Get Y offer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def apply_free_shipping_coupon(self, coupon, cart):

        if cart.applied_coupon and cart.applied_coupon.id == coupon.id:
            return Response(
                {"detail": "This coupon is already applied."},
                status=status.HTTP_200_OK,
            )
        cart.applied_coupon = coupon
        address = CustomerAddress.objects.filter(
            customer__user=cart.user, primary=True
        ).last()
        if not address:
            return Response(
                {"detail": "No primary address found for the user."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if coupon.shipping_scope == "Specific States":
            offered_states = coupon.states.values_list("abbreviation", flat=True)
            if address.state not in offered_states:
                return Response(
                    {"detail": "Free shipping is not available for this state."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if coupon.exclude_shipping_rate:
            cart.delivery_fees = 0.00
            cart.save()
            return Response({"detail": "Free shipping applied successfully."})
        elif coupon.shipping_rate is not None:
            cart.delivery_fees = coupon.shipping_rate
            cart.save()
            return Response({"detail": "Free shipping applied successfully."})
        return Response(
            {"detail": "Free shipping is not available for this state."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def apply_amount_off_order_coupon(self, coupon, cart, user_coupon):

        if cart.applied_coupon and cart.applied_coupon.id == coupon.id:
            return Response(
                {"detail": "This coupon is already applied."},
                status=status.HTTP_200_OK,
            )
        total_cart_price = cart.total_price
        cart.applied_coupon = coupon
        if coupon.discount_types == Coupon.DiscountType.AMOUNT:
            if total_cart_price >= coupon.minimum_purchase_value:
                discount_amount = coupon.discount_value
                new_total_price = max(total_cart_price - discount_amount, 0.00)

                cart.delivery_fees = max(cart.delivery_fees, 0.00)
                cart.save()

                return Response(
                    {"detail": "Coupon applied successfully."},
                    status=status.HTTP_200_OK,
                )
            else:
                min_purchase = coupon.minimum_purchase_value
                error = f"Coupon can only be applied on\
                    a minimum purchase of {min_purchase}."
                return Response(
                    {"detail": error},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        elif coupon.discount_types == Coupon.DiscountType.PERCENTAGE:

            if total_cart_price >= coupon.minimum_purchase_value:
                discount_amount = (
                    Decimal(coupon.discount_value) / 100
                ) * total_cart_price
                new_total_price = max(total_cart_price - discount_amount, 0.00)

                cart.delivery_fees = max(cart.delivery_fees, 0.00)
                cart.save()

                return Response(
                    {
                        "detail": "Coupon applied successfully.",
                        "discount": discount_amount,
                        "new_total": new_total_price,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                min_purchase = coupon.minimum_purchase_value
                return Response(
                    {"detail": f"Minimum purchase amount of {min_purchase} not met."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(
            {"detail": "Invalid coupon type."}, status=status.HTTP_400_BAD_REQUEST
        )

    def apply_amount_off_products_coupon(self, coupon, cart, user_coupon):
        if cart.applied_coupon and cart.applied_coupon.id == coupon.id:
            return Response(
                {"detail": "This coupon is already applied."},
                status=status.HTTP_200_OK,
            )

        if coupon.applies_to == Coupon.CouponApplyType.ALL_PRODUCTS:
            eligible_products = ProductVariant.objects.all()
        else:
            eligible_products = coupon.specific_products.all()
        cart.applied_coupon = coupon
        cart_items = CartItem.objects.filter(
            cart=cart, product_variant__in=eligible_products
        )

        for item in cart_items:
            original_price = item.product_variant.inventory_items.regular_price
            discounted_price = max(original_price - coupon.discount_value, 0)

            item.discount_value = discounted_price * item.quantity

            item.save()
            cart.save()

        return Response(
            {"detail": "Discount applied to eligible products successfully."}
        )

    def delete(self, request):
        user = request.user
        try:
            cart = Cart.objects.filter(user=user).last()

            if not cart.applied_coupon:
                return Response(
                    {"detail": "No coupon is currently applied to the cart."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            coupon = cart.applied_coupon

            if coupon.coupon_type == Coupon.CouponType.BUY_X_GET_Y:
                self.revert_buy_x_get_y_coupon(cart, coupon)
            elif coupon.coupon_type == Coupon.CouponType.FREE_SHIPPING:
                self.revert_free_shipping_coupon(cart)
            elif coupon.coupon_type in [
                Coupon.CouponType.AMOUNT_OFF_ORDER,
                Coupon.CouponType.AMOUNT_OFF_PRODUCT,
            ]:
                self.revert_amount_off_coupons(cart)

            cart.applied_coupon = None
            cart.save()

            return Response(
                {"detail": "Coupon removed successfully."}, status=status.HTTP_200_OK
            )

        except Cart.DoesNotExist:
            return Response(
                {"detail": "Invalid cart ID."}, status=status.HTTP_404_NOT_FOUND
            )

    def revert_buy_x_get_y_coupon(self, cart, coupon):
        """
        Reverts changes made by Buy X Get Y coupons,
        such as removing free items and baskets.
        """
        try:
            # Handle free products
            free_products = coupon.customer_get_products.all()
            free_baskets = coupon.customer_get_basket.all()

            if free_products.exists() or free_baskets.exists():
                # Handle products
                for product in free_products:
                    try:
                        cart_item = CartItem.objects.get(
                            cart=cart, product_variant=product
                        )
                        if cart_item.quantity > coupon.customer_gets_quantity:
                            cart_item.quantity -= coupon.customer_gets_quantity
                            cart_item.discounted_price = None
                            cart_item.save()
                        else:
                            cart_item.delete()
                    except CartItem.DoesNotExist:
                        continue

                # Handle baskets
                for basket in free_baskets:
                    try:
                        cart_item = CartItem.objects.get(
                            cart=cart, user_basket__basket=basket
                        )
                        if cart_item.quantity > coupon.customer_get_quantity:
                            cart_item.quantity -= coupon.customer_get_quantity
                            cart_item.discounted_price = None
                            cart_item.save()
                        else:
                            cart_item.delete()
                    except CartItem.DoesNotExist:
                        continue

                return Response(
                    {"detail": "Coupon removed successfully."},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {
                        "detail": f"No products or baskets associated with coupon {coupon.id}."
                    }
                )
        except AttributeError:
            return Response({"detail": f"Error processing coupon {coupon.id}."})

    def revert_free_shipping_coupon(self, cart):
        """
        Reverts changes made by Free Shipping coupons.
        """
        cart.delivery_fees = cart.delivery_fees
        cart.save()

    def revert_amount_off_coupons(self, cart):
        """
        Reverts any discounts applied to products or the total cart amount.
        """
        cart_items = cart.cart_items.all()
        for item in cart_items:
            item.discounted_price = None
            item.save()

        cart.save()


class BulkCouponUpdateDeleteAPIView(APIView):

    permission_classes = [IsAdmin]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        serializer = BulkCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon_ids = serializer.validated_data.get("coupons", [])
        coupon_ids = request.data.get("coupons", [])
        if not isinstance(coupon_ids, list):
            return Response(
                {"error": "Invalid input format. Expected a list of coupon IDs."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_coupons = []
        for coupon_id in coupon_ids:
            try:
                existing_coupon = Coupon.objects.get(id=coupon_id)
                with transaction.atomic():
                    counter = 1
                    new_code = f"{existing_coupon.code}_copy"
                    while Coupon.objects.filter(code=new_code).exists():
                        counter += 1
                        new_code = f"{existing_coupon.code}_copy_{counter}"
                    existing_coupon.pk = None
                    existing_coupon.code = new_code
                    new_coupons.append(existing_coupon)
            except Coupon.DoesNotExist:
                return Response(
                    {"error": f"Coupon with ID {coupon_id} does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        Coupon.objects.bulk_create(new_coupons)

        return Response(
            {"message": "Coupon Created Successfully."}, status=status.HTTP_201_CREATED
        )

    def patch(self, request):
        serializer = BulkCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon_status = serializer.validated_data.get("status", None)
        coupon_ids = serializer.validated_data.get("coupons", [])

        updated_ids = []
        if coupon_ids:
            coupons = Coupon.objects.filter(id__in=coupon_ids)
            if not coupons:
                return Response(
                    {"error": "Coupon id not found"}, status=status.HTTP_404_NOT_FOUND
                )
            for coupon in coupons:
                if coupon_status == "draft":
                    coupon.is_active = False
                    coupon.is_deleted = False
                    updated_ids.append(coupon)

                elif coupon_status == "publish":
                    coupon.is_active = True
                    coupon.is_deleted = False
                    updated_ids.append(coupon)

            if updated_ids:
                Coupon.objects.bulk_update(updated_ids, ["is_active", "is_deleted"])
                return Response(
                    {"message": "Coupon Updated Successfully."},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"message": "Coupon does not existed."},
                    status=status.HTTP_200_OK,
                )
        else:
            return Response(
                {"error": "Coupon does not existed."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def delete(self, request):

        serializer = BulkCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        coupon_status = serializer.validated_data.get("status", None)
        coupon_ids = serializer.validated_data.get("coupons", [])
        deleted_ids = []
        if coupon_ids:
            coupons = Coupon.objects.filter(id__in=coupon_ids)
            if not coupons:
                return Response(
                    {"error": "Product id not found"}, status=status.HTTP_404_NOT_FOUND
                )
            for coupon in coupons:
                if coupon_status == "delete":
                    coupon.is_deleted = True
                    coupon.is_active = False
                    deleted_ids.append(coupon)
                elif coupon_status == "publish":
                    coupon.is_active = True
                    coupon.is_deleted = False
                    deleted_ids.append(coupon)

            if deleted_ids:
                Coupon.objects.bulk_update(deleted_ids, ["is_deleted", "is_active"])
                return Response(
                    {"message": "Coupon Deleted Successfully."},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Coupon does not existed."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            return Response(
                {"error": "Coupon does not existed"},
                status=status.HTTP_404_NOT_FOUND,
            )


class CouponTrashAPIView(APIView):
    """
    API view for managing individual coupons.

    Methods:
    - PUT: Update a specific coupon

    Authentication:
    - Requires JWT authentication
    - Only admin users can access
    """

    permission_classes = [IsAdmin]
    authentication_classess = [JWTAuthentication]

    def get_object(self, pk):
        return get_object_or_404(Coupon, pk=pk)

    @swagger_auto_schema(request_body=UpdateCouponSerializer)
    def patch(self, request, pk):
        coupon = self.get_object(pk)
        serializer = UpdateCouponSerializer(coupon, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)