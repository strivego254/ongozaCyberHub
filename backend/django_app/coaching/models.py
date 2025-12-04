"""
Coaching OS models - Habits, Goals, and Reflections.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.db.models import Q
from users.models import User


class Habit(models.Model):
    """User habit for daily/weekly practice."""
    CATEGORY_CHOICES = [
        ('learn', 'Learn'),
        ('practice', 'Practice'),
        ('reflect', 'Reflect'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='habits',
        db_index=True
    )
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    target_frequency = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Times per week'
    )
    streak_current = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    streak_longest = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    last_completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'habits'
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Habit: {self.name} ({self.user.email})"


class HabitLog(models.Model):
    """Log entry for habit completion."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name='logs',
        db_index=True
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='habit_logs',
        db_index=True
    )
    completed_at = models.DateTimeField(default=timezone.now, db_index=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'habitlogs'
        indexes = [
            models.Index(fields=['user', 'completed_at']),
            models.Index(fields=['habit', 'completed_at']),
        ]
        # Note: Unique constraint per day handled at application level
        # Database-level constraint would require date_trunc which is PostgreSQL-specific
    
    def __str__(self):
        return f"Log: {self.habit.name} - {self.completed_at.date()}"


class Goal(models.Model):
    """User goal (daily/weekly/monthly)."""
    TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='goals',
        db_index=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True
    )
    target_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    mentor_feedback = models.TextField(
        blank=True,
        help_text='Premium tier only'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'goals'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'target_date']),
        ]
    
    def __str__(self):
        return f"Goal: {self.title} ({self.user.email})"


class Reflection(models.Model):
    """User reflection with AI sentiment analysis."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reflections',
        db_index=True
    )
    prompt = models.TextField()
    response = models.TextField()
    sentiment_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(-0.5), MaxValueValidator(0.5)],
        help_text='AI computed -0.5 to +0.5'
    )
    behavior_tags = models.JSONField(
        default=list,
        blank=True,
        help_text='["discipline", "growth_mindset"]'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'reflections'
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Reflection: {self.user.email} - {self.created_at.date()}"
