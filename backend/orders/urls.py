from django.urls import path

from orders.views import (
    ApproveOrderAPIView,
    OrderSortAPI,
    OrderDetailView,
    CheckoutAPIView,
    OrderListAPIView,
    ListInvoicesAPIView,
    GetInvoiceAPIView,
    GetUserInvoiceAPIView,
    DownloadInvoiceAPIView,
    DownloadOrderAPIView,
    GetOrderByIdAPIView,
    NotifyInvoiceStatusUpdateView,
    CheckoutAPIForCompanyView,
    OrderAfterBooking
) 

urlpatterns = [
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("checkout_order/", CheckoutAPIForCompanyView.as_view(), name="checkout_for_company_view"),
    
    path("pending-approval/", ApproveOrderAPIView.as_view(), name="pending-approval"),
    path(
        "pending-approval/<int:pk>/",
        ApproveOrderAPIView.as_view(),
        name="update-pending-approval",
    ),
    path("orders/", OrderListAPIView.as_view(), name="orders"),
    # 
    path("OrderAfterBooking/", OrderAfterBooking, name="OrderAfterBooking"),

    path("orders/<int:pk>/", OrderListAPIView.as_view(), name="order-detail"),
    path("order-detail/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/sort/", OrderSortAPI.as_view(), name="order_sort"),
    path("invoices/", ListInvoicesAPIView.as_view(), name="list-invoices"),
    path("invoices/<int:pk>/", GetInvoiceAPIView.as_view(), name="single-invoice"),
    path("user-invoices/", GetUserInvoiceAPIView.as_view(), name="user-invoices"),
    path(
        "user-invoices/<int:pk>/", GetUserInvoiceAPIView.as_view(), name="user-invoices"
    ),
    path(
        "download-invoice/<str:invoice_number>/",
        DownloadInvoiceAPIView.as_view(),
        name="download-invoice",
    ),
    path(
        "notify-invoice-status/",
        NotifyInvoiceStatusUpdateView.as_view(),
        name="notify-invoice-status",
    ),
    path(
        "generate-order-pdf/<str:order_id>/",
        DownloadOrderAPIView.as_view(),
        name="generate_order_pdf_api",
    ),
    path(
        "orders/<str:order_id>/",
        GetOrderByIdAPIView.as_view(),
        name="order_detail",
    ),
]
