from decimal import Decimal
from datetime import date
from django.db import models
from account.models import BaseModel
from account.models import CustomUser as User
from customer.models import CustomerAddress
from coupon.models import Coupon
from product.models import ProductVariant, UserBasket
from decimal import Decimal
from django.db.models import F, Sum, DecimalField, Case, When, Value
from product.models import Inventory

class Cart(BaseModel):
    user = models.OneToOneField(User, null=True, blank=True, on_delete=models.CASCADE)
    session_id = models.CharField(max_length=40, unique=True, null=True, blank=True)
    applied_coupon = models.ForeignKey(
        Coupon, null=True, blank=True, on_delete=models.SET_NULL
    )
    is_gift_wrap = models.BooleanField(default=False)
    gift_wrap_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    order_packaging_charge = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00
    )
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_fees = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    vat_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    total_with_vat = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    @property
    def total_price(self):
        """
        Calculate the total price without any discounts, considering product variants
        and user baskets.
        """
        total_price = Decimal("0.00")

        # Iterate through all items in the cart
        for item in self.items.all():
            # Handle items with a product variant
            if item.product_variant:
                inventory = Inventory.objects.filter(product_variant=item.product_variant).first()
                if inventory:
                    total_price += inventory.regular_price * item.quantity

            # Handle items with a user basket
            if item.user_basket:
                user_basket = UserBasket.objects.filter(id=item.user_basket.id).first()
                for basket_item in user_basket.items.all():
                    if basket_item.product_variant:
                        inventory = Inventory.objects.filter(product_variant=basket_item.product_variant).first()
                        if inventory:
                            total_price += inventory.regular_price * basket_item.quantity

                # Add the total price of the user basket multiplied by the quantity
                total_price += user_basket.basket_price * item.quantity

            # Add shipping cost if applicable
        total_shipping_cost = (
            Decimal(self.delivery_fees) if self.delivery_fees else Decimal("0.00")
        )
        print("Total Shipping Cost:", total_shipping_cost)
        print("Total Price:", total_price)
        return total_price + total_shipping_cost

    def calculate_discounted_total(
        self, free_items=None, free_basket=None, baskets=None, products=None
    ):
        """Calculate total price, ensuring free items and baskets are excluded from the cost.
        If the cart is empty, return total as 0 and do not apply any coupons.
        """
        cart_items = self.items.all()

        # ✅ Check if cart is empty
        if not cart_items.exists():
            self.applied_coupon = None  # ✅ Remove coupon if cart is empty
            self.save()
            return Decimal("0.00")  # ✅ Return total as 0

        total_item_price = Decimal("0.00")

        if free_items:
            coupon = self.applied_coupon
            free_item_ids = {item.id for item in free_items}
            for item in cart_items:
                if item.id not in free_item_ids:
                    total_item_price += Decimal(item.item_price)
                else:
                    # Only charge for quantities beyond the free amount
                    chargable_quantity = max(
                        0, item.quantity - coupon.customer_gets_quantity
                    )
                    if chargable_quantity > 0:
                        item_unit_price = item.item_price / item.quantity
                        total_item_price += item_unit_price * chargable_quantity

        elif free_basket:
            coupon = self.applied_coupon
            free_basket_items = {item for item in free_basket}
            for item in cart_items:
                if item in free_basket_items:
                    item.refresh_from_db()
                    chargable_quantity = max(
                        0, item.quantity - coupon.customer_get_quantity
                    )
                    if chargable_quantity > 0:
                        basket_unit_price = Decimal(item.item_price) / Decimal(
                            item.quantity
                        )
                        charge_amount = basket_unit_price * chargable_quantity
                        total_item_price += charge_amount
                else:
                    total_item_price += Decimal(item.item_price)

        elif products:
            product_item_ids = {item.id for item in products} if products else set()
            coupon = self.applied_coupon
            if coupon.customer_gets_types == Coupon.CustomerGetsType.PERCENTAGE:
                for item in cart_items:
                    if item.id in product_item_ids:
                        discount_percentage = coupon.customer_gets_discount_value
                        item_discounted_price = item.item_price * (
                            1 - (Decimal(discount_percentage) / 100)
                        )
                        dis_amount = item.item_price - item_discounted_price
                        total_item_price += dis_amount
            else:
                for item in cart_items:
                    if item.id in product_item_ids:
                        discount_value = Decimal(coupon.customer_gets_discount_value)
                        total_item_price += discount_value * item.quantity

        elif baskets:
            product_item_ids = {item.id for item in baskets} if baskets else set()
            coupon = self.applied_coupon

            if coupon.customer_gets_types == Coupon.CustomerGetsType.PERCENTAGE:
                for item in cart_items:
                    if item.id in product_item_ids:
                        discount_percentage = Decimal(
                            coupon.customer_gets_discount_value
                        )
                        discount_quantity = min(
                            item.quantity, coupon.customer_gets_quantity
                        )
                        normal_quantity = item.quantity - discount_quantity
                        discounted_price = item.item_price * (
                            1 - (discount_percentage / 100)
                        )
                        total_item_price += (discounted_price * discount_quantity) + (
                            item.item_price * normal_quantity
                        )
            else:
                for item in cart_items:
                    if item.id in product_item_ids:
                        discount_value = Decimal(coupon.customer_gets_discount_value)
                        discount_quantity = min(
                            item.quantity, coupon.customer_gets_quantity
                        )
                        normal_quantity = item.quantity - discount_quantity
                        total_item_price += (discount_value * discount_quantity) + (
                            item.item_price * normal_quantity
                        )

        # ✅ Ensure shipping cost is added
        total_shipping_cost = (
            Decimal(self.delivery_fees) if self.delivery_fees else Decimal("0.00")
        )
        return total_item_price + total_shipping_cost

    @property
    def cart_items(self):
        """
        Get all cart items related to this cart.
        """
        return self.items.all()

    @property
    def discounted_price(self):
        """Calculate the total price after applying discounts."""
        total_cart_price = self.total_price
        if not self.applied_coupon:
            return total_cart_price

        coupon = self.applied_coupon

        if coupon.coupon_type == Coupon.CouponType.AMOUNT_OFF_ORDER:
            
            if coupon.discount_types == Coupon.DiscountType.AMOUNT:
                discount_amount = coupon.discount_value
                total_cart_price = max(total_cart_price - discount_amount, 0.00)

            elif coupon.discount_types == Coupon.DiscountType.PERCENTAGE:
                discount_amount = (
                    Decimal(coupon.discount_value) / 100
                ) * total_cart_price
                total_cart_price = max(total_cart_price - discount_amount, 0.00)

        elif coupon.coupon_type == Coupon.CouponType.BUY_X_GET_Y:
            buy_products = coupon.buy_products.all()
            buy_baskets = coupon.buy_baskets.all()

            qualifying_purchase = (
                CartItem.objects.filter(
                    cart=self, product_variant__in=buy_products
                ).exists()
                or CartItem.objects.filter(
                    cart=self, user_basket__basket__in=buy_baskets
                ).exists()
            )
            if qualifying_purchase:

                free_items = set()
                free_baskets = set()
                discounted_products = set()
                discounted_basket = set()

                # Handle product offers
                products_get = coupon.customer_get_products.all()
                for product in products_get:
                    item = CartItem.objects.filter(
                        cart=self, product_variant=product
                    ).first()
                    if not item:
                        continue

                    if coupon.customer_gets_types == Coupon.CustomerGetsType.FREE:
                        free_items.add(item)
                    else:
                        discounted_products.add(item)

                # Handle basket offers
                baskets_get = coupon.customer_get_basket.all()
                for basket in baskets_get:
                    item = (
                        CartItem.objects.filter(cart=self, user_basket__basket=basket)
                        .select_related("user_basket")
                        .first()
                    )
                    print(f"Original item quantity: {item.quantity}")
                    if not item:
                        continue

                    if coupon.customer_gets_types == Coupon.CustomerGetsType.FREE:

                        free_baskets.add(item)
                        print(f"Added to free_baskets with quantity: {item.quantity}")
                    else:
                        discounted_basket.add(item)

                # Calculate the discount
                discount = self.calculate_discounted_total(
                    free_items=free_items if free_items else None,
                    free_basket=free_baskets if free_baskets else None,
                    products=discounted_products if discounted_products else None,
                    baskets=discounted_basket if discounted_basket else None,
                )
                return max(discount, Decimal("0.00"))

        elif coupon.coupon_type == Coupon.CouponType.AMOUNT_OFF_PRODUCT:
            eligible_products = []
            eligible_baskets = []
            if coupon.applies_to == Coupon.CouponApplyType.SPECIFIC_PRODUCTS:
                eligible_products = coupon.specific_products.all()
                eligible_baskets = coupon.specific_baskets.all()
            else:
                eligible_products = ProductVariant.objects.all()
                eligible_baskets = UserBasket.objects.all()

            cart_items_products = self.items.filter(
                product_variant__in=eligible_products
            )
            cart_items_baskets = self.items.filter(user_basket__in=eligible_baskets)

            non_discounted_total = self.items.exclude(
                product_variant__in=eligible_products
            ).exclude(user_basket__in=eligible_baskets).annotate(
                item_price=Case(
                    When(
                        product_variant__isnull=False,
                        then=F("product_variant__inventory_items__regular_price")
                        * F("quantity"),
                    ),
                    When(
                        user_basket__isnull=False,
                        then=F("user_basket__basket_price") * F("quantity"),
                    ),
                    default=Value(0),
                    output_field=DecimalField(),
                )
            ).aggregate(
                total=Sum("item_price", output_field=DecimalField())
            )[
                "total"
            ] or Decimal(
                "0.00"
            )
            discounted_total = Decimal("0.00")

            # Calculate discounts for both products and baskets
            for item in cart_items_products.union(cart_items_baskets):
                original_price = item.item_price
                if coupon.discount_types == Coupon.DiscountType.AMOUNT:
                    discount = min(
                        original_price, coupon.discount_value * item.quantity
                    )
                else:  # PERCENTAGE
                    discount = original_price * (
                        Decimal(coupon.discount_value) / Decimal("100")
                    )
                discounted_total += original_price - discount
            return discounted_total + non_discounted_total

        elif coupon.coupon_type == Coupon.CouponType.FREE_SHIPPING:
            address = CustomerAddress.objects.filter(
                customer__user=self.user, primary=True
            ).last()
            offered_states = coupon.states.values_list("name", flat=True)
            if address and address.state in list(offered_states):
                self.delivery_fees = Decimal("0.00")
                if coupon.shipping_rate and not coupon.exclude_shipping_rate:
                    self.delivery_fees = Decimal(coupon.shipping_rate)
                self.save()

        return total_cart_price

    def calculate_vat(self, vat_percentage=10, delivery_fees=10):
        
        cart_config = CartConfigrations.objects.first()

        # Default values if missing
        if cart_config:
            tax_amount = cart_config.tax_amount or Decimal(0)
            if tax_amount:
                vat_percentage = tax_amount
            else:
                tax_amount = Decimal(0)
            
            platform_fee = cart_config.platform_fee or Decimal(0)
            packaging_fee = cart_config.order_packaging_charge or Decimal(0)
        else:
            tax_amount=Decimal(0)
            vat_percentage = tax_amount
            platform_fee=Decimal(0)
            packaging_fee=Decimal(0)
            
            
        if self.is_gift_wrap:
            gift_wrap_fee = cart_config.gift_wrap_price or Decimal(0)
        else:
            gift_wrap_fee = Decimal(0)
        
        discount_total = self.discounted_price if self.discounted_price else 0
        result_amount = self.total_price - discount_total

        if result_amount:
            self.vat_amount = (discount_total * Decimal(vat_percentage)) / 100
            self.total_with_vat = discount_total + self.vat_amount
        else:
            self.vat_amount = (self.total_price * Decimal(vat_percentage)) / 100
            self.total_with_vat = self.total_price + self.vat_amount

        self.delivery_fees = delivery_fees
        self.total_with_vat = self.total_with_vat + self.delivery_fees + platform_fee + packaging_fee + gift_wrap_fee

        Cart.objects.filter(pk=self.pk).update(
            vat_amount=self.vat_amount,
            total_with_vat=self.total_with_vat,
            delivery_fees=Decimal(delivery_fees),
            platform_fee=platform_fee,
            order_packaging_charge=packaging_fee,
            gift_wrap_price=gift_wrap_fee,
        )

    def __str__(self):
        return f"Cart({self.user if self.user else 'Guest'})"

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["session_id"], name="unique_session_cart")
        ]


