"""
Views for Mentorship Coordination Engine.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Q, Count, F
from django.contrib.auth import get_user_model
from datetime import timedelta
import json
import uuid

from .models import MenteeMentorAssignment, MentorSession, MentorWorkQueue, MentorFlag
from .serializers import (
    MenteeMentorAssignmentSerializer,
    MentorSessionSerializer,
    MentorWorkQueueSerializer,
    MentorFlagSerializer,
    CreateSessionSerializer,
    MissionReviewSerializer,
    CreateFlagSerializer
)
from missions.models import MissionSubmission
from student_dashboard.services import DashboardAggregationService

User = get_user_model()


def get_current_mentor(user):
    """Verify user is a mentor."""
    if not user.is_mentor:
        raise Exception("User is not a mentor")
    return user


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_dashboard(request):
    """
    GET /api/v1/mentor/dashboard
    Mentor home dashboard with work queue, sessions, and at-risk mentees.
    """
    mentor = get_current_mentor(request.user)
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    # Work queue stats
    work_queue = MentorWorkQueue.objects.filter(mentor=mentor)
    overdue = work_queue.filter(status='overdue').count()
    today_items = work_queue.filter(
        due_at__gte=today_start,
        due_at__lt=today_end,
        status__in=['pending', 'in_progress']
    ).count()
    high_priority = work_queue.filter(
        priority__in=['urgent', 'high'],
        status__in=['pending', 'in_progress']
    ).count()
    total_pending = work_queue.filter(status__in=['pending', 'in_progress']).count()
    
    # Today's sessions
    today_sessions = MentorSession.objects.filter(
        mentor=mentor,
        start_time__gte=today_start,
        start_time__lt=today_end
    ).order_by('start_time')
    
    # At-risk mentees (simplified - would integrate with TalentScope)
    at_risk_mentees = []
    active_assignments = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        status='active'
    ).select_related('mentee')
    
    for assignment in active_assignments[:5]:  # Top 5
        flags = MentorFlag.objects.filter(
            mentee=assignment.mentee,
            resolved=False
        ).order_by('-created_at')[:1]
        
        if flags:
            flag = flags[0]
            at_risk_mentees.append({
                'mentee_id': str(assignment.mentee.id),
                'name': assignment.mentee.get_full_name() or assignment.mentee.email,
                'readiness_trend': -12.5,  # Would come from TalentScope
                'habit_streak': 0,  # Would come from Coaching OS
                'flag': flag.reason[:100]
            })
    
    # Capacity
    week_start = now - timedelta(days=now.weekday())
    week_sessions = MentorSession.objects.filter(
        mentor=mentor,
        start_time__gte=week_start
    ).count()
    capacity_used = f"{week_sessions}/{mentor.mentor_capacity_weekly}"
    
    # Next available slot (simplified)
    next_available = now + timedelta(hours=24)
    
    # Recent activity (last 10 work queue completions)
    recent_activity = MentorWorkQueue.objects.filter(
        mentor=mentor,
        status='completed'
    ).order_by('-completed_at')[:10].values(
        'mentee__email',
        'title',
        'completed_at'
    )
    
    return Response({
        'work_queue': {
            'overdue': overdue,
            'today': today_items,
            'high_priority': high_priority,
            'total_pending': total_pending
        },
        'today_sessions': MentorSessionSerializer(today_sessions, many=True).data,
        'at_risk_mentees': at_risk_mentees,
        'capacity': {
            'weekly_slots': capacity_used,
            'next_available': next_available.isoformat()
        },
        'recent_activity': [
            {
                'mentee': item['mentee__email'],
                'action': item['title'],
                'time': f"{(now - item['completed_at']).total_seconds() / 3600:.0f}h ago"
            }
            for item in recent_activity
        ]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_workqueue(request):
    """
    GET /api/v1/mentor/workqueue
    Get mentor's work queue items.
    """
    mentor = get_current_mentor(request.user)
    
    status_filter = request.query_params.get('status', 'pending')
    priority_filter = request.query_params.get('priority')
    
    queryset = MentorWorkQueue.objects.filter(mentor=mentor)
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    if priority_filter:
        queryset = queryset.filter(priority=priority_filter)
    
    queryset = queryset.order_by('-priority', 'due_at')
    
    serializer = MentorWorkQueueSerializer(queryset, many=True)
    
    # Add reference URLs
    data = serializer.data
    for item in data:
        if item['type'] == 'mission_review' and item['reference_id']:
            item['reference_url'] = f"/missions/{item['reference_id']}/review"
        else:
            item['reference_url'] = None
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentee_cockpit(request, mentee_id):
    """
    GET /api/v1/mentor/mentees/{mentee_id}/cockpit
    Get detailed mentee cockpit view.
    """
    mentor = get_current_mentor(request.user)
    
    # Verify assignment exists
    assignment = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee_id=mentee_id,
        status='active'
    ).first()
    
    if not assignment:
        return Response(
            {'error': 'Mentee not assigned to this mentor'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    mentee = assignment.mentee
    
    # Profile data
    profile = {
        'name': mentee.get_full_name() or mentee.email,
        'track': mentee.track_key or 'Not assigned',
        'futureyou': mentee.futureyou_persona.get('name', 'Not generated') if isinstance(mentee.futureyou_persona, dict) else 'Not generated',
        'readiness': 67.4,  # Would come from TalentScope
        'trend_7d': -2.1  # Would come from TalentScope
    }
    
    # Quick actions
    pending_missions = MissionSubmission.objects.filter(
        user=mentee,
        status__in=['submitted', 'ai_reviewed']
    ).order_by('-submitted_at')[:3]
    
    quick_actions = [
        {
            'type': 'review_mission',
            'title': mission.mission.title if hasattr(mission, 'mission') else 'Mission',
            'url': f"/missions/{mission.id}/review"
        }
        for mission in pending_missions
    ]
    quick_actions.append({
        'type': 'schedule_session',
        'url': '/sessions/new'
    })
    
    # Metrics (simplified - would integrate with actual data)
    metrics = {
        'habit_completion': 62.3,  # Would come from Coaching OS
        'missions_completed': 8,  # Would come from Missions
        'sessions_used': assignment.sessions_used
    }
    
    return Response({
        'profile': profile,
        'quick_actions': quick_actions,
        'metrics': metrics
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """
    POST /api/v1/mentor/sessions
    Create a mentor session and schedule Zoom meeting.
    """
    mentor = get_current_mentor(request.user)
    serializer = CreateSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    mentee_id = serializer.validated_data['mentee_id']
    
    # Verify assignment
    assignment = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee_id=mentee_id,
        status='active'
    ).first()
    
    if not assignment:
        return Response(
            {'error': 'Mentee not assigned to this mentor'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if assignment.sessions_used >= assignment.max_sessions:
        return Response(
            {'error': 'Maximum sessions reached for this assignment'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    start_time = serializer.validated_data['start_time']
    duration = serializer.validated_data['duration_minutes']
    end_time = start_time + timedelta(minutes=duration)
    
    # Create session
    session = MentorSession.objects.create(
        assignment=assignment,
        mentee_id=mentee_id,
        mentor=mentor,
        title=serializer.validated_data['title'],
        type=serializer.validated_data['type'],
        start_time=start_time,
        end_time=end_time,
        zoom_url=f"https://zoom.us/j/{uuid.uuid4().hex[:10]}"  # Mock Zoom URL
    )
    
    # Create work queue entry for session notes
    MentorWorkQueue.objects.create(
        mentor=mentor,
        mentee_id=mentee_id,
        type='session_notes',
        priority='normal',
        title=f"Session notes: {session.title}",
        reference_id=session.id,
        sla_hours=24,
        due_at=end_time + timedelta(hours=24)
    )
    
    # Update assignment
    assignment.sessions_used += 1
    assignment.save()
    
    # Trigger dashboard refresh for mentee
    DashboardAggregationService.queue_update(
        assignment.mentee,
        'session_scheduled',
        'normal'
    )
    
    return Response(MentorSessionSerializer(session).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_mission(request, submission_id):
    """
    POST /api/v1/mentor/missions/{submission_id}/review
    Review and approve/reject a mission submission.
    """
    mentor = get_current_mentor(request.user)
    
    try:
        submission = MissionSubmission.objects.get(id=submission_id)
    except MissionSubmission.DoesNotExist:
        return Response(
            {'error': 'Mission submission not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify assignment
    assignment = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee=submission.user,
        status='active'
    ).first()
    
    if not assignment:
        return Response(
            {'error': 'Mentee not assigned to this mentor'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = MissionReviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # Update submission
    submission.mentor_feedback = serializer.validated_data['feedback']
    submission.status = 'approved' if serializer.validated_data['approved'] else 'rejected'
    submission.reviewed_at = timezone.now()
    submission.save()
    
    # Complete work queue item
    work_item = MentorWorkQueue.objects.filter(
        mentor=mentor,
        mentee=submission.user,
        type='mission_review',
        reference_id=submission_id,
        status__in=['pending', 'in_progress']
    ).first()
    
    if work_item:
        work_item.status = 'completed'
        work_item.completed_at = timezone.now()
        work_item.save()
    
    # Trigger dashboard refresh (would update readiness score)
    DashboardAggregationService.queue_update(
        submission.user,
        'mission_reviewed',
        'high'
    )
    
    return Response({
        'status': 'success',
        'submission_id': str(submission.id),
        'approved': serializer.validated_data['approved']
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_flag(request):
    """
    POST /api/v1/mentor/flags
    Raise a risk flag for a mentee.
    """
    mentor = get_current_mentor(request.user)
    serializer = CreateFlagSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    mentee_id = serializer.validated_data['mentee_id']
    
    # Verify assignment
    assignment = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee_id=mentee_id,
        status='active'
    ).first()
    
    if not assignment:
        return Response(
            {'error': 'Mentee not assigned to this mentor'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create flag
    flag = MentorFlag.objects.create(
        mentor=mentor,
        mentee_id=mentee_id,
        reason=serializer.validated_data['reason'],
        severity=serializer.validated_data['severity']
    )
    
    # Notify director if high/critical
    if serializer.validated_data['severity'] in ['high', 'critical']:
        flag.director_notified = True
        flag.save()
        # Would send notification here
    
    # Trigger dashboard refresh
    DashboardAggregationService.queue_update(
        assignment.mentee,
        'risk_flag_raised',
        'urgent'
    )
    
    return Response(MentorFlagSerializer(flag).data, status=status.HTTP_201_CREATED)
