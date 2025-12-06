"""
Program Director API Views - Comprehensive director dashboard and management endpoints.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db import transaction

from programs.models import Program, Track, Cohort, Enrollment, MentorAssignment, ProgramRule
from programs.services.director_service import DirectorService
from programs.services.calendar_service import CalendarService
from programs.services.certificate_service import CertificateService
from programs.serializers import (
    ProgramSerializer, TrackSerializer, CohortSerializer,
    EnrollmentSerializer, MentorAssignmentSerializer, ProgramRuleSerializer,
    CalendarEventSerializer
)
from programs.core_services import EnrollmentService
from programs.models import CalendarEvent

import logging

logger = logging.getLogger(__name__)


class DirectorProgramViewSet(viewsets.ModelViewSet):
    """Program Director's program management endpoints."""
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get programs where user is a director."""
        user = self.request.user
        return DirectorService.get_director_programs(user)
    
    def perform_create(self, serializer):
        """Create program."""
        user = self.request.user
        program = DirectorService.create_program(
            user=user,
            name=serializer.validated_data['name'],
            description=serializer.validated_data.get('description', ''),
            duration_weeks=serializer.validated_data.get('duration_weeks', 12),
            pricing=serializer.validated_data.get('pricing', {}),
            outcomes=serializer.validated_data.get('outcomes', []),
        )
        serializer.instance = program
        return program


class DirectorTrackViewSet(viewsets.ModelViewSet):
    """Program Director's track management endpoints."""
    serializer_class = TrackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get tracks where user is a director."""
        user = self.request.user
        program_id = self.request.query_params.get('program_id')
        return DirectorService.get_director_tracks(user, program_id)
    
    def perform_create(self, serializer):
        """Create track."""
        user = self.request.user
        program = serializer.validated_data['program']
        
        if not DirectorService.can_manage_program(user, program):
            return Response(
                {'error': 'You do not have permission to create tracks for this program'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        track = DirectorService.create_track(
            user=user,
            program=program,
            name=serializer.validated_data['name'],
            key=serializer.validated_data['key'],
            competencies=serializer.validated_data.get('competencies', []),
            missions=serializer.validated_data.get('missions', []),
        )
        serializer.instance = track
        return track


class DirectorCohortViewSet(viewsets.ModelViewSet):
    """Program Director's cohort management endpoints."""
    serializer_class = CohortSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get cohorts where user is a director."""
        user = self.request.user
        status_filter = self.request.query_params.get('status')
        return DirectorService.get_director_cohorts(user, status_filter)
    
    def perform_create(self, serializer):
        """Create cohort."""
        user = self.request.user
        track = serializer.validated_data['track']
        
        if not DirectorService.can_manage_track(user, track):
            return Response(
                {'error': 'You do not have permission to create cohorts for this track'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cohort = DirectorService.create_cohort(
            user=user,
            track=track,
            name=serializer.validated_data['name'],
            start_date=serializer.validated_data['start_date'],
            end_date=serializer.validated_data['end_date'],
            mode=serializer.validated_data.get('mode', 'online'),
            seat_cap=serializer.validated_data['seat_cap'],
            mentor_ratio=serializer.validated_data.get('mentor_ratio', 0.1),
            seat_pool=serializer.validated_data.get('seat_pool'),
            calendar_template_id=serializer.validated_data.get('calendar_template_id'),
        )
        serializer.instance = cohort
        return cohort
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update cohort status with state machine validation."""
        cohort = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cohort = DirectorService.update_cohort_status(cohort, new_status, request.user)
            serializer = self.get_serializer(cohort)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post'])
    def manage_seat_pool(self, request, pk=None):
        """Manage cohort seat pool allocations."""
        cohort = self.get_object()
        seat_pool = request.data.get('seat_pool')
        
        if not seat_pool:
            return Response(
                {'error': 'seat_pool is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cohort = DirectorService.manage_seat_pool(cohort, seat_pool, request.user)
            serializer = self.get_serializer(cohort)
            return Response(serializer.data)
        except (ValueError, PermissionError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def readiness(self, request, pk=None):
        """Get cohort readiness analytics."""
        cohort = self.get_object()
        analytics = DirectorService.get_cohort_readiness_analytics(cohort)
        return Response(analytics)
    
    @action(detail=True, methods=['get'])
    def mission_funnel(self, request, pk=None):
        """Get mission funnel analytics."""
        cohort = self.get_object()
        analytics = DirectorService.get_mission_funnel_analytics(cohort)
        return Response(analytics)
    
    @action(detail=True, methods=['get'])
    def portfolio_heatmap(self, request, pk=None):
        """Get portfolio coverage heatmap."""
        cohort = self.get_object()
        heatmap = DirectorService.get_portfolio_coverage_heatmap(cohort)
        return Response(heatmap)
    
    @action(detail=True, methods=['get'])
    def at_risk(self, request, pk=None):
        """Get at-risk students list."""
        cohort = self.get_object()
        at_risk = DirectorService.get_at_risk_students(cohort)
        return Response({'at_risk_students': at_risk})
    
    @action(detail=True, methods=['post'])
    def approve_enrollment(self, request, pk=None):
        """Approve a single enrollment."""
        cohort = self.get_object()
        enrollment_id = request.data.get('enrollment_id')
        
        if not enrollment_id:
            return Response(
                {'error': 'enrollment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            enrollment = Enrollment.objects.get(id=enrollment_id, cohort=cohort)
            enrollment = DirectorService.approve_enrollment(enrollment, request.user)
            serializer = EnrollmentSerializer(enrollment)
            return Response(serializer.data)
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'Enrollment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post'])
    def bulk_approve_enrollments(self, request, pk=None):
        """Bulk approve enrollments."""
        cohort = self.get_object()
        enrollment_ids = request.data.get('enrollment_ids', [])
        
        if not enrollment_ids:
            return Response(
                {'error': 'enrollment_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = DirectorService.bulk_approve_enrollments(cohort, enrollment_ids, request.user)
            return Response(result)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['get'])
    def mentor_workload(self, request, pk=None):
        """Get mentor workload analysis."""
        cohort = self.get_object()
        workload = DirectorService.get_mentor_workload(cohort)
        return Response({'workload': workload})
    
    @action(detail=True, methods=['post'])
    def rebalance_mentors(self, request, pk=None):
        """Rebalance mentor assignments."""
        cohort = self.get_object()
        try:
            result = DirectorService.rebalance_mentors(cohort, request.user)
            return Response(result)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['get'])
    def closure_pack(self, request, pk=None):
        """Generate cohort closure pack."""
        cohort = self.get_object()
        pack = DirectorService.generate_cohort_closure_pack(cohort)
        return Response(pack)
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export cohort data."""
        cohort = self.get_object()
        format_type = request.query_params.get('format', 'json')
        
        try:
            data = DirectorService.export_cohort_data(cohort, format_type)
            
            if format_type == 'csv':
                response = HttpResponse(data, content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="cohort_{cohort.id}_export.csv"'
                return response
            else:
                return Response({'data': data.decode('utf-8')})
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get', 'post'])
    def calendar(self, request, pk=None):
        """Get or create calendar events for cohort."""
        cohort = self.get_object()
        
        if request.method == 'GET':
            events = CalendarService.get_cohort_calendar(cohort)
            serializer = CalendarEventSerializer(events, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            action_type = request.data.get('action', 'create')
            
            if action_type == 'create_standard':
                # Create standard calendar
                events = CalendarService.create_standard_cohort_calendar(cohort)
                serializer = CalendarEventSerializer(events, many=True)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            elif action_type == 'create_from_template':
                # Create from template
                template_events = request.data.get('template_events', [])
                events = CalendarService.create_calendar_from_template(cohort, template_events)
                serializer = CalendarEventSerializer(events, many=True)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            else:
                # Create single event
                data = request.data.copy()
                data['cohort'] = cohort.id
                serializer = CalendarEventSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive cohort and trigger certificate issuance."""
        cohort = self.get_object()
        
        if cohort.status != 'closing':
            return Response(
                {'error': 'Cohort must be in "closing" status before archiving'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = CertificateService.archive_cohort_and_issue_certificates(cohort)
            return Response(result)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def trigger_certificates(self, request, pk=None):
        """Trigger certificate issuance for completed enrollments."""
        cohort = self.get_object()
        auto_approve = request.data.get('auto_approve', False)
        
        try:
            result = CertificateService.trigger_cohort_certificates(cohort, auto_approve)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DirectorMentorViewSet(viewsets.ViewSet):
    """Program Director's mentor management endpoints."""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def assign(self, request):
        """Assign mentor to mentee."""
        cohort_id = request.data.get('cohort_id')
        mentor_id = request.data.get('mentor_id')
        mentee_id = request.data.get('mentee_id')
        is_primary = request.data.get('is_primary', True)
        
        if not all([cohort_id, mentor_id, mentee_id]):
            return Response(
                {'error': 'cohort_id, mentor_id, and mentee_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            cohort = Cohort.objects.get(id=cohort_id)
            mentor = User.objects.get(id=mentor_id)
            mentee = User.objects.get(id=mentee_id)
            
            if not DirectorService.can_manage_cohort(request.user, cohort):
                return Response(
                    {'error': 'You do not have permission to manage this cohort'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            assignment = DirectorService.assign_mentor(
                cohort=cohort,
                mentor=mentor,
                mentee=mentee,
                is_primary=is_primary,
                user=request.user
            )
            
            serializer = MentorAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except (Cohort.DoesNotExist, User.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )


class DirectorDashboardViewSet(viewsets.ViewSet):
    """Program Director dashboard summary endpoint."""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get director dashboard summary."""
        user = request.user
        
        programs = DirectorService.get_director_programs(user)
        cohorts = DirectorService.get_director_cohorts(user)
        active_cohorts = [c for c in cohorts if c.status in ['active', 'running']]
        
        total_seats = sum(c.seat_cap for c in active_cohorts)
        seats_used = sum(
            Enrollment.objects.filter(cohort=c, status='active').count()
            for c in active_cohorts
        )
        
        summary = {
            'programs_count': programs.count(),
            'cohorts_count': cohorts.count(),
            'active_cohorts_count': len(active_cohorts),
            'total_seats': total_seats,
            'seats_used': seats_used,
            'seats_utilization': (seats_used / total_seats * 100) if total_seats > 0 else 0,
            'pending_enrollments': Enrollment.objects.filter(
                cohort__in=cohorts,
                status='pending_payment'
            ).count(),
            'at_risk_cohorts': [
                {
                    'cohort_id': str(c.id),
                    'cohort_name': c.name,
                    'risk_score': 50,  # TODO: Calculate actual risk score
                }
                for c in active_cohorts
                if c.completion_rate < 50
            ],
        }
        
        return Response(summary)

