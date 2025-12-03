"""
Profiler Engine models - Future-You persona generation and track recommendation.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User


class ProfilerSession(models.Model):
    """Profiler session for user assessment."""
    STATUS_CHOICES = [
        ('started', 'Started'),
        ('current_self_complete', 'Current Self Complete'),
        ('future_you_complete', 'Future You Complete'),
        ('finished', 'Finished'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='profiler_sessions',
        db_index=True
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='started',
        db_index=True
    )
    current_self_assessment = models.JSONField(
        default=dict,
        blank=True,
        help_text='{skills: {...}, behaviors: {...}, learning_style: {...}}'
    )
    futureyou_persona = models.JSONField(
        default=dict,
        blank=True,
        help_text='{name: "Cyber Sentinel", archetype: "Defender", skills: [...]}'
    )
    recommended_track_id = models.UUIDField(null=True, blank=True, db_index=True)
    track_confidence = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        help_text='Confidence score 0.0-1.0'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'profilersessions'
        indexes = [
            models.Index(fields=['user', 'status']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'status'],
                condition=models.Q(status='started'),
                name='unique_active_session'
            )
        ]
    
    def __str__(self):
        return f"Profiler Session: {self.user.email} - {self.status}"


class ProfilerAnswer(models.Model):
    """Individual answers in profiler session."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ProfilerSession,
        on_delete=models.CASCADE,
        related_name='answers',
        db_index=True
    )
    question_key = models.CharField(
        max_length=255,
        db_index=True,
        help_text='e.g., "skills.networking", "behaviors.discipline"'
    )
    answer = models.JSONField(
        help_text='{value: 7, comment: "Experienced with Wireshark"}'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'profileranswers'
        indexes = [
            models.Index(fields=['session', 'question_key']),
        ]
    
    def __str__(self):
        return f"Answer: {self.question_key} = {self.answer}"
