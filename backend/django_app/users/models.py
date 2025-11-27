"""
User models for the Ongoza CyberHub platform.
Comprehensive identity, authentication, and authorization system.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid


class User(AbstractUser):
    """
    Enhanced User model with ABAC attributes and account lifecycle management.
    """
    # Override email to make it unique and indexed (AbstractUser has email but not unique by default)
    email = models.EmailField(unique=True, db_index=True)
    
    # Account lifecycle
    ACCOUNT_STATUS_CHOICES = [
        ('pending_verification', 'Pending Verification'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('deactivated', 'Deactivated'),
        ('erased', 'Erased'),
    ]
    account_status = models.CharField(
        max_length=20,
        choices=ACCOUNT_STATUS_CHOICES,
        default='pending_verification'
    )
    email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    erased_at = models.DateTimeField(null=True, blank=True)
    
    # ABAC Attributes
    cohort_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    track_key = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    org_id = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_members',
        db_index=True
    )
    country = models.CharField(max_length=2, null=True, blank=True)  # ISO 3166-1 alpha-2
    timezone = models.CharField(max_length=50, default='UTC')
    language = models.CharField(max_length=10, default='en')  # ISO 639-1 language code
    
    # Risk and security
    RISK_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    risk_level = models.CharField(
        max_length=20,
        choices=RISK_LEVEL_CHOICES,
        default='low'
    )
    mfa_enabled = models.BooleanField(default=False)
    mfa_method = models.CharField(
        max_length=20,
        choices=[('totp', 'TOTP'), ('sms', 'SMS'), ('email', 'Email')],
        null=True,
        blank=True
    )
    password_changed_at = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Profile fields
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
        )]
    )
    
    # Mentee onboarding fields (for TalentScope baseline)
    LEARNING_STYLE_CHOICES = [
        ('visual', 'Visual'),
        ('auditory', 'Auditory'),
        ('kinesthetic', 'Kinesthetic'),
        ('reading', 'Reading/Writing'),
        ('mixed', 'Mixed'),
    ]
    preferred_learning_style = models.CharField(
        max_length=20,
        choices=LEARNING_STYLE_CHOICES,
        blank=True,
        null=True,
        help_text='Preferred learning style for TalentScope calculations'
    )
    career_goals = models.TextField(
        blank=True,
        null=True,
        help_text='Career goals and aspirations for TalentScope baseline'
    )
    CYBER_EXPOSURE_CHOICES = [
        ('none', 'No Experience'),
        ('beginner', 'Beginner (Some Awareness)'),
        ('intermediate', 'Intermediate (Some Training)'),
        ('advanced', 'Advanced (Professional Experience)'),
    ]
    cyber_exposure_level = models.CharField(
        max_length=20,
        choices=CYBER_EXPOSURE_CHOICES,
        blank=True,
        null=True,
        help_text='Current cyber security exposure level for TalentScope baseline'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['cohort_id']),
            models.Index(fields=['track_key']),
            models.Index(fields=['org_id']),
            models.Index(fields=['account_status']),
            models.Index(fields=['email_verified']),
            models.Index(fields=['mfa_enabled']),
        ]
    
    def __str__(self):
        return self.email
    
    def activate(self):
        """Activate user account."""
        self.account_status = 'active'
        self.is_active = True
        if not self.activated_at:
            self.activated_at = timezone.now()
        self.save()
    
    def deactivate(self):
        """Deactivate user account."""
        self.account_status = 'deactivated'
        self.is_active = False
        self.deactivated_at = timezone.now()
        self.save()
    
    def erase(self):
        """Erase user data (GDPR compliance)."""
        self.account_status = 'erased'
        self.is_active = False
        self.erased_at = timezone.now()
        # Anonymize PII
        self.email = f"erased_{uuid.uuid4()}@erased.local"
        self.username = f"erased_{uuid.uuid4()}"
        self.first_name = "Erased"
        self.last_name = "User"
        self.bio = None
        self.phone_number = None
        self.save()


class Role(models.Model):
    """
    RBAC Role model for global/base roles.
    """
    ROLE_TYPES = [
        ('admin', 'Admin'),
        ('program_director', 'Program Director'),
        ('mentor', 'Mentor'),
        ('mentee', 'Mentee'),
        ('student', 'Student'),
        ('finance', 'Finance'),
        ('sponsor_admin', 'Sponsor/Employer Admin'),
        ('analyst', 'Analyst'),
    ]
    
    name = models.CharField(max_length=50, choices=ROLE_TYPES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_system_role = models.BooleanField(default=True)  # Cannot be deleted
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Permissions (many-to-many relationship)
    permissions = models.ManyToManyField(
        'Permission',
        related_name='roles',
        blank=True
    )
    
    class Meta:
        db_table = 'roles'
        ordering = ['name']
    
    def __str__(self):
        return self.display_name


class Permission(models.Model):
    """
    Permission model for fine-grained access control.
    """
    RESOURCE_TYPES = [
        ('user', 'User'),
        ('organization', 'Organization'),
        ('cohort', 'Cohort'),
        ('track', 'Track'),
        ('portfolio', 'Portfolio'),
        ('profiling', 'Profiling'),
        ('mentorship', 'Mentorship'),
        ('analytics', 'Analytics'),
        ('billing', 'Billing'),
        ('invoice', 'Invoice'),
        ('api_key', 'API Key'),
        ('webhook', 'Webhook'),
    ]
    
    ACTION_TYPES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('list', 'List'),
        ('manage', 'Manage'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPES)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'permissions'
        unique_together = ['resource_type', 'action']
        ordering = ['resource_type', 'action']
    
    def __str__(self):
        return f"{self.action}_{self.resource_type}"


class UserRole(models.Model):
    """
    User-Role assignment with context (cohort, track, org).
    Supports scope-based role assignments per specification.
    """
    SCOPE_CHOICES = [
        ('global', 'Global'),
        ('org', 'Organization'),
        ('cohort', 'Cohort'),
        ('track', 'Track'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_roles')
    
    # Scope for ABAC (per specification)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='global')
    scope_ref = models.UUIDField(null=True, blank=True, db_index=True)  # Reference to org/cohort/track UUID
    
    # Legacy fields (for backward compatibility)
    cohort_id = models.CharField(max_length=100, null=True, blank=True)
    track_key = models.CharField(max_length=100, null=True, blank=True)
    org_id = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='role_assignments'
    )
    
    # Assignment metadata
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='role_assignments_made'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_roles'
        unique_together = [
            ['user', 'role', 'scope', 'scope_ref'],
            ['user', 'role', 'cohort_id', 'track_key', 'org_id'],  # Legacy compatibility
        ]
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['scope', 'scope_ref']),
            models.Index(fields=['cohort_id']),
            models.Index(fields=['track_key']),
            models.Index(fields=['org_id']),
        ]
    
    def __str__(self):
        context = []
        if self.scope != 'global':
            context.append(f"{self.scope}:{self.scope_ref}")
        if self.cohort_id:
            context.append(f"cohort:{self.cohort_id}")
        if self.track_key:
            context.append(f"track:{self.track_key}")
        if self.org_id:
            context.append(f"org:{self.org_id.id}")
        context_str = f" ({', '.join(context)})" if context else ""
        return f"{self.user.email} - {self.role.display_name}{context_str}"


class ConsentScope(models.Model):
    """
    Consent scopes for privacy compliance (GDPR/DPA).
    """
    SCOPE_TYPES = [
        ('share_with_mentor', 'Share with Mentor'),
        ('share_with_sponsor', 'Share with Sponsor'),
        ('analytics', 'Analytics'),
        ('marketing', 'Marketing'),
        ('research', 'Research'),
        ('public_portfolio', 'Public Portfolio'),
        ('employer_share', 'Employer Share'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consent_scopes')
    scope_type = models.CharField(max_length=50, choices=SCOPE_TYPES)
    granted = models.BooleanField(default=False)
    granted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'consent_scopes'
        unique_together = ['user', 'scope_type']
        indexes = [
            models.Index(fields=['user', 'granted']),
        ]
    
    def __str__(self):
        status = "Granted" if self.granted else "Revoked"
        return f"{self.user.email} - {self.scope_type} ({status})"


class Entitlement(models.Model):
    """
    Entitlements for feature access control.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='entitlements')
    feature = models.CharField(max_length=100, db_index=True)
    granted = models.BooleanField(default=True)
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'entitlements'
        unique_together = ['user', 'feature']
        indexes = [
            models.Index(fields=['user', 'granted']),
            models.Index(fields=['feature']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.feature}"
