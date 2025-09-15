from django.urls import path

from .views import CustomerContactAPIView, CustomerQueryListCreateAPIView

urlpatterns = [

    path(
        "customer-contact/",
        CustomerQueryListCreateAPIView.as_view(),
        name="customer_query_list_create",
    ),
    path(
        "customer-contact/<int:pk>/",
        CustomerContactAPIView.as_view(),
        name="customer_query_detail",
    ),
]