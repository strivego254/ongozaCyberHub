"""
API views for Profiler Engine.
"""
import os
import requests
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ProfilerSession, ProfilerAnswer
from .serializers import (
    ProfilerSessionSerializer,
    StartProfilerSerializer,
    SubmitAnswersSerializer,
    FutureYouRequestSerializer,
    ProfilerStatusSerializer,
)
from student_dashboard.services import DashboardAggregationService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_profiler(request):
    """
    POST /api/v1/profiler/start
    Initialize profiler session.
    """
    user = request.user
    
    # Check for existing active session
    active_session = ProfilerSession.objects.filter(
        user=user,
        status__in=['started', 'current_self_complete']
    ).first()
    
    if active_session:
        serializer = ProfilerSessionSerializer(active_session)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # Create new session
    session = ProfilerSession.objects.create(
        user=user,
        status='started'
    )
    
    serializer = ProfilerSessionSerializer(session)
    return Response({
        'session_id': str(session.id),
        'questions': [
            {'key': 'skills.networking', 'type': 'scale', 'label': 'Network troubleshooting'},
            {'key': 'behaviors.discipline', 'type': 'likert', 'label': 'I follow through on commitments'},
        ]
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_answers(request):
    """
    POST /api/v1/profiler/answers
    Submit profiler answers.
    """
    serializer = SubmitAnswersSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    session_id = serializer.validated_data['session_id']
    answers_data = serializer.validated_data['answers']
    
    try:
        session = ProfilerSession.objects.get(id=session_id, user=request.user)
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Save answers
    with transaction.atomic():
        for answer_data in answers_data:
            ProfilerAnswer.objects.update_or_create(
                session=session,
                question_key=answer_data['question_key'],
                defaults={'answer': answer_data['answer']}
            )
        
        # Update session status
        if session.status == 'started':
            session.status = 'current_self_complete'
            session.save()
    
    # Queue Future-You generation
    from profiler.tasks import generate_future_you_task
    generate_future_you_task.delay(str(session.id))
    
    return Response({'status': 'answers_saved'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_future_you(request):
    """
    POST /api/v1/profiler/future-you
    Generate Future-You persona (triggers background job).
    """
    serializer = FutureYouRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    session_id = serializer.validated_data['session_id']
    
    try:
        session = ProfilerSession.objects.get(id=session_id, user=request.user)
    except ProfilerSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Trigger background job
    from profiler.tasks import generate_future_you_task
    generate_future_you_task.delay(str(session.id))
    
    return Response({'status': 'generating'}, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profiler_status(request):
    """
    GET /api/v1/profiler/status
    Get profiler status and recommendations.
    """
    session = ProfilerSession.objects.filter(
        user=request.user
    ).order_by('-created_at').first()
    
    if not session:
        return Response({
            'status': 'not_started',
            'current_self_complete': False,
            'future_you_complete': False,
        })
    
    track_recommendation = None
    if session.futureyou_persona:
        track_recommendation = {
            'track_id': str(session.recommended_track_id) if session.recommended_track_id else None,
            'confidence': float(session.track_confidence) if session.track_confidence else None,
            'persona': session.futureyou_persona,
        }
    
    return Response({
        'status': session.status,
        'track_recommendation': track_recommendation,
        'current_self_complete': session.status in ['current_self_complete', 'future_you_complete', 'finished'],
        'future_you_complete': session.status in ['future_you_complete', 'finished'],
    })
