"""
API views for Programs app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db.models import Q, Count, Avg, Sum, F, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta
from .models import (
    Program, Track, Specialization, Cohort, Enrollment,
    CalendarEvent, MentorAssignment, ProgramRule, Certificate, Waitlist
)
from .serializers import (
    ProgramSerializer, TrackSerializer, SpecializationSerializer,
    CohortSerializer, EnrollmentSerializer, CalendarEventSerializer,
    MentorAssignmentSerializer, ProgramRuleSerializer, CertificateSerializer,
    CohortDashboardSerializer, WaitlistSerializer
)
from .services import auto_graduate_cohort, EnrollmentService, ProgramManagementService


@extend_schema(
    summary='Get Director Dashboard (Legacy)',
    description='Comprehensive director dashboard endpoint. Returns hero metrics, alerts, cohort table data, and program overview. Use /api/v1/director/dashboard/summary/ for cached version.',
    tags=['Director Dashboard'],
    deprecated=True,
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def director_dashboard(request):
    """
    Comprehensive director dashboard endpoint.
    Returns hero metrics, alerts, cohort table data, and program overview.
    """
    user = request.user
    
    # Get user's programs and cohorts
    if user.is_staff:
        programs = Program.objects.all()
        cohorts = Cohort.objects.all()
    else:
        programs = Program.objects.filter(tracks__director=user).distinct()
        cohorts = Cohort.objects.filter(
            Q(track__director=user) | Q(mentor_assignments__mentor=user)
        ).distinct()
    
    active_programs = programs.filter(status='active').count()
    active_cohorts = cohorts.filter(status__in=['active', 'running'])
    
    # Hero Metrics
    total_seats_used = sum(c.enrollments.filter(status='active').count() for c in active_cohorts)
    total_seats_available = sum(c.seat_cap for c in active_cohorts)
    seat_utilization = (total_seats_used / total_seats_available * 100) if total_seats_available > 0 else 0
    
    # Calculate average readiness (mock - should come from TalentScope)
    avg_readiness = 65.0  # TODO: Aggregate from student_dashboard_cache
    
    completion_rates = [c.completion_rate or 0 for c in active_cohorts if c.completion_rate]
    avg_completion = sum(completion_rates) / len(completion_rates) if completion_rates else 0
    
    # Revenue per seat (mock - should come from billing)
    revenue_per_seat = 0.0  # TODO: Calculate from billing data
    
    # Alerts - items needing attention
    alerts = []
    
    # Cohorts at risk (low completion or readiness)
    for cohort in active_cohorts:
        if (cohort.completion_rate or 0) < 50:
            alerts.append({
                'type': 'cohort_at_risk',
                'severity': 'high',
                'title': f'Low completion rate: {cohort.name}',
                'message': f'Completion rate is {cohort.completion_rate or 0}%',
                'cohort_id': str(cohort.id),
                'action_url': f'/dashboard/director/cohorts/{cohort.id}'
            })
        
        # Check seat utilization
        enrolled_count = cohort.enrollments.filter(status='active').count()
        utilization = (enrolled_count / cohort.seat_cap * 100) if cohort.seat_cap > 0 else 0
        if utilization < 60 and enrolled_count > 0:
            alerts.append({
                'type': 'underfilled_cohort',
                'severity': 'medium',
                'title': f'Under-filled cohort: {cohort.name}',
                'message': f'Only {utilization:.0f}% of seats filled',
                'cohort_id': str(cohort.id),
                'action_url': f'/dashboard/director/cohorts/{cohort.id}'
            })
        elif utilization >= 95:
            alerts.append({
                'type': 'overfilled_cohort',
                'severity': 'medium',
                'title': f'Near capacity: {cohort.name}',
                'message': f'{utilization:.0f}% of seats filled',
                'cohort_id': str(cohort.id),
                'action_url': f'/dashboard/director/cohorts/{cohort.id}'
            })
    
    # Mentor SLA breaches (mock - should check mentor performance)
    # TODO: Check mentor session completion rates, feedback scores
    
    # Payment anomalies
    pending_payments = Enrollment.objects.filter(
        cohort__in=active_cohorts,
        payment_status='pending',
        status='active'
    ).count()
    
    if pending_payments > 0:
        alerts.append({
            'type': 'payment_anomaly',
            'severity': 'medium',
            'title': f'{pending_payments} pending payments',
            'message': 'Review payment status for active enrollments',
            'action_url': '/dashboard/director/reports?filter=payments'
        })
    
    # Cohort Table Data
    cohort_table = []
    for cohort in active_cohorts:
        enrollments = cohort.enrollments.filter(status='active')
        mentor_count = cohort.mentor_assignments.filter(active=True).count()
        
        # Upcoming milestones
        upcoming_events = CalendarEvent.objects.filter(
            cohort=cohort,
            start_ts__gte=timezone.now()
        ).order_by('start_ts')[:3]
        
        milestones = [
            {
                'title': event.title,
                'date': event.start_ts.isoformat(),
                'type': event.type
            }
            for event in upcoming_events
        ]
        
        enrolled_count = cohort.enrollments.filter(status='active').count()
        cohort_table.append({
            'id': str(cohort.id),
            'name': cohort.name,
            'track_name': cohort.track.name if cohort.track else '',
            'program_name': cohort.track.program.name if cohort.track and cohort.track.program else '',
            'status': cohort.status,
            'seats_used': enrolled_count,
            'seats_available': cohort.seat_cap - enrolled_count,
            'seats_total': cohort.seat_cap,
            'readiness_delta': 0.0,  # TODO: Calculate from TalentScope
            'completion_rate': cohort.completion_rate or 0,
            'mentor_coverage': mentor_count,
            'upcoming_milestones': milestones,
            'start_date': cohort.start_date.isoformat() if cohort.start_date else None,
            'end_date': cohort.end_date.isoformat() if cohort.end_date else None,
        })
    
    # Sort cohorts by status and start date
    cohort_table.sort(key=lambda x: (
        {'running': 0, 'active': 1, 'closing': 2, 'closed': 3}.get(x['status'], 4),
        x['start_date'] or ''
    ))
    
    return Response({
        'hero_metrics': {
            'active_programs': active_programs,
            'active_cohorts': active_cohorts.count(),
            'seats_used': total_seats_used,
            'seats_available': total_seats_available,
            'seat_utilization': round(seat_utilization, 1),
            'avg_readiness': round(avg_readiness, 1),
            'avg_completion_rate': round(avg_completion, 1),
            'revenue_per_seat': revenue_per_seat,
        },
        'alerts': alerts[:10],  # Top 10 alerts
        'cohort_table': cohort_table,
        'programs': ProgramSerializer(programs, many=True).data,
    })


class ProgramViewSet(viewsets.ModelViewSet):
    """ViewSet for Program model."""
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter programs based on user permissions."""
        user = self.request.user
        if user.is_staff:
            return Program.objects.all()
        # Directors can see programs they direct (via tracks)
        # Also allow programs with no tracks if the director has created tracks elsewhere
        # (this allows seeing newly created programs before tracks are added)
        director_has_tracks = user.directed_tracks.exists()
        if director_has_tracks:
            # Director has tracks, show programs they direct OR programs with no tracks
            return Program.objects.filter(
                Q(tracks__director=user) | Q(tracks__isnull=True)
            ).distinct()
        else:
            # New director with no tracks yet, show all programs (they can create tracks)
            return Program.objects.all()


