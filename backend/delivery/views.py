from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ClientData, Subscriber
from dashboard.models import ZipCodeConfig
from delivery.serializers import (
    ZipcodeSerializer,
    ClientDataSerializer,
    SubscriberSerializer,
    StateSerializer
)
from rest_framework.pagination import PageNumberPagination
from django.core.mail import send_mail
from django.conf import settings


class SubscribeView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = SubscriberSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Subscription successful!"}, status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {"detail": "Subscription is already added for this email!"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class SendNewsletterView(APIView):
    def post(self, request, *args, **kwargs):
        offer_subject = request.data.get("subject")
        offer_body = request.data.get("body")

        if not offer_subject or not offer_body:
            return Response(
                {"message": "Subject and body are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscribers = Subscriber.objects.all()
        for subscriber in subscribers:
            send_mail(
                offer_subject,
                offer_body,
                settings.DEFAULT_FROM_EMAIL,
                [subscriber.email],
                fail_silently=False,
            )

        return Response(
            {"message": "Emails sent successfully!"}, status=status.HTTP_200_OK
        )


class ClientDataAPIView(APIView):
    def get(self, request, pk=None):
        if pk:
            try:
                client_data = ClientData.objects.get(pk=pk)
                serializer = ClientDataSerializer(client_data)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except ClientData.DoesNotExist:
                return Response(
                    {"detail": "Data not found"}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            client_data = ClientData.objects.all()
            serializer = ClientDataSerializer(client_data, many=True)
            return Response(
                serializer.data[0] if len(serializer.data) == 1 else serializer.data,
                status=status.HTTP_200_OK,
            )

    def post(self, request):
        serializer = ClientDataSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        try:
            client_data = ClientData.objects.get(pk=pk)
        except ClientData.DoesNotExist:
            return Response(
                {"detail": "Data not found"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ClientDataSerializer(client_data, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        try:
            client_data = ClientData.objects.get(pk=pk)
            client_data.delete()
            return Response(
                {"message": "Data deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except ClientData.DoesNotExist:
            return Response(
                {"detail": "Data not found"}, status=status.HTTP_404_NOT_FOUND
            )


class CheckZipCodeAPIView(APIView):
    DEFAULT_ZIP_CODE = "12345"
    DEFAULT_STATE = "Västernorrlands län"
    DEFAULT_CITY = "Västra Götalands län"

    def post(self, request, *args, **kwargs):
        serializer = StateSerializer(data=request.data)
        print("Serializer: ", serializer)
        if serializer.is_valid():
            state = serializer.validated_data.get("state", self.DEFAULT_STATE)
            city = serializer.validated_data.get("city", self.DEFAULT_CITY)
            print("STATE: ", state)
            current_time = timezone.now()

            cutoff_time = current_time.replace(
                hour=14, minute=0, second=0, microsecond=0
            )
            print("Entering Try")
            try:
                # zipcode_entry = ZipCodeConfig.objects.get(zip_code=zip_code)
                state_entry = ZipCodeConfig.objects.filter(state__icontains=state)[0]
                print("State Entry: ", state_entry)

                if state_entry.delivery_availability == ZipCodeConfig.AVAILABLE:
                    if current_time < cutoff_time:
                        delivery_message = "Delivery available today."
                    else:
                        delivery_message = "Delivery available tomorrow."

                    return Response(
                        {
                            "state": state,
                            "delivery_availability": True,
                            "message": delivery_message,
                            "current_time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    return Response(
                        {"message": "Delivery is not available in this area."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

            except ZipCodeConfig.DoesNotExist:
                return Response(
                    {"message": "Delivery is not available in this area."}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            state = self.DEFAULT_STATE
            print(f"Using default State: {state}")

            try:
                zipcode_entry = ZipCodeConfig.objects.get(state=state)

                if zipcode_entry.delivery_availability == ZipCodeConfig.AVAILABLE:
                    current_time = timezone.now()
                    cutoff_time = current_time.replace(
                        hour=14, minute=0, second=0, microsecond=0
                    )

                    if current_time < cutoff_time:
                        delivery_message = "Delivery available today."
                    else:
                        delivery_message = "Delivery available tomorrow."

                    return Response(
                        {
                            "state": state,
                            "delivery_availability": True,
                            "message": delivery_message,
                            "current_time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    return Response(
                        {"message": "Delivery is not available in this area."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

            except ZipCodeConfig.DoesNotExist:
                return Response(
                    {"message": "Delivery is not available in this area."}, status=status.HTTP_404_NOT_FOUND
                )
