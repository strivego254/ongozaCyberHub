"""
URL configuration for Programs app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProgramViewSet, TrackViewSet, CohortViewSet,
    ProgramRuleViewSet, CertificateViewSet,
    DirectorProgramViewSet, DirectorTrackViewSet, DirectorCohortViewSet,
    DirectorMentorViewSet, DirectorDashboardViewSet,
    DirectorProgramRuleViewSet
)

router = DefaultRouter()
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'tracks', TrackViewSet, basename='track')
router.register(r'cohorts', CohortViewSet, basename='cohort')
router.register(r'rules', ProgramRuleViewSet, basename='rule')
router.register(r'certificates', CertificateViewSet, basename='certificate')

# Director-specific endpoints
director_router = DefaultRouter()
director_router.register(r'programs', DirectorProgramViewSet, basename='director-program')
director_router.register(r'tracks', DirectorTrackViewSet, basename='director-track')
director_router.register(r'cohorts', DirectorCohortViewSet, basename='director-cohort')
director_router.register(r'mentors', DirectorMentorViewSet, basename='director-mentor')
director_router.register(r'rules', DirectorProgramRuleViewSet, basename='director-rule')
director_router.register(r'dashboard', DirectorDashboardViewSet, basename='director-dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('director/', include(director_router.urls)),
]


