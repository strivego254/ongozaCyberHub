from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.utils.consent_utils import check_consent
from subscriptions.utils import get_user_tier

from .models import Employer, MarketplaceProfile, EmployerInterestLog, JobPosting
from .serializers import (
    EmployerSerializer,
    MarketplaceProfileListSerializer,
    MarketplaceProfileDetailSerializer,
    EmployerInterestLogSerializer,
    JobPostingSerializer,
)


class IsEmployer(permissions.BasePermission):
    """
    Only users with an Employer profile or employer role can access these endpoints.
    Checks for:
    1. Direct employer_profile relationship
    2. UserRole with 'sponsor_admin' role (which is the employer role)
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check if user has employer_profile
        if hasattr(request.user, 'employer_profile'):
            return True
        
        # Check if user has sponsor_admin role (employer role)
        if request.user.user_roles.filter(
            role__name='sponsor_admin',
            is_active=True
        ).exists():
            return True
        
        return False


from .utils import get_employer_for_user


class MarketplaceTalentListView(generics.ListAPIView):
    """
    GET /api/v1/marketplace/talent

    Employer talent browsing endpoint with filtering.
    Only exposes Professional ($7) mentees that:
    - have marketplace feature enabled via subscription tier
    - have granted employer_share consent
    - have is_visible=True on their marketplace profile
    """

    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = MarketplaceProfileListSerializer

    def get_queryset(self):
        qs = MarketplaceProfile.objects.filter(
            is_visible=True,
            employer_share_consent=True,
            tier__in=['starter', 'professional'],  # free tier never visible
        )

        # Filter: only Professional tier are directly contactable
        contactable_only = self.request.query_params.get('contactable_only')
        if contactable_only and contactable_only.lower() == 'true':
            qs = qs.filter(tier='professional')

        # Filter by profile status
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(profile_status=status_param)

        # Filter by minimum readiness score
        min_readiness = self.request.query_params.get('min_readiness')
        if min_readiness:
            try:
                qs = qs.filter(readiness_score__gte=float(min_readiness))
            except ValueError:
                pass

        # Filter by skills (comma-separated)
        skills = self.request.query_params.get('skills')
        if skills:
            skill_list = [s.strip().lower() for s in skills.split(',') if s.strip()]
            for skill in skill_list:
                qs = qs.filter(skills__icontains=skill)

        # Simple search across name / role
        search = self.request.query_params.get('q')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(primary_role__icontains=search)
                | Q(primary_track_key__icontains=search)
                | Q(mentee__first_name__icontains=search)
                | Q(mentee__last_name__icontains=search)
                | Q(mentee__email__icontains=search)
            )

        # Order by readiness score then recent updates
        return qs.order_by('-readiness_score', '-last_updated_at')


class MarketplaceProfileMeView(APIView):
    """
    GET /api/v1/marketplace/profile/me

    Returns the current mentee's marketplace profile (or a skeleton)
    so they can see their readiness status and visibility.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            profile = user.marketplace_profile
        except MarketplaceProfile.DoesNotExist:
            # Create a non-visible skeleton profile the first time
            tier = get_user_tier(user.id)
            tier_label = 'free'
            if tier.startswith('starter'):
                tier_label = 'starter'
            elif tier in ['professional', 'premium']:
                tier_label = 'professional'

            profile = MarketplaceProfile.objects.create(
                mentee=user,
                tier=tier_label,
                is_visible=False,
                employer_share_consent=check_consent(user, 'employer_share'),
            )

        serializer = MarketplaceProfileDetailSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EmployerInterestLogView(generics.CreateAPIView):
    """
    POST /api/v1/marketplace/interest

    Records employer interactions: view, favorite, shortlist, contact_request.
    """

    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = EmployerInterestLogSerializer

    def create(self, request, *args, **kwargs):
        employer = get_employer_for_user(request.user)
        if not employer:
            return Response(
                {'detail': 'Employer profile not found. Please create an employer profile first.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile_id = request.data.get('profile_id')
        action = request.data.get('action')
        metadata = request.data.get('metadata', {}) or {}

        if not profile_id or not action:
            return Response(
                {'detail': 'profile_id and action are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            profile = MarketplaceProfile.objects.get(id=profile_id)
        except MarketplaceProfile.DoesNotExist:
            return Response(
                {'detail': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        log = EmployerInterestLog.objects.create(
            employer=employer,
            profile=profile,
            action=action,
            metadata=metadata,
        )

        serializer = EmployerInterestLogSerializer(log)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class JobPostingListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/marketplace/jobs
    POST /api/v1/marketplace/jobs

    Employers can list and create job postings.
    """

    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = JobPostingSerializer

    def get_queryset(self):
        employer = get_employer_for_user(self.request.user)
        if not employer:
            return JobPosting.objects.none()
        return JobPosting.objects.filter(employer=employer).order_by(
            '-posted_at'
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx
    
    def perform_create(self, serializer):
        """Override to ensure employer is set correctly."""
        employer = get_employer_for_user(self.request.user)
        if not employer:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Employer profile not found. Please create an employer profile first.')
        serializer.save()


class JobPostingRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/marketplace/jobs/<id>
    PATCH /api/v1/marketplace/jobs/<id>
    DELETE /api/v1/marketplace/jobs/<id>

    Employers can retrieve, update, and delete their job postings.
    """

    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = JobPostingSerializer
    lookup_field = 'id'

    def get_queryset(self):
        employer = get_employer_for_user(self.request.user)
        if not employer:
            return JobPosting.objects.none()
        return JobPosting.objects.filter(employer=employer)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


