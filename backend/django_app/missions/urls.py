"""
URL configuration for Missions MXP.
"""
from django.urls import path
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

app_name = 'missions'

urlpatterns = [
    # Legacy endpoints
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
]

