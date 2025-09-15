from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CartAPIView, CartItemAPIView, ReOrderCartItemAPIView, CartConfigrationsView, empty_cart_for_user


urlpatterns = [
    path("", CartAPIView.as_view(), name="cart-create"),
    path("item/", CartItemAPIView.as_view(), name="cart-item-create"),
    path("item/<int:pk>/", CartItemAPIView.as_view(), name="cart-item"),
    path("item/update/", CartItemAPIView.as_view(), name="cart-item-update"),
    path("re-order/", ReOrderCartItemAPIView.as_view(), name="re-order"),
    path("cart-config/", CartConfigrationsView.as_view(), name="cart-config"),
    path("empty_cart/<int:cart_id>/", empty_cart_for_user, name="empty_cart")
]
