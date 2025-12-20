"""
ViewSet for Mentor Assignment management.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from programs.models import MentorAssignment, Cohort
from programs.serializers import MentorAssignmentSerializer
from programs.services.director_service import DirectorService


class MentorAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing mentor assignments."""
    queryset = MentorAssignment.objects.select_related('mentor', 'cohort').all()
    serializer_class = MentorAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Filter assignments based on user permissions."""
        queryset = super().get_queryset()
        user = self.request.user
        
<<<<<<< HEAD
=======
        # Support filtering by mentor ID via query parameter (for admin/staff)
        mentor_id = self.request.query_params.get('mentor')
        if mentor_id:
            try:
                mentor_id_int = int(mentor_id)
                queryset = queryset.filter(mentor_id=mentor_id_int)
            except (ValueError, TypeError):
                pass  # Invalid mentor ID, ignore filter
        
        # Support filtering by mentor ID via query parameter (for admin/staff)
        mentor_id = self.request.query_params.get('mentor')
        if mentor_id:
            try:
                mentor_id_int = int(mentor_id)
                queryset = queryset.filter(mentor_id=mentor_id_int)
            except (ValueError, TypeError):
                pass  # Invalid mentor ID, ignore filter
        
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
        # If user is a program director, show assignments for cohorts they manage
        if hasattr(user, 'is_staff') and user.is_staff:
            return queryset
        
        # If user is a mentor, show only their assignments
        if hasattr(user, 'cohort_mentor_assignments'):
            return queryset.filter(mentor=user)
        
        # If user is a program director, filter by managed cohorts
        managed_cohorts = Cohort.objects.filter(
            track__director=user
        ).values_list('id', flat=True)
        
        return queryset.filter(cohort_id__in=managed_cohorts)
    
    def get_object(self):
        """Get object using base queryset for destroy/update operations."""
        # For destroy/update operations, use base queryset to find the object
        # Then check permissions in perform_destroy/perform_update
        if self.action in ['destroy', 'update', 'partial_update']:
            queryset = MentorAssignment.objects.select_related('mentor', 'cohort').all()
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
            try:
                obj = queryset.get(**filter_kwargs)
                return obj
            except MentorAssignment.DoesNotExist:
                from rest_framework.exceptions import NotFound
                raise NotFound("MentorAssignment not found")
        
        # For other operations, use filtered queryset
        return super().get_object()
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only program directors can modify assignments
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Create mentor assignment with permission check."""
        cohort = serializer.validated_data['cohort']
        
        # Check if user can manage this cohort
        # Allow if user is staff/admin or if they are the director of the cohort's track
        if not (self.request.user.is_staff or DirectorService.can_manage_cohort(self.request.user, cohort)):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to manage this cohort")
        
        serializer.save()
    
    def perform_update(self, serializer):
        """Update mentor assignment with permission check."""
        cohort = serializer.instance.cohort
        
        # Check if user can manage this cohort
        # Allow if user is staff/admin or if they are the director of the cohort's track
        if not (self.request.user.is_staff or DirectorService.can_manage_cohort(self.request.user, cohort)):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to manage this cohort")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete mentor assignment with permission check."""
        cohort = instance.cohort
        
        # Check if user can manage this cohort
        # Allow if user is staff/admin or if they are the director of the cohort's track
        if not (self.request.user.is_staff or DirectorService.can_manage_cohort(self.request.user, cohort)):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to manage this cohort")
        
        # Soft delete by setting active=False
        instance.active = False
        instance.save()
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, id=None):
        """Deactivate a mentor assignment (soft delete)."""
        assignment = self.get_object()
        cohort = assignment.cohort
        
        # Allow if user is staff/admin or if they are the director of the cohort's track
        if not (request.user.is_staff or DirectorService.can_manage_cohort(request.user, cohort)):
            return Response(
                {'error': 'You do not have permission to manage this cohort'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        assignment.active = False
        assignment.save()
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, id=None):
        """Reactivate a mentor assignment."""
        assignment = self.get_object()
        cohort = assignment.cohort
        
        # Allow if user is staff/admin or if they are the director of the cohort's track
        if not (request.user.is_staff or DirectorService.can_manage_cohort(request.user, cohort)):
            return Response(
<<<<<<< HEAD
                {'error': 'You do not have permission to manage this cohort'},
=======
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
                status=status.HTTP_403_FORBIDDEN
            )
        
        assignment.active = True
        assignment.save()
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data)

