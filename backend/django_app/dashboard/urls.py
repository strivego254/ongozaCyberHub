from django.urls import path
from . import views
from . import views_websocket

app_name = 'dashboard'

urlpatterns = [
    path('overview/', views.dashboard_overview, name='overview'),
    path('metrics/', views.dashboard_metrics, name='metrics'),
    path('next-actions/', views.next_actions, name='next-actions'),
    path('events/', views.dashboard_events, name='events'),
    path('track-overview/', views.track_overview, name='track-overview'),
    path('community-feed/', views.community_feed, name='community-feed'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('habits/', views.dashboard_habits, name='habits'),
    path('ai-coach-nudge/', views.ai_coach_nudge, name='ai-coach-nudge'),
    path('sse/', views_websocket.dashboard_sse, name='sse'),
]

