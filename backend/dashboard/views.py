import logging
from rest_framework.parsers import MultiPartParser, FormParser

from datetime import timedelta
from rest_framework import generics, permissions, status
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from datetime import datetime
from django.conf import settings
from django.db.models import Count, Q, Sum, Value
from django.db.models.functions import Concat, TruncWeek
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.timezone import now
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from account.models import CustomUser
from account.permissions import AllowGetOnlyIsAdminStockManager, IsAdmin
from customer.models import Customer
from customer.serializers import CustomerAdminSerializer
from dashboard.models import (
    AdminConfiguration,
    AdminInvoiceConfiguration,
    ZipCodeConfig,
)
from dashboard.serializers import (
    AdminConfigurationSerializer,
    AdminInvoiceConfigurationSerializer,
    ZipCodeConfigSerializer,
    
)
from orders.models import Order, OrderItem
from product.models import Basket, Inventory, Product, ProductVariant, Category

logger = logging.getLogger(__name__)


class ZipCodeConfiguration(APIView):
    permission_classes = [AllowGetOnlyIsAdminStockManager]
    authentication_classess = [JWTAuthentication]

    def get_queryset(self):
        queryset = ZipCodeConfig.objects.filter(is_deleted=False)

        search = self.request.query_params.get("search")
        sort_by = self.request.query_params.get("sort_by", "asc")

        if search:
            queryset = queryset.filter(
                Q(zip_code__iregex=search)
                | Q(city__iregex=search)
                | Q(state__iregex=search)
                | Q(delivery_availability__iexact=search)
                | Q(min_order_quantity__iexact=search)
                | Q(delivery_threshold__iexact=search)
            )
        if sort_by == "asc":
            queryset = queryset.order_by("-created_at")
        elif sort_by == "desc":
            queryset = queryset.order_by("created_at")
        elif sort_by == "min_order":
            queryset = queryset.order_by("min_order_quantity")
        elif sort_by == "-min_order":
            queryset = queryset.order_by("-min_order_quantity")
        elif sort_by == "-delivery":
            queryset = queryset.order_by("-delivery_threshold")
        elif sort_by == "delivery":
            queryset = queryset.order_by("-delivery_threshold")
        elif sort_by == "-delivery_availability":
            queryset = queryset.order_by("-delivery_availability")
        elif sort_by == "delivery_availability":
            queryset = queryset.order_by("delivery_availability")

        return queryset

    def get(self, request, id=None):
        if id:
            delivery = get_object_or_404(ZipCodeConfig, id=id, is_deleted=False)
            serializer = ZipCodeConfigSerializer(delivery)
            return Response(serializer.data, status=status.HTTP_200_OK)

        paginator = PageNumberPagination()
        deliveries = self.get_queryset()
        paginated_deliveries = paginator.paginate_queryset(deliveries, request)
        serializer = ZipCodeConfigSerializer(paginated_deliveries, many=True)
        return paginator.get_paginated_response(serializer.data)

    @swagger_auto_schema(request_body=ZipCodeConfigSerializer)
    def post(self, request):
        serializer = ZipCodeConfigSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(request_body=ZipCodeConfigSerializer)
    def patch(self, request, id):
        delivery = get_object_or_404(ZipCodeConfig, id=id)

        serializer = ZipCodeConfigSerializer(delivery, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        delivery = get_object_or_404(ZipCodeConfig, id=id, is_deleted=False)
        delivery.is_deleted = True
        delivery.save()
        return Response({"message": "Item deleted"}, status=status.HTTP_204_NO_CONTENT)


class ProductStatsView(APIView):
    permission_classes = [IsAdmin]
    authentication_classess = [JWTAuthentication]

    def get(self, request):
        today = timezone.now().date()

        days = request.query_params.get("days", None)

        if days in ["7", "15", "30"]:
            start_date = today - timedelta(days=int(days))
        else:
            current_year = today.year
            start_date = today.replace(month=1, day=1)

        orders_in_range = Order.objects.filter(
            created_at__date__range=(start_date, today)
        )

        total_orders_today = orders_in_range.count()
        
        total_workers = CustomUser.objects.filter(
            role__in=["worker", "accountant", "stock_manager"]
        ).count()
        total_bakery_customers = CustomUser.objects.filter(role="customer").count()
        total_running_orders = Order.objects.filter(
            status__in=["in_transit", "in_progress"]
        ).count()
        total_today_order_price = (
            orders_in_range.aggregate(Sum("final_amount"))["final_amount__sum"] or 0.0
        )
        configurations = AdminConfiguration.objects.all().last()
        low_stock_threshold = (
            configurations.out_of_stock
            if configurations
            else settings.LOW_STOCK_THRESHOLD
        )
        low_stock_products = Inventory.objects.filter(
            total_quantity__lt=low_stock_threshold
        ).count()

        total_products_period = Product.objects.filter(
            created_at__date__range=(today - timedelta(days=365), today)).count()

        total_product_added_today = Product.objects.filter(created_at__date=today).count()

        total_product_variants = ProductVariant.objects.filter(
            product__is_active=True
        ).count()

        current_year_start = today.replace(month=1, day=1)
        last_year_start = current_year_start.replace(year=current_year_start.year - 1)
        last_year_end = current_year_start - timedelta(days=1)

        # Calculate orders this year and last year
        orders_this_year = Order.objects.filter(
            created_at__date__gte=current_year_start
        ).count()
        orders_last_year = Order.objects.filter(
            created_at__date__range=(last_year_start, last_year_end)
        ).count()
        published_products_in_period = Product.objects.filter(
            created_at__date__range=(today - timedelta(days=365), today),
            is_active=True,
            is_deleted=False,
        ).count()
        # Safely calculate orders growth rate
        if orders_last_year > 0:
            orders_growth_rate = (
                (orders_this_year - orders_last_year) / orders_last_year
            ) * 100
        else:
            # If no orders last year, treat all current year orders as "new"
            orders_growth_rate = (
                0 if orders_this_year == 0 else None
            )  # None indicates new growth

        # Calculate new customers this year and last year
        new_customers_this_year = Customer.objects.filter(
            created_at__date__gte=current_year_start
        ).count()
        new_customers_last_year = Customer.objects.filter(
            created_at__date__range=(last_year_start, last_year_end)
        ).count()

        # Safely calculate customers growth rate
        if new_customers_last_year > 0:
            customers_growth_rate = (
                (new_customers_this_year - new_customers_last_year)
                / new_customers_last_year
            ) * 100
        else:
            # If no customers last year, treat all current year customers as "new"
            customers_growth_rate = 0 if new_customers_this_year == 0 else None

        # Total Baskets
        total_basket = Basket.objects.count()
        total_in_progress_orders = Order.objects.filter(status="in_progress").count()
        thirty_days_ago = today - timedelta(days=30)

        last_thirty_day_customer = Customer.objects.filter(
            user__role="bakery", created_at__range=(thirty_days_ago, today)
        ).count()
        current_year = now().year
        total_revenue = (
            Order.objects.filter(created_at__year=current_year).aggregate(
                Sum("final_amount")
            )["final_amount__sum"]
            or 0.0
        )

        def get_weekly_summary(start_date, end_date, role="customer"):
            week_data = {}
            current_date = start_date
            while current_date <= end_date:
                week_num = current_date.isocalendar()[1]
                week_data[week_num] = 0
                current_date += timedelta(days=7)

            customers_by_week = (
                Customer.objects.filter(
                    user__role=role, customer_type="I", created_at__range=(start_date, end_date)
                )
                .annotate(week=TruncWeek("created_at"))
                .values("week")
                .annotate(total_customers=Count("id"))
            )

            for entry in customers_by_week:
                week_num = entry["week"].isocalendar()[1]
                week_data[week_num] = entry["total_customers"]

            return [
                {"week": week, "total_customers": count}
                for week, count in sorted(week_data.items())
            ]

        def get_weekly_sales_summary(start_date, end_date):
            weekly_sales_data = {}
            current_date = start_date
            while current_date <= end_date:
                week_num = current_date.isocalendar()[1]
                weekly_sales_data[week_num] = 0.0
                current_date += timedelta(days=7)

            weekly_sales_summary = (
                Order.objects.filter(created_at__date__range=(start_date, end_date))
                .annotate(week=TruncWeek("created_at"))
                .values("week")
                .annotate(total_sales=Sum("total_amount"))
                .order_by("week")
            )

            for entry in weekly_sales_summary:
                week_num = entry["week"].isocalendar()[1]
                weekly_sales_data[week_num] = float(entry["total_sales"] or 0.0)

            return [
                {"week": week, "total_sales": sales}
                for week, sales in sorted(weekly_sales_data.items())
            ]
        

        # Company's Weekly summary
        def get_weekly_company_summary(start_date, end_date, role="customer"):
            week_data = {}
            current_date = start_date
            while current_date <= end_date:
                week_num = current_date.isocalendar()[1]
                week_data[week_num] = 0
                current_date += timedelta(days=7)

            customers_by_week = (
                Customer.objects.filter(
                    user__role=role, customer_type="C", created_at__range=(start_date, end_date)
                )
                .annotate(week=TruncWeek("created_at"))
                .values("week")
                .annotate(total_customers=Count("id"))
            )

            for entry in customers_by_week:
                week_num = entry["week"].isocalendar()[1]
                week_data[week_num] = entry["total_customers"]

            return [
                {"week": week, "total_customers": count}
                for week, count in sorted(week_data.items())
            ]

        def get_weekly_company_sales_summary(start_date, end_date):
            weekly_sales_data = {}
            current_date = start_date
            while current_date <= end_date:
                week_num = current_date.isocalendar()[1]
                weekly_sales_data[week_num] = 0.0
                current_date += timedelta(days=7)

            weekly_sales_summary = (
                Order.objects.filter(created_at__date__range=(start_date, end_date))
                .annotate(week=TruncWeek("created_at"))
                .values("week")
                .annotate(total_sales=Sum("total_amount"))
                .order_by("week")
            )

            for entry in weekly_sales_summary:
                week_num = entry["week"].isocalendar()[1]
                weekly_sales_data[week_num] = float(entry["total_sales"] or 0.0)

            return [
                {"week": week, "total_sales": sales}
                for week, sales in sorted(weekly_sales_data.items())
            ]

        weekly_sales_data = get_weekly_sales_summary(start_date, today)

        first_day_current_month = today.replace(day=1)
        first_day_last_month = (first_day_current_month - timedelta(days=1)).replace(
            day=1
        )
        last_day_last_month = first_day_current_month - timedelta(days=1)
        
        todays_total_order = Order.objects.filter(
            created_at__date=today
        )
        todays_total_order_amount  = todays_total_order.aggregate(Sum("total_amount"))["total_amount__sum"] or 0.0
        todays_total_order_count = todays_total_order.count()
        last_7_days = today - timedelta(days=7)

        last_7_days_sales_summary = (
            Order.objects.filter(created_at__date__range=(last_7_days, today))
            .annotate(week=TruncWeek("created_at"))
            .values("week")
            .annotate(total_sales=Sum("total_amount"))
            .order_by("week")
        )

        last_7_days_sales_count = Order.objects.filter(created_at__date__range=(last_7_days, today)).count()

        last_7_days_summary = [
            {
            "week": entry["week"].isocalendar()[1],
            "total_sales": float(entry["total_sales"] or 0.0),
            }
            for entry in last_7_days_sales_summary
        ]

        last_month_data = get_weekly_summary(first_day_last_month, last_day_last_month)
        current_month_data = get_weekly_summary(first_day_current_month, today)

        last_month_customer_data = get_weekly_company_summary(first_day_last_month, last_day_last_month)
        current_month_customer_data = get_weekly_company_summary(first_day_current_month, today)

        start_of_week = today - timedelta(days=today.weekday())

        # Start of last week (Previous Monday)
        start_of_last_week = start_of_week - timedelta(days=7)
        end_of_last_week = start_of_week - timedelta(seconds=1)

        current_week_running_all_sales = (
            Order.objects.filter(created_at__gte=start_of_week).count()
        )
        print("Current_week_running_all_sales: ", current_week_running_all_sales)
        
        current_week_delivered_sales_count = (
            OrderItem.objects.filter(
                order__status="delivered", order__created_at__gte=start_of_week
            ).aggregate(total_sales=Sum("quantity"))["total_sales"]
            or 0
        )

        total_delivered_count = OrderItem.objects.filter(
                order__status__icontains="delivered"
        ).count()

        last_week_sales_delivered_count = (
            OrderItem.objects.filter(
                order__status="delivered",
                order__created_at__range=(start_of_last_week, end_of_last_week),
            ).aggregate(total_sales=Sum("quantity"))["total_sales"]
            or 0
        )
        print("Last week Sales Delivered Count: ", last_week_sales_delivered_count)

        if current_week_delivered_sales_count > 0:
            percentage_difference = (
                (current_week_delivered_sales_count - last_week_sales_delivered_count)
                / current_week_delivered_sales_count
            ) * 100
        else:
            percentage_difference = 0
        total_categories = Category.objects.count()

        statistics_data = {
            "total_orders_in_period": total_orders_today,
            "total_workers": total_workers,
            "total_bakery_customers": total_bakery_customers,
            "total_running_orders": total_running_orders,
            "total_order_price_in_period": total_today_order_price,
            "low_stock_products": low_stock_products,
            "total_categories": total_categories,
            "published_products_in_period": published_products_in_period,
            "total_products_in_period": total_products_period,
            "total_product_added_today": total_product_added_today,
            "total_product_variants": total_product_variants,
            "total_in_progress_orders": total_in_progress_orders,
            "total_revenue": total_revenue,
            'total_delivered_count': total_delivered_count,
            "weekly_sales_data": weekly_sales_data,
            "last_thirty_day_customer": last_thirty_day_customer,
            "user_summary_data": {
                "last_month_summary": last_month_data,
                "current_month_summary": current_month_data,
                'last_week_sales_count': last_week_sales_delivered_count,
                'last_week_sales_delivered_count': last_week_sales_delivered_count,
                'current_week_delivered_sales_count': current_week_delivered_sales_count
            },
            "company_summary_data": {
                "last_month_summary": last_month_customer_data,
                "current_month_summary": current_month_customer_data,
            },
            "current_week_sales": current_week_delivered_sales_count,
            "current_week_sale_rate": percentage_difference,
            "customer_added_percentage": customers_growth_rate,
            "order_added_percentage": orders_growth_rate,
            'total_baskets': total_basket,
            'today_sales_summary': {
                'todays_sales_amount': todays_total_order_amount,
                'todays_sales_count': todays_total_order_count,
            },
            'total_new_orders_summary': {
                'total_new_orders': last_7_days_summary,
                'total_new_orders_count': last_7_days_sales_count,
            }
        }

        return Response(statistics_data)


class ListCustomerBakeryAPIView(APIView):
    permission_classes = [IsAdmin]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(auto_schema=None)
    def get(self, request, *args, **kwargs):
        bakeries = Customer.objects.prefetch_related("addresses").annotate(
            order_count=Count("user__order")
        )

        paginator = PageNumberPagination()
        sort_by = request.query_params.get("sort_by", "asc")
        search = request.query_params.get("search")

        if search:
            bakeries = bakeries.annotate(
                full_name=Concat("user__first_name", Value(" "), "user__last_name")
            ).filter(
                Q(name__iregex=search)
                | Q(user__first_name__iregex=search)
                | Q(user__email__iregex=search)
                | Q(full_name__regex=search)
            )
        valid_sort_fields = [
            "created_at",
            "created_at",
            "-created_at",
            "-created_at",
            "title",
            "name",
            "-title",
            "-name",
            "name",
            "user__first_name",
            "-name",
            "-user__first_name",
            "order_count",
            "-order_count",
        ]
        if sort_by in valid_sort_fields:
            bakeries = bakeries.order_by(sort_by)
        else:
            # Default to sorting by descending `created_at` if invalid sort field
            bakeries = bakeries.order_by("-created_at")

        paginated_bakeries = paginator.paginate_queryset(bakeries, request)
        serializer = CustomerAdminSerializer(paginated_bakeries, many=True)
        return paginator.get_paginated_response(serializer.data)

    @swagger_auto_schema(
        operation_description="Delete a Customer and associated user by pk"
    )
    def delete(self, request, pk, *args, **kwargs):
        try:
            bakery = Customer.objects.filter(pk=pk).first()
            if not bakery:
                return Response(
                    {"error": "Customer with the given ID does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            user = bakery.user
            bakery.delete()

            if user:
                user.delete()

            return Response(
                {"message": "Customer and associated user deleted successfully"},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminConfigurationAPIView(APIView):
    permission_classes = [IsAdmin]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        """
        Retrieve the single AdminConfiguration record.
        If not found, return an empty response.
        """
        try:
            configuration = AdminConfiguration.objects.get()
            serializer = AdminConfigurationSerializer(configuration)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AdminConfiguration.DoesNotExist:
            return Response(
                {"message": "AdminConfiguration not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def post(self, request):
        """
        Create or update the single AdminConfiguration record.
        If it already exists, update the record.
        """
        try:
            configuration = AdminConfiguration.objects.get()
            serializer = AdminConfigurationSerializer(
                configuration, data=request.data, partial=True
            )
        except AdminConfiguration.DoesNotExist:
            serializer = AdminConfigurationSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """
        Delete the single AdminConfiguration record.
        """
        try:
            configuration = AdminConfiguration.objects.get()
            configuration.delete()
            return Response(
                {"message": "AdminConfiguration deleted successfully."},
                status=status.HTTP_204_NO_CONTENT,
            )
        except AdminConfiguration.DoesNotExist:
            return Response(
                {"message": "AdminConfiguration not found."},
                status=status.HTTP_404_NOT_FOUND,
            )


class AdminInvoiceConfigurationView(APIView):

    permission_classes = [IsAdmin]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, *args, **kwargs):
        """
        Retrieve the single AdminInvoiceConfiguration record.
        """
        instance = AdminInvoiceConfiguration.objects.first()
        if instance:
            serializer = AdminInvoiceConfigurationSerializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {"error": "Configuration not found."}, status=status.HTTP_404_NOT_FOUND
        )

    def post(self, request, *args, **kwargs):
        """
        Create or update the single AdminInvoiceConfiguration record.
        """
        instance = AdminInvoiceConfiguration.objects.first()

        if instance:
            serializer = AdminInvoiceConfigurationSerializer(
                instance, data=request.data, partial=True
            )
        else:
            serializer = AdminInvoiceConfigurationSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Configuration saved successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK if instance else status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

