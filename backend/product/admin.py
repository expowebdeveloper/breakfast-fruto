from django.contrib import admin

from product.models import (
    Category,
    Inventory,
    Product,
    ProductImage,
    ProductMaterial,
    ProductSeo,
    ProductVariant,
    SubCategory,
    TimeSlotConfiguration,
    UserBasket,
    UserBasketItem,
    BasketImage,
    Basket,
    ProductRating,
    FavouriteItem,
)


admin.site.register(Category)
admin.site.register(ProductImage)
admin.site.register(SubCategory)
admin.site.register(ProductSeo)
admin.site.register(Inventory)
admin.site.register(ProductRating)
admin.site.register(ProductMaterial)
admin.site.register(UserBasketItem)
admin.site.register(BasketImage)
admin.site.register(Basket)
admin.site.register(TimeSlotConfiguration)
admin.site.register(UserBasket)
admin.site.register(Product)
admin.site.register(ProductVariant)
admin.site.register(FavouriteItem)
