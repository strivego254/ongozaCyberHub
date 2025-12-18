"""
User views for DRF - User management endpoints.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.db import models
from django.db.models import Q
import os
import uuid
from ..serializers import UserSerializer, UserCreateSerializer
from ..audit_models import AuditLog

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User model.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """
        Filter users based on permissions and optional role filter.
        """
        user = self.request.user
        queryset = None
        
        # Admin can see all users
        if user.is_staff:
            queryset = User.objects.all()
        else:
            # Program directors can see all users (for mentor assignment, etc.)
            from ..models import Role, UserRole
            director_roles = Role.objects.filter(name__in=['program_director', 'admin'])
            has_director_role = UserRole.objects.filter(
                user=user,
                role__in=director_roles,
                is_active=True
            ).exists()
            
            if has_director_role:
                queryset = User.objects.all()
            else:
                # Others can only see themselves
                queryset = User.objects.filter(id=user.id)
        
        # Filter by role if requested
        role_filter = self.request.query_params.get('role')
        if role_filter and queryset:
            from ..models import Role, UserRole
            try:
                role = Role.objects.get(name=role_filter)
                user_ids_with_role = UserRole.objects.filter(
                    role=role,
                    is_active=True
                ).values_list('user_id', flat=True)
                queryset = queryset.filter(id__in=user_ids_with_role)
            except Role.DoesNotExist:
                # If role doesn't exist, return empty queryset
                queryset = queryset.none()
        
        # Filter by search query if provided
        search_query = self.request.query_params.get('search')
        if search_query and queryset:
            queryset = queryset.filter(
                Q(email__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(username__icontains=search_query)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get current user profile.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    