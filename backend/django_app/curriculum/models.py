"""
Curriculum Engine models - Modules, Lessons, and Progress tracking.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from users.models import User


class CurriculumModule(models.Model):
    """Curriculum module within a track."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    track_key = models.CharField(max_length=50, db_index=True, help_text='Track key like "soc_analyst"')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_core = models.BooleanField(default=True, help_text='Core vs optional module')
    order_index = models.IntegerField(default=0, help_text='Order within track')
    estimated_time_minutes = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text='Estimated minutes to complete'
    )
    competencies = models.JSONField(
        default=list,
        blank=True,
        help_text='["SIEM", "Alerting", "IR"]'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'curriculummodules'
        indexes = [
            models.Index(fields=['track_key', 'order_index']),
            models.Index(fields=['track_key', 'is_core']),
        ]
        ordering = ['track_key', 'order_index']
    
    def __str__(self):
        return f"{self.title} ({self.track_key})"


class Lesson(models.Model):
    """Lesson within a curriculum module."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='lessons',
        db_index=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    content_url = models.URLField(blank=True, help_text='URL to lesson content')
    order_index = models.IntegerField(default=0, help_text='Order within module')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'lessons'
        indexes = [
            models.Index(fields=['module', 'order_index']),
        ]
        ordering = ['module', 'order_index']
    
    def __str__(self):
        return f"{self.title} ({self.module.title})"


class UserModuleProgress(models.Model):
    """User progress tracking for curriculum modules."""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='module_progress',
        db_index=True
    )
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='user_progress',
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        db_index=True
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_module_progress'
        unique_together = [['user', 'module']]
        indexes = [
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.module.title} ({self.status})"


class UserLessonProgress(models.Model):
    """User progress tracking for lessons."""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lesson_progress',
        db_index=True
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='user_progress',
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        db_index=True
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_lesson_progress'
        unique_together = [['user', 'lesson']]
        indexes = [
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.lesson.title} ({self.status})"

