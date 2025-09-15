# import uuid
# from decimal import Decimal

# from cart.models import Cart as CartModel
# from cart.models import CartItem
# from product.models import ProductVariant


# class Cart:
#     def __init__(self, request):
#         """Initialize the cart"""
#         self.session = request.session
#         if not request.user.is_authenticated:
#             if not self.session.get("cart_user_id"):
#                 self.session["cart_user_id"] = str(uuid.uuid4())
#             self.user_id = self.session["cart_user_id"]
#         else:
#             self.user_id = request.user.id

#         cart = self.session.get("cart")
#         if not cart:
#             cart = self.session["cart"] = {}
#         self.cart = cart

#     def add(self, product_variant, quantity=1):
#         """Add a product variant to the cart or update its quantity"""
#         variant_id = str(product_variant.id)
#         if variant_id not in self.cart:
#             self.cart[variant_id] = {"quantity": 0, "price": str(product_variant.price)}
#         self.cart[variant_id]["quantity"] += quantity
#         self.save()

#         self.add_to_db(product_variant, quantity)

#     def add_to_db(self, product_variant, quantity):
#         """Add the cart item to the database"""
#         cart, created = CartModel.objects.get_or_create(
#             user_id=self.user_id if isinstance(self.user_id, int) else None,
#             session_id=(
#                 self.session["cart_user_id"]
#                 if not isinstance(self.user_id, int)
#                 else None
#             ),
#         )

#         cart_item, created = CartItem.objects.get_or_create(
#             cart=cart, product_variant=product_variant
#         )

#         cart_item.quantity += quantity
#         cart_item.save()

#     def save(self):
#         """Save the cart in the session"""
#         self.session.modified = True

#     def remove(self, product_variant):
#         """Remove a product variant from the cart"""
#         variant_id = str(product_variant.id)
#         if variant_id in self.cart:
#             del self.cart[variant_id]
#             self.save()

#             cart = CartModel.objects.get(session_id=self.session["cart_user_id"])
#             CartItem.objects.filter(cart=cart, product_variant=product_variant).delete()

#     # def clear(self):
#     #     """Clear the cart"""
#     #     self.session["cart"] = {}
#     #     self.save()

#     #     # Also clear the cart from the database
#     #     CartModel.objects.filter(session_id=self.session["cart_user_id"]).delete()

#     # def __iter__(self):
#     #     """Iterate over the items in the cart and attach product variant info"""
#     #     variant_ids = self.cart.keys()
#     #     variants = ProductVariant.objects.filter(id__in=variant_ids)
#     #     for variant in variants:
#     #         cart_item = self.cart[str(variant.id)]
#     #         cart_item["product_variant"] = variant
#     #         cart_item["total_price"] = (
#     #             Decimal(cart_item["price"]) * cart_item["quantity"]
#     #         )
#     #         yield cart_item

#     # def get_total_price(self):
#     #     """Get the total price of all items in the cart"""
#     #     return sum(
#     #         Decimal(item["price"]) * item["quantity"] for item in self.cart.values()
#     #     )

#     # def get_total_quantity(self):
#     #     """Get the total quantity of all items in the cart"""
#     #     return sum(item["quantity"] for item in self.cart.values())
