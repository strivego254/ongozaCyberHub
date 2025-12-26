"""
Curriculum Engine URL configuration.

API Endpoints:
- /tracks/                          - List all tracks
- /tracks/{code}/                   - Track details with modules
- /tracks/{code}/enroll/            - Enroll in track
- /tracks/{code}/progress/          - User's progress in track
- /tracks/{code}/leaderboard/       - Track leaderboard

- /modules/                         - List modules (filterable by track)
- /modules/{id}/                    - Module details
- /modules/{id}/start/              - Start module
- /modules/{id}/complete/           - Complete module

- /lessons/                         - List lessons (filterable by module)
- /lessons/{id}/                    - Lesson details
- /lessons/{id}/progress/           - Update lesson progress

- /mission-progress/                - Mission progress updates (from Missions Engine)
- /my-progress/                     - User's overall curriculum progress
- /activities/                      - User's recent activities
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tracks', views.CurriculumTrackViewSet, basename='track')
router.register(r'modules', views.CurriculumModuleViewSet, basename='module')
router.register(r'lessons', views.LessonViewSet, basename='lesson')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Custom endpoints
    path('mission-progress/', views.MissionProgressView.as_view(), name='mission-progress'),
    path('my-progress/', views.UserProgressView.as_view(), name='my-progress'),
    path('activities/', views.RecentActivityView.as_view(), name='activities'),
]

