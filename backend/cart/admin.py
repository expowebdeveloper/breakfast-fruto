from django.contrib import admin

from cart.models import Cart, CartItem, CartConfigrations

# admin.site.register(Cart)
# admin.site.register(CartItem)


class CartAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "session_id",
        "applied_coupon",
        "is_gift_wrap",
        "gift_wrap_price",
        "order_packaging_charge",
        "platform_fee",
        "delivery_fees",
        "total_price",
    )


admin.site.register(Cart, CartAdmin)


class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "product_variant", "quantity", "user_basket")


admin.site.register(CartItem, CartItemAdmin)


class CartConfigrationsAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "out_of_stock",
        "gift_wrap_price",
        "order_packaging_charge",
        "platform_fee",
        "tax_amount",
    )


admin.site.register(CartConfigrations, CartConfigrationsAdmin)
