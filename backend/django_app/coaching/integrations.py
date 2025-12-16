"""
Coaching OS Platform Integrations - Missions gatekeeping, TalentScope signals.
"""
from django.db.models import Q
from .models import Habit, HabitLog, Goal, Reflection
from .services import calculate_coaching_metrics
from talentscope.models import BehaviorSignal
import logging

logger = logging.getLogger(__name__)


def can_start_mission(user, mission_id=None):
    """
    Check if user can start a mission based on coaching metrics.
    
    Rules:
    - Habit streak >= 3 days
    - Has recent reflection (within 7 days)
    """
    metrics = calculate_coaching_metrics(user)
    
    # Check habit streak
    if metrics['totalStreakDays'] < 3:
        return False, 'Complete 3-day habit streak first. Log your daily habits!'
    
    # Check recent reflection
    from datetime import date, timedelta
    seven_days_ago = date.today() - timedelta(days=7)
    recent_reflection = Reflection.objects.filter(
        user=user,
        date__gte=seven_days_ago
    ).exists()
    
    if not recent_reflection:
        return False, 'Log a daily reflection to unlock missions. Reflect on your progress!'
    
    return True, None


def get_mission_score_multiplier(user):
    """
    Get mission score multiplier based on coaching metrics.
    
    - Missing reflection: -20% multiplier
    - High alignment score (>80%): +10% multiplier
    - Long streak (>14 days): +5% multiplier
    """
    multiplier = 1.0
    metrics = calculate_coaching_metrics(user)
    
    # Check recent reflection
    from datetime import date, timedelta
    seven_days_ago = date.today() - timedelta(days=7)
    recent_reflection = Reflection.objects.filter(
        user=user,
        date__gte=seven_days_ago
    ).exists()
    
    if not recent_reflection:
        multiplier -= 0.20
    
    # High alignment bonus
    if metrics['alignmentScore'] > 80:
        multiplier += 0.10
    
    # Long streak bonus
    if metrics['totalStreakDays'] > 14:
        multiplier += 0.05
    
    return max(0.5, min(1.5, multiplier))  # Clamp between 0.5x and 1.5x


def sync_to_talentscope(user, event_type, data):
    """
    Sync coaching events to TalentScope behavior signals.
    Called from emit_coaching_event.
    """
    if event_type == 'habit.logged' and data.get('status') == 'completed':
        # Already handled in views.log_habit
        pass
    
    elif event_type == 'reflection.saved':
        # Already handled in views.reflections_list
        pass
    
    elif event_type == 'goal.completed':
        # Already handled in views.goal_detail
        pass

