from django.urls import path
from holiday.views import *

urlpatterns = [
    path("holidays/", HolidayAPIView.as_view(), name="holiday-list-create"),
    path("holidays/<int:pk>/", HolidayAPIView.as_view(), name="holiday-detail"),
]