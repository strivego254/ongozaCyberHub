from django.urls import path

from .views import (
    MarketplaceTalentListView,
    MarketplaceProfileMeView,
    EmployerInterestLogView,
    JobPostingListCreateView,
    JobPostingRetrieveUpdateDestroyView,
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
]


