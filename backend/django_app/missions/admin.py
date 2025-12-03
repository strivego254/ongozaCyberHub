"""
Admin interface for Missions MXP.
"""
from django.contrib import admin
from .models import Mission, MissionSubmission, MissionFile


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty', 'est_hours', 'created_at']
    list_filter = ['difficulty', 'created_at']
    search_fields = ['title', 'description']


@admin.register(MissionSubmission)
class MissionSubmissionAdmin(admin.ModelAdmin):
    list_display = ['mission', 'user', 'status', 'ai_score', 'submitted_at']
    list_filter = ['status', 'submitted_at']
    search_fields = ['mission__title', 'user__email']


@admin.register(MissionFile)
class MissionFileAdmin(admin.ModelAdmin):
    list_display = ['filename', 'submission', 'size_bytes', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['filename', 'submission__mission__title']
