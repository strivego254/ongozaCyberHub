"""
URL configuration for Student Dashboard endpoints.
"""
from django.urls import path
from .views import get_student_dashboard, track_dashboard_action, stream_dashboard_updates

app_name = 'student_dashboard'

urlpatterns = [
    path('dashboard', get_student_dashboard, name='dashboard'),
    path('dashboard/action', track_dashboard_action, name='dashboard-action'),
    path('dashboard/stream', stream_dashboard_updates, name='dashboard-stream'),
]


