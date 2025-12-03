"""
Serializers for Coaching OS.
"""
from rest_framework import serializers
from .models import Habit, HabitLog, Goal, Reflection


class HabitSerializer(serializers.ModelSerializer):
    """Serializer for habits."""
    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'category', 'target_frequency',
            'streak_current', 'streak_longest', 'last_completed_at',
            'created_at'
        ]
        read_only_fields = ['id', 'streak_current', 'streak_longest', 'last_completed_at', 'created_at']


class HabitLogSerializer(serializers.ModelSerializer):
    """Serializer for habit logs."""
    class Meta:
        model = HabitLog
        fields = ['id', 'habit', 'completed_at', 'notes']
        read_only_fields = ['id', 'completed_at']


class CreateHabitSerializer(serializers.Serializer):
    """Serializer for creating/logging habits."""
    name = serializers.CharField(required=True)
    category = serializers.ChoiceField(choices=['learn', 'practice', 'reflect'], required=True)
    log_today = serializers.BooleanField(default=False)


class GoalSerializer(serializers.ModelSerializer):
    """Serializer for goals."""
    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'description', 'type', 'status',
            'target_date', 'completed_at', 'mentor_feedback', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'completed_at', 'created_at']


class CreateGoalSerializer(serializers.Serializer):
    """Serializer for creating goals."""
    title = serializers.CharField(required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    type = serializers.ChoiceField(choices=['daily', 'weekly', 'monthly'], required=True)
    target_date = serializers.DateTimeField(required=False, allow_null=True)


class ReflectionSerializer(serializers.ModelSerializer):
    """Serializer for reflections."""
    class Meta:
        model = Reflection
        fields = [
            'id', 'prompt', 'response', 'sentiment_score',
            'behavior_tags', 'created_at'
        ]
        read_only_fields = ['id', 'sentiment_score', 'behavior_tags', 'created_at']


class CreateReflectionSerializer(serializers.Serializer):
    """Serializer for creating reflections."""
    prompt = serializers.CharField(required=True)
    response = serializers.CharField(required=True)


class CoachingSummarySerializer(serializers.Serializer):
    """Serializer for coaching summary."""
    habit_completion = serializers.DecimalField(max_digits=4, decimal_places=2)
    streak_current = serializers.IntegerField()
    goals_active = serializers.IntegerField()
    goals_completed = serializers.IntegerField()
    period = serializers.CharField()

