from django.urls import path

from delivery.views import (
    CheckZipCodeAPIView,
    ClientDataAPIView,
    SendNewsletterView,
    SubscribeView,
)

urlpatterns = [
    path("check-zipcode/", CheckZipCodeAPIView.as_view(), name="check-zipcode"),
    path("client-data/", ClientDataAPIView.as_view(), name="client-data-list"),
    path(
        "client-data/<uuid:pk>/", ClientDataAPIView.as_view(), name="client-data-detail"
    ),
    path("send-newsletter/", SendNewsletterView.as_view(), name="send-newsletter"),
    path("subscribe/", SubscribeView.as_view(), name="subscribe"),
]
