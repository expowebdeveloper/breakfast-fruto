from django.urls import path

from . import views

urlpatterns = [
    path('', views.CreateWelcomePopupAPIView.as_view(), name="welcome_pop_create_list"),
    path('LastWelcomPopupView/', views.FirstWelcomPopupView, name="lastWelcomepopup"),
]