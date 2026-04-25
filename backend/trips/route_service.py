import requests
import polyline as polyline_codec
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="truck_driver_guide")


def geocode_address(address):
    """Converts address string to {lat, lng, display_name}."""
    location = geolocator.geocode(address, timeout=10)
    if not location:
        raise ValueError(f"Could not find address: '{address}'. Please check spelling.")
    return {
        'lat': location.latitude,
        'lng': location.longitude,
        'display_name': location.address,
    }


def get_route(coordinates):
    """
    Gets driving route from OSRM.
    coordinates: list of (lng, lat) tuples
    Returns: distance_miles, duration_hours, polyline, and per-leg details
    """
    coords_str = ';'.join([f"{lng},{lat}" for lng, lat in coordinates])
    url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=polyline&steps=true"

    response = requests.get(url, timeout=15)
    data = response.json()

    if data.get('code') != 'Ok':
        raise ValueError(f"OSRM routing failed: {data.get('message', 'Unknown error')}")

    route = data['routes'][0]
    legs = []
    for leg in route['legs']:
        legs.append({
            'distance_miles': round(leg['distance'] * 0.000621371, 1),
            'duration_hours': round(leg['duration'] / 3600, 2),
        })

    return {
        'total_distance_miles': round(route['distance'] * 0.000621371, 1),
        'total_duration_hours': round(route['duration'] / 3600, 2),
        'polyline': route['geometry'],
        'legs': legs,
    }


def decode_polyline(encoded):
    """Decode a polyline string into a list of (lat, lng) tuples."""
    return polyline_codec.decode(encoded)


def interpolate_location(decoded_points, fraction):
    """
    Get a point along the decoded polyline at a given fraction (0.0 to 1.0).
    Returns {lat, lng}.
    """
    if not decoded_points:
        return None
    if fraction <= 0:
        return {'lat': decoded_points[0][0], 'lng': decoded_points[0][1]}
    if fraction >= 1:
        return {'lat': decoded_points[-1][0], 'lng': decoded_points[-1][1]}

    # Calculate total distance and find the point at the given fraction
    total_segments = len(decoded_points) - 1
    target_idx = fraction * total_segments
    idx = int(target_idx)
    idx = min(idx, total_segments - 1)
    sub_fraction = target_idx - idx

    lat1, lng1 = decoded_points[idx]
    lat2, lng2 = decoded_points[idx + 1]

    return {
        'lat': round(lat1 + (lat2 - lat1) * sub_fraction, 6),
        'lng': round(lng1 + (lng2 - lng1) * sub_fraction, 6),
    }


def get_trip_route(current_location, pickup_location, dropoff_location):
    """Full pipeline: geocode 3 addresses → get route → return everything."""
    current = geocode_address(current_location)
    pickup = geocode_address(pickup_location)
    dropoff = geocode_address(dropoff_location)

    coordinates = [
        (current['lng'], current['lat']),
        (pickup['lng'], pickup['lat']),
        (dropoff['lng'], dropoff['lat']),
    ]

    route = get_route(coordinates)
    route['locations'] = {
        'current': current,
        'pickup': pickup,
        'dropoff': dropoff,
    }

    return route
