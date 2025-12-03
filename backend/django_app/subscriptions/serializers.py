"""
Serializers for Subscription Engine.
"""
from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans."""
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price_monthly', 'features', 'max_missions_monthly', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for user subscriptions."""
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.UUIDField(write_only=True, required=False)
    days_enhanced_left = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = UserSubscription
        fields = [
            'id', 'plan', 'plan_id', 'status', 'current_period_start',
            'current_period_end', 'enhanced_access_expires_at',
            'days_enhanced_left', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubscriptionStatusSerializer(serializers.Serializer):
    """Serializer for subscription status response."""
    tier = serializers.CharField()
    days_enhanced_left = serializers.IntegerField(required=False, allow_null=True)
    can_upgrade = serializers.BooleanField()
    features = serializers.ListField(child=serializers.CharField())
    next_payment = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.CharField()


class UpgradeSubscriptionSerializer(serializers.Serializer):
    """Serializer for upgrading subscription."""
    plan = serializers.CharField(required=True)
    stripe_session_id = serializers.CharField(required=False, allow_null=True)

