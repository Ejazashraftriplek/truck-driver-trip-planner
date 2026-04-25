from rest_framework import serializers
from .models import Trip


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = '__all__'
        read_only_fields = [
            'id',
            'route_data',
            'stops',
            'eld_logs',
            'total_distance_miles',
            'total_driving_hours',
            'total_trip_days',
            'created_at',
        ]
