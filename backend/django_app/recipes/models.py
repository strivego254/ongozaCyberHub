"""
Recipe Engine models - Micro-skill delivery system.
Provides short, actionable "how-to" learning units (15-30min).
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.indexes import GinIndex
from users.models import User


class Recipe(models.Model):
    """
    Recipe - A micro-skill learning unit (15-30min step-by-step procedure).
    Examples: "Write Sigma rule", "Parse logs with jq", "Setup ELK stack"
    """
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, db_index=True, help_text='e.g., "Write Basic Sigma Rule"')
    slug = models.SlugField(max_length=255, unique=True, db_index=True, help_text='URL-friendly identifier')
    summary = models.TextField(max_length=500, help_text='1-2 sentence overview')
    description = models.TextField(blank=True, help_text='Detailed "what this solves"')
    
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='beginner',
        db_index=True
    )
    estimated_minutes = models.IntegerField(
        validators=[MinValueValidator(5), MaxValueValidator(60)],
        help_text='Estimated completion time (5-60 minutes)'
    )
    
    # Arrays for filtering/searching
    track_codes = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of track codes like ["SOCDEFENSE", "DFIR"]'
    )
    skill_codes = models.JSONField(
        default=list,
        help_text='Array of skill codes like ["SIEM_RULE_WRITING", "LOG_ANALYSIS"]'
    )
    tools_used = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of tools like ["sigma", "jq", "awk"]'
    )
    prerequisites = models.JSONField(
        default=list,
        blank=True,
        help_text='Other recipes or knowledge prerequisites'
    )
    
    # Content structure (JSONB)
    content = models.JSONField(
        help_text='Structured steps with sections: intro, prerequisites, steps, validation'
    )
    validation_steps = models.JSONField(
        default=dict,
        blank=True,
        help_text='How to know you\'re done - validation criteria'
    )
    
    thumbnail_url = models.URLField(blank=True, max_length=500)
    mentor_curated = models.BooleanField(default=False, db_index=True)
    
    # Stats
    usage_count = models.IntegerField(default=0, db_index=True)
    avg_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_recipes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'recipes'
        verbose_name = 'Recipe'
        verbose_name_plural = 'Recipes'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'usage_count']),
            models.Index(fields=['difficulty', 'is_active']),
            GinIndex(fields=['track_codes']),
            GinIndex(fields=['skill_codes']),
            GinIndex(fields=['tools_used']),
        ]
        ordering = ['-usage_count', '-created_at']
    
    def __str__(self):
        return self.title


class UserRecipeProgress(models.Model):
    """
    User progress tracking for recipes.
    """
    STATUS_CHOICES = [
        ('started', 'Started'),
        ('completed', 'Completed'),
        ('bookmarked', 'Bookmarked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recipe_progress'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='user_progress'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='started',
        db_index=True
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='User rating 1-5'
    )
    notes = models.TextField(blank=True, help_text='Student feedback')
    time_spent_minutes = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_recipe_progress'
        verbose_name = 'User Recipe Progress'
        verbose_name_plural = 'User Recipe Progress'
        unique_together = [['user', 'recipe']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['recipe', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.recipe.title} ({self.status})"


class RecipeContextLink(models.Model):
    """
    Contextual links - Where recipes appear (missions, modules, projects, mentor sessions).
    """
    CONTEXT_TYPE_CHOICES = [
        ('mission', 'Mission'),
        ('module', 'Module'),
        ('project', 'Project'),
        ('mentor_session', 'Mentor Session'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='context_links'
    )
    
    context_type = models.CharField(
        max_length=20,
        choices=CONTEXT_TYPE_CHOICES,
        db_index=True
    )
    context_id = models.UUIDField(db_index=True, help_text='mission_id, module_id, etc')
    
    is_required = models.BooleanField(default=False, help_text='Required vs recommended')
    position_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'recipe_context_links'
        verbose_name = 'Recipe Context Link'
        verbose_name_plural = 'Recipe Context Links'
        indexes = [
            models.Index(fields=['context_type', 'context_id', 'position_order']),
            models.Index(fields=['recipe', 'context_type']),
        ]
    
    def __str__(self):
        return f"{self.recipe.title} → {self.context_type}:{self.context_id}"


class UserRecipeBookmark(models.Model):
    """
    User bookmarks for recipes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recipe_bookmarks'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )
    bookmarked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_recipe_bookmarks'
        verbose_name = 'User Recipe Bookmark'
        verbose_name_plural = 'User Recipe Bookmarks'
        unique_together = [['user', 'recipe']]
        indexes = [
            models.Index(fields=['user', '-bookmarked_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} bookmarked {self.recipe.title}"
