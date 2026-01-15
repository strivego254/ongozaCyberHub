"""
Curriculum Engine models - Tracks, Modules, Lessons, Missions, and Progress tracking.

This is the "What do I do NEXT?" coordinator that drives students from content → missions → skill mastery.
Core Flow: Profiler → Track → Curriculum loads modules → "Do Mission 2.1 next" → Mission Engine → Progress updates → TalentScope signals
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User


class CurriculumTrack(models.Model):
    """
    Dedicated curriculum track (extends programs.Track concept).
    Links to Profiler recommendations and contains curriculum-specific metadata.
    """
    LEVEL_CHOICES = [
        ('entry', 'Entry Level'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    TIER_CHOICES = [
        (0, 'Tier 0 - Profiler'),
        (1, 'Tier 1 - Foundations'),
        (2, 'Tier 2 - Beginner Tracks'),
        (3, 'Tier 3 - Intermediate Tracks'),
        (4, 'Tier 4 - Advanced Tracks'),
        (5, 'Tier 5 - Mastery Tracks'),
        (6, 'Tier 6 - Cross-Track Programs'),
        (7, 'Tier 7 - Missions & Recipe Engine'),
        (8, 'Tier 8 - Platform Ecosystem'),
        (9, 'Tier 9 - Enterprise & National Intelligence'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True, help_text='e.g., "SOCDEFENSE", "CLOUDSEC"')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='entry')
    tier = models.IntegerField(
        default=2,
        choices=TIER_CHOICES,
        db_index=True,
        help_text='Academic tier (0-9). Tier 2 = Beginner Tracks'
    )
    
    # Linking to programs.Track if needed
    program_track_id = models.UUIDField(null=True, blank=True, help_text='FK to programs.Track')
    
    # Track metadata
    icon = models.CharField(max_length=50, blank=True, help_text='Icon identifier e.g., "shield", "cloud"')
    color = models.CharField(max_length=20, blank=True, default='indigo', help_text='Theme color')
    estimated_duration_weeks = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    
    # Stats (denormalized for performance)
    module_count = models.IntegerField(default=0)
    lesson_count = models.IntegerField(default=0)
    mission_count = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'curriculum_tracks'
        verbose_name = 'Curriculum Track'
        verbose_name_plural = 'Curriculum Tracks'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code', 'is_active']),
            models.Index(fields=['level', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class CurriculumModule(models.Model):
    """Curriculum module within a track - hierarchical content container."""
    
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('capstone', 'Capstone'),
    ]
    
    ENTITLEMENT_TIER_CHOICES = [
        ('all', 'All Tiers'),
        ('starter_enhanced', 'Starter Enhanced (First 6mo)'),
        ('starter_normal', 'Starter Normal'),
        ('professional', 'Professional Only'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Track relationship (supports both old track_key and new FK)
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.CASCADE,
        related_name='modules',
        null=True,
        blank=True,
        help_text='FK to CurriculumTrack'
    )
    track_key = models.CharField(max_length=50, db_index=True, help_text='Track key like "soc_analyst"')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Module structure
    is_core = models.BooleanField(default=True, help_text='Core vs optional module')
    is_required = models.BooleanField(default=True, help_text='Required to complete track')
    order_index = models.IntegerField(default=0, help_text='Order within track')
    
    # Level and entitlements
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default='beginner',
        help_text='Module difficulty level'
    )
    entitlement_tier = models.CharField(
        max_length=20,
        choices=ENTITLEMENT_TIER_CHOICES,
        default='all',
        help_text='Minimum subscription tier required'
    )
    
    # Time estimates
    estimated_time_minutes = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text='Estimated minutes to complete'
    )
    
    # Competencies and skills
    competencies = models.JSONField(
        default=list,
        blank=True,
        help_text='["SIEM", "Alerting", "IR"]'
    )
    
    # Mentor notes (7-tier professional only)
    mentor_notes = models.TextField(
        blank=True,
        help_text='Mentor guidance notes (Professional tier only)'
    )
    
    # Stats (denormalized)
    lesson_count = models.IntegerField(default=0)
    mission_count = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'curriculummodules'
        verbose_name = 'Curriculum Module'
        verbose_name_plural = 'Curriculum Modules'
        indexes = [
            models.Index(fields=['track_key', 'order_index']),
            models.Index(fields=['track_key', 'is_core']),
            models.Index(fields=['track', 'order_index']),
            models.Index(fields=['level', 'entitlement_tier']),
        ]
        ordering = ['track_key', 'order_index']
    
    def __str__(self):
        return f"{self.title} ({self.track_key})"


class Lesson(models.Model):
    """Lesson within a curriculum module - videos, guides, quizzes."""
    
    LESSON_TYPE_CHOICES = [
        ('video', 'Video'),
        ('guide', 'Guide/Article'),
        ('quiz', 'Quiz'),
        ('assessment', 'Assessment'),
        ('lab', 'Hands-on Lab'),
        ('reading', 'Reading Material'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='lessons',
        db_index=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Content
    content_url = models.URLField(blank=True, help_text='URL to lesson content')
    lesson_type = models.CharField(
        max_length=20,
        choices=LESSON_TYPE_CHOICES,
        default='video',
        help_text='Type of lesson content'
    )
    
    # Duration
    duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text='Duration in minutes'
    )
    
    order_index = models.IntegerField(default=0, help_text='Order within module')
    is_required = models.BooleanField(default=True, help_text='Required to complete module')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'lessons'
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'
        indexes = [
            models.Index(fields=['module', 'order_index']),
            models.Index(fields=['lesson_type']),
        ]
        ordering = ['module', 'order_index']
    
    def __str__(self):
        return f"{self.title} ({self.module.title})"


class ModuleMission(models.Model):
    """
    Link table between curriculum modules and missions.
    Enables module → mission execution in Missions Engine.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='module_missions',
        db_index=True
    )
    mission_id = models.UUIDField(db_index=True, help_text='FK to missions.Mission')
    
    # Mission metadata (denormalized for display)
    mission_title = models.CharField(max_length=255, blank=True)
    mission_difficulty = models.CharField(max_length=20, blank=True)
    mission_estimated_hours = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True
    )
    
    is_required = models.BooleanField(default=True, help_text='Required to complete module')
    recommended_order = models.IntegerField(default=0, help_text='Order within module missions')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'module_missions'
        verbose_name = 'Module Mission'
        verbose_name_plural = 'Module Missions'
        unique_together = [['module', 'mission_id']]
        indexes = [
            models.Index(fields=['module', 'recommended_order']),
            models.Index(fields=['mission_id']),
        ]
        ordering = ['module', 'recommended_order']
    
    def __str__(self):
        return f"{self.module.title} → {self.mission_title or self.mission_id}"


