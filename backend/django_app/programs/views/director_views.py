"""
Program Director API Views - Comprehensive director dashboard and management endpoints.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db import transaction

from programs.models import Program, Track, Cohort, Enrollment, MentorAssignment, ProgramRule, Milestone
from programs.services.director_service import DirectorService
from programs.services.calendar_service import CalendarService
from programs.services.certificate_service import CertificateService
from programs.serializers import (
    ProgramSerializer, TrackSerializer, CohortSerializer,
    EnrollmentSerializer, MentorAssignmentSerializer, ProgramRuleSerializer,
    CalendarEventSerializer, WaitlistSerializer
)
from programs.core_services import EnrollmentService
from programs.models import CalendarEvent

from users.utils.audit_utils import log_audit_event

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
        log_audit_event(
            request=self.request,
            user=user,
            action='create',
            resource_type='program',
            resource_id=str(program.id),
            metadata={'name': program.name},
        )
        return program

    def perform_update(self, serializer):
        program = self.get_object()
        before = {'name': program.name}
        updated = serializer.save()
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='update',
            resource_type='program',
            resource_id=str(updated.id),
            metadata={'before': before, 'updated_fields': list(serializer.validated_data.keys())},
        )
        return updated

    def perform_destroy(self, instance):
        meta = {'name': getattr(instance, 'name', None)}
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='delete',
            resource_type='program',
            resource_id=str(instance.id),
            metadata=meta,
        )
        return super().perform_destroy(instance)


class DirectorTrackViewSet(viewsets.ModelViewSet):
    """Program Director's track management endpoints."""
    serializer_class = TrackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get tracks where user is a director with prefetched related data."""
        from django.db.models import Prefetch
        
        user = self.request.user
        program_id = self.request.query_params.get('program_id')
        
        # Get base queryset from DirectorService
        queryset = DirectorService.get_director_tracks(user, program_id)
        
        # Prefetch related data for better performance
        queryset = queryset.select_related('program', 'director').prefetch_related(
            Prefetch('milestones', queryset=Milestone.objects.prefetch_related(
                Prefetch('modules')
            ).order_by('order')),
            Prefetch('specializations')
        )
        
        return queryset.order_by('program__name', 'name')
    
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
        log_audit_event(
            request=self.request,
            user=user,
            action='create',
            resource_type='track',
            resource_id=str(track.id),
            metadata={'name': track.name, 'program_id': str(track.program_id)},
        )
        return track

    def perform_update(self, serializer):
        track = self.get_object()
        before = {'name': track.name, 'program_id': str(track.program_id)}
        updated = serializer.save()
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='update',
            resource_type='track',
            resource_id=str(updated.id),
            metadata={'before': before, 'updated_fields': list(serializer.validated_data.keys())},
        )
        return updated

    def perform_destroy(self, instance):
        meta = {'name': getattr(instance, 'name', None), 'program_id': str(getattr(instance, 'program_id', '') or '')}
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='delete',
            resource_type='track',
            resource_id=str(instance.id),
            metadata=meta,
        )
        return super().perform_destroy(instance)


class DirectorCohortViewSet(viewsets.ModelViewSet):
    """Program Director's cohort management endpoints."""
    serializer_class = CohortSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get cohorts where user is a director."""
        user = self.request.user
        status_filter = self.request.query_params.get('status')
        return DirectorService.get_director_cohorts(user, status_filter)
    
    def get_object(self):
        """Get cohort object, checking permissions using can_manage_cohort."""
        from programs.models import Cohort, Track
        from rest_framework.exceptions import NotFound
        
        # Get the cohort ID from URL kwargs
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        cohort_id = self.kwargs[lookup_url_kwarg]
        
        try:
            # Get the cohort directly (don't rely on filtered queryset)
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist:
            raise NotFound("Cohort not found")
        
        # Check if user can manage this cohort (this handles both direct directors and program_director role)
        if DirectorService.can_manage_cohort(self.request.user, cohort):
            return cohort
        
        # If user can't manage current cohort, check if they're trying to update the track
        # and if they can manage the new track
        if self.request.method in ('PATCH', 'PUT') and 'track' in self.request.data:
            try:
                new_track_id = self.request.data.get('track')
                if new_track_id:
                    # Handle both UUID string and Track object
                    if isinstance(new_track_id, str):
                        new_track = Track.objects.get(id=new_track_id)
                    else:
                        new_track = new_track_id
                    
                    # If user can manage the new track, allow access for the update
                    if DirectorService.can_manage_track(self.request.user, new_track):
                        return cohort
            except (Track.DoesNotExist, ValueError, TypeError):
                # If track doesn't exist or is invalid, fall through to NotFound
                pass
        
        raise NotFound("Cohort not found")
    
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
        log_audit_event(
            request=self.request,
            user=user,
            action='create',
            resource_type='cohort',
            resource_id=str(cohort.id),
            metadata={'name': cohort.name, 'track_id': str(cohort.track_id)},
        )
        return cohort

    def perform_update(self, serializer):
        cohort = self.get_object()
        user = self.request.user
        
        # Check if track is being updated
        if 'track' in serializer.validated_data:
            new_track = serializer.validated_data['track']
            # Verify user can manage the new track
            if not DirectorService.can_manage_track(user, new_track):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    'You do not have permission to assign cohorts to this track. '
                    'You must be the director of the track or have program_director role.'
                )
        
        before = {'name': cohort.name, 'status': getattr(cohort, 'status', None), 'track_id': str(cohort.track_id)}
        updated = serializer.save()
        log_audit_event(
            request=self.request,
            user=user,
            action='update',
            resource_type='cohort',
            resource_id=str(updated.id),
            metadata={'before': before, 'updated_fields': list(serializer.validated_data.keys())},
        )
        return updated

    def perform_destroy(self, instance):
        meta = {'name': getattr(instance, 'name', None), 'track_id': str(getattr(instance, 'track_id', '') or '')}
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='delete',
            resource_type='cohort',
            resource_id=str(instance.id),
            metadata=meta,
        )
        return super().perform_destroy(instance)
    
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
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                metadata={'update': 'status', 'new_status': new_status},
            )
            serializer = self.get_serializer(cohort)
            return Response(serializer.data)
        except ValueError as e:
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                result='failure',
                metadata={'update': 'status', 'new_status': new_status},
                error_message=str(e),
            )
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                result='failure',
                metadata={'update': 'status', 'new_status': new_status},
                error_message=str(e),
            )
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

    @action(detail=True, methods=['post'])
    def update_enrollment_status(self, request, pk=None):
        """Update a single enrollment status in this cohort."""
        cohort = self.get_object()
        enrollment_id = request.data.get('enrollment_id')
        new_status = request.data.get('status')
        if not enrollment_id or not new_status:
            return Response(
                {'error': 'enrollment_id and status are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            enrollment = Enrollment.objects.get(id=enrollment_id, cohort=cohort)
            result = DirectorService.bulk_update_enrollments_status(cohort, [str(enrollment.id)], new_status, request.user)
            enrollment.refresh_from_db()
            return Response(EnrollmentSerializer(enrollment).data)
        except Enrollment.DoesNotExist:
            return Response({'error': 'Enrollment not found'}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def bulk_update_enrollments(self, request, pk=None):
        """Bulk update enrollment statuses for this cohort."""
        cohort = self.get_object()
        enrollment_ids = request.data.get('enrollment_ids', [])
        new_status = request.data.get('status')
        if not enrollment_ids or not new_status:
            return Response(
                {'error': 'enrollment_ids and status are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            result = DirectorService.bulk_update_enrollments_status(cohort, enrollment_ids, new_status, request.user)
            return Response(result)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def bulk_remove_enrollments(self, request, pk=None):
        """Bulk remove enrollments for this cohort."""
        cohort = self.get_object()
        enrollment_ids = request.data.get('enrollment_ids', [])
        if not enrollment_ids:
            return Response({'error': 'enrollment_ids is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = DirectorService.bulk_remove_enrollments(cohort, enrollment_ids, request.user)
            return Response(result)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'], url_path='bulk_create_enrollments')
    def bulk_create_enrollments(self, request, pk=None):
        """
        Bulk assign students to cohort (director action).
        Uses EnrollmentService to enforce seat pool and waitlist rules.
        """
        cohort = self.get_object()
        user_ids = request.data.get('user_ids', [])
        seat_type = request.data.get('seat_type', 'paid')
        enrollment_type = request.data.get('enrollment_type', 'director')

        if not user_ids:
            return Response({'error': 'user_ids is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not DirectorService.can_manage_cohort(request.user, cohort):
            return Response({'error': 'You do not have permission to manage this cohort'}, status=status.HTTP_403_FORBIDDEN)

        from django.contrib.auth import get_user_model
        UserModel = get_user_model()

        created = []
        waitlisted = []
        errors = []

        for raw_id in user_ids:
            try:
                user = UserModel.objects.get(id=int(raw_id) if isinstance(raw_id, str) and raw_id.isdigit() else raw_id)
            except Exception:
                errors.append({'user_id': str(raw_id), 'error': 'User not found'})
                continue

            enrollment, is_waitlisted, err = EnrollmentService.create_enrollment(
                user=user,
                cohort=cohort,
                enrollment_type=enrollment_type,
                seat_type=seat_type,
                org=None
            )

            if err:
                errors.append({'user_id': str(user.id), 'error': err})
                continue

            if is_waitlisted:
                waitlisted.append(WaitlistSerializer(enrollment).data)
            else:
                created.append(EnrollmentSerializer(enrollment).data)

        log_audit_event(
            request=request,
            user=request.user,
            action='update',
            resource_type='cohort',
            resource_id=str(cohort.id),
            metadata={
                'operation': 'bulk_create_enrollments',
                'requested': len(user_ids),
                'created_count': len(created),
                'waitlisted_count': len(waitlisted),
                'error_count': len(errors),
            },
            result='partial' if errors else 'success',
        )

        return Response({
            'created': created,
            'waitlisted': waitlisted,
            'errors': errors,
            'requested': len(user_ids),
            'created_count': len(created),
            'waitlisted_count': len(waitlisted),
            'error_count': len(errors),
        }, status=status.HTTP_200_OK)
    
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
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                metadata={'operation': 'rebalance_mentors'},
            )
            return Response(result)
        except PermissionError as e:
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                result='failure',
                metadata={'operation': 'rebalance_mentors'},
                error_message=str(e),
            )
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



        if not user_ids:
            return Response({'error': 'user_ids is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not DirectorService.can_manage_cohort(request.user, cohort):
            return Response({'error': 'You do not have permission to manage this cohort'}, status=status.HTTP_403_FORBIDDEN)

        from django.contrib.auth import get_user_model
        UserModel = get_user_model()

        created = []
        waitlisted = []
        errors = []

        for raw_id in user_ids:
            try:
                user = UserModel.objects.get(id=int(raw_id) if isinstance(raw_id, str) and raw_id.isdigit() else raw_id)
            except Exception:
                errors.append({'user_id': str(raw_id), 'error': 'User not found'})
                continue

            enrollment, is_waitlisted, err = EnrollmentService.create_enrollment(
                user=user,
                cohort=cohort,
                enrollment_type=enrollment_type,
                seat_type=seat_type,
                org=None
            )

            if err:
                errors.append({'user_id': str(user.id), 'error': err})
                continue

            if is_waitlisted:
                waitlisted.append(WaitlistSerializer(enrollment).data)
            else:
                created.append(EnrollmentSerializer(enrollment).data)

        log_audit_event(
            request=request,
            user=request.user,
            action='update',
            resource_type='cohort',
            resource_id=str(cohort.id),
            metadata={
                'operation': 'bulk_create_enrollments',
                'requested': len(user_ids),
                'created_count': len(created),
                'waitlisted_count': len(waitlisted),
                'error_count': len(errors),
            },
            result='partial' if errors else 'success',
        )

        return Response({
            'created': created,
            'waitlisted': waitlisted,
            'errors': errors,
            'requested': len(user_ids),
            'created_count': len(created),
            'waitlisted_count': len(waitlisted),
            'error_count': len(errors),
        }, status=status.HTTP_200_OK)
    
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
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                metadata={'operation': 'rebalance_mentors'},
            )
            return Response(result)
        except PermissionError as e:
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                result='failure',
                metadata={'operation': 'rebalance_mentors'},
                error_message=str(e),
            )
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



        if not user_ids:
            return Response({'error': 'user_ids is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not DirectorService.can_manage_cohort(request.user, cohort):
            return Response({'error': 'You do not have permission to manage this cohort'}, status=status.HTTP_403_FORBIDDEN)

        from django.contrib.auth import get_user_model
        UserModel = get_user_model()

        created = []
        waitlisted = []
        errors = []

        for raw_id in user_ids:
            try:
                user = UserModel.objects.get(id=int(raw_id) if isinstance(raw_id, str) and raw_id.isdigit() else raw_id)
            except Exception:
                errors.append({'user_id': str(raw_id), 'error': 'User not found'})
                continue

            enrollment, is_waitlisted, err = EnrollmentService.create_enrollment(
                user=user,
                cohort=cohort,
                enrollment_type=enrollment_type,
                seat_type=seat_type,
                org=None
            )

            if err:
                errors.append({'user_id': str(user.id), 'error': err})
                continue

            if is_waitlisted:
                waitlisted.append(WaitlistSerializer(enrollment).data)
            else:
                created.append(EnrollmentSerializer(enrollment).data)

        log_audit_event(
            request=request,
            user=request.user,
            action='update',
            resource_type='cohort',
            resource_id=str(cohort.id),
            metadata={
                'operation': 'bulk_create_enrollments',
                'requested': len(user_ids),
                'created_count': len(created),
                'waitlisted_count': len(waitlisted),
                'error_count': len(errors),
            },
            result='partial' if errors else 'success',
        )

        return Response({
            'created': created,
            'waitlisted': waitlisted,
            'errors': errors,
            'requested': len(user_ids),
            'created_count': len(created),
            'waitlisted_count': len(waitlisted),
            'error_count': len(errors),
        }, status=status.HTTP_200_OK)
    
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
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                metadata={'operation': 'rebalance_mentors'},
            )
            return Response(result)
        except PermissionError as e:
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                result='failure',
                metadata={'operation': 'rebalance_mentors'},
                error_message=str(e),
            )
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



        if not user_ids:
            return Response({'error': 'user_ids is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not DirectorService.can_manage_cohort(request.user, cohort):
            return Response({'error': 'You do not have permission to manage this cohort'}, status=status.HTTP_403_FORBIDDEN)

        from django.contrib.auth import get_user_model
        UserModel = get_user_model()

        created = []
        waitlisted = []
        errors = []

        for raw_id in user_ids:
            try:
                user = UserModel.objects.get(id=int(raw_id) if isinstance(raw_id, str) and raw_id.isdigit() else raw_id)
            except Exception:
                errors.append({'user_id': str(raw_id), 'error': 'User not found'})
                continue

            enrollment, is_waitlisted, err = EnrollmentService.create_enrollment(
                user=user,
                cohort=cohort,
                enrollment_type=enrollment_type,
                seat_type=seat_type,
                org=None
            )

            if err:
                errors.append({'user_id': str(user.id), 'error': err})
                continue

            if is_waitlisted:
                waitlisted.append(WaitlistSerializer(enrollment).data)
            else:
                created.append(EnrollmentSerializer(enrollment).data)

        log_audit_event(
            request=request,
            user=request.user,
            action='update',
            resource_type='cohort',
            resource_id=str(cohort.id),
            metadata={
                'operation': 'bulk_create_enrollments',
                'requested': len(user_ids),
                'created_count': len(created),
                'waitlisted_count': len(waitlisted),
                'error_count': len(errors),
            },
            result='partial' if errors else 'success',
        )

        return Response({
            'created': created,
            'waitlisted': waitlisted,
            'errors': errors,
            'requested': len(user_ids),
            'created_count': len(created),
            'waitlisted_count': len(waitlisted),
            'error_count': len(errors),
        }, status=status.HTTP_200_OK)
    
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
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                metadata={'operation': 'rebalance_mentors'},
            )
            return Response(result)
        except PermissionError as e:
            log_audit_event(
                request=request,
                user=request.user,
                action='update',
                resource_type='cohort',
                resource_id=str(cohort.id),
                result='failure',
                metadata={'operation': 'rebalance_mentors'},
                error_message=str(e),
            )
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

"""
Program Director API Views - Comprehensive director dashboard and management endpoints.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db import transaction

