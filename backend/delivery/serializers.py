from rest_framework import serializers
from .models import ClientData, Subscriber


class ZipcodeSerializer(serializers.Serializer):
    zipcode = serializers.CharField(max_length=6)


class StateSerializer(serializers.Serializer):
    state = serializers.CharField(max_length=50)


class CitySerializer(serializers.Serializer):
    city = serializers.CharField(max_length=50)


class ClientDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientData
        fields = "__all__"


class SubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = ["email"]
