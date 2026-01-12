from django.urls import path

from .views import (
    MarketplaceTalentListView,
    MarketplaceProfileMeView,
    EmployerInterestLogView,
    EmployerInterestListView,
    StudentContactRequestsView,
    JobPostingListCreateView,
    JobPostingRetrieveUpdateDestroyView,
)
from .student_job_views import (
    StudentJobBrowseView,
    StudentJobDetailView,
    StudentJobApplicationView,
    StudentJobApplicationsView,
    StudentJobApplicationDetailView,
)
from .employer_application_views import (
    EmployerJobApplicationsView,
    EmployerAllApplicationsView,
    EmployerApplicationDetailView,
    EmployerApplicationStatusUpdateView,
)


urlpatterns = [
    # Employer talent browsing
    path(
        'marketplace/talent',
        MarketplaceTalentListView.as_view(),
        name='marketplace-talent-list',
    ),
    # Mentee self-view of marketplace profile
    path(
        'marketplace/profile/me',
        MarketplaceProfileMeView.as_view(),
        name='marketplace-profile-me',
    ),
    # Employer interest logging
    path(
        'marketplace/interest',
        EmployerInterestLogView.as_view(),
        name='marketplace-interest',
    ),
    # Employer interest list (favorites, shortlists, contacts)
    path(
        'marketplace/interest/list',
        EmployerInterestListView.as_view(),
        name='marketplace-interest-list',
    ),
    # Student contact requests
    path(
        'marketplace/contacts',
        StudentContactRequestsView.as_view(),
        name='marketplace-contacts',
    ),
    # Employer job postings
    path(
        'marketplace/jobs',
        JobPostingListCreateView.as_view(),
        name='marketplace-jobs',
    ),
    path(
        'marketplace/jobs/<uuid:id>',
        JobPostingRetrieveUpdateDestroyView.as_view(),
        name='marketplace-jobs-detail',
    ),
    # Student job browsing
    path(
        'marketplace/jobs/browse',
        StudentJobBrowseView.as_view(),
        name='student-job-browse',
    ),
    path(
        'marketplace/jobs/<uuid:id>/detail',
        StudentJobDetailView.as_view(),
        name='student-job-detail',
    ),
    path(
        'marketplace/jobs/<uuid:id>/apply',
        StudentJobApplicationView.as_view(),
        name='student-job-apply',
    ),
    # Student applications
    path(
        'marketplace/applications',
        StudentJobApplicationsView.as_view(),
        name='student-applications',
    ),
    path(
        'marketplace/applications/<uuid:id>',
        StudentJobApplicationDetailView.as_view(),
        name='student-application-detail',
    ),
    # Employer application management
    path(
        'marketplace/jobs/<uuid:job_id>/applications',
        EmployerJobApplicationsView.as_view(),
        name='employer-job-applications',
    ),
    path(
        'marketplace/applications/employer',
        EmployerAllApplicationsView.as_view(),
        name='employer-all-applications',
    ),
    path(
        'marketplace/applications/<uuid:id>/employer',
        EmployerApplicationDetailView.as_view(),
        name='employer-application-detail',
    ),
    path(
        'marketplace/applications/<uuid:id>/status',
        EmployerApplicationStatusUpdateView.as_view(),
        name='employer-application-status',
    ),
]


