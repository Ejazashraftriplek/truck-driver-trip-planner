from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Trip
from .serializers import TripSerializer
from .route_service import get_trip_route, decode_polyline, interpolate_location
from .hos_engine import plan_trip


@api_view(['POST'])
def create_trip(request):
    """Takes trip inputs, computes route + HOS + ELD logs, returns everything."""
    serializer = TripSerializer(data=request.data)
    if serializer.is_valid():
        trip = serializer.save()

        try:
            route_data = get_trip_route(
                trip.current_location,
                trip.pickup_location,
                trip.dropoff_location,
            )

            result = plan_trip(route_data, trip.current_cycle_used)

            # Interpolate locations for mid-route stops
            decoded_points = decode_polyline(route_data['polyline'])
            for stop in result['stops']:
                loc = stop.get('location')
                if loc and isinstance(loc, dict) and 'fraction' in loc:
                    coords = interpolate_location(decoded_points, loc['fraction'])
                    if coords:
                        stop['location'] = {
                            'lat': coords['lat'],
                            'lng': coords['lng'],
                            'display_name': f"Mile {loc['mile_marker']}",
                        }

            trip.route_data = route_data
            trip.stops = result['stops']
            trip.eld_logs = result['eld_logs']
            trip.total_distance_miles = result['total_distance_miles']
            trip.total_driving_hours = result['total_driving_hours']
            trip.total_trip_days = result['total_trip_days']
            trip.save()

        except Exception as e:
            trip.delete()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(TripSerializer(trip).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_trip(request, trip_id):
    """Retrieves a previously computed trip."""
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return Response({'error': 'Trip not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(TripSerializer(trip).data)
