"""
Admin interface for Coaching OS.
"""
from django.contrib import admin
from .models import Habit, HabitLog, Goal, Reflection


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_core', 'frequency', 'created_at']
    list_filter = ['is_core', 'frequency', 'created_at']
    search_fields = ['name', 'user__email']


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ['habit', 'user', 'log_date', 'status', 'created_at']
    list_filter = ['status', 'log_date', 'created_at']
    search_fields = ['habit__name', 'user__email']


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'scope', 'status', 'target_date']
    list_filter = ['scope', 'status', 'created_at']
    search_fields = ['title', 'user__email']


@admin.register(Reflection)
class ReflectionAdmin(admin.ModelAdmin):
    list_display = ['user', 'ai_sentiment', 'created_at']
    list_filter = ['ai_sentiment', 'created_at']
    search_fields = ['user__email', 'content']
