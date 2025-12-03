"""
Serializers for Missions MXP.
"""
from rest_framework import serializers
from .models import Mission, MissionSubmission, MissionFile


class MissionSerializer(serializers.ModelSerializer):
    """Serializer for missions."""
    class Meta:
        model = Mission
        fields = [
            'id', 'title', 'description', 'difficulty',
            'track_id', 'est_hours', 'competencies', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MissionFileSerializer(serializers.ModelSerializer):
    """Serializer for mission files."""
    class Meta:
        model = MissionFile
        fields = ['id', 'filename', 'file_url', 'content_type', 'size_bytes', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class MissionSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for mission submissions."""
    mission = MissionSerializer(read_only=True)
    files = MissionFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = MissionSubmission
        fields = [
            'id', 'mission', 'status', 'ai_score', 'ai_feedback',
            'mentor_feedback', 'notes', 'submitted_at', 'reviewed_at',
            'created_at', 'files'
        ]
        read_only_fields = ['id', 'status', 'ai_score', 'ai_feedback', 'mentor_feedback', 'submitted_at', 'reviewed_at', 'created_at']


class SubmitMissionSerializer(serializers.Serializer):
    """Serializer for submitting missions."""
    notes = serializers.CharField(required=False, allow_blank=True)
    # Files handled via FormData


class MissionStatusSerializer(serializers.Serializer):
    """Serializer for mission status summary."""
    in_progress = serializers.IntegerField()
    in_review = serializers.IntegerField()
    completed_total = serializers.IntegerField()
    next_recommended = serializers.DictField(required=False, allow_null=True)

