"""
Student Dashboard models for OCH Cyber Talent Engine.
Aggregates data from 12+ microservices into a performant cache layer.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User


class StudentDashboardCache(models.Model):
    """
    Denormalized cache table for student dashboard data.
    Aggregates data from 12+ microservices for sub-100ms response times.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='dashboard_cache',
        primary_key=True
    )
    
    # TalentScope Readiness
    readiness_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Readiness score 0-100 from TalentScope'
    )
    time_to_ready_days = models.IntegerField(
        default=365,
        validators=[MinValueValidator(0)],
        help_text='Estimated days to employability'
    )
    skill_heatmap = models.JSONField(
        default=dict,
        blank=True,
        help_text='Skill scores: {networking: 45, cloud: 22, ...}'
    )
    top_3_gaps = models.JSONField(
        default=list,
        blank=True,
        help_text='Top 3 skill gaps: ["DFIR", "Python", "AWS"]'
    )
    
    # Coaching OS Summary
    habit_streak_current = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    habit_completion_week = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Habit completion percentage for current week'
    )
    goals_active_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    goals_completed_week = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Missions Status
    missions_in_progress = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    missions_in_review = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    missions_completed_total = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    next_mission_recommended = models.JSONField(
        default=dict,
        blank=True,
        help_text='{id, title, difficulty, est_hours}'
    )
    
    # Portfolio Health
    portfolio_health_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Portfolio health score 0-100'
    )
    portfolio_items_total = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    portfolio_items_approved = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    public_profile_enabled = models.BooleanField(default=False)
    public_profile_slug = models.CharField(max_length=255, blank=True, null=True)
    
    # Cohort/Calendar
    cohort_id = models.UUIDField(null=True, blank=True, db_index=True)
    cohort_name = models.CharField(max_length=255, blank=True)
    mentor_name = models.CharField(max_length=255, blank=True)
    next_cohort_event = models.JSONField(
        default=dict,
        blank=True,
        help_text='{title, date, type: "mentorship|submission"}'
    )
    cohort_completion_pct = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Community/Leaderboard
    leaderboard_rank_global = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    leaderboard_rank_cohort = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    
    # Notifications
    notifications_unread = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    notifications_urgent = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Curriculum Progress
    curriculum_progress_pct = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    next_module_title = models.CharField(max_length=255, blank=True)
    
    # AI Coach
    ai_coach_nudge = models.TextField(blank=True)
    ai_action_plan = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of prioritized actions'
    )
    
    # Subscription
    days_to_renewal = models.IntegerField(null=True, blank=True)
    can_upgrade_to_premium = models.BooleanField(default=False)
    
    # Real-time Flags
    needs_mentor_feedback = models.BooleanField(default=False)
    payment_overdue = models.BooleanField(default=False)
    profile_incomplete = models.BooleanField(default=True)
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    last_active_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'student_dashboard_cache'
        indexes = [
            models.Index(fields=['user', 'updated_at']),
            models.Index(fields=['cohort_id']),
            models.Index(fields=['leaderboard_rank_global']),
        ]
    
    def __str__(self):
        return f"Dashboard Cache: {self.user.email}"


class DashboardUpdateQueue(models.Model):
    """
    Queue for background dashboard refresh jobs.
    Prioritized by urgency and event type.
    """
    PRIORITY_CHOICES = [
        ('urgent', 'Urgent'),
        ('high', 'High'),
        ('normal', 'Normal'),
        ('low', 'Low'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='dashboard_updates',
        db_index=True
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal',
        db_index=True
    )
    reason = models.CharField(
        max_length=100,
        help_text='Event that triggered update: "mission_completed", "habit_logged", etc'
    )
    queued_at = models.DateTimeField(auto_now_add=True, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'dashboard_update_queue'
        indexes = [
            models.Index(fields=['user', 'priority']),
            models.Index(fields=['priority', 'queued_at']),
            models.Index(fields=['processed_at']),
        ]
        ordering = ['-priority', 'queued_at']
    
    def __str__(self):
        return f"Update Queue: {self.user.email} - {self.reason} ({self.priority})"
