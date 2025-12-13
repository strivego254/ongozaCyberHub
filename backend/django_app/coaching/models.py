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
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='habits',
        db_index=True
    )
    name = models.CharField(max_length=255)
    is_core = models.BooleanField(default=False, help_text='Learn/Practice/Reflect = True')
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='daily',
        help_text='Daily or weekly frequency'
    )
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
    STATUS_CHOICES = [
        ('done', 'Done'),
        ('skipped', 'Skipped'),
    ]
    
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
    log_date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='done'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'habitlogs'
        indexes = [
            models.Index(fields=['user', 'log_date']),
            models.Index(fields=['habit', 'log_date']),
        ]
        unique_together = [['habit', 'log_date']]
    
    def __str__(self):
        return f"Log: {self.habit.name} - {self.log_date}"


class Goal(models.Model):
    """User goal (daily/weekly/monthly)."""
    SCOPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='goals',
        db_index=True
    )
    title = models.CharField(max_length=255)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES)
    description = models.TextField(blank=True)
    target_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True
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
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reflections',
        db_index=True
    )
    content = models.TextField()
    ai_sentiment = models.CharField(
        max_length=20,
        choices=SENTIMENT_CHOICES,
        null=True,
        blank=True,
        help_text='AI computed sentiment'
    )
    ai_tags = models.JSONField(
        default=list,
        blank=True,
        help_text='["overwhelmed", "confident"]'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'reflections'
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Reflection: {self.user.email} - {self.created_at.date()}"
