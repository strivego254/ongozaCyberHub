"""
Coaching OS models - Complete behavioral transformation engine.
Habits, Goals, Reflections, AI Coach sessions with full platform integration.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.db.models import Q
from users.models import User


class Habit(models.Model):
    """User habit for daily/weekly practice."""
    TYPE_CHOICES = [
        ('core', 'Core'),
        ('custom', 'Custom'),
    ]
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_habits',
        db_index=True
    )
    name = models.CharField(max_length=255, help_text='"Learn", "Practice", "Reflect", or custom')
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='custom',
        db_index=True
    )
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='daily',
        help_text='Daily or weekly frequency'
    )
    streak = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Current streak days'
    )
    longest_streak = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Longest streak achieved'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'coaching_habits'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Habit: {self.name} ({self.user.email})"


class HabitLog(models.Model):
    """Log entry for habit completion."""
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
        ('missed', 'Missed'),
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
        related_name='coaching_habit_logs',
        db_index=True
    )
    date = models.DateField(db_index=True, help_text='YYYY-MM-DD')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='completed'
    )
    notes = models.TextField(blank=True, null=True)
    logged_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'coaching_habit_logs'
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['habit', 'date']),
            models.Index(fields=['user', 'date', 'status']),
        ]
        unique_together = [['habit', 'date']]
    
    def __str__(self):
        return f"Log: {self.habit.name} - {self.date} ({self.status})"


class Goal(models.Model):
    """User goal (daily/weekly/monthly) with mentor feedback."""
    TYPE_CHOICES = [
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
        related_name='coaching_goals',
        db_index=True
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        db_index=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Progress percentage 0-100'
    )
    target = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Target value for progress calculation'
    )
    current = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Current value toward target'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True
    )
    mentor_feedback = models.TextField(
        blank=True,
        null=True,
        help_text='Mentor feedback (7-tier only)'
    )
    subscription_tier = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Subscription tier when goal was created'
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'coaching_goals'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'due_date']),
        ]
    
    def __str__(self):
        return f"Goal: {self.title} ({self.user.email})"


class Reflection(models.Model):
    """User reflection with AI sentiment analysis and insights."""
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coaching_reflections',
        db_index=True
    )
    date = models.DateField(db_index=True, help_text='YYYY-MM-DD')
    content = models.TextField()
    sentiment = models.CharField(
        max_length=20,
        choices=SENTIMENT_CHOICES,
        null=True,
        blank=True,
        help_text='User-selected or AI-computed sentiment'
    )
    emotion_tags = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of emotion tags: ["overwhelmed", "confident"]'
    )
    ai_insights = models.TextField(
        blank=True,
        null=True,
        help_text='AI-generated insights'
    )
    word_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Word count for analytics'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'coaching_reflections'
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['sentiment']),
        ]
        unique_together = [['user', 'date']]
    
    def __str__(self):
        return f"Reflection: {self.user.email} - {self.date}"


class AICoachSession(models.Model):
    """AI Coach conversation session."""
    SESSION_TYPE_CHOICES = [
        ('habit', 'Habit'),
        ('goal', 'Goal'),
        ('reflection', 'Reflection'),
        ('mission', 'Mission'),
        ('general', 'General'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ai_coach_sessions',
        db_index=True
    )
    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPE_CHOICES,
        default='general',
        db_index=True
    )
    prompt_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Number of prompts in this session'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_coach_sessions'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['user', 'session_type']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"AI Coach Session: {self.user.email} - {self.session_type}"


class AICoachMessage(models.Model):
    """Individual message in AI Coach conversation."""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        AICoachSession,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        db_index=True
    )
    content = models.TextField()
    context = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='Context: habit_help, goal_revision, etc.'
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional context (habit_id, goal_id, etc.)'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'ai_coach_messages'
        indexes = [
            models.Index(fields=['session', 'created_at']),
            models.Index(fields=['role']),
        ]
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message: {self.role} - {self.session.user.email}"
