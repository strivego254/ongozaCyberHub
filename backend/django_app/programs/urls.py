"""
URL configuration for Programs app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProgramViewSet, TrackViewSet, CohortViewSet,
    ProgramRuleViewSet, CertificateViewSet, director_dashboard
)
from .director_dashboard_views import (
    director_dashboard_summary,
    director_cohorts_list,
    director_cohort_detail
)

router = DefaultRouter()
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'tracks', TrackViewSet, basename='track')
router.register(r'cohorts', CohortViewSet, basename='cohort')
router.register(r'rules', ProgramRuleViewSet, basename='rule')
router.register(r'certificates', CertificateViewSet, basename='certificate')

urlpatterns = [
    # Legacy director dashboard endpoint (kept for backward compatibility)
    path('programs/director/dashboard/', director_dashboard, name='director-dashboard'),
    
    # New high-performance cached director dashboard endpoints
    path('director/dashboard/summary/', director_dashboard_summary, name='director-dashboard-summary'),
    path('director/dashboard/cohorts/', director_cohorts_list, name='director-cohorts-list'),
    path('director/dashboard/cohorts/<uuid:cohort_id>/', director_cohort_detail, name='director-cohort-detail'),
    
    path('', include(router.urls)),
]



