from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from django.db.models import Q

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from account.permissions import IsAdmin
from holiday.models import Holiday
from holiday.serializers import HolidaySerializer


class HolidayAPIView(APIView):
    queryset = Holiday.objects.all().order_by('-created_at')
    serializer_class = HolidaySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]
    pagination_class = PageNumberPagination

    @swagger_auto_schema(
        responses={200: HolidaySerializer(many=True)},
    )
    def get(self, request, pk=None, *args, **kwargs):
        """Retrieve all holidays or a specific holiday by ID with Q-based filtering and pagination"""
        
        if pk:
            try:
                holiday = Holiday.objects.get(pk=pk)
                serializer = HolidaySerializer(holiday)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Holiday.DoesNotExist:
                return Response({"detail": "Holiday not found."}, status=status.HTTP_404_NOT_FOUND)

        search_query = request.GET.get("search")

        filters = Q()
        
        if search_query:
            filters |= Q(holiday__icontains=search_query)
            filters |= Q(date__icontains=search_query)


        queryset = Holiday.objects.filter(filters).distinct()

        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request, view=self)

        serializer = HolidaySerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)


    @swagger_auto_schema(
            request_body=HolidaySerializer,
            responses={201: HolidaySerializer(), 400: "Bad Request"},
        )
    def post(self, request, *args, **kwargs):
        """Create a new holiday"""
        serializer = HolidaySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        request_body=HolidaySerializer,
        responses={200: HolidaySerializer(), 400: "Bad Request", 404: "Not Found"},
    )
    def patch(self, request, pk, *args, **kwargs):
        """Update a holiday by ID"""
        try:
            holiday = Holiday.objects.get(pk=pk)
        except Holiday.DoesNotExist:
            return Response({"detail": "Holiday not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = HolidaySerializer(holiday, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        responses={204: "Deleted Successfully", 404: "Not Found"},
    )
    def delete(self, request, pk, *args, **kwargs):
        """Delete a holiday by ID"""
        try:
            holiday = Holiday.objects.get(pk=pk)
            holiday.delete()
            return Response({"detail": "Holiday deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Holiday.DoesNotExist:
            return Response({"detail": "Holiday not found."}, status=status.HTTP_404_NOT_FOUND)
