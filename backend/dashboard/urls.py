from django.urls import path

from dashboard.views import (
    AdminConfigurationAPIView,
    AdminInvoiceConfigurationView,
    ListCustomerBakeryAPIView,
    ProductStatsView,
    ZipCodeConfiguration,
)

urlpatterns = [
    path("products-stats/", ProductStatsView.as_view(),
         name="product-stats"),
    path("zip/configuration/", ZipCodeConfiguration.as_view(),
         name="deliery-list"),
    path(
        "zip/configurations/<int:id>/",
        ZipCodeConfiguration.as_view(),
        name="delivery-list",
    ),
    path(
        "customer-list/",
        ListCustomerBakeryAPIView.as_view(),
        name="customer-list",
    ),
    path(
        "customer/<int:pk>/", ListCustomerBakeryAPIView.as_view(),
        name="delete_bakery"
    ),
    path(
        "admin-configurations/",
        AdminConfigurationAPIView.as_view(),
        name="admin-configuration-list-create",
    ),
    path(
        "admin-invoice-config/",
        AdminInvoiceConfigurationView.as_view(),
        name="admin-invoice-config",
    ),
]

