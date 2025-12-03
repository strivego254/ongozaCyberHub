"""
URL configuration for Missions MXP.
"""
from django.urls import path
from .views import get_recommended_missions, submit_mission, mission_status

app_name = 'missions'

urlpatterns = [
    path('missions/recommended', get_recommended_missions, name='recommended'),
    path('missions/<uuid:mission_id>/submit', submit_mission, name='submit'),
    path('missions/status', mission_status, name='status'),
]

