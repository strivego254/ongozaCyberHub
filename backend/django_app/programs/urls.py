"""
URL configuration for Programs app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProgramViewSet, TrackViewSet, CohortViewSet,
    ProgramRuleViewSet, CertificateViewSet,
    MilestoneViewSet, ModuleViewSet,
    DirectorProgramViewSet, DirectorTrackViewSet, DirectorCohortViewSet,
    DirectorMentorViewSet, DirectorDashboardViewSet,
    DirectorProgramRuleViewSet, ProgramManagementViewSet,
    director_dashboard
)
from .director_dashboard_views import (
    director_dashboard_summary,
    director_cohorts_list,
    director_cohort_detail
)

router = DefaultRouter()
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'programs-management', ProgramManagementViewSet, basename='program-management')
router.register(r'tracks', TrackViewSet, basename='track')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'modules', ModuleViewSet, basename='module')
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
    # Legacy director dashboard endpoint (kept for backward compatibility)
    path('programs/director/dashboard/', director_dashboard, name='director-dashboard'),
    
    # New high-performance cached director dashboard endpoints
    path('director/dashboard/summary/', director_dashboard_summary, name='director-dashboard-summary'),
    path('director/dashboard/cohorts/', director_cohorts_list, name='director-cohorts-list'),
    path('director/dashboard/cohorts/<uuid:cohort_id>/', director_cohort_detail, name='director-cohort-detail'),
    
    path('', include(router.urls)),
    path('director/', include(director_router.urls)),
]



