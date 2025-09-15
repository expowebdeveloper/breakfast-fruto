from rest_framework.serializers import ModelSerializer
from .models import WelcomePopup

class WelcomePopupSerializer(ModelSerializer):
    class Meta:
        model = WelcomePopup
        fields = "__all__"  