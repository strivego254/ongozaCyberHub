"""
URL configuration for Profiler Engine.
"""
from django.urls import path
from .views import start_profiler, submit_answers, generate_future_you, profiler_status

app_name = 'profiler'

urlpatterns = [
    path('profiler/start', start_profiler, name='start'),
    path('profiler/answers', submit_answers, name='answers'),
    path('profiler/future-you', generate_future_you, name='future-you'),
    path('profiler/status', profiler_status, name='status'),
]

