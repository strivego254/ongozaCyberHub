"""
Curriculum Engine admin configuration.
"""
from django.contrib import admin
from .models import (
    CurriculumTrack, CurriculumModule, Lesson, ModuleMission,
    RecipeRecommendation, UserTrackProgress, UserModuleProgress,
    UserLessonProgress, UserMissionProgress, CurriculumActivity
)


@admin.register(CurriculumTrack)
class CurriculumTrackAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'level', 'module_count', 'is_active', 'created_at']
    list_filter = ['level', 'is_active']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['module_count', 'lesson_count', 'mission_count', 'created_at', 'updated_at']
    ordering = ['name']


@admin.register(CurriculumModule)
class CurriculumModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'track_key', 'order_index', 'level', 'entitlement_tier', 'is_core', 'is_active']
    list_filter = ['track_key', 'level', 'entitlement_tier', 'is_core', 'is_active']
    search_fields = ['title', 'description', 'track_key']
    raw_id_fields = ['track']
    readonly_fields = ['lesson_count', 'mission_count', 'created_at', 'updated_at']
    ordering = ['track_key', 'order_index']


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'lesson_type', 'duration_minutes', 'order_index', 'is_required']
    list_filter = ['lesson_type', 'is_required', 'module__track_key']
    search_fields = ['title', 'description']
    raw_id_fields = ['module']
    ordering = ['module', 'order_index']


@admin.register(ModuleMission)
class ModuleMissionAdmin(admin.ModelAdmin):
    list_display = ['module', 'mission_title', 'mission_difficulty', 'is_required', 'recommended_order']
    list_filter = ['is_required', 'mission_difficulty', 'module__track_key']
    search_fields = ['mission_title', 'module__title']
    raw_id_fields = ['module']
    ordering = ['module', 'recommended_order']


@admin.register(RecipeRecommendation)
class RecipeRecommendationAdmin(admin.ModelAdmin):
    list_display = ['module', 'recipe_title', 'recipe_difficulty', 'relevance_score', 'order_index']
    list_filter = ['recipe_difficulty', 'module__track_key']
    search_fields = ['recipe_title', 'module__title']
    raw_id_fields = ['module']
    ordering = ['module', 'order_index']


@admin.register(UserTrackProgress)
class UserTrackProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'track', 'completion_percentage', 'circle_level', 'phase', 'total_points', 'last_activity_at']
    list_filter = ['track', 'circle_level', 'phase']
    search_fields = ['user__email', 'track__name']
    raw_id_fields = ['user', 'track', 'current_module']
    readonly_fields = ['started_at', 'last_activity_at']
    ordering = ['-last_activity_at']


@admin.register(UserModuleProgress)
class UserModuleProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'module', 'status', 'completion_percentage', 'is_blocked', 'updated_at']
    list_filter = ['status', 'is_blocked', 'module__track_key']
    search_fields = ['user__email', 'module__title']
    raw_id_fields = ['user', 'module']
    readonly_fields = ['updated_at']
    ordering = ['-updated_at']


@admin.register(UserLessonProgress)
class UserLessonProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'status', 'progress_percentage', 'quiz_score', 'updated_at']
    list_filter = ['status', 'lesson__lesson_type']
    search_fields = ['user__email', 'lesson__title']
    raw_id_fields = ['user', 'lesson']
    readonly_fields = ['updated_at']
    ordering = ['-updated_at']


@admin.register(UserMissionProgress)
class UserMissionProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'module_mission', 'status', 'score', 'grade', 'attempts', 'updated_at']
    list_filter = ['status', 'grade']
    search_fields = ['user__email', 'module_mission__mission_title']
    raw_id_fields = ['user', 'module_mission']
    readonly_fields = ['updated_at']
    ordering = ['-updated_at']


@admin.register(CurriculumActivity)
class CurriculumActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'track', 'module', 'points_awarded', 'created_at']
    list_filter = ['activity_type', 'track']
    search_fields = ['user__email', 'track__name', 'module__title']
    raw_id_fields = ['user', 'track', 'module', 'lesson']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

