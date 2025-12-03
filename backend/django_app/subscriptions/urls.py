"""
URL configuration for Subscription Engine.
"""
from django.urls import path
from .views import subscription_status, upgrade_subscription, stripe_webhook

app_name = 'subscriptions'

urlpatterns = [
    path('subscription/status', subscription_status, name='status'),
    path('subscription/upgrade', upgrade_subscription, name='upgrade'),
    path('subscription/webhooks/stripe', stripe_webhook, name='stripe-webhook'),
]

