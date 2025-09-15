from rest_framework import serializers
from product.models import  ProductVariant, UserBasket
from cart.models import Cart, CartItem, CartConfigrations
from product.serializers import ProductVariantSerializer


class CartConfigrationssSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartConfigrations
        fields = [
            "id",
            "out_of_stock",
            "gift_wrap_price",
            "order_packaging_charge",
            "platform_fee",
            "tax_amount",
        ]


class ProductVariantUpdateSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(required=True)


class BasketUpdateSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(required=True)


class CartItemPatchSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(required=True)

    def validate_quantity(self, value):
        """Ensure that quantity is a positive integer."""
        if value < 1:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value


class ProductVariantCartSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductVariant with necessary fields for the cart.
    """

    class Meta:
        model = ProductVariant
        fields = ["id", "product", "regular_price", "sale_price", "quantity"]


class BasketCartSerializer(serializers.ModelSerializer):
    """
    Serializer for Basket with necessary fields for the cart, including basket name.
    """

    basket_name = serializers.CharField(source="basket", read_only=True)
    is_customizable = serializers.SerializerMethodField()
    # products = serializers.SerializerMethodField()

    class Meta:
        model = UserBasket
        fields = ["id", "basket", "basket_name", "image", "offer_price", "basket_price", "is_customizable"]

    # def get_products(self, obj):
    #     """Get all products in the basket with their details"""
    #     basket_products = obj.basket_products.all()  # Assuming related_name='basket_products'
    #     return [{
    #         'id': bp.product.id,
    #         'name': bp.product.name,
    #         'quantity': bp.quantity,
    #         'price': str(bp.price),
    #         'image': bp.product.image.url if bp.product.image else None,
    #         'description': bp.product.description,
    #     } for bp in basket_products]
    def get_is_customizable(self, obj):
        return obj.basket.is_customizable


    def to_representation(self, instance):
        """
        Override to_representation to ensure proper serialization of basket_name.
        """
        representation = super().to_representation(instance)
        basket_name = representation.get("basket_name")
        if not basket_name:
            representation["basket_name"] = "No Name Available"
        return representation


class CartItemSerializer(serializers.ModelSerializer):
    item_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    product_variant = ProductVariantSerializer(required=False)
    basket_details = serializers.SerializerMethodField()
    basket_products = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product_variant",
            "quantity",
            "item_price",
            "basket_details",
            "basket_products",
        ]

    def get_basket_details(self, obj):
        """
        Get details of the basket associated with this cart item.
        """
        if obj.user_basket:
            return BasketCartSerializer(obj.user_basket).data
        return None

    def get_basket_products(self, obj):
        """
        Get full product variant details for items in the user's basket associated with this cart item.
        """
        if obj.user_basket:
            basket_items = obj.user_basket.items.all()
            return [
                {
                    "id": item.id,
                    "product_variant": ProductVariantSerializer(
                        item.product_variant
                    ).data,
                    "quantity": item.quantity,
                    "description": item.product_variant.description,
                }
                for item in basket_items
            ]
        return None


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    discounted_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    applied_coupon_name = serializers.SerializerMethodField()
    discounted_amount = serializers.SerializerMethodField()

    class Meta:
        product_variant = ProductVariantSerializer()
        model = Cart
        fields = [
            "id",
            "user",
            "session_id",
            "items",
            "applied_coupon",
            "gift_wrap_price",
            "order_packaging_charge",
            "platform_fee",
            "delivery_fees",
            "is_gift_wrap",
            "total_price",
            "vat_amount",
            "total_with_vat",
            "discounted_price",
            "applied_coupon_name",
            "discounted_amount"
        ]
    def get_discounted_amount(self, obj):
        # Calculate discounted amount as total_price - discounted_price
        if obj.total_price and obj.discounted_price:
            return obj.total_price - obj.discounted_price
        return None

    def get_applied_coupon_name(self, obj):
        # Calculate discounted amount as total_price - discounted_price
        if obj:
            if obj.applied_coupon:

                return obj.applied_coupon.code
        return None




class CartItemInputSerializer(serializers.ModelSerializer):
    """
    Serializer for handling cart item creation.
    """

    item_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    product_variant = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.all(), required=False  # ✅ Accepts ID instead of full object
    )
    user_basket_id = serializers.IntegerField(required=False)  # ✅ Accepts basket ID as an integer
    quantity = serializers.IntegerField(min_value=1, required=False) 

    class Meta:  # ✅ Added Meta class
        model = CartItem
        fields = [
            "id",
            "product_variant",
            "user_basket_id",
            "quantity",
            "item_price",
        ]

    def get_user_basket_price(self, obj):
        """
        Get the ID of the user's basket if it exists.
        """
        if obj.user_basket:
            x = obj.user_basket.id
            
        return None
        

class CartUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = ['is_gift_wrap']
        

class CartConfigrationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartConfigrations
        fields = "__all__"