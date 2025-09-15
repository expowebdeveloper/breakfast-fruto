from django.urls import path

from customer.views import (
    BakeryAddressDetailAPIView,
    BakeryAddressListCreateAPIView,
    RegisterBakeryAPIView,
    SendEmailOTPAPIView,
    SendSMSAPIView,
    UpdateBakeryAPIView,
    VerifyOTPAPIView,
)

urlpatterns = [
    path("register/", RegisterBakeryAPIView.as_view(), name="customer_register"),
    path("verify-otp/", VerifyOTPAPIView.as_view(), name="verify-otp"),
    path("sms-otp/", SendSMSAPIView.as_view(), name="sms-otp"),
    path("email-otp/", SendEmailOTPAPIView.as_view(), name="email-otp"),
    path("update-bakery/", UpdateBakeryAPIView.as_view(), name="update-bakery"),
    path(
        "customer-addresses/",
        BakeryAddressListCreateAPIView.as_view(),
        name="customer-address-list-create",
    ),
    path(
        "customer-addresses/<int:pk>/",
        BakeryAddressDetailAPIView.as_view(),
        name="customer-address-retrieve-update-delete",
    ),
]
