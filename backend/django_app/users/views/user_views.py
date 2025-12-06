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
        Filter users based on permissions.
        """
        user = self.request.user
        # Admin can see all users
        if user.is_staff:
            return User.objects.all()
        # Others can only see themselves
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get current user profile.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        POST /api/v1/users/change_password/
        Change password for authenticated user.
        """
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response(
                {'detail': 'Both old_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify old password
        if not user.check_password(old_password):
            AuditLog.objects.create(
                user=user,
                actor_type='user',
                actor_identifier=user.email,
                action='password_change',
                resource_type='user',
                result='failure',
                timestamp=timezone.now(),
                metadata={'reason': 'Invalid old password'}
            )
            return Response(
                {'detail': 'Invalid old password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password
        from django.contrib.auth.password_validation import validate_password
        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.password_changed_at = timezone.now()
        user.save()
        
        # Log success
        AuditLog.objects.create(
            user=user,
            actor_type='user',
            actor_identifier=user.email,
            action='password_change',
            resource_type='user',
            result='success',
            timestamp=timezone.now(),
        )
        
        return Response(
            {'detail': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def upload_avatar(self, request):
        """
        POST /api/v1/users/upload_avatar/
        Upload profile picture for authenticated user.
        """
        user = request.user
        
        if 'avatar' not in request.FILES:
            return Response(
                {'detail': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_file = request.FILES['avatar']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            return Response(
                {'detail': 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response(
                {'detail': 'File size exceeds 5MB limit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate unique filename
        file_ext = os.path.splitext(avatar_file.name)[1]
        filename = f'avatars/{user.id}/{uuid.uuid4()}{file_ext}'
        
        # Save file
        try:
            file_path = default_storage.save(filename, ContentFile(avatar_file.read()))
            avatar_url = f"{settings.MEDIA_URL}{file_path}"
            
            # Update user avatar_url
            user.avatar_url = avatar_url
            user.save()
            
            # Log update
            AuditLog.objects.create(
                user=user,
                actor_type='user',
                actor_identifier=user.email,
                action='update',
                resource_type='user',
                resource_id=str(user.id),
                result='success',
                timestamp=timezone.now(),
                changes={'avatar_url': {'old': user.avatar_url or 'None', 'new': avatar_url}}
            )
            
            return Response(
                {
                    'detail': 'Avatar uploaded successfully',
                    'avatar_url': avatar_url
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'detail': f'Failed to upload avatar: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


