"""
API views for Sponsor Dashboard.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from organizations.models import Organization
from programs.models import Cohort, Enrollment
from .models import (
    SponsorDashboardCache,
    SponsorCohortDashboard,
    SponsorStudentAggregates,
    SponsorCode
)
from .serializers import (
    SponsorDashboardSummarySerializer,
    SponsorCohortListSerializer,
    SponsorCohortDetailSerializer,
    SponsorStudentAggregateSerializer,
    SponsorCodeSerializer,
    SponsorCodeGenerateSerializer,
    SponsorSeatAssignSerializer,
    SponsorInvoiceSerializer,
)
from .services import (
    SponsorDashboardService,
    SponsorCodeService,
    TalentScopeService,
    BillingService,
)


class SponsorDashboardViewSet(viewsets.ViewSet):
    """
    Sponsor Dashboard API endpoints.
    Requires authentication and org membership.
    """
    permission_classes = [IsAuthenticated]
    
    def get_org(self, request):
        """Get sponsor organization from user."""
        user = request.user
        # First check user's direct org_id
        org = user.org_id
        if org and hasattr(org, 'org_type') and org.org_type == 'sponsor':
            return org
        
        # Check if user is a member of any sponsor organization
        sponsor_orgs = Organization.objects.filter(
            org_type='sponsor',
            status='active',
            organizationmember__user=user
        ).distinct().first()
        
        if sponsor_orgs:
            return sponsor_orgs
        
        # If no sponsor org found, return None
        return None
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        GET /api/v1/sponsor/dashboard/summary
        Get sponsor dashboard summary.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create cache
        try:
            cache = SponsorDashboardCache.objects.get(org=org)
        except SponsorDashboardCache.DoesNotExist:
            # Refresh cache if it doesn't exist
            cache = SponsorDashboardService.refresh_sponsor_cache(org.id)
        
        serializer = SponsorDashboardSummarySerializer(cache)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def cohorts(self, request):
        """
        GET /api/v1/sponsor/dashboard/cohorts
        Get list of sponsored cohorts with pagination.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        cursor = request.query_params.get('cursor')
        
        queryset = SponsorCohortDashboard.objects.filter(org=org).order_by('-updated_at')
        
        # Cursor-based pagination (simplified)
        if cursor:
            try:
                cursor_time = timezone.datetime.fromisoformat(cursor.replace('Z', '+00:00'))
                queryset = queryset.filter(updated_at__lt=cursor_time)
            except (ValueError, AttributeError):
                pass
        
        cohorts = queryset[offset:offset + limit]
        serializer = SponsorCohortListSerializer(cohorts, many=True)
        
        # Get next cursor
        next_cursor = None
        if len(cohorts) == limit:
            next_cursor = cohorts[-1].updated_at.isoformat()
        
        return Response({
            'results': serializer.data,
            'next_cursor': next_cursor,
            'count': queryset.count(),
        })
    
    @action(detail=True, methods=['get'])
    def cohort_detail(self, request, pk=None):
        """
        GET /api/v1/sponsor/dashboard/cohorts/{cohort_id}
        Get detailed cohort information.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            dashboard = SponsorCohortDashboard.objects.get(org=org, cohort_id=pk)
        except SponsorCohortDashboard.DoesNotExist:
            # Refresh if doesn't exist
            dashboard = SponsorDashboardService.refresh_cohort_details(org.id, pk)
        
        serializer = SponsorCohortDetailSerializer(dashboard)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def students(self, request):
        """
        GET /api/v1/sponsor/dashboard/students?cohort_id={uuid}
        Get student aggregates (consent-gated).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cohort_id = request.query_params.get('cohort_id')
        queryset = SponsorStudentAggregates.objects.filter(org=org)
        
        if cohort_id:
            queryset = queryset.filter(cohort_id=cohort_id)
        
        # Only show consented profiles
        queryset = queryset.filter(consent_employer_share=True)
        
        serializer = SponsorStudentAggregateSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def seats_assign(self, request):
        """
        POST /api/v1/sponsor/seats/assign
        Bulk assign seats to users.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SponsorSeatAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        cohort_id = serializer.validated_data['cohort_id']
        user_ids = serializer.validated_data['user_ids']
        code = serializer.validated_data.get('code')
        
        try:
            if code:
                # Redeem code
                result = SponsorCodeService.redeem_code(code, cohort_id, user_ids)
            else:
                # Direct assignment
                cohort = Cohort.objects.get(id=cohort_id)
                assigned = []
                for user_id in user_ids:
                    enrollment, created = Enrollment.objects.get_or_create(
                        cohort=cohort,
                        user_id=user_id,
                        defaults={
                            'org': org,
                            'enrollment_type': 'sponsor',
                            'seat_type': 'sponsored',
                            'payment_status': 'waived',
                            'status': 'active',
                        }
                    )
                    assigned.append(str(enrollment.id))
                
                result = {
                    'seats_assigned': len(assigned),
                    'enrollment_ids': assigned,
                }
            
            # Refresh cache
            SponsorDashboardService.refresh_sponsor_cache(org.id)
            SponsorDashboardService.refresh_cohort_details(org.id, cohort_id)
            
            return Response(result, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Cohort.DoesNotExist:
            return Response(
                {'detail': 'Cohort not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def codes_generate(self, request):
        """
        POST /api/v1/sponsor/codes/generate
        Generate sponsor codes.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SponsorCodeGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        count = serializer.validated_data.get('count', 1)
        codes = []
        
        for _ in range(count):
            code = SponsorCodeService.generate_code(
                org.id,
                serializer.validated_data['seats'],
                value_per_seat=serializer.validated_data.get('value_per_seat'),
                valid_from=serializer.validated_data.get('valid_from'),
                valid_until=serializer.validated_data.get('valid_until'),
                max_usage=serializer.validated_data.get('max_usage'),
            )
            codes.append(code)
        
        serializer = SponsorCodeSerializer(codes, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def codes(self, request):
        """
        GET /api/v1/sponsor/codes
        List sponsor codes.
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = SponsorCode.objects.filter(org=org).order_by('-created_at')
        serializer = SponsorCodeSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def invoices(self, request):
        """
        GET /api/v1/sponsor/invoices
        Get invoice history (placeholder - integrate with billing).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # TODO: Integrate with billing service
        # For now, return empty list
        return Response([])
    
    @action(detail=False, methods=['post'])
    def reports_export(self, request):
        """
        POST /api/v1/sponsor/reports/export
        Export reports (CSV/JSON).
        """
        org = self.get_org(request)
        if not org:
            return Response(
                {'detail': 'User is not associated with a sponsor organization'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        format_type = request.data.get('format', 'json')
        report_type = request.data.get('type', 'summary')
        
        # TODO: Implement export logic
        return Response({
            'detail': 'Export functionality coming soon',
            'format': format_type,
            'type': report_type,
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
