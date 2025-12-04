"""
Mentorship Coordination Engine Models.
Connects 1K mentors to 10K mentees with work queues, sessions, and risk signals.
"""
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class MenteeMentorAssignment(models.Model):
    """Mentor-Mentee assignment relationship."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentee_assignments',
        db_index=True
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_assignments',
        db_index=True
    )
    cohort_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    assigned_at = models.DateTimeField(default=timezone.now)
    max_sessions = models.IntegerField(default=12)
    sessions_used = models.IntegerField(default=0)
    mentor_notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'menteementorassignments'
        unique_together = [['mentee', 'mentor']]
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['mentor', 'status']),
        ]
    
    def __str__(self):
        return f"{self.mentee.email} ← {self.mentor.email} ({self.status})"


class MentorSession(models.Model):
    """Mentor-mentee session scheduling."""
    TYPE_CHOICES = [
        ('one_on_one', 'One-on-One'),
        ('group', 'Group'),
        ('capstone_review', 'Capstone Review'),
        ('goal_review', 'Goal Review'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(
        MenteeMentorAssignment,
        on_delete=models.CASCADE,
        related_name='sessions',
        db_index=True
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentee_sessions',
        db_index=True
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_sessions',
        db_index=True
    )
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField(db_index=True)
    zoom_url = models.URLField(blank=True)
    calendar_event_id = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    outcomes = models.JSONField(default=dict, blank=True)  # {"action_items": [], "new_goals": []}
    attended = models.BooleanField(default=False)
    no_show_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mentorsessions'
        indexes = [
            models.Index(fields=['mentor', 'start_time']),
            models.Index(fields=['mentee', 'start_time']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.mentee.email} ({self.start_time})"


class MentorWorkQueue(models.Model):
    """Mentor work queue for reviews, feedback, and tasks."""
    TYPE_CHOICES = [
        ('mission_review', 'Mission Review'),
        ('goal_feedback', 'Goal Feedback'),
        ('session_notes', 'Session Notes'),
        ('risk_flag', 'Risk Flag'),
    ]
    
    PRIORITY_CHOICES = [
        ('urgent', 'Urgent'),
        ('high', 'High'),
        ('normal', 'Normal'),
        ('low', 'Low'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='work_queue_items',
        db_index=True
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_work_items',
        db_index=True
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    reference_id = models.UUIDField(null=True, blank=True)  # mission_id, goal_id, etc
    sla_hours = models.IntegerField(default=48)  # Service Level Agreement
    due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mentorworkqueue'
        indexes = [
            models.Index(fields=['mentor', 'status']),
            models.Index(fields=['due_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.mentee.email} ({self.status})"


class MentorFlag(models.Model):
    """Risk signals and flags for mentees."""
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='raised_flags',
        db_index=True
    )
    mentee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='risk_flags',
        db_index=True
    )
    reason = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    director_notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mentorflags'
        indexes = [
            models.Index(fields=['mentee']),
            models.Index(fields=['mentor']),
            models.Index(fields=['resolved']),
        ]
    
    def __str__(self):
        return f"{self.mentee.email} - {self.reason[:50]} ({self.severity})"
