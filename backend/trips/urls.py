from django.urls import path
from . import views

urlpatterns = [
    path('api/trips/', views.create_trip, name='create_trip'),
    path('api/trips/<uuid:trip_id>/', views.get_trip, name='get_trip'),
]
