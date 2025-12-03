"""
API views for Subscription Engine.
"""
import os
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SubscriptionPlan, UserSubscription
from .serializers import (
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
    SubscriptionStatusSerializer,
    UpgradeSubscriptionSerializer,
)
from .utils import get_user_tier
from student_dashboard.services import DashboardAggregationService
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    """
    GET /api/v1/subscription/status
    Get user's subscription status.
    """
    user = request.user
    
    try:
        subscription = user.subscription
        plan = subscription.plan
    except UserSubscription.DoesNotExist:
        # Default to free tier
        return Response({
            'tier': 'free',
            'days_enhanced_left': None,
            'can_upgrade': True,
            'features': [],
            'next_payment': None,
            'status': 'active',
        })
    
    # Check if can upgrade
    can_upgrade = subscription.plan.name != 'premium'
    
    return Response({
        'tier': subscription.plan.name,
        'days_enhanced_left': subscription.days_enhanced_left,
        'can_upgrade': can_upgrade,
        'features': subscription.plan.features,
        'next_payment': subscription.current_period_end,
        'status': subscription.status,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upgrade_subscription(request):
    """
    POST /api/v1/subscription/upgrade
    Upgrade subscription (creates Stripe session).
    """
    serializer = UpgradeSubscriptionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    plan_name = serializer.validated_data['plan']
    
    try:
        plan = SubscriptionPlan.objects.get(name=plan_name)
    except SubscriptionPlan.DoesNotExist:
        return Response(
            {'error': 'Invalid plan'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Create Stripe checkout session
    stripe_key = os.environ.get('STRIPE_SECRET_KEY')
    stripe_session_id = None
    
    if stripe_key:
        try:
            import stripe
            stripe.api_key = stripe_key
            
            # Get or create customer
            customer_id = None
            if hasattr(user, 'subscription') and user.subscription.stripe_subscription_id:
                # Get customer from existing subscription
                subscription = stripe.Subscription.retrieve(user.subscription.stripe_subscription_id)
                customer_id = subscription.customer
            else:
                # Create new customer
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.get_full_name() or user.email,
                )
                customer_id = customer.id
            
            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': plan.name.replace('_', ' ').title(),
                        },
                        'unit_amount': int(plan.price_monthly * 100) if plan.price_monthly else 0,
                        'recurring': {
                            'interval': 'month',
                        },
                    },
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/subscription/cancel",
            )
            stripe_session_id = session.id
        except Exception as e:
            logger.error(f"Stripe error: {e}")
            # Continue without Stripe for development
    
    return Response({
        'stripe_session_id': stripe_session_id,
        'plan': plan_name,
        'message': 'Redirect to Stripe checkout' if stripe_session_id else 'Upgrade pending',
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stripe_webhook(request):
    """
    POST /api/v1/subscription/webhooks/stripe
    Handle Stripe webhooks.
    """
    import json
    import hmac
    import hashlib
    
    stripe_key = os.environ.get('STRIPE_SECRET_KEY')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    if not stripe_key or not webhook_secret:
        return Response({'error': 'Stripe not configured'}, status=status.HTTP_400_BAD_REQUEST)
    
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        import stripe
        stripe.api_key = stripe_key
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle events
    from subscriptions.tasks import process_stripe_webhook_task
    process_stripe_webhook_task.delay(event)
    
    return Response({'status': 'received'}, status=status.HTTP_200_OK)
