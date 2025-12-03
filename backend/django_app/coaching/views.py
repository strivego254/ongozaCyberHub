"""
API views for Coaching OS.
"""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Habit, HabitLog, Goal, Reflection
from .serializers import (
    HabitSerializer,
    CreateHabitSerializer,
    GoalSerializer,
    CreateGoalSerializer,
    ReflectionSerializer,
    CreateReflectionSerializer,
    CoachingSummarySerializer,
)
from student_dashboard.services import DashboardAggregationService
from coaching.tasks import analyze_reflection_sentiment_task


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_or_log_habit(request):
    """
    POST /api/v1/coaching/habits
    Create or log habit completion.
    """
    serializer = CreateHabitSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = request.user
    name = serializer.validated_data['name']
    category = serializer.validated_data['category']
    log_today = serializer.validated_data.get('log_today', False)
    
    # Get or create habit
    habit, created = Habit.objects.get_or_create(
        user=user,
        name=name,
        category=category,
        defaults={'target_frequency': 1}
    )
    
    # Log completion if requested
    if log_today:
        today = timezone.now().date()
        log, log_created = HabitLog.objects.get_or_create(
            habit=habit,
            user=user,
            completed_at__date=today,
            defaults={'completed_at': timezone.now()}
        )
        
        if log_created:
            # Update streak
            habit.last_completed_at = timezone.now()
            habit.streak_current += 1
            if habit.streak_current > habit.streak_longest:
                habit.streak_longest = habit.streak_current
            habit.save()
            
            # Trigger dashboard refresh
            DashboardAggregationService.queue_update(user, 'habit_logged', 'normal')
    
    # Calculate week completion
    week_start = timezone.now() - timedelta(days=7)
    week_logs = HabitLog.objects.filter(
        habit=habit,
        completed_at__gte=week_start
    ).count()
    week_completion = (week_logs / habit.target_frequency) * 100 if habit.target_frequency > 0 else 0
    
    return Response({
        'habit': HabitSerializer(habit).data,
        'streak_current': habit.streak_current,
        'week_completion': round(week_completion, 2),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_goal(request):
    """
    POST /api/v1/coaching/goals
    Create a new goal.
    """
    serializer = CreateGoalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    goal = Goal.objects.create(
        user=request.user,
        **serializer.validated_data
    )
    
    # Trigger dashboard refresh
    DashboardAggregationService.queue_update(request.user, 'goal_created', 'normal')
    
    return Response(GoalSerializer(goal).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_reflection(request):
    """
    POST /api/v1/coaching/reflect
    Create reflection with AI sentiment analysis.
    """
    serializer = CreateReflectionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    reflection = Reflection.objects.create(
        user=request.user,
        **serializer.validated_data
    )
    
    # Trigger AI sentiment analysis
    from coaching.tasks import analyze_reflection_sentiment_task
    analyze_reflection_sentiment_task.delay(str(reflection.id))
    
    # Trigger dashboard refresh
    DashboardAggregationService.queue_update(request.user, 'reflection_created', 'low')
    
    return Response(ReflectionSerializer(reflection).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coaching_summary(request):
    """
    GET /api/v1/coaching/summary?period=week
    Get coaching summary.
    """
    user = request.user
    period = request.query_params.get('period', 'week')
    
    if period == 'week':
        start_date = timezone.now() - timedelta(days=7)
    elif period == 'month':
        start_date = timezone.now() - timedelta(days=30)
    else:
        start_date = timezone.now() - timedelta(days=7)
    
    # Calculate habit completion
    habits = Habit.objects.filter(user=user)
    total_target = sum(h.target_frequency for h in habits)
    completed_logs = HabitLog.objects.filter(
        user=user,
        completed_at__gte=start_date
    ).count()
    habit_completion = (completed_logs / total_target * 100) if total_target > 0 else 0
    
    # Get current streak
    current_streak = max([h.streak_current for h in habits], default=0)
    
    # Goals
    goals_active = Goal.objects.filter(user=user, status='active').count()
    goals_completed = Goal.objects.filter(
        user=user,
        status='completed',
        completed_at__gte=start_date
    ).count()
    
    return Response({
        'habit_completion': round(habit_completion, 2),
        'streak_current': current_streak,
        'goals_active': goals_active,
        'goals_completed': goals_completed,
        'period': period,
    }, status=status.HTTP_200_OK)
