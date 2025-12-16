"""
Coaching OS serializers for API responses.
"""
from rest_framework import serializers
from .models import Habit, HabitLog, Goal, Reflection, AICoachSession, AICoachMessage


class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = [
            'id', 'user_id', 'name', 'type', 'frequency',
            'streak', 'longest_streak', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HabitLogSerializer(serializers.ModelSerializer):
    habit = HabitSerializer(read_only=True)
    habit_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = HabitLog
        fields = [
            'id', 'habit_id', 'habit', 'user_id', 'date', 'status',
            'notes', 'logged_at'
        ]
        read_only_fields = ['id', 'logged_at']


class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = [
            'id', 'user_id', 'type', 'title', 'description',
            'progress', 'target', 'current', 'status',
            'mentor_feedback', 'subscription_tier', 'due_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReflectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reflection
        fields = [
            'id', 'user_id', 'date', 'content', 'sentiment',
            'emotion_tags', 'ai_insights', 'word_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AICoachMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AICoachMessage
        fields = [
            'id', 'session_id', 'role', 'content', 'context',
            'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AICoachSessionSerializer(serializers.ModelSerializer):
    messages = AICoachMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = AICoachSession
        fields = [
            'id', 'user_id', 'session_type', 'prompt_count',
            'messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
