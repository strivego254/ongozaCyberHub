"""
Admin interface for Profiler.
"""
from django.contrib import admin
from .models import ProfilerSession, ProfilerAnswer


@admin.register(ProfilerSession)
class ProfilerSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'track_confidence', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at', 'completed_at']


@admin.register(ProfilerAnswer)
class ProfilerAnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'question_key', 'created_at']
    list_filter = ['question_key', 'created_at']
    search_fields = ['session__user__email', 'question_key']
