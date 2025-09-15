from .models import CustomerQuery
from rest_framework.serializers import ModelSerializer


class CustomerQuerySerializer(ModelSerializer):
    class Meta:
        model = CustomerQuery
        fields = "__all__"