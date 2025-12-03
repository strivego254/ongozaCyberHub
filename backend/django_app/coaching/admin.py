"""
Admin interface for Coaching OS.
"""
from django.contrib import admin
from .models import Habit, HabitLog, Goal, Reflection


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'category', 'streak_current', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'user__email']


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ['habit', 'user', 'completed_at']
    list_filter = ['completed_at']
    search_fields = ['habit__name', 'user__email']


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'type', 'status', 'target_date']
    list_filter = ['type', 'status', 'created_at']
    search_fields = ['title', 'user__email']


@admin.register(Reflection)
class ReflectionAdmin(admin.ModelAdmin):
    list_display = ['user', 'sentiment_score', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'prompt']
