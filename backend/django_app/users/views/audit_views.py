"""
Audit log views for compliance and security monitoring.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from users.audit_models import AuditLog
from users.serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/audit-logs
    List audit logs (admin only).
    """
    queryset = AuditLog.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuditLogSerializer
    
    def get_queryset(self):
        """Filter audit logs based on user permissions."""
        user = self.request.user
        
        # Admins can see all logs
        if user.is_staff or user.is_superuser:
            queryset = AuditLog.objects.all()
        else:
            # Users can only see their own audit logs
            queryset = AuditLog.objects.filter(user=user)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        # Filter by action
        action_filter = self.request.query_params.get('action')
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        
        # Filter by resource type
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        # Filter by result
        result = self.request.query_params.get('result')
        if result:
            queryset = queryset.filter(result=result)
        
        return queryset.order_by('-timestamp')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get audit log statistics."""
        queryset = self.get_queryset()
        
        total = queryset.count()
        success = queryset.filter(result='success').count()
        failure = queryset.filter(result='failure').count()
        
        # Group by action
        action_counts = {}
        for log in queryset.values('action').distinct():
            action = log['action']
            action_counts[action] = queryset.filter(action=action).count()
        
        return Response({
            'total': total,
            'success': success,
            'failure': failure,
            'action_counts': action_counts,
        })

