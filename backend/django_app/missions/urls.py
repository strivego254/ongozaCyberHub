"""
URL configuration for Missions MXP.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_recommended_missions, submit_mission, mission_status
from .views_student import (
    get_mission_funnel,
    list_student_missions,
    get_mission_detail,
    submit_mission_for_ai,
    upload_mission_artifacts,
    save_mission_draft,
    submit_for_mentor_review,
)
from .views_director import MissionViewSet

app_name = 'missions'

# Router for director mission management (CRUD operations)
# This registers /missions/ for list/create and /missions/{id}/ for detail/update/delete
router = DefaultRouter()
router.register(r'missions', MissionViewSet, basename='mission')

urlpatterns = [
    # Specific endpoints that need to come before router to avoid conflicts
    path('missions/recommended', get_recommended_missions, name='recommended'),
    path('missions/<uuid:mission_id>/submit', submit_mission, name='submit'),
    path('missions/status', mission_status, name='status'),
    
    # Student-facing endpoints
    path('student/missions/funnel', get_mission_funnel, name='student-funnel'),
    path('student/missions', list_student_missions, name='student-list'),
    path('student/missions/<uuid:mission_id>', get_mission_detail, name='student-detail'),
    path('student/missions/<uuid:mission_id>/submit', submit_mission_for_ai, name='student-submit'),
    path('student/missions/<uuid:mission_id>/draft', save_mission_draft, name='student-draft'),
    path('student/missions/submissions/<uuid:submission_id>/artifacts', upload_mission_artifacts, name='student-artifacts'),
    path('student/missions/submissions/<uuid:submission_id>/submit-mentor', submit_for_mentor_review, name='student-submit-mentor'),
    
    # Director mission management (CRUD operations) - Router comes last
    path('', include(router.urls)),
]