class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product_variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, null=True, blank=True
    )
    user_basket = models.ForeignKey(
        UserBasket, on_delete=models.CASCADE, null=True, blank=True
    )
    quantity = models.PositiveIntegerField()

    @property
    def item_price(self):
        """
        Dynamically calculate the item price based on the product_variant or user_basket.
        """
        if self.product_variant:
            inventory_item = getattr(self.product_variant, "inventory_items", None)
            if inventory_item:
                today = date.today()

                is_sale_active = (
                    inventory_item.sale_price_dates_from
                    and inventory_item.sale_price_dates_to
                    and inventory_item.sale_price_dates_from
                    <= today
                    <= inventory_item.sale_price_dates_to
                )

                if is_sale_active:
                    return inventory_item.sale_price * self.quantity
                else:
                    return inventory_item.regular_price * self.quantity
            return 0

        elif self.user_basket:
            basket_price = self.user_basket.basket_price
            if basket_price:
                return basket_price * self.quantity
            return 0

        return 0

    def __str__(self):
        """
        String representation of the CartItem instance.
        """
        return f"CartItem({self.product_variant.variant_name if self.product_variant else 'Basket Item'}, {self.quantity})"

    def save(self, *args, **kwargs):
        """
        Override save method to perform additional actions if needed.
        """
        super().save(*args, **kwargs)


class CartConfigrations(BaseModel):

    gift_wrap_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Price for gift wrapping",
    )
    out_of_stock = models.IntegerField(default=5)

    order_packaging_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Charge for packaging the order",
    )
    platform_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Fee charged by the platform",
    )
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00, help_text="Calculated tax amount"
    )

    def __str__(self):
        return f"Gift Wrap Price: {self.gift_wrap_price}, \
            Packaging Charge: {self.order_packaging_charge}, \
                Platform Fee: {self.platform_fee}, Tax Amount: {self.tax_amount})"
