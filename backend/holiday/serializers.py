from datetime import datetime
from rest_framework import serializers
from datetime import datetime
from holiday.models import Holiday


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ["id", "date", "day", "holiday", "restricted"]

    def validate_date(self, value):
        if isinstance(value, str):
            try:
                value = datetime.strptime(value, "%Y-%m-%d").date()
            except ValueError:
                raise serializers.ValidationError(
                    "Invalid date format. Use YYYY-MM-DD."
                )
        return value
