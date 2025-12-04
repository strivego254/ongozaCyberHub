"""
URL configuration for Mentorship Coordination Engine.
"""
from django.urls import path
from .views import (
    mentor_dashboard,
    mentor_workqueue,
    mentee_cockpit,
    create_session,
    review_mission,
    create_flag
)
from .sse_views import mentor_dashboard_stream

app_name = 'mentorship_coordination'

urlpatterns = [
    path('mentor/dashboard', mentor_dashboard, name='dashboard'),
    path('mentor/dashboard/stream', mentor_dashboard_stream, name='dashboard-stream'),
    path('mentor/workqueue', mentor_workqueue, name='workqueue'),
    path('mentor/mentees/<uuid:mentee_id>/cockpit', mentee_cockpit, name='mentee-cockpit'),
    path('mentor/sessions', create_session, name='create-session'),
    path('mentor/missions/<uuid:submission_id>/review', review_mission, name='review-mission'),
    path('mentor/flags', create_flag, name='create-flag'),
]