class TrackViewSet(viewsets.ModelViewSet):
    """ViewSet for Track model."""
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter tracks based on user permissions."""
        user = self.request.user
        program_id = self.request.query_params.get('program_id')
        queryset = Track.objects.all()
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        if not user.is_staff:
            queryset = queryset.filter(Q(director=user) | Q(program__tracks__director=user)).distinct()
        
        return queryset


class CohortViewSet(viewsets.ModelViewSet):
    """ViewSet for Cohort model."""
    queryset = Cohort.objects.all()
    serializer_class = CohortSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter cohorts based on user permissions."""
        user = self.request.user
        track_id = self.request.query_params.get('track_id')
        status_filter = self.request.query_params.get('status')
        
        queryset = Cohort.objects.all()
        
        if track_id:
            queryset = queryset.filter(track_id=track_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if not user.is_staff:
            # Directors can see cohorts from tracks they direct OR cohorts they're assigned as mentors
            queryset = queryset.filter(
                Q(track__director=user) |
                Q(mentor_assignments__mentor=user) |
                Q(track__program__tracks__director=user)  # Also allow cohorts from programs they direct
            ).distinct()
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Get cohort dashboard data."""
        cohort = self.get_object()
        
        enrollments = cohort.enrollments.filter(status='active')
        enrollments_count = enrollments.count()
        
        # Calculate readiness delta (mock - should come from analytics)
        readiness_delta = 0.0
        
        # Payment status
        payments_complete = enrollments.filter(payment_status='paid').count()
        payments_pending = enrollments.filter(payment_status='pending').count()
        
        dashboard_data = {
            'cohort_id': cohort.id,
            'cohort_name': cohort.name,
            'track_name': cohort.track.name,
            'enrollments_count': enrollments_count,
            'seat_utilization': cohort.seat_utilization,
            'mentor_assignments_count': cohort.mentor_assignments.filter(active=True).count(),
            'readiness_delta': readiness_delta,
            'completion_percentage': cohort.completion_rate,
            'payments_complete': payments_complete,
            'payments_pending': payments_pending,
        }
        
        serializer = CohortDashboardSerializer(dashboard_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def calendar(self, request, pk=None):
        """Get or create calendar events for cohort."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            events = CalendarEvent.objects.filter(cohort=cohort)
            serializer = CalendarEventSerializer(events, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data.copy()
            data['cohort'] = cohort.id
            serializer = CalendarEventSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get', 'post'])
    def enrollments(self, request, pk=None):
        """Get or create enrollments for cohort."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            enrollments = Enrollment.objects.filter(cohort=cohort)
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Use EnrollmentService for validation and waitlist handling
            user_id = request.data.get('user', request.user.id)
            enrollment_type = request.data.get('enrollment_type', 'self')
            seat_type = request.data.get('seat_type', 'paid')
            org_id = request.data.get('org')
            
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            org = None
            if org_id:
                from organizations.models import Organization
                try:
                    org = Organization.objects.get(id=org_id)
                except Organization.DoesNotExist:
                    pass
            
            enrollment, is_waitlisted, error = EnrollmentService.create_enrollment(
                user=user,
                cohort=cohort,
                enrollment_type=enrollment_type,
                seat_type=seat_type,
                org=org
            )
            
            if error:
                return Response(
                    {'error': error, 'is_waitlisted': is_waitlisted},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if is_waitlisted:
                serializer = WaitlistSerializer(enrollment)
                return Response(
                    {'waitlist_entry': serializer.data, 'is_waitlisted': True},
                    status=status.HTTP_201_CREATED
                )
            else:
                serializer = EnrollmentSerializer(enrollment)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get', 'post'])
    def mentors(self, request, pk=None):
        """Get or assign mentors for cohort."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            assignments = MentorAssignment.objects.filter(cohort=cohort, active=True)
            serializer = MentorAssignmentSerializer(assignments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data.copy()
            data['cohort'] = cohort.id
            serializer = MentorAssignmentSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def auto_graduate(self, request, pk=None):
        """Auto-graduate students in cohort based on completion rules."""
        cohort = self.get_object()
        rule_id = request.data.get('rule_id')
        
        result = auto_graduate_cohort(str(cohort.id), rule_id)
        
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(result, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export cohort report as CSV or JSON."""
        cohort = self.get_object()
        format_type = request.query_params.get('format', 'json')
        
        # Get cohort data
        enrollments = Enrollment.objects.filter(cohort=cohort)
        enrollments_data = EnrollmentSerializer(enrollments, many=True).data
        
        if format_type == 'csv':
            import csv
            from django.http import HttpResponse
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="cohort_{cohort.id}_report.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['User Email', 'Status', 'Payment Status', 'Seat Type', 'Joined At'])
            
            for enrollment in enrollments_data:
                writer.writerow([
                    enrollment.get('user_email', ''),
                    enrollment.get('status', ''),
                    enrollment.get('payment_status', ''),
                    enrollment.get('seat_type', ''),
                    enrollment.get('joined_at', ''),
                ])
            
            return response
        
        # JSON format
        return Response({
            'cohort_id': str(cohort.id),
            'cohort_name': cohort.name,
            'enrollments': enrollments_data,
            'seat_utilization': cohort.seat_utilization,
            'completion_rate': cohort.completion_rate,
        })
    
    @action(detail=True, methods=['get', 'post'])
    def waitlist(self, request, pk=None):
        """Get waitlist or promote from waitlist."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            waitlist_entries = Waitlist.objects.filter(cohort=cohort, active=True)
            serializer = WaitlistSerializer(waitlist_entries, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Promote users from waitlist
            count = int(request.data.get('count', 1))
            promoted = EnrollmentService.promote_from_waitlist(cohort, count)
            
            if promoted:
                serializer = EnrollmentSerializer(promoted, many=True)
                return Response({
                    'promoted': serializer.data,
                    'count': len(promoted)
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'message': 'No users could be promoted from waitlist'},
                    status=status.HTTP_200_OK
                )


class ProgramRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for ProgramRule model."""
    queryset = ProgramRule.objects.filter(active=True)
    serializer_class = ProgramRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter rules by program."""
        program_id = self.request.query_params.get('program_id')
        queryset = ProgramRule.objects.filter(active=True)
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        return queryset


class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Certificate model (read-only)."""
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download certificate file."""
        certificate = self.get_object()
        if certificate.file_uri:
            return Response({'file_uri': certificate.file_uri})
        return Response(
            {'error': 'Certificate file not available'},
            status=status.HTTP_404_NOT_FOUND
        )
