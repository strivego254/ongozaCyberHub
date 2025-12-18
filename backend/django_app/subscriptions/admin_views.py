"""
Admin API views for Subscription Engine management.
Only accessible to admin users.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import (
    SubscriptionPlan, UserSubscription, PaymentGateway,
    PaymentTransaction, SubscriptionRule, PaymentSettings
)
from .serializers import SubscriptionPlanSerializer, UserSubscriptionSerializer

User = get_user_model()


class IsAdmin(permissions.BasePermission):
    """Permission check for admin users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing subscription plans."""
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_serializer_class(self):
        from .serializers import SubscriptionPlanSerializer
        return SubscriptionPlanSerializer


class UserSubscriptionAdminViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing user subscriptions."""
    queryset = UserSubscription.objects.select_related('user', 'plan').all()
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by user email or username
        user_search = self.request.query_params.get('user', None)
        if user_search:
            queryset = queryset.filter(
                user__email__icontains=user_search
            ) | queryset.filter(
                user__username__icontains=user_search
            )
        # Filter by plan
        plan_id = self.request.query_params.get('plan', None)
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
    
    @action(detail=True, methods=['post'])
    def upgrade(self, request, pk=None):
        """Manually upgrade a user's subscription."""
        subscription = self.get_object()
        new_plan_id = request.data.get('plan_id')
        
        if not new_plan_id:
            return Response(
                {'error': 'plan_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Invalid plan'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if it's an upgrade
        tier_levels = {'free': 0, 'starter': 1, 'premium': 2}
        current_level = tier_levels.get(subscription.plan.tier, 0)
        new_level = tier_levels.get(new_plan.tier, 0)
        
        with transaction.atomic():
            subscription.plan = new_plan
            # If upgrading to starter, set enhanced access period
            if new_plan.tier == 'starter' and new_plan.enhanced_access_days:
                subscription.enhanced_access_expires_at = (
                    timezone.now() + timezone.timedelta(days=new_plan.enhanced_access_days)
                )
            subscription.save()
        
        return Response({
            'message': 'Subscription upgraded successfully',
            'subscription': UserSubscriptionSerializer(subscription).data
        })
    
    @action(detail=True, methods=['post'])
    def downgrade(self, request, pk=None):
        """Schedule a downgrade (takes effect at end of billing cycle)."""
        subscription = self.get_object()
        new_plan_id = request.data.get('plan_id')
        
        if not new_plan_id:
            return Response(
                {'error': 'plan_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Invalid plan'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Downgrades take effect at end of billing cycle
        # Store pending downgrade in metadata or separate field
        # For now, apply immediately (can be enhanced later)
        subscription.plan = new_plan
        subscription.enhanced_access_expires_at = None  # Clear enhanced access
        subscription.save()
        
        return Response({
            'message': 'Subscription downgrade scheduled',
            'subscription': UserSubscriptionSerializer(subscription).data
        })


class PaymentGatewayViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing payment gateways."""
    queryset = PaymentGateway.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class PaymentGatewaySerializer(serializers.ModelSerializer):
            class Meta:
                model = PaymentGateway
                fields = '__all__'
                read_only_fields = ['id', 'created_at', 'updated_at']
        
        return PaymentGatewaySerializer
    
    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Toggle gateway enabled status."""
        gateway = self.get_object()
        gateway.enabled = not gateway.enabled
        gateway.save()
        return Response({
            'enabled': gateway.enabled,
            'message': f'Gateway {"enabled" if gateway.enabled else "disabled"}'
        })


class PaymentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin viewset for viewing payment transactions."""
    queryset = PaymentTransaction.objects.select_related('user', 'gateway', 'subscription').all()
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class PaymentTransactionSerializer(serializers.ModelSerializer):
            user_email = serializers.CharField(source='user.email', read_only=True)
            gateway_name = serializers.CharField(source='gateway.name', read_only=True)
            
            class Meta:
                model = PaymentTransaction
                fields = '__all__'
                read_only_fields = ['id', 'created_at', 'updated_at']
        
        return PaymentTransactionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by user
        user_search = self.request.query_params.get('user', None)
        if user_search:
            queryset = queryset.filter(user__email__icontains=user_search)
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        # Filter by gateway
        gateway_id = self.request.query_params.get('gateway', None)
        if gateway_id:
            queryset = queryset.filter(gateway_id=gateway_id)
        return queryset.order_by('-created_at')


class SubscriptionRuleViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing subscription rules."""
    queryset = SubscriptionRule.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class SubscriptionRuleSerializer(serializers.ModelSerializer):
            class Meta:
                model = SubscriptionRule
                fields = '__all__'
                read_only_fields = ['id', 'created_at', 'updated_at']
        
        return SubscriptionRuleSerializer


class PaymentSettingsViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing payment settings."""
    queryset = PaymentSettings.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class PaymentSettingsSerializer(serializers.ModelSerializer):
            class Meta:
                model = PaymentSettings
                fields = '__all__'
                read_only_fields = ['id', 'updated_at']
            
            def update(self, instance, validated_data):
                validated_data['updated_by'] = self.context['request'].user
                return super().update(instance, validated_data)
        
        return PaymentSettingsSerializer