from programs.models import Program, Track, Cohort, Enrollment, MentorAssignment, ProgramRule, Milestone
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
        """Get tracks where user is a director with prefetched related data."""
        from django.db.models import Prefetch
        
        user = self.request.user
        program_id = self.request.query_params.get('program_id')
        
        # Get base queryset from DirectorService
        queryset = DirectorService.get_director_tracks(user, program_id)
        
        # Prefetch related data for better performance
        queryset = queryset.select_related('program', 'director').prefetch_related(
            Prefetch('milestones', queryset=Milestone.objects.prefetch_related(
                Prefetch('modules')
            ).order_by('order')),
            Prefetch('specializations')
        )
        
        return queryset.order_by('program__name', 'name')
    
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
    
    def get_object(self):
        """Get cohort object, checking permissions using can_manage_cohort."""
        from programs.models import Cohort, Track
        from rest_framework.exceptions import NotFound
        
        # Get the cohort ID from URL kwargs
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        cohort_id = self.kwargs[lookup_url_kwarg]
        
        try:
            # Get the cohort directly (don't rely on filtered queryset)
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist:
            raise NotFound("Cohort not found")
        
        # Check if user can manage this cohort (this handles both direct directors and program_director role)
        if DirectorService.can_manage_cohort(self.request.user, cohort):
            return cohort
        
        # If user can't manage current cohort, check if they're trying to update the track
        # and if they can manage the new track
        if self.request.method in ('PATCH', 'PUT') and 'track' in self.request.data:
            try:
                new_track_id = self.request.data.get('track')
                if new_track_id:
                    # Handle both UUID string and Track object
                    if isinstance(new_track_id, str):
                        new_track = Track.objects.get(id=new_track_id)
                    else:
                        new_track = new_track_id
                    
                    # If user can manage the new track, allow access for the update
                    if DirectorService.can_manage_track(self.request.user, new_track):
                        return cohort
            except (Track.DoesNotExist, ValueError, TypeError):
                # If track doesn't exist or is invalid, fall through to NotFound
                pass
        
        raise NotFound("Cohort not found")
    
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
        log_audit_event(
            request=self.request,
            user=user,
            action='create',
            resource_type='cohort',
            resource_id=str(cohort.id),
            metadata={'name': cohort.name, 'track_id': str(cohort.track_id)},
        )
        return cohort
    
    def perform_update(self, serializer):
        cohort = self.get_object()
        user = self.request.user
        
        # Check if track is being updated
        if 'track' in serializer.validated_data:
            new_track = serializer.validated_data['track']
            # Verify user can manage the new track
            if not DirectorService.can_manage_track(user, new_track):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    'You do not have permission to assign cohorts to this track. '
                    'You must be the director of the track or have program_director role.'
                )
        
        before = {'name': cohort.name, 'status': getattr(cohort, 'status', None), 'track_id': str(cohort.track_id)}
        updated = serializer.save()
        log_audit_event(
            request=self.request,
            user=user,
            action='update',
            resource_type='cohort',
            resource_id=str(updated.id),
            metadata={'before': before, 'updated_fields': list(serializer.validated_data.keys())},
        )
        return updated
    
    def perform_destroy(self, instance):
        meta = {'name': getattr(instance, 'name', None), 'track_id': str(getattr(instance, 'track_id', '') or '')}
        log_audit_event(
            request=self.request,
            user=self.request.user,
            action='delete',
            resource_type='cohort',
            resource_id=str(instance.id),
            metadata=meta,
        )
        return super().perform_destroy(instance)
    
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

>>>>>>> 2cfc00f (mentor and program director role update)
