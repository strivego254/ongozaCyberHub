"""
Missions MXP models - Mission submissions with AI and mentor review.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User


class Mission(models.Model):
    """Mission template."""
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('capstone', 'Capstone'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        db_index=True
    )
    track_id = models.UUIDField(null=True, blank=True, db_index=True)
    est_hours = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text='Estimated hours to complete'
    )
    competencies = models.JSONField(
        default=list,
        blank=True,
        help_text='["networking", "dfir", "python"]'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'missions'
        indexes = [
            models.Index(fields=['difficulty', 'track_id']),
        ]
    
    def __str__(self):
        return f"Mission: {self.title} ({self.difficulty})"


class MissionSubmission(models.Model):
    """User submission for a mission."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('ai_reviewed', 'AI Reviewed'),
        ('mentor_review', 'Mentor Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name='submissions',
        db_index=True
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mission_submissions',
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True
    )
    ai_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='AI review score 0-100'
    )
    ai_feedback = models.TextField(blank=True)
    mentor_feedback = models.TextField(
        blank=True,
        help_text='Premium tier only'
    )
    notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'missionsubmissions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['mission', 'status']),
        ]
    
    def __str__(self):
        return f"Submission: {self.mission.title} by {self.user.email} ({self.status})"


class MissionFile(models.Model):
    """File attachment for mission submission."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(
        MissionSubmission,
        on_delete=models.CASCADE,
        related_name='files',
        db_index=True
    )
    filename = models.CharField(max_length=255)
    file_url = models.URLField(max_length=500, help_text='S3 signed URL or local path')
    content_type = models.CharField(max_length=100, blank=True)
    size_bytes = models.BigIntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'missionfiles'
        indexes = [
            models.Index(fields=['submission', 'uploaded_at']),
        ]
    
    def __str__(self):
        return f"File: {self.filename} ({self.submission.mission.title})"
