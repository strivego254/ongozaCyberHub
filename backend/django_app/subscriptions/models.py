"""
Subscription Engine models - Tier management and Stripe integration.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from users.models import User


class SubscriptionPlan(models.Model):
    """Subscription plan definition."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text='e.g., "starter_enhanced", "premium"'
    )
    price_monthly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    features = models.JSONField(
        default=list,
        blank=True,
        help_text='["ai_full", "mentor_access", "unlimited_missions"]'
    )
    max_missions_monthly = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='NULL = unlimited'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subscription_plans'
    
    def __str__(self):
        return f"Plan: {self.name}"


class UserSubscription(models.Model):
    """User subscription record."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('trial', 'Trial'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='subscription',
        db_index=True
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='user_subscriptions',
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='trial',
        db_index=True
    )
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    enhanced_access_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text='180 days for starter_enhanced'
    )
    stripe_subscription_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_subscriptions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'current_period_end']),
        ]
    
    def __str__(self):
        return f"Subscription: {self.user.email} - {self.plan.name} ({self.status})"
    
    @property
    def days_enhanced_left(self):
        """Calculate days remaining for enhanced access."""
        if not self.enhanced_access_expires_at:
            return None
        delta = self.enhanced_access_expires_at - timezone.now()
        return max(0, delta.days)
