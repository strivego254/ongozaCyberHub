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
    CreateGroupSessionSerializer,
    MissionReviewSerializer,
    CreateFlagSerializer
)
from missions.models import MissionSubmission
from student_dashboard.services import DashboardAggregationService
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


def get_current_mentor(user):
    """Verify user is a mentor."""
    if not user.is_mentor:
        raise Exception("User is not a mentor")
    return user


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mentees(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/mentees
    Get list of assigned mentees for a mentor.
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own mentees'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    mentor = get_current_mentor(request.user)
    
    # Get active assignments
    assignments = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        status='active'
    ).select_related('mentee')
    
    # Get mentee dashboard data for readiness scores
    from student_dashboard.models import StudentDashboardCache
    from missions.models import MissionSubmission
    
    mentees_data = []
    for assignment in assignments:
        mentee = assignment.mentee
        
        # Get readiness score from dashboard cache
        cache = StudentDashboardCache.objects.filter(user=mentee).first()
        readiness_score = float(cache.readiness_score) if cache else 0.0
        
        # Determine readiness label
        if readiness_score >= 80:
            readiness_label = "Advanced Ready"
        elif readiness_score >= 70:
            readiness_label = "Ready for Intermediate"
        elif readiness_score >= 40:
            readiness_label = "Needs Support"
        else:
            readiness_label = "At Risk"
        
        # Get last activity (from last login or session)
        last_activity = mentee.last_login or mentee.updated_at
        
        # Get risk level from cache or default
        risk_level = cache.risk_level if cache and cache.risk_level else 'low'
        
        # Count completed missions
        missions_completed = MissionSubmission.objects.filter(
            user=mentee,
            status='approved'
        ).count()
        
        mentees_data.append({
            'id': str(mentee.id),
            'name': mentee.get_full_name() or mentee.email,
            'email': mentee.email,
            'track': mentee.track_key or None,
            'cohort': assignment.cohort_id or None,
            'readiness_score': readiness_score,
            'readiness_label': readiness_label,
            'last_activity_at': last_activity.isoformat() if last_activity else None,
            'risk_level': risk_level.lower(),
            'missions_completed': missions_completed,
        })
    
    return Response(mentees_data)


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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mentor_sessions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/sessions - List group mentorship sessions
    POST /api/v1/mentors/{mentor_id}/sessions - Create a group mentorship session
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"mentor_sessions called: method={request.method}, mentor_id={mentor_id}, user_id={request.user.id}")
    
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        logger.warning(f"Mentor ID mismatch: user_id={request.user.id}, mentor_id={mentor_id}")
        return Response(
            {'error': 'You can only access your own sessions'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        mentor = get_current_mentor(request.user)
    except Exception as e:
        logger.error(f"Error getting mentor: {e}")
        return Response(
            {'error': f'User is not a mentor: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if request.method == 'GET':
        # List sessions
        status_filter = request.query_params.get('status', 'all')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = MentorSession.objects.filter(
            mentor=mentor,
            type='group'
        )
        
        if status_filter != 'all':
            # Map frontend status to database fields
            if status_filter == 'scheduled':
                queryset = queryset.filter(start_time__gt=timezone.now(), attended=False)
            elif status_filter == 'completed':
                queryset = queryset.filter(attended=True)
        
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__lte=end_date)
        
        queryset = queryset.order_by('-start_time')
        sessions = queryset.select_related('mentee', 'assignment')
        
        # Format sessions for frontend
        sessions_data = []
        for session in sessions:
            outcomes = session.outcomes or {}
            sessions_data.append({
                'id': str(session.id),
                'mentor_id': str(mentor.id),
                'title': session.title,
                'description': outcomes.get('description', ''),
                'scheduled_at': session.start_time.isoformat(),
                'duration_minutes': int((session.end_time - session.start_time).total_seconds() / 60),
                'meeting_link': session.zoom_url or '',
                'meeting_type': outcomes.get('meeting_type', 'zoom'),
                'track_assignment': outcomes.get('track_assignment', ''),
                'recording_url': None,  # Would come from separate field if added
                'transcript_url': None,  # Would come from separate field if added
                'status': 'completed' if session.attended else ('in_progress' if session.start_time <= timezone.now() <= session.end_time else 'scheduled'),
                'attendance': [],  # Would need to be populated from a separate model
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
            })
        
        return Response(sessions_data)
    
    elif request.method == 'POST':
        # Create group session
        logger.info(f"Creating group session with data: {request.data}")
        serializer = CreateGroupSessionSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Serializer validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        scheduled_at = serializer.validated_data['scheduled_at']
        duration = serializer.validated_data['duration_minutes']
        end_time = scheduled_at + timedelta(minutes=duration)
        
        # For group sessions, we need to create a session without a specific mentee
        # We'll use the mentor's first active assignment as a placeholder, or create a dummy one
        # Get first active assignment for this mentor (or create a placeholder)
        first_assignment = MenteeMentorAssignment.objects.filter(
            mentor=mentor,
            status='active'
        ).first()
        
        if not first_assignment:
            # If no assignments exist, we can't create a session (group sessions still need a base assignment)
            return Response(
                {'error': 'No active mentee assignments found. Group sessions require at least one active assignment.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create group session using first assignment as base (group sessions can have multiple mentees)
        session = MentorSession.objects.create(
            assignment=first_assignment,
            mentee=first_assignment.mentee,  # Use first mentee as placeholder
            mentor=mentor,
            title=serializer.validated_data['title'],
            type='group',
            start_time=scheduled_at,
            end_time=end_time,
            zoom_url=serializer.validated_data.get('meeting_link', '') or f"https://zoom.us/j/{uuid.uuid4().hex[:10]}",
            notes=serializer.validated_data.get('description', '')
        )
        
        # Store track assignment and meeting type in outcomes JSON field
        session.outcomes = {
            'track_assignment': serializer.validated_data.get('track_assignment', ''),
            'meeting_type': serializer.validated_data.get('meeting_type', 'zoom'),
            'description': serializer.validated_data.get('description', '')
        }
        session.save()
        
        # Return session data in format expected by frontend
        session_data = {
            'id': str(session.id),
            'mentor_id': str(mentor.id),
            'title': session.title,
            'description': serializer.validated_data.get('description', ''),
            'scheduled_at': scheduled_at.isoformat(),
            'duration_minutes': duration,
            'meeting_type': serializer.validated_data.get('meeting_type', 'zoom'),
            'meeting_link': session.zoom_url,
            'track_assignment': serializer.validated_data.get('track_assignment', ''),
            'status': 'scheduled',
            'attendance': [],
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
        }
        
        return Response(session_data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """
    POST /api/v1/mentor/sessions
    Create a one-on-one mentor session and schedule Zoom meeting.
    """
    mentor = get_current_mentor(request.user)
    serializer = CreateSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    mentee_id = serializer.validated_data.get('mentee_id')
    
    if not mentee_id:
        return Response(
            {'error': 'mentee_id is required for one-on-one sessions'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
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
    # Combine flag_type and description into reason field
    reason_parts = []
    if serializer.validated_data.get('flag_type'):
        reason_parts.append(f"Flag Type: {serializer.validated_data['flag_type']}")
    if serializer.validated_data.get('description'):
        reason_parts.append(serializer.validated_data['description'])
    if serializer.validated_data.get('reason'):
        reason_parts.append(serializer.validated_data['reason'])
    
    reason = ' | '.join(reason_parts) if reason_parts else 'No reason provided'
    
    flag = MentorFlag.objects.create(
        mentor=mentor,
        mentee_id=mentee_id,
        reason=reason,
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mission_submissions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/missions/submissions
    Get mission submission queue for mentor's mentees.
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own submissions'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    mentor = get_current_mentor(request.user)
    
    # Get active assignments
    assignments = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        status='active'
    ).values_list('mentee_id', flat=True)
    
    status_filter = request.query_params.get('status', 'all')
    limit = int(request.query_params.get('limit', 50))
    offset = int(request.query_params.get('offset', 0))
    
    # Get submissions for mentor's mentees
    queryset = MissionSubmission.objects.filter(user_id__in=assignments)
    
    if status_filter == 'pending_review':
        queryset = queryset.filter(status__in=['submitted', 'ai_reviewed'])
    elif status_filter == 'in_review':
        queryset = queryset.filter(status='in_review')
    
    total_count = queryset.count()
    submissions = queryset.order_by('-submitted_at')[offset:offset + limit]
    
    submissions_data = []
    for submission in submissions:
        submissions_data.append({
            'id': str(submission.id),
            'mission_id': str(submission.mission_id) if submission.mission_id else None,
            'mission_title': submission.mission.title if hasattr(submission, 'mission') and submission.mission else 'Unknown',
            'mentee_id': str(submission.user.id),
            'mentee_name': submission.user.get_full_name() or submission.user.email,
            'status': submission.status,
            'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else None,
            'ai_score': float(submission.ai_score) if submission.ai_score else None,
            'mentor_score': float(submission.mentor_score) if submission.mentor_score else None,
        })
    
    return Response({
        'results': submissions_data,
        'count': total_count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_all_missions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/missions
    Get all missions defined by directors (read-only for mentors).
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own missions'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from missions.models import Mission
    from missions.serializers import MissionSerializer
    from django.db.models import Q
    
    # Get query parameters for filtering
    track_key = request.query_params.get('track_key')
    track = request.query_params.get('track')
    difficulty = request.query_params.get('difficulty')
    tier = request.query_params.get('tier')
    mission_type = request.query_params.get('type')
    search = request.query_params.get('search')
    is_active = request.query_params.get('is_active', 'true')
    
    # Build queryset
    queryset = Mission.objects.all()
    
    if is_active.lower() == 'true':
        queryset = queryset.filter(is_active=True)
    
    if track_key:
        queryset = queryset.filter(track_key=track_key)
    
    if track:
        queryset = queryset.filter(track=track)
    
    if difficulty:
        queryset = queryset.filter(difficulty=difficulty)
    
    if tier:
        queryset = queryset.filter(tier=tier)
    
    if mission_type:
        queryset = queryset.filter(type=mission_type)
    
    if search:
        queryset = queryset.filter(
            Q(code__icontains=search) |
            Q(title__icontains=search) |
            Q(description__icontains=search)
        )
    
    # Order by created_at
    queryset = queryset.order_by('-created_at')
    
    # Pagination
    limit = int(request.query_params.get('limit', 50))
    offset = int(request.query_params.get('offset', 0))
    total_count = queryset.count()
    missions = queryset[offset:offset + limit]
    
    serializer = MissionSerializer(missions, many=True)
    
    return Response({
        'results': serializer.data,
        'count': total_count,
        'limit': limit,
        'offset': offset
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_submission_status(request, submission_id):
    """
    PATCH /api/v1/mentors/missions/submissions/{submission_id}/status
    Update mission submission status (reviewed, in_progress, scheduled).
    """
    from missions.models import MissionSubmission
    
    try:
        submission = MissionSubmission.objects.get(id=submission_id)
    except MissionSubmission.DoesNotExist:
        return Response(
            {'error': 'Mission submission not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify mentor has access to this submission
    mentor = get_current_mentor(request.user)
    assignments = MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        mentee=submission.user,
        status='active'
    ).exists()
    
    if not assignments:
        return Response(
            {'error': 'You do not have access to this submission'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update status
    new_status = request.data.get('status')
    valid_statuses = ['in_progress', 'in_mentor_review', 'scheduled', 'reviewed']
    
    if new_status not in valid_statuses:
        return Response(
            {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    submission.status = new_status
    
    # Add notes if provided (store in mentor_feedback or create a JSON field)
    # For now, we'll append to mentor_feedback if notes are provided
    if 'notes' in request.data and request.data['notes']:
        if submission.mentor_feedback:
            submission.mentor_feedback += f"\n\n[Status Update - {timezone.now().strftime('%Y-%m-%d %H:%M')}]: {request.data['notes']}"
        else:
            submission.mentor_feedback = f"[Status Update - {timezone.now().strftime('%Y-%m-%d %H:%M')}]: {request.data['notes']}"
    
    submission.save()
    
    return Response({
        'id': str(submission.id),
        'status': submission.status,
        'updated_at': timezone.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_flags(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/flags
    Get all flags raised by a mentor.
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own flags'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    mentor = get_current_mentor(request.user)
    
    # Get query parameters
    status_filter = request.query_params.get('status', 'all')
    severity_filter = request.query_params.get('severity')
    
    # Build queryset
    queryset = MentorFlag.objects.filter(mentor=mentor)
    
    if status_filter == 'open':
        queryset = queryset.filter(resolved=False)
    elif status_filter == 'resolved':
        queryset = queryset.filter(resolved=True)
    
    if severity_filter:
        queryset = queryset.filter(severity=severity_filter)
    
    flags = queryset.order_by('-created_at')
    
    serializer = MentorFlagSerializer(flags, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mentee_talentscope(request, mentor_id, mentee_id):
    """
    GET /api/v1/mentors/{mentor_id}/mentees/{mentee_id}/talentscope
    Get TalentScope mentor view for a mentee.
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own mentees'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    mentor = get_current_mentor(request.user)
    
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
    
    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Mentee not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get TalentScope data (simplified - would integrate with actual TalentScope service)
    from student_dashboard.models import StudentDashboardCache
    
    try:
        cache = StudentDashboardCache.objects.filter(user=mentee).only(
            'readiness_score', 'estimated_readiness_window', 'skills_heatmap'
        ).first()
        
        skills_heatmap = cache.skills_heatmap if cache and hasattr(cache, 'skills_heatmap') else {}
        readiness_score = cache.readiness_score if cache and hasattr(cache, 'readiness_score') else None
    except Exception as e:
        logger.warning(f"Failed to load TalentScope cache: {e}")
        skills_heatmap = {}
        readiness_score = None
    
    return Response({
        'mentee_id': str(mentee.id),
        'mentee_name': mentee.get_full_name() or mentee.email,
        'readiness_score': float(readiness_score) if readiness_score else None,
        'skills_heatmap': skills_heatmap if isinstance(skills_heatmap, dict) else {},
        'ingested_signals': {
            'mission_scores': MissionSubmission.objects.filter(user=mentee).count(),
            'habit_logs': 0,  # Would integrate with coaching module
            'mentor_evaluations': 0,  # Would integrate with evaluation system
            'community_engagement': 0,  # Would integrate with community module
        },
        'performance_trend': []  # Would come from TalentScope
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_influence_index(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/influence
    Get mentor influence index metrics.
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own influence index'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    mentor = get_current_mentor(request.user)
    
    # Get date range
    from datetime import datetime
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Get assignments
    assignments = MenteeMentorAssignment.objects.filter(mentor=mentor, status='active')
    mentee_ids = assignments.values_list('mentee_id', flat=True)
    
    # Calculate metrics (simplified - would integrate with actual TalentScope influence tracking)
    total_feedback = MissionSubmission.objects.filter(
        user_id__in=mentee_ids,
        mentor_feedback__isnull=False
    ).exclude(mentor_feedback='').count()
    
    total_sessions = MentorSession.objects.filter(
        mentor=mentor,
        type='group'
    ).count()
    
    approved_missions = MissionSubmission.objects.filter(
        user_id__in=mentee_ids,
        status='approved'
    ).count()
    
    total_reviewed = MissionSubmission.objects.filter(
        user_id__in=mentee_ids,
        mentor_reviewed_at__isnull=False
    ).count()
    
    # Calculate period (default to last 30 days if not specified)
    from datetime import datetime, timedelta
    if start_date:
        try:
            period_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except:
            period_start = timezone.now() - timedelta(days=30)
    else:
        period_start = timezone.now() - timedelta(days=30)
    
    if end_date:
        try:
            period_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except:
            period_end = timezone.now()
    else:
        period_end = timezone.now()
    
    # Calculate overall influence score (simplified)
    avg_correlation = (
        0.75 + 0.68 + 0.82
    ) / 3  # Average of correlation coefficients
    improvement_factor = 75.0 / 100  # Normalize improvement rate
    overall_score = (avg_correlation * 0.5 + improvement_factor * 0.5) * 10  # Scale to 0-10
    
    return Response({
        'mentor_id': str(mentor.id),
        'overall_influence_score': round(overall_score, 1),
        'metrics': {
            'total_feedback_given': total_feedback,
            'average_response_time_hours': 24,  # Would calculate from actual data
            'mentee_improvement_rate': 75.0,  # Would calculate from TalentScope
            'session_attendance_rate': 85.0,  # Would calculate from session data
            'mission_approval_rate': (approved_missions / total_reviewed * 100) if total_reviewed > 0 else 0,
        },
        'correlation_data': {
            'feedback_to_performance': 0.75,  # Would calculate from TalentScope
            'sessions_to_engagement': 0.68,  # Would calculate from data
            'reviews_to_mission_quality': 0.82,  # Would calculate from data
        },
        'period': {
            'start_date': period_start.isoformat(),
            'end_date': period_end.isoformat(),
        },
        'trend_data': []  # Would come from historical data
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_group_session(request, session_id):
    """
    PATCH /api/v1/mentors/sessions/{session_id}
    Update a group mentorship session (post-session management).
    """
    try:
        session = MentorSession.objects.get(id=session_id, type='group')
    except MentorSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify the mentor owns this session
    if str(session.mentor.id) != str(request.user.id):
        return Response(
            {'error': 'You can only update your own sessions'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update session fields
    if 'recording_url' in request.data:
        if not session.outcomes:
            session.outcomes = {}
        session.outcomes['recording_url'] = request.data['recording_url']
    
    if 'transcript_url' in request.data:
        if not session.outcomes:
            session.outcomes = {}
        session.outcomes['transcript_url'] = request.data['transcript_url']
    
    if 'structured_notes' in request.data:
        if not session.outcomes:
            session.outcomes = {}
        session.outcomes['structured_notes'] = request.data['structured_notes']
    
    if 'scheduled_at' in request.data:
        from datetime import datetime
        scheduled_at = datetime.fromisoformat(request.data['scheduled_at'].replace('Z', '+00:00'))
        session.start_time = scheduled_at
    
    if 'duration_minutes' in request.data:
        duration = int(request.data['duration_minutes'])
        session.end_time = session.start_time + timedelta(minutes=duration)
    
    if 'is_closed' in request.data:
        session.attended = request.data['is_closed']
    
    session.save()
    
    # Return updated session data
    return Response({
        'id': str(session.id),
        'mentor_id': str(session.mentor.id),
        'title': session.title,
        'description': session.outcomes.get('description', '') if session.outcomes else '',
        'scheduled_at': session.start_time.isoformat(),
        'duration_minutes': int((session.end_time - session.start_time).total_seconds() / 60),
        'meeting_link': session.zoom_url or '',
        'meeting_type': session.outcomes.get('meeting_type', 'zoom') if session.outcomes else 'zoom',
        'recording_url': session.outcomes.get('recording_url') if session.outcomes else None,
        'transcript_url': session.outcomes.get('transcript_url') if session.outcomes else None,
        'structured_notes': session.outcomes.get('structured_notes') if session.outcomes else None,
        'status': 'completed' if session.attended else ('in_progress' if session.start_time <= timezone.now() <= session.end_time else 'scheduled'),
        'is_closed': session.attended,
        'attendance': [],
        'created_at': session.created_at.isoformat(),
        'updated_at': session.updated_at.isoformat(),
    })
