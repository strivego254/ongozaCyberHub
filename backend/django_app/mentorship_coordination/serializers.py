"""
Serializers for Mentorship Coordination Engine.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MenteeMentorAssignment, MentorSession, MentorWorkQueue, MentorFlag

User = get_user_model()


class MenteeMentorAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for mentor-mentee assignments."""
    mentee_email = serializers.EmailField(source='mentee.email', read_only=True)
    mentee_name = serializers.CharField(source='mentee.get_full_name', read_only=True)
    mentor_email = serializers.EmailField(source='mentor.email', read_only=True)
    mentor_name = serializers.CharField(source='mentor.get_full_name', read_only=True)
    
    class Meta:
        model = MenteeMentorAssignment
        fields = [
            'id', 'mentee', 'mentee_email', 'mentee_name',
            'mentor', 'mentor_email', 'mentor_name',
            'cohort_id', 'status', 'assigned_at',
            'max_sessions', 'sessions_used', 'mentor_notes', 'updated_at'
        ]
        read_only_fields = ['id', 'assigned_at', 'updated_at']


class MentorSessionSerializer(serializers.ModelSerializer):
    """Serializer for mentor sessions."""
    mentee_name = serializers.CharField(source='mentee.get_full_name', read_only=True)
    mentee_email = serializers.EmailField(source='mentee.email', read_only=True)
    mentor_name = serializers.CharField(source='mentor.get_full_name', read_only=True)
    
    class Meta:
        model = MentorSession
        fields = [
            'id', 'assignment', 'mentee', 'mentee_name', 'mentee_email',
            'mentor', 'mentor_name', 'title', 'type',
            'start_time', 'end_time', 'zoom_url', 'calendar_event_id',
            'notes', 'outcomes', 'attended', 'no_show_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MentorWorkQueueSerializer(serializers.ModelSerializer):
    """Serializer for mentor work queue."""
    mentee_name = serializers.CharField(source='mentee.get_full_name', read_only=True)
    mentee_email = serializers.EmailField(source='mentee.email', read_only=True)
    sla_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = MentorWorkQueue
        fields = [
            'id', 'mentor', 'mentee', 'mentee_name', 'mentee_email',
            'type', 'priority', 'title', 'description', 'reference_id',
            'sla_hours', 'due_at', 'completed_at', 'status',
            'sla_remaining', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_sla_remaining(self, obj):
        """Calculate remaining SLA time."""
        if obj.completed_at or not obj.due_at:
            return None
        from django.utils import timezone
        delta = obj.due_at - timezone.now()
        if delta.total_seconds() < 0:
            return "OVERDUE"
        hours = int(delta.total_seconds() / 3600)
        minutes = int((delta.total_seconds() % 3600) / 60)
        return f"{hours}h {minutes}m ⏰"


class MentorFlagSerializer(serializers.ModelSerializer):
    """Serializer for mentor flags."""
    mentee_name = serializers.CharField(source='mentee.get_full_name', read_only=True)
    mentee_email = serializers.EmailField(source='mentee.email', read_only=True)
    mentor_name = serializers.CharField(source='mentor.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = MentorFlag
        fields = [
            'id', 'mentor', 'mentor_name', 'mentee', 'mentee_name', 'mentee_email',
            'reason', 'severity', 'resolved', 'resolved_at',
            'director_notified', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CreateSessionSerializer(serializers.Serializer):
    """Serializer for creating a mentor session."""
    mentee_id = serializers.UUIDField()
    title = serializers.CharField(max_length=200)
    start_time = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(default=45, min_value=15, max_value=120)
    type = serializers.ChoiceField(choices=MentorSession.TYPE_CHOICES, default='one_on_one')


class MissionReviewSerializer(serializers.Serializer):
    """Serializer for mission review."""
    score = serializers.IntegerField(min_value=0, max_value=100)
    feedback = serializers.CharField()
    approved = serializers.BooleanField()
    competencies = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class CreateFlagSerializer(serializers.Serializer):
    """Serializer for creating a risk flag."""
    mentee_id = serializers.UUIDField()
    reason = serializers.CharField()
    severity = serializers.ChoiceField(choices=MentorFlag.SEVERITY_CHOICES, default='medium')

