"""
Coaching OS URL configuration.
"""
from django.urls import path
from .views import (
    habits_list, habit_detail, log_habit, habit_logs,
    goals_list, goal_detail,
    reflections_list, reflection_detail,
    ai_coach_message, ai_coach_history,
    coaching_metrics,
)

urlpatterns = [
    # Habits
    path('habits', habits_list, name='coaching-habits-list'),
    path('habits/<uuid:habit_id>', habit_detail, name='coaching-habit-detail'),
    path('habits/log', log_habit, name='coaching-habit-log'),
    path('habits/<uuid:habit_id>/logs', habit_logs, name='coaching-habit-logs'),
    
    # Goals
    path('goals', goals_list, name='coaching-goals-list'),
    path('goals/<uuid:goal_id>', goal_detail, name='coaching-goal-detail'),
    
    # Reflections
    path('reflections', reflections_list, name='coaching-reflections-list'),
    path('reflections/<uuid:reflection_id>', reflection_detail, name='coaching-reflection-detail'),
    
    # AI Coach
    path('ai-coach/message', ai_coach_message, name='coaching-ai-coach-message'),
    path('ai-coach/history', ai_coach_history, name='coaching-ai-coach-history'),
    
    # Metrics
    path('metrics', coaching_metrics, name='coaching-metrics'),
]