class RecipeRecommendation(models.Model):
    """
    Recipe recommendations for modules - micro-skill boosters.
    Links to Recipe Engine for contextual skill gaps.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.CASCADE,
        related_name='recipe_recommendations',
        db_index=True
    )
    recipe_id = models.UUIDField(db_index=True, help_text='FK to recipes.Recipe')
    
    # Recipe metadata (denormalized)
    recipe_title = models.CharField(max_length=255, blank=True)
    recipe_duration_minutes = models.IntegerField(null=True, blank=True)
    recipe_difficulty = models.CharField(max_length=20, blank=True)
    
    relevance_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=1.0,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        help_text='How relevant is this recipe to the module (0-1)'
    )
    
    order_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'curriculum_recipe_recommendations'
        verbose_name = 'Recipe Recommendation'
        verbose_name_plural = 'Recipe Recommendations'
        unique_together = [['module', 'recipe_id']]
        indexes = [
            models.Index(fields=['module', 'order_index']),
        ]
        ordering = ['module', 'order_index']
    
    def __str__(self):
        return f"{self.module.title} → Recipe: {self.recipe_title or self.recipe_id}"


class UserTrackProgress(models.Model):
    """
    User progress tracking at the track level.
    Aggregates module/lesson/mission progress for track completion %.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='track_progress',
        db_index=True
    )
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.CASCADE,
        related_name='user_progress',
        db_index=True
    )
    
    # Current position
    current_module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_users',
        help_text='Current active module'
    )
    
    # Progress stats
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    modules_completed = models.IntegerField(default=0)
    lessons_completed = models.IntegerField(default=0)
    missions_completed = models.IntegerField(default=0)
    
    # Time tracking
    total_time_spent_minutes = models.IntegerField(default=0)
    estimated_completion_date = models.DateField(null=True, blank=True)
    
    # Circle/Phase integration (from Profiler)
    circle_level = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text='OCH Circle level (1-10)'
    )
    phase = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Phase within circle (1-5)'
    )
    
    # Gamification
    total_points = models.IntegerField(default=0)
    current_streak_days = models.IntegerField(default=0)
    longest_streak_days = models.IntegerField(default=0)
    total_badges = models.IntegerField(default=0)
    
    # Rankings
    university_rank = models.IntegerField(null=True, blank=True)
    global_rank = models.IntegerField(null=True, blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Tier 2 (Beginner Tracks) specific completion tracking
    tier2_quizzes_passed = models.IntegerField(default=0, help_text='Number of quizzes passed (Tier 2)')
    tier2_mini_missions_completed = models.IntegerField(default=0, help_text='Number of mini-missions completed (Tier 2)')
    tier2_reflections_submitted = models.IntegerField(default=0, help_text='Number of reflections submitted (Tier 2)')
    tier2_mentor_approval = models.BooleanField(default=False, help_text='Mentor approval for Tier 2 completion (optional)')
    tier2_completion_requirements_met = models.BooleanField(default=False, db_index=True, help_text='All Tier 2 requirements met')
    
    class Meta:
        db_table = 'user_track_progress'
        verbose_name = 'User Track Progress'
        verbose_name_plural = 'User Track Progress'
        unique_together = [['user', 'track']]
        indexes = [
            models.Index(fields=['user', 'track']),
            models.Index(fields=['track', '-completion_percentage']),
            models.Index(fields=['user', '-last_activity_at']),
            models.Index(fields=['circle_level', 'phase']),
        ]
    
    def check_tier2_completion(self, require_mentor_approval=False):
        """
        Check if Tier 2 (Beginner Track) completion requirements are met.
        
        Requirements:
        - All mandatory modules completed
        - All quizzes passed
        - Minimum number of beginner tasks/mini-missions submitted
        - Mentor approval (if required)
        
        Returns: (is_complete: bool, missing_requirements: list)
        """
        if self.track.tier != 2:
            return False, ['Not a Tier 2 track']
        
        missing = []
        
        # Check all mandatory modules are completed
        mandatory_modules = CurriculumModule.objects.filter(
            track=self.track,
            is_required=True,
            is_active=True
        )
        completed_modules = UserModuleProgress.objects.filter(
            user=self.user,
            module__in=mandatory_modules,
            status='completed'
        )
        if completed_modules.count() < mandatory_modules.count():
            missing.append(f"Complete all {mandatory_modules.count()} mandatory modules")
        
        # Check quizzes passed (all quizzes in required modules)
        required_quizzes = Lesson.objects.filter(
            module__track=self.track,
            module__is_required=True,
            lesson_type='quiz',
            is_required=True
        )
        passed_quizzes = UserLessonProgress.objects.filter(
            user=self.user,
            lesson__in=required_quizzes,
            status='completed',
            quiz_score__gte=70  # 70% passing score
        )
        if passed_quizzes.count() < required_quizzes.count():
            missing.append(f"Pass all {required_quizzes.count()} quizzes (70% minimum)")
        
        # Check minimum mini-missions completed (at least 1-2 as per guidelines)
        min_missions_required = 1  # Configurable, default 1
        if self.tier2_mini_missions_completed < min_missions_required:
            missing.append(f"Complete at least {min_missions_required} mini-mission(s)")
        
        # Check mentor approval if required
        if require_mentor_approval and not self.tier2_mentor_approval:
            missing.append("Mentor approval required")
        
        is_complete = len(missing) == 0
        self.tier2_completion_requirements_met = is_complete
        self.save(update_fields=['tier2_completion_requirements_met'])
        
        return is_complete, missing
    
    def __str__(self):
        return f"{self.user.email} - {self.track.name} ({self.completion_percentage}%)"


class UserModuleProgress(models.Model):
    """User progress tracking for curriculum modules."""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),  # Waiting on mission completion
    ]
    
    # Note: Keep default auto id field for backwards compatibility with existing table
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
    
    # Progress details
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    lessons_completed = models.IntegerField(default=0)
    missions_completed = models.IntegerField(default=0)
    
    # Blocking state
    is_blocked = models.BooleanField(default=False, help_text='Waiting on mission completion')
    blocked_by_mission_id = models.UUIDField(null=True, blank=True)
    
    # Time tracking
    time_spent_minutes = models.IntegerField(default=0)
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_module_progress'
        verbose_name = 'User Module Progress'
        verbose_name_plural = 'User Module Progress'
        unique_together = [['user', 'module']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['module', '-completion_percentage']),
            models.Index(fields=['user', 'is_blocked']),
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
    
    # Note: Keep default auto id field for backwards compatibility with existing table
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
    
    # Progress details
    progress_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='For video: watch percentage'
    )
    
    # Quiz/assessment results
    quiz_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    quiz_attempts = models.IntegerField(default=0)
    
    # Time tracking
    time_spent_minutes = models.IntegerField(default=0)
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_lesson_progress'
        verbose_name = 'User Lesson Progress'
        verbose_name_plural = 'User Lesson Progress'
        unique_together = [['user', 'lesson']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['lesson', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.lesson.title} ({self.status})"


class UserMissionProgress(models.Model):
    """
    User progress tracking for curriculum missions.
    Links curriculum to Missions Engine results.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='curriculum_mission_progress',
        db_index=True
    )
    module_mission = models.ForeignKey(
        ModuleMission,
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
    
    # Mission results (from Missions Engine)
    mission_submission_id = models.UUIDField(
        null=True,
        blank=True,
        help_text='FK to missions.MissionSubmission'
    )
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    grade = models.CharField(max_length=10, blank=True)  # A+, A, B+, etc.
    feedback = models.TextField(blank=True)
    
    # Time tracking
    time_spent_minutes = models.IntegerField(default=0)
    attempts = models.IntegerField(default=0)
    
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_curriculum_mission_progress'
        verbose_name = 'User Mission Progress'
        verbose_name_plural = 'User Mission Progress'
        unique_together = [['user', 'module_mission']]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['module_mission', 'status']),
            models.Index(fields=['mission_submission_id']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.module_mission} ({self.status})"


class CurriculumActivity(models.Model):
    """
    Activity log for curriculum engagement - feeds TalentScope signals.
    """
    ACTIVITY_TYPE_CHOICES = [
        ('lesson_started', 'Lesson Started'),
        ('lesson_completed', 'Lesson Completed'),
        ('module_started', 'Module Started'),
        ('module_completed', 'Module Completed'),
        ('mission_started', 'Mission Started'),
        ('mission_submitted', 'Mission Submitted'),
        ('mission_completed', 'Mission Completed'),
        ('quiz_completed', 'Quiz Completed'),
        ('recipe_started', 'Recipe Started'),
        ('recipe_completed', 'Recipe Completed'),
        ('track_started', 'Track Started'),
        ('track_completed', 'Track Completed'),
        ('streak_milestone', 'Streak Milestone'),
        ('badge_earned', 'Badge Earned'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='curriculum_activities',
        db_index=True
    )
    
    activity_type = models.CharField(
        max_length=30,
        choices=ACTIVITY_TYPE_CHOICES,
        db_index=True
    )
    
    # Related entities (nullable)
    track = models.ForeignKey(
        CurriculumTrack,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities'
    )
    module = models.ForeignKey(
        CurriculumModule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities'
    )
    
    # Activity metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional activity data: {score, time_spent, badge_name, etc.}'
    )
    
    # Points awarded
    points_awarded = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'curriculum_activities'
        verbose_name = 'Curriculum Activity'
        verbose_name_plural = 'Curriculum Activities'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['activity_type', '-created_at']),
            models.Index(fields=['track', '-created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.activity_type} @ {self.created_at}"

