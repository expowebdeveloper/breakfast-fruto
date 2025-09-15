from django.shortcuts import render
from django.conf import settings
from .models import CustomerQuery
from .serializers import CustomerQuerySerializer
from rest_framework import generics, permissions, status
from rest_framework_simplejwt.authentication import JWTAuthentication
from datetime import datetime, timedelta
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from account.permissions import IsAdmin
from django.utils.html import strip_tags


class CustomerQueryPermission(permissions.BasePermission):
    """
    Custom permission:
    - Anyone can create (`POST`)
    - Only admin users can retrieve (`GET`), update (`PATCH`), or delete (`DELETE`)
    """

    def has_permission(self, request, view):
        # Allow everyone to create a query (POST request)
        if request.method == "POST":
            return True
        # Allow only admin users for GET, PATCH, DELETE
        return request.user.is_authenticated and request.user.is_staff


class CustomerQueryListCreateAPIView(generics.ListCreateAPIView):
    """
    API to list all customer queries and create a new one.
    Sends an email to the admin when a new query is created.
    """

    queryset = CustomerQuery.objects.all()
    serializer_class = CustomerQuerySerializer
    permission_classes = [CustomerQueryPermission]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        # Save the customer query
        customer_query = serializer.save()

        # Email details
        subject = "New Customer Query Received"
        admin_email = settings.ADMIN_EMAIL  # Define ADMIN_EMAIL in settings.py

        # Render HTML template with context
        context = {
            "name": customer_query.name,
            "email": customer_query.email,
            "contact_no": customer_query.contact_no,
            "message": customer_query.message,
            "year": datetime.now().year,
        }
        html_content = render_to_string("emails/customer_query_email.html", context)
        plain_message = strip_tags(html_content)

        # Send email
        email = EmailMultiAlternatives(
            subject, plain_message, settings.EMAIL_HOST_USER, [admin_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()


class CustomerContactAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    authentication_classes = [JWTAuthentication]
    """
    API to retrieve, update, or delete a specific customer query.
    """
    queryset = CustomerQuery.objects.all()
    serializer_class = CustomerQuerySerializer
