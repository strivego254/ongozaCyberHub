"""
Serializers for Missions MXP.
"""
from rest_framework import serializers
from .models import Mission, MissionSubmission, MissionArtifact, AIFeedback


class MissionSerializer(serializers.ModelSerializer):
    """Serializer for missions."""
    class Meta:
        model = Mission
        fields = [
            'id', 'code', 'title', 'description', 'difficulty', 'type',
            'track_id', 'track_key', 'est_hours', 'estimated_time_minutes',
            'competencies', 'requirements', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MissionArtifactSerializer(serializers.ModelSerializer):
    """Serializer for mission artifacts."""
    class Meta:
        model = MissionArtifact
        fields = ['id', 'type', 'url', 'filename', 'size_bytes', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class AIFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for AI feedback."""
    class Meta:
        model = AIFeedback
        fields = [
            'id', 'score', 'strengths', 'gaps', 'suggestions',
            'competencies_detected', 'full_feedback', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MissionSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for mission submissions."""
    mission = MissionSerializer(read_only=True)
    artifacts = MissionArtifactSerializer(many=True, read_only=True)
    ai_feedback_detail = AIFeedbackSerializer(read_only=True)
    
    class Meta:
        model = MissionSubmission
        fields = [
            'id', 'mission', 'status', 'ai_score', 'mentor_score',
            'ai_feedback', 'mentor_feedback', 'notes', 'portfolio_item_id',
            'submitted_at', 'ai_reviewed_at', 'mentor_reviewed_at',
            'reviewed_at', 'created_at', 'updated_at', 'artifacts', 'ai_feedback_detail'
        ]
        read_only_fields = [
            'id', 'status', 'ai_score', 'mentor_score', 'ai_feedback',
            'mentor_feedback', 'portfolio_item_id', 'submitted_at',
            'ai_reviewed_at', 'mentor_reviewed_at', 'reviewed_at',
            'created_at', 'updated_at'
        ]


class SubmitMissionSerializer(serializers.Serializer):
    """Serializer for submitting missions."""
    notes = serializers.CharField(required=False, allow_blank=True)
    github_url = serializers.URLField(required=False, allow_blank=True)
    notebook_url = serializers.URLField(required=False, allow_blank=True)
    video_url = serializers.URLField(required=False, allow_blank=True)
    # Files handled via FormData


class MissionStatusSerializer(serializers.Serializer):
    """Serializer for mission status summary."""
    in_progress = serializers.IntegerField()
    in_review = serializers.IntegerField()
    completed_total = serializers.IntegerField()
    next_recommended = serializers.DictField(required=False, allow_null=True)

