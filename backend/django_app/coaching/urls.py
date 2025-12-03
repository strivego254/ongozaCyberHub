"""
URL configuration for Coaching OS.
"""
from django.urls import path
from .views import create_or_log_habit, create_goal, create_reflection, coaching_summary

app_name = 'coaching'

urlpatterns = [
    path('coaching/habits', create_or_log_habit, name='habits'),
    path('coaching/goals', create_goal, name='goals'),
    path('coaching/reflect', create_reflection, name='reflect'),
    path('coaching/summary', coaching_summary, name='summary'),
]

