import uuid
from django.db import models


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Inputs (what the user provides)
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(default=0)

    # Computed outputs (what we calculate)
    route_data = models.JSONField(null=True, blank=True)
    stops = models.JSONField(null=True, blank=True)
    eld_logs = models.JSONField(null=True, blank=True)
    total_distance_miles = models.FloatField(null=True, blank=True)
    total_driving_hours = models.FloatField(null=True, blank=True)
    total_trip_days = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip: {self.current_location} → {self.pickup_location} → {self.dropoff_location}"
