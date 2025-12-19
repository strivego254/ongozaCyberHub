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
    mentee_id = serializers.CharField(source='mentee.id', read_only=True)
    mentor_name = serializers.CharField(source='mentor.get_full_name', read_only=True, allow_null=True)
    flag_type = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    raised_by = serializers.CharField(source='mentor.id', read_only=True)
    raised_at = serializers.DateTimeField(source='created_at', read_only=True)
    status = serializers.SerializerMethodField()
    
    def get_flag_type(self, obj):
        """Extract flag_type from reason if it matches known patterns, otherwise return 'struggling' as default."""
        reason = obj.reason or ''
        # Check if reason contains a flag_type pattern (look for "Flag Type: X" pattern)
        if 'Flag Type:' in reason:
            flag_type_part = reason.split('Flag Type:')[1].split('|')[0].strip()
            if flag_type_part in ['struggling', 'at_risk', 'needs_attention', 'technical_issue']:
                return flag_type_part
        # Check if reason contains a flag_type pattern directly
        for flag_type in ['struggling', 'at_risk', 'needs_attention', 'technical_issue']:
            if flag_type in reason.lower():
                return flag_type
        # Default to 'struggling' if no pattern matches
        return 'struggling'
    
    def get_description(self, obj):
        """Extract description from reason, removing flag_type prefix if present."""
        reason = obj.reason or ''
        # Remove "Flag Type: X |" prefix if present
        if 'Flag Type:' in reason and '|' in reason:
            parts = reason.split('|', 1)
            if len(parts) > 1:
                return parts[1].strip()
        return reason
    
    def get_status(self, obj):
        """Map resolved boolean to status string."""
        if obj.resolved:
            return 'resolved'
        return 'open'
    
    class Meta:
        model = MentorFlag
        fields = [
            'id', 'mentor', 'mentor_name', 'mentee', 'mentee_id', 'mentee_name', 'mentee_email',
            'reason', 'description', 'flag_type', 'severity', 'resolved', 'status', 'resolved_at',
            'director_notified', 'created_at', 'raised_by', 'raised_at'
        ]
        read_only_fields = ['id', 'created_at']


class CreateSessionSerializer(serializers.Serializer):
    """Serializer for creating a mentor session."""
    mentee_id = serializers.UUIDField(required=False)
    title = serializers.CharField(max_length=200)
    start_time = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(default=45, min_value=15, max_value=120)
    type = serializers.ChoiceField(choices=MentorSession.TYPE_CHOICES, default='one_on_one')


class CreateGroupSessionSerializer(serializers.Serializer):
    """Serializer for creating a group mentorship session."""
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    scheduled_at = serializers.CharField()  # Accept as string first, then parse in validation
    duration_minutes = serializers.IntegerField(default=60, min_value=15, max_value=240)
    meeting_type = serializers.ChoiceField(choices=[('zoom', 'Zoom'), ('google_meet', 'Google Meet'), ('in_person', 'In Person')], default='zoom')
    meeting_link = serializers.CharField(required=False, allow_blank=True, default='')
    track_assignment = serializers.CharField(required=False, allow_blank=True, max_length=100, default='')
    
    def validate_scheduled_at(self, value):
        """Parse scheduled_at string and ensure it's timezone-aware."""
        from django.utils import timezone
        from datetime import datetime
        
        if not isinstance(value, str):
            raise serializers.ValidationError("scheduled_at must be a string")
        
        # Handle Z suffix (UTC) - convert to +00:00 for fromisoformat
        if value.endswith('Z'):
            value = value[:-1] + '+00:00'
        elif not ('+' in value or value.endswith('UTC')):
            # If no timezone info, assume UTC
            if 'T' in value:
                value = value + '+00:00'
        
        try:
            # Parse ISO format datetime
            dt = datetime.fromisoformat(value)
        except ValueError as e:
            # Try alternative formats
            try:
                # Try with microseconds
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                # Try parsing with strptime for common formats
                for fmt in ['%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S']:
                    try:
                        dt = datetime.strptime(value.replace('Z', ''), fmt)
                        break
                    except ValueError:
                        continue
                else:
                    raise serializers.ValidationError(f"Invalid datetime format: {value}. Error: {str(e)}")
        
        # Ensure timezone-aware
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
        
        return dt


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
    mentee_id = serializers.CharField()  # Accept string, convert to UUID in validate
    reason = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)  # Frontend sends 'description'
    flag_type = serializers.ChoiceField(
        choices=[
            ('struggling', 'Struggling'),
            ('at_risk', 'At Risk'),
            ('needs_attention', 'Needs Attention'),
            ('technical_issue', 'Technical Issue'),
        ],
        required=False
    )
    severity = serializers.ChoiceField(choices=MentorFlag.SEVERITY_CHOICES, default='medium')
    
    def validate_mentee_id(self, value):
        """Convert string to appropriate type (UUID or int)."""
        import uuid
        if isinstance(value, str):
            # Try UUID first
            try:
                return uuid.UUID(value)
            except ValueError:
                # If not UUID, try integer (user ID)
                try:
                    int_value = int(value)
                    # Return as string - the view will handle conversion
                    return str(int_value)
                except ValueError:
                    raise serializers.ValidationError(f"Invalid mentee_id format: {value}. Must be UUID or integer.")
        return value
    
    def validate(self, attrs):
        """Ensure either reason or description is provided."""
        if not attrs.get('reason') and not attrs.get('description'):
            raise serializers.ValidationError("Either 'reason' or 'description' must be provided.")
        return attrs

