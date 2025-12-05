"""
Serializers for Programs app.
"""
from rest_framework import serializers
from .models import (
    Program, Track, Specialization, Cohort, Enrollment,
    CalendarEvent, MentorAssignment, ProgramRule, Certificate, Waitlist
)


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TrackSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    class Meta:
        model = Track
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SpecializationSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source='track.name', read_only=True)
    
    class Meta:
        model = Specialization
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CohortSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source='track.name', read_only=True)
    seat_utilization = serializers.FloatField(read_only=True)
    completion_rate = serializers.FloatField(read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cohort
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_enrolled_count(self, obj):
        return obj.enrollments.filter(status='active').count()


class EnrollmentSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['id', 'joined_at']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class CalendarEventSerializer(serializers.ModelSerializer):
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = CalendarEvent
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class MentorAssignmentSerializer(serializers.ModelSerializer):
    mentor_email = serializers.CharField(source='mentor.email', read_only=True)
    mentor_name = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = MentorAssignment
        fields = '__all__'
        read_only_fields = ['id', 'assigned_at']
    
    def get_mentor_name(self, obj):
        return obj.mentor.get_full_name() or obj.mentor.email


class ProgramRuleSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    class Meta:
        model = ProgramRule
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CertificateSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='enrollment.user.email', read_only=True)
    cohort_name = serializers.CharField(source='enrollment.cohort.name', read_only=True)
    
    class Meta:
        model = Certificate
        fields = '__all__'
        read_only_fields = ['id', 'issued_at']


class WaitlistSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = Waitlist
        fields = '__all__'
        read_only_fields = ['id', 'added_at', 'position']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class CohortDashboardSerializer(serializers.Serializer):
    """Serializer for cohort dashboard data."""
    cohort_id = serializers.UUIDField()
    cohort_name = serializers.CharField()
    track_name = serializers.CharField()
    enrollments_count = serializers.IntegerField()
    seat_utilization = serializers.FloatField()
    mentor_assignments_count = serializers.IntegerField()
    readiness_delta = serializers.FloatField()
    completion_percentage = serializers.FloatField()
    payments_complete = serializers.IntegerField()
    payments_pending = serializers.IntegerField()

