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

from .models import MenteeMentorAssignment, MentorSession, MentorWorkQueue, MentorFlag, SessionAttendance
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

User = get_user_model()


def get_current_mentor(user):
    """Verify user is a mentor (either via is_mentor flag or active mentor role)."""
    # Fast path: explicit mentor flag
    if getattr(user, 'is_mentor', False):
        return user

    # Fallback: active role record
    try:
        from users.models import UserRole
        has_mentor_role = UserRole.objects.filter(
            user=user,
            role__name='mentor',
            is_active=True
        ).exists()
        if has_mentor_role:
            return user
    except Exception:
        # If role system isn't available, keep legacy behavior
        pass

    raise Exception("User is not a mentor")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_flags(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/flags
    Get flags raised by this mentor.

    Optional query params:
    - status: open|closed (maps to resolved flag)
    - severity: low|medium|high|critical
    """
    # Verify the mentor_id matches the authenticated user
    if str(request.user.id) != str(mentor_id):
        return Response(
            {'error': 'You can only view your own flags'},
            status=status.HTTP_403_FORBIDDEN
        )

    mentor = get_current_mentor(request.user)

    qs = MentorFlag.objects.filter(mentor=mentor)

    status_filter = request.query_params.get('status')
    if status_filter:
        sf = status_filter.strip().lower()
        if sf in ['open', 'active', 'pending']:
            qs = qs.filter(resolved=False)
        elif sf in ['closed', 'resolved', 'done']:
            qs = qs.filter(resolved=True)

    severity = request.query_params.get('severity')
    if severity:
        qs = qs.filter(severity=severity)

    qs = qs.order_by('-created_at')
    serializer = MentorFlagSerializer(qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


def _mentor_can_view_mentee(mentor, mentee) -> bool:
    """
    Mentors can view a mentee if:
    - there's an active direct mentor<->mentee assignment, OR
    - the mentor is assigned (active) to any cohort the mentee is actively enrolled in.
    """
    if MenteeMentorAssignment.objects.filter(mentor=mentor, mentee=mentee, status='active').exists():
        return True

    try:
        from programs.models import Enrollment, MentorAssignment
        mentee_cohort_ids = Enrollment.objects.filter(
            user=mentee,
            status='active'
        ).values_list('cohort_id', flat=True)
        if not mentee_cohort_ids:
            return False
        return MentorAssignment.objects.filter(
            mentor=mentor,
            cohort_id__in=mentee_cohort_ids,
            active=True
        ).exists()
    except Exception:
        # If programs app isn't available, fall back to direct assignment only
        return False


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mentee_talentscope(request, mentor_id, mentee_id):
    """
    GET /api/v1/mentors/{mentor_id}/mentees/{mentee_id}/talentscope
    TalentScope mentor view for a specific mentee.
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own mentor analytics'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response({'error': 'Mentee not found'}, status=status.HTTP_404_NOT_FOUND)

    if not _mentor_can_view_mentee(mentor, mentee):
        return Response({'error': 'Mentee not assigned to this mentor'}, status=status.HTTP_403_FORBIDDEN)

    # Pull TalentScope models if available
    try:
        from talentscope.models import SkillSignal, BehaviorSignal, ReadinessSnapshot
    except Exception:
        SkillSignal = None
        BehaviorSignal = None
        ReadinessSnapshot = None

    # Latest readiness snapshot (source of truth for advanced fields)
    latest_snapshot = None
    if ReadinessSnapshot is not None:
        latest_snapshot = ReadinessSnapshot.objects.filter(mentee=mentee).order_by('-snapshot_date').first()

    # Skills heatmap (skill_name -> mastery_level)
    skills_heatmap = {}
    if SkillSignal is not None:
        latest_by_skill = {}
        for s in SkillSignal.objects.filter(mentee=mentee).order_by('-created_at')[:500]:
            if s.skill_name not in latest_by_skill:
                latest_by_skill[s.skill_name] = s
        skills_heatmap = {k: float(v.mastery_level) for k, v in latest_by_skill.items()}

    # Behavioral trends (last 30 days)
    today = timezone.now().date()
    start = today - timedelta(days=29)
    days = [start + timedelta(days=i) for i in range(30)]
    trend_map = {d.isoformat(): {'missions_completed': 0, 'hours_studied': 0.0, 'reflections_count': 0} for d in days}

    # Missions completed (approved)
    for row in MissionSubmission.objects.filter(
        user=mentee,
        status='approved',
        created_at__date__gte=start,
        created_at__date__lte=today
    ).values('created_at__date').annotate(c=Count('id')):
        day = row['created_at__date'].isoformat()
        trend_map[day]['missions_completed'] = int(row['c'])

    if BehaviorSignal is not None:
        # hours_studied: sum of study_consistency values
        for row in BehaviorSignal.objects.filter(
            mentee=mentee,
            behavior_type='study_consistency',
            recorded_at__date__gte=start,
            recorded_at__date__lte=today
        ).values('recorded_at__date').annotate(total=Count('id'), sum_val=F('recorded_at__date')):
            # We can't sum DecimalField with this limited import set in this file; do a simple per-row loop instead.
            pass

        # fallback simple aggregation in python (safe, small window)
        for sig in BehaviorSignal.objects.filter(
            mentee=mentee,
            recorded_at__date__gte=start,
            recorded_at__date__lte=today
        ).only('behavior_type', 'value', 'recorded_at')[:2000]:
            day = sig.recorded_at.date().isoformat()
            if day not in trend_map:
                continue
            if sig.behavior_type == 'study_consistency':
                trend_map[day]['hours_studied'] += float(sig.value)
            if sig.behavior_type == 'reflection_frequency':
                trend_map[day]['reflections_count'] += 1

    behavioral_trends = [
        {'date': d, **vals} for d, vals in sorted(trend_map.items(), key=lambda x: x[0])
    ]

    # Readiness over time
    readiness_over_time = []
    if ReadinessSnapshot is not None:
        for snap in ReadinessSnapshot.objects.filter(mentee=mentee).order_by('snapshot_date')[:120]:
            readiness_over_time.append({
                'date': snap.snapshot_date.date().isoformat(),
                'score': float(snap.core_readiness_score)
            })

    # Ingested signals (best-effort counts)
    mentor_evaluations = MentorSession.objects.filter(mentor=mentor, mentee=mentee).count()
    habit_logs = 0
    community_engagement = 0
    if BehaviorSignal is not None:
        habit_logs = BehaviorSignal.objects.filter(mentee=mentee, source='habit_log').count()
        community_engagement = BehaviorSignal.objects.filter(
            mentee=mentee,
            behavior_type__in=['engagement_level', 'collaboration']
        ).count()

    mission_scores = MissionSubmission.objects.filter(
        user=mentee
    ).filter(Q(ai_score__isnull=False) | Q(mentor_score__isnull=False)).count()

    # Default advanced fields from snapshot when available
    core_readiness_score = float(latest_snapshot.core_readiness_score) if latest_snapshot else None
    career_readiness_stage = getattr(latest_snapshot, 'career_readiness_stage', None) if latest_snapshot else None
    learning_velocity = float(latest_snapshot.learning_velocity) if latest_snapshot and latest_snapshot.learning_velocity is not None else None
    estimated_readiness_window = getattr(latest_snapshot, 'estimated_readiness_window', None) if latest_snapshot else None

    readiness_breakdown = getattr(latest_snapshot, 'breakdown', None) if latest_snapshot else None
    gap_analysis = None
    professional_tier_data = None
    if latest_snapshot:
        gap_analysis = {
            'strengths': getattr(latest_snapshot, 'strengths', []) or [],
            'weaknesses': getattr(latest_snapshot, 'weaknesses', []) or [],
            'missing_skills': getattr(latest_snapshot, 'missing_skills', []) or [],
            'improvement_plan': getattr(latest_snapshot, 'improvement_plan', []) or [],
        }
        professional_tier_data = {
            'job_fit_score': float(latest_snapshot.job_fit_score) if latest_snapshot.job_fit_score is not None else None,
            'hiring_timeline_prediction': getattr(latest_snapshot, 'hiring_timeline_prediction', None),
            'track_benchmarks': getattr(latest_snapshot, 'track_benchmarks', None) or {},
        }

    return Response({
        'mentee_id': str(mentee.id),
        'mentee_name': mentee.get_full_name() or mentee.email,
        'ingested_signals': {
            'mentor_evaluations': mentor_evaluations,
            'habit_logs': habit_logs,
            'mission_scores': mission_scores,
            'reflection_sentiment': {'positive': 0, 'neutral': 0, 'negative': 0},
            'community_engagement': community_engagement,
        },
        'skills_heatmap': skills_heatmap,
        'behavioral_trends': behavioral_trends,
        'readiness_over_time': readiness_over_time,
        'core_readiness_score': core_readiness_score,
        'career_readiness_stage': career_readiness_stage,
        'learning_velocity': learning_velocity,
        'estimated_readiness_window': estimated_readiness_window,
        'readiness_breakdown': readiness_breakdown,
        'gap_analysis': gap_analysis,
        'professional_tier_data': professional_tier_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mission_submissions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/missions/submissions
    List mission submissions for mentees a mentor can access.
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own submissions view'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    status_filter = request.query_params.get('status')
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    offset = (page - 1) * page_size

    mentee_ids = set(MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        status='active'
    ).values_list('mentee_id', flat=True))

    # Include mentees from cohorts the mentor is assigned to (best effort)
    try:
        from programs.models import Enrollment, MentorAssignment
        cohort_ids = MentorAssignment.objects.filter(mentor=mentor, active=True).values_list('cohort_id', flat=True)
        cohort_mentee_ids = Enrollment.objects.filter(cohort_id__in=cohort_ids, status='active').values_list('user_id', flat=True)
        mentee_ids.update(cohort_mentee_ids)
    except Exception:
        pass

    qs = MissionSubmission.objects.filter(user_id__in=list(mentee_ids)).select_related('user', 'mission').order_by('-created_at')
    if status_filter:
        qs = qs.filter(status=status_filter)

    total = qs.count()
    rows = qs[offset:offset + page_size]

    results = []
    for sub in rows:
        results.append({
            'id': str(sub.id),
            'mission_id': str(sub.mission_id),
            'mission_title': getattr(sub.mission, 'title', ''),
            'mentee_id': str(sub.user_id),
            'mentee_name': sub.user.get_full_name() or sub.user.email,
            'mentee_email': sub.user.email,
            'submitted_at': sub.submitted_at.isoformat() if sub.submitted_at else None,
            'status': sub.status,
            'mentor_score': float(sub.mentor_score) if sub.mentor_score is not None else None,
            'ai_score': float(sub.ai_score) if sub.ai_score is not None else None,
        })

    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'results': results,
    })


def _ensure_tz_aware(dt):
    if dt is None:
        return None
    if timezone.is_naive(dt):
        return timezone.make_aware(dt)
    return dt


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_group_session(request, session_id):
    """
    PATCH /api/v1/mentors/sessions/{session_id}
    Update a group mentorship session (recording/transcript, notes, attendance, schedule, closure).
    """
    mentor = get_current_mentor(request.user)
    try:
        session = MentorSession.objects.get(id=session_id, mentor=mentor, type='group')
    except MentorSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data or {}

    # Update schedule
    scheduled_at = data.get('scheduled_at')
    duration_minutes = data.get('duration_minutes')
    if scheduled_at:
        # Reuse CreateGroupSessionSerializer datetime parsing logic
        try:
            tmp = CreateGroupSessionSerializer(data={'title': 'tmp', 'scheduled_at': scheduled_at, 'duration_minutes': 60})
            tmp.is_valid(raise_exception=True)
            start_time = tmp.validated_data['scheduled_at']
            session.start_time = _ensure_tz_aware(start_time)
            if duration_minutes is None:
                duration_minutes = int((session.end_time - session.start_time).total_seconds() / 60)
        except Exception as e:
            return Response({'error': f'Invalid scheduled_at: {e}'}, status=status.HTTP_400_BAD_REQUEST)

    if duration_minutes is not None:
        try:
            dur = int(duration_minutes)
            session.end_time = _ensure_tz_aware(session.start_time) + timedelta(minutes=dur)
        except Exception:
            return Response({'error': 'Invalid duration_minutes'}, status=status.HTTP_400_BAD_REQUEST)

    # Update meeting info
    meeting_link = data.get('meeting_link')
    if meeting_link is not None:
        session.zoom_url = meeting_link

    # Update recording/transcript
    if 'recording_url' in data:
        session.recording_url = data.get('recording_url') or ''
    if 'transcript_url' in data:
        session.transcript_url = data.get('transcript_url') or ''

    # Notes
    if 'structured_notes' in data:
        session.structured_notes = data.get('structured_notes') or {}
    if 'notes' in data:
        session.notes = data.get('notes') or ''

    # Close session
    if 'is_closed' in data:
        session.is_closed = bool(data.get('is_closed'))

    # Attendance records (optional)
    attendance = data.get('attendance')
    if isinstance(attendance, list):
        for row in attendance:
            mentee_id = row.get('mentee_id')
            if not mentee_id:
                continue
            rec, _ = SessionAttendance.objects.get_or_create(session=session, mentee_id=mentee_id)
            if 'attended' in row:
                rec.attended = bool(row.get('attended'))
            if row.get('joined_at'):
                try:
                    rec.joined_at = _ensure_tz_aware(timezone.datetime.fromisoformat(row['joined_at'].replace('Z', '+00:00')))
                except Exception:
                    pass
            if row.get('left_at'):
                try:
                    rec.left_at = _ensure_tz_aware(timezone.datetime.fromisoformat(row['left_at'].replace('Z', '+00:00')))
                except Exception:
                    pass
            rec.save()

    session.save()

    # Return in the same shape as mentor_sessions list
    now = timezone.now()
    start_time = _ensure_tz_aware(session.start_time)
    end_time = _ensure_tz_aware(session.end_time)
    session_status = 'completed' if session.attended else ('in_progress' if start_time <= now <= end_time else 'scheduled')

    attendance_out = []
    for rec in session.attendance_records.select_related('mentee').all():
        attendance_out.append({
            'mentee_id': str(rec.mentee_id),
            'mentee_name': rec.mentee.get_full_name() or rec.mentee.email,
            'attended': rec.attended,
            'joined_at': rec.joined_at.isoformat() if rec.joined_at else None,
            'left_at': rec.left_at.isoformat() if rec.left_at else None,
        })

    return Response({
        'id': str(session.id),
        'mentor_id': str(mentor.id),
        'title': session.title,
        'description': (session.outcomes or {}).get('description', '') if isinstance(session.outcomes, dict) else '',
        'scheduled_at': session.start_time.isoformat(),
        'duration_minutes': int((session.end_time - session.start_time).total_seconds() / 60),
        'meeting_link': session.zoom_url or '',
        'meeting_type': (session.outcomes or {}).get('meeting_type', 'zoom') if isinstance(session.outcomes, dict) else 'zoom',
        'track_assignment': (session.outcomes or {}).get('track_assignment', '') if isinstance(session.outcomes, dict) else '',
        'recording_url': session.recording_url or None,
        'transcript_url': session.transcript_url or None,
        'status': session_status,
        'attendance': attendance_out,
        'structured_notes': session.structured_notes or None,
        'is_closed': session.is_closed,
        'created_at': session.created_at.isoformat(),
        'updated_at': session.updated_at.isoformat(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_influence_index(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/influence
    Mentor influence index based on TalentScope MentorInfluence records.
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own influence index'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    try:
        from talentscope.models import MentorInfluence
    except Exception:
        # Return a stable response shape expected by the frontend.
        now = timezone.now().date()
        start = (now - timedelta(days=30)).isoformat()
        end = now.isoformat()
        return Response({
            'mentor_id': str(mentor_id),
            'overall_influence_score': 0.0,
            'metrics': {
                'total_feedback_given': 0,
                'average_response_time_hours': 0.0,
                'mentee_improvement_rate': 0.0,
                'session_attendance_rate': 0.0,
                'mission_approval_rate': 0.0,
            },
            'correlation_data': {
                'feedback_to_performance': 0.0,
                'sessions_to_engagement': 0.0,
                'reviews_to_mission_quality': 0.0,
            },
            'period': {'start_date': start, 'end_date': end},
            'trend_data': [],
        })

    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    qs = MentorInfluence.objects.filter(mentor=mentor)
    if start_date:
        qs = qs.filter(period_start__date__gte=start_date)
    if end_date:
        qs = qs.filter(period_end__date__lte=end_date)

    qs = qs.order_by('period_start')[:200]

    # period resolution (fall back to last 30 days if no records)
    if start_date and end_date:
        period_start = start_date
        period_end = end_date
    elif qs.exists():
        first = qs.first()
        last = qs.last()
        period_start = first.period_start.date().isoformat() if first and first.period_start else None
        period_end = last.period_end.date().isoformat() if last and last.period_end else None
    else:
        now = timezone.now().date()
        period_start = (now - timedelta(days=30)).isoformat()
        period_end = now.isoformat()

    influences = [float(x.influence_index) for x in qs if x.influence_index is not None]
    # influence_index is 0-10; frontend expects 0-100
    overall = (sum(influences) / len(influences) * 10.0) if influences else 0.0

    # Basic metric averages
    def avg(field):
        vals = [getattr(x, field) for x in qs if getattr(x, field) is not None]
        vals = [float(v) for v in vals]
        return sum(vals) / len(vals) if vals else 0.0

    # Map available TalentScope fields into the frontend's expected metrics.
    # (Some fields are proxies until deeper instrumentation exists.)
    metrics = {
        'total_feedback_given': int(qs.count()),
        'average_response_time_hours': 0.0,
        'mentee_improvement_rate': avg('performance_score'),
        'session_attendance_rate': avg('mission_completion_rate'),
        'mission_approval_rate': avg('code_quality_score'),
    }

    trend_data = [
        {'date': x.period_start.date().isoformat(), 'score': float((x.influence_index or 0) * 10.0)}
        for x in qs if x.period_start
    ]

    return Response({
        'mentor_id': str(mentor_id),
        'overall_influence_score': overall,
        'metrics': metrics,
        'correlation_data': {
            'feedback_to_performance': 0.0,
            'sessions_to_engagement': 0.0,
            'reviews_to_mission_quality': 0.0,
        },
        'period': {'start_date': period_start, 'end_date': period_end},
        'trend_data': trend_data,
    })


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
            structured_notes = session.structured_notes or {}
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
                'recording_url': session.recording_url or None,
                'transcript_url': session.transcript_url or None,
                'status': 'completed' if session.attended else ('in_progress' if session.start_time <= timezone.now() <= session.end_time else 'scheduled'),
                'attendance': [],  # Would need to be populated from a separate model
                'structured_notes': structured_notes,
                'is_closed': session.is_closed,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
            })
        
        return Response(sessions_data)
    
    elif request.method == 'POST':
        # Create group session
        logger.info(f"Creating group session with data: {request.data}")
        logger.info(f"Request data type: {type(request.data)}, keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
        
        # Clean up None/undefined values - convert to empty strings for optional fields
        cleaned_data = {}
        for key, value in request.data.items():
            if value is None or value == 'undefined':
                # For optional string fields, use empty string
                if key in ['meeting_link', 'track_assignment', 'description']:
                    cleaned_data[key] = ''
                else:
                    # Skip None values for other fields (will use defaults)
                    continue
            else:
                cleaned_data[key] = value
        
        logger.info(f"Cleaned data: {cleaned_data}")
        
        try:
            serializer = CreateGroupSessionSerializer(data=cleaned_data)
            logger.info(f"Serializer created, calling is_valid()...")
            is_valid_result = serializer.is_valid()
            logger.info(f"Serializer is_valid() returned: {is_valid_result}")
            
            if not is_valid_result:
                error_dict = dict(serializer.errors)
                error_details = {
                    'errors': error_dict,
                    'raw_data': dict(request.data),
                    'cleaned_data': cleaned_data,
                }
                logger.error(f"Serializer validation failed: {error_details}")
                # Also print to console for immediate visibility
                import sys
                print(f"VALIDATION ERROR: {error_dict}", file=sys.stderr)
                print(f"Data received: {cleaned_data}", file=sys.stderr)
                # Return errors in a format that's easy to debug
                response_data = {
                    'error': 'Validation failed',
                    'details': error_dict,
                    'received_data': cleaned_data
                }
                logger.error(f"Returning error response: {response_data}")
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
            
            # Validation passed, proceed with creating the session
            logger.info("Serializer validation passed, proceeding with session creation...")
            scheduled_at = serializer.validated_data['scheduled_at']
            duration = serializer.validated_data.get('duration_minutes', 60)
            logger.info(f"Parsed scheduled_at: {scheduled_at}, duration: {duration}")
            
            end_time = scheduled_at + timedelta(minutes=duration)
            
            # For group sessions, find cohorts where the mentor is assigned
            # Get cohorts from MentorAssignment (cohort-level assignments)
            from programs.models import MentorAssignment, Cohort, Enrollment
            
            # Check if cohort_id was provided
            cohort_id = serializer.validated_data.get('cohort_id')
            
            if cohort_id:
                # Validate that the mentor is assigned to this cohort
                logger.info(f"Using provided cohort_id: {cohort_id}")
                try:
                    cohort = Cohort.objects.get(id=cohort_id)
                    cohort_assignment = MentorAssignment.objects.filter(
                        mentor=mentor,
                        cohort=cohort,
                        active=True
                    ).first()
                    
                    if not cohort_assignment:
                        logger.error(f"Mentor {mentor.id} is not assigned to cohort {cohort_id}")
                        return Response(
                            {'error': f'You are not assigned to cohort {cohort.name}. Please select a cohort you are assigned to.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Cohort.DoesNotExist:
                    logger.error(f"Cohort {cohort_id} not found")
                    return Response(
                        {'error': 'Selected cohort not found.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Fallback to first assigned cohort if no cohort_id provided
                logger.info(f"No cohort_id provided, looking for cohort assignments for mentor {mentor.id}")
                cohort_assignments = MentorAssignment.objects.filter(
                    mentor=mentor,
                    active=True
                ).select_related('cohort')
                
                if not cohort_assignments.exists():
                    logger.error(f"No active cohort assignments found for mentor {mentor.id}")
                    return Response(
                        {'error': 'No active cohort assignments found. Group sessions require at least one assigned cohort. Please select a cohort.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get the first cohort assignment
                first_cohort_assignment = cohort_assignments.first()
                cohort = first_cohort_assignment.cohort
                logger.info(f"Using first available cohort: {cohort.id} ({cohort.name})")
            
            logger.info(f"Using cohort: {cohort.id} ({cohort.name}), getting enrollments...")
            
            # Get active enrollments from this cohort to use as base for the session
            enrollments = Enrollment.objects.filter(
                cohort=cohort,
                status__in=['active', 'completed']
            ).select_related('user')
            
            if not enrollments.exists():
                logger.error(f"No active enrollments found in cohort {cohort.id}")
                return Response(
                    {'error': f'No active students found in cohort {cohort.name}. Group sessions require at least one enrolled student.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the first enrollment as the base mentee for the session
            # (Group sessions can have multiple mentees, but we need one as a base)
            first_enrollment = enrollments.first()
            first_mentee = first_enrollment.user
            
            # Try to find or create a MenteeMentorAssignment for this mentee
            # This is needed for the MentorSession model which requires an assignment
            mentee_assignment, created = MenteeMentorAssignment.objects.get_or_create(
                mentee=first_mentee,
                mentor=mentor,
                defaults={
                    'status': 'active',
                    'cohort_id': str(cohort.id),
                }
            )
            
            if created:
                logger.info(f"Created MenteeMentorAssignment for mentee {first_mentee.id}")
            else:
                logger.info(f"Using existing MenteeMentorAssignment {mentee_assignment.id}")
            
            logger.info(f"Creating group session with mentee {first_mentee.id} from cohort {cohort.id}...")
            
            # Create group session using the assignment as base (group sessions can have multiple mentees)
            meeting_link = serializer.validated_data.get('meeting_link') or ''
            if not meeting_link:
                # Generate a placeholder Zoom URL if none provided
                meeting_link = f"https://zoom.us/j/{uuid.uuid4().hex[:10]}"
            
            session = MentorSession.objects.create(
                assignment=mentee_assignment,
                mentee=first_mentee,  # Use first mentee as placeholder
                mentor=mentor,
                title=serializer.validated_data['title'],
                type='group',
                start_time=scheduled_at,
                end_time=end_time,
                zoom_url=meeting_link,
                notes=serializer.validated_data.get('description', '') or ''
            )
            
            # Store track assignment and meeting type in outcomes JSON field
            session.outcomes = {
                'track_assignment': serializer.validated_data.get('track_assignment') or '',
                'meeting_type': serializer.validated_data.get('meeting_type') or 'zoom',
                'description': serializer.validated_data.get('description') or ''
            }
            session.save()
            
            logger.info(f"Session created successfully: {session.id}")
            
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
                'recording_url': None,
                'transcript_url': None,
                'status': 'scheduled',
                'attendance': [],
                'structured_notes': {},
                'is_closed': False,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
            }
            
            return Response(session_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Exception during serializer validation or session creation: {str(e)}", exc_info=True)
            import sys
            import traceback
            print(f"EXCEPTION: {str(e)}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            return Response(
                {
                    'error': 'Error processing request',
                    'message': str(e),
                    'type': type(e).__name__
                },
                status=status.HTTP_400_BAD_REQUEST
            )


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



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mentee_talentscope(request, mentor_id, mentee_id):
    """
    GET /api/v1/mentors/{mentor_id}/mentees/{mentee_id}/talentscope
    TalentScope mentor view for a specific mentee.
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own mentor analytics'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    try:
        mentee = User.objects.get(id=mentee_id)
    except User.DoesNotExist:
        return Response({'error': 'Mentee not found'}, status=status.HTTP_404_NOT_FOUND)

    if not _mentor_can_view_mentee(mentor, mentee):
        return Response({'error': 'Mentee not assigned to this mentor'}, status=status.HTTP_403_FORBIDDEN)

    # Pull TalentScope models if available
    try:
        from talentscope.models import SkillSignal, BehaviorSignal, ReadinessSnapshot
    except Exception:
        SkillSignal = None
        BehaviorSignal = None
        ReadinessSnapshot = None

    # Latest readiness snapshot (source of truth for advanced fields)
    latest_snapshot = None
    if ReadinessSnapshot is not None:
        latest_snapshot = ReadinessSnapshot.objects.filter(mentee=mentee).order_by('-snapshot_date').first()

    # Skills heatmap (skill_name -> mastery_level)
    skills_heatmap = {}
    if SkillSignal is not None:
        latest_by_skill = {}
        for s in SkillSignal.objects.filter(mentee=mentee).order_by('-created_at')[:500]:
            if s.skill_name not in latest_by_skill:
                latest_by_skill[s.skill_name] = s
        skills_heatmap = {k: float(v.mastery_level) for k, v in latest_by_skill.items()}

    # Behavioral trends (last 30 days)
    today = timezone.now().date()
    start = today - timedelta(days=29)
    days = [start + timedelta(days=i) for i in range(30)]
    trend_map = {d.isoformat(): {'missions_completed': 0, 'hours_studied': 0.0, 'reflections_count': 0} for d in days}

    # Missions completed (approved)
    for row in MissionSubmission.objects.filter(
        user=mentee,
        status='approved',
        created_at__date__gte=start,
        created_at__date__lte=today
    ).values('created_at__date').annotate(c=Count('id')):
        day = row['created_at__date'].isoformat()
        trend_map[day]['missions_completed'] = int(row['c'])

    if BehaviorSignal is not None:
        # hours_studied: sum of study_consistency values
        for row in BehaviorSignal.objects.filter(
            mentee=mentee,
            behavior_type='study_consistency',
            recorded_at__date__gte=start,
            recorded_at__date__lte=today
        ).values('recorded_at__date').annotate(total=Count('id'), sum_val=F('recorded_at__date')):
            # We can't sum DecimalField with this limited import set in this file; do a simple per-row loop instead.
            pass

        # fallback simple aggregation in python (safe, small window)
        for sig in BehaviorSignal.objects.filter(
            mentee=mentee,
            recorded_at__date__gte=start,
            recorded_at__date__lte=today
        ).only('behavior_type', 'value', 'recorded_at')[:2000]:
            day = sig.recorded_at.date().isoformat()
            if day not in trend_map:
                continue
            if sig.behavior_type == 'study_consistency':
                trend_map[day]['hours_studied'] += float(sig.value)
            if sig.behavior_type == 'reflection_frequency':
                trend_map[day]['reflections_count'] += 1

    behavioral_trends = [
        {'date': d, **vals} for d, vals in sorted(trend_map.items(), key=lambda x: x[0])
    ]

    # Readiness over time
    readiness_over_time = []
    if ReadinessSnapshot is not None:
        for snap in ReadinessSnapshot.objects.filter(mentee=mentee).order_by('snapshot_date')[:120]:
            readiness_over_time.append({
                'date': snap.snapshot_date.date().isoformat(),
                'score': float(snap.core_readiness_score)
            })

    # Ingested signals (best-effort counts)
    mentor_evaluations = MentorSession.objects.filter(mentor=mentor, mentee=mentee).count()
    habit_logs = 0
    community_engagement = 0
    if BehaviorSignal is not None:
        habit_logs = BehaviorSignal.objects.filter(mentee=mentee, source='habit_log').count()
        community_engagement = BehaviorSignal.objects.filter(
            mentee=mentee,
            behavior_type__in=['engagement_level', 'collaboration']
        ).count()

    mission_scores = MissionSubmission.objects.filter(
        user=mentee
    ).filter(Q(ai_score__isnull=False) | Q(mentor_score__isnull=False)).count()

    # Default advanced fields from snapshot when available
    core_readiness_score = float(latest_snapshot.core_readiness_score) if latest_snapshot else None
    career_readiness_stage = getattr(latest_snapshot, 'career_readiness_stage', None) if latest_snapshot else None
    learning_velocity = float(latest_snapshot.learning_velocity) if latest_snapshot and latest_snapshot.learning_velocity is not None else None
    estimated_readiness_window = getattr(latest_snapshot, 'estimated_readiness_window', None) if latest_snapshot else None

    readiness_breakdown = getattr(latest_snapshot, 'breakdown', None) if latest_snapshot else None
    gap_analysis = None
    professional_tier_data = None
    if latest_snapshot:
        gap_analysis = {
            'strengths': getattr(latest_snapshot, 'strengths', []) or [],
            'weaknesses': getattr(latest_snapshot, 'weaknesses', []) or [],
            'missing_skills': getattr(latest_snapshot, 'missing_skills', []) or [],
            'improvement_plan': getattr(latest_snapshot, 'improvement_plan', []) or [],
        }
        professional_tier_data = {
            'job_fit_score': float(latest_snapshot.job_fit_score) if latest_snapshot.job_fit_score is not None else None,
            'hiring_timeline_prediction': getattr(latest_snapshot, 'hiring_timeline_prediction', None),
            'track_benchmarks': getattr(latest_snapshot, 'track_benchmarks', None) or {},
        }

    return Response({
        'mentee_id': str(mentee.id),
        'mentee_name': mentee.get_full_name() or mentee.email,
        'ingested_signals': {
            'mentor_evaluations': mentor_evaluations,
            'habit_logs': habit_logs,
            'mission_scores': mission_scores,
            'reflection_sentiment': {'positive': 0, 'neutral': 0, 'negative': 0},
            'community_engagement': community_engagement,
        },
        'skills_heatmap': skills_heatmap,
        'behavioral_trends': behavioral_trends,
        'readiness_over_time': readiness_over_time,
        'core_readiness_score': core_readiness_score,
        'career_readiness_stage': career_readiness_stage,
        'learning_velocity': learning_velocity,
        'estimated_readiness_window': estimated_readiness_window,
        'readiness_breakdown': readiness_breakdown,
        'gap_analysis': gap_analysis,
        'professional_tier_data': professional_tier_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_mission_submissions(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/missions/submissions
    List mission submissions for mentees a mentor can access.
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own submissions view'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    status_filter = request.query_params.get('status')
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    offset = (page - 1) * page_size

    mentee_ids = set(MenteeMentorAssignment.objects.filter(
        mentor=mentor,
        status='active'
    ).values_list('mentee_id', flat=True))

    # Include mentees from cohorts the mentor is assigned to (best effort)
    try:
        from programs.models import Enrollment, MentorAssignment
        cohort_ids = MentorAssignment.objects.filter(mentor=mentor, active=True).values_list('cohort_id', flat=True)
        cohort_mentee_ids = Enrollment.objects.filter(cohort_id__in=cohort_ids, status='active').values_list('user_id', flat=True)
        mentee_ids.update(cohort_mentee_ids)
    except Exception:
        pass

    qs = MissionSubmission.objects.filter(user_id__in=list(mentee_ids)).select_related('user', 'mission').order_by('-created_at')
    if status_filter:
        qs = qs.filter(status=status_filter)

    total = qs.count()
    rows = qs[offset:offset + page_size]

    results = []
    for sub in rows:
        results.append({
            'id': str(sub.id),
            'mission_id': str(sub.mission_id),
            'mission_title': getattr(sub.mission, 'title', ''),
            'mentee_id': str(sub.user_id),
            'mentee_name': sub.user.get_full_name() or sub.user.email,
            'mentee_email': sub.user.email,
            'submitted_at': sub.submitted_at.isoformat() if sub.submitted_at else None,
            'status': sub.status,
            'mentor_score': float(sub.mentor_score) if sub.mentor_score is not None else None,
            'ai_score': float(sub.ai_score) if sub.ai_score is not None else None,
        })

    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'results': results,
    })


def _ensure_tz_aware(dt):
    if dt is None:
        return None
    if timezone.is_naive(dt):
        return timezone.make_aware(dt)
    return dt


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_group_session(request, session_id):
    """
    PATCH /api/v1/mentors/sessions/{session_id}
    Update a group mentorship session (recording/transcript, notes, attendance, schedule, closure).
    """
    mentor = get_current_mentor(request.user)
    try:
        session = MentorSession.objects.get(id=session_id, mentor=mentor, type='group')
    except MentorSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data or {}

    # Update schedule
    scheduled_at = data.get('scheduled_at')
    duration_minutes = data.get('duration_minutes')
    if scheduled_at:
        # Reuse CreateGroupSessionSerializer datetime parsing logic
        try:
            tmp = CreateGroupSessionSerializer(data={'title': 'tmp', 'scheduled_at': scheduled_at, 'duration_minutes': 60})
            tmp.is_valid(raise_exception=True)
            start_time = tmp.validated_data['scheduled_at']
            session.start_time = _ensure_tz_aware(start_time)
            if duration_minutes is None:
                duration_minutes = int((session.end_time - session.start_time).total_seconds() / 60)
        except Exception as e:
            return Response({'error': f'Invalid scheduled_at: {e}'}, status=status.HTTP_400_BAD_REQUEST)

    if duration_minutes is not None:
        try:
            dur = int(duration_minutes)
            session.end_time = _ensure_tz_aware(session.start_time) + timedelta(minutes=dur)
        except Exception:
            return Response({'error': 'Invalid duration_minutes'}, status=status.HTTP_400_BAD_REQUEST)

    # Update meeting info
    meeting_link = data.get('meeting_link')
    if meeting_link is not None:
        session.zoom_url = meeting_link

    # Update recording/transcript
    if 'recording_url' in data:
        session.recording_url = data.get('recording_url') or ''
    if 'transcript_url' in data:
        session.transcript_url = data.get('transcript_url') or ''

    # Notes
    if 'structured_notes' in data:
        session.structured_notes = data.get('structured_notes') or {}
    if 'notes' in data:
        session.notes = data.get('notes') or ''

    # Close session
    if 'is_closed' in data:
        session.is_closed = bool(data.get('is_closed'))

    # Attendance records (optional)
    attendance = data.get('attendance')
    if isinstance(attendance, list):
        for row in attendance:
            mentee_id = row.get('mentee_id')
            if not mentee_id:
                continue
            rec, _ = SessionAttendance.objects.get_or_create(session=session, mentee_id=mentee_id)
            if 'attended' in row:
                rec.attended = bool(row.get('attended'))
            if row.get('joined_at'):
                try:
                    rec.joined_at = _ensure_tz_aware(timezone.datetime.fromisoformat(row['joined_at'].replace('Z', '+00:00')))
                except Exception:
                    pass
            if row.get('left_at'):
                try:
                    rec.left_at = _ensure_tz_aware(timezone.datetime.fromisoformat(row['left_at'].replace('Z', '+00:00')))
                except Exception:
                    pass
            rec.save()

    session.save()

    # Return in the same shape as mentor_sessions list
    now = timezone.now()
    start_time = _ensure_tz_aware(session.start_time)
    end_time = _ensure_tz_aware(session.end_time)
    session_status = 'completed' if session.attended else ('in_progress' if start_time <= now <= end_time else 'scheduled')

    attendance_out = []
    for rec in session.attendance_records.select_related('mentee').all():
        attendance_out.append({
            'mentee_id': str(rec.mentee_id),
            'mentee_name': rec.mentee.get_full_name() or rec.mentee.email,
            'attended': rec.attended,
            'joined_at': rec.joined_at.isoformat() if rec.joined_at else None,
            'left_at': rec.left_at.isoformat() if rec.left_at else None,
        })

    return Response({
        'id': str(session.id),
        'mentor_id': str(mentor.id),
        'title': session.title,
        'description': (session.outcomes or {}).get('description', '') if isinstance(session.outcomes, dict) else '',
        'scheduled_at': session.start_time.isoformat(),
        'duration_minutes': int((session.end_time - session.start_time).total_seconds() / 60),
        'meeting_link': session.zoom_url or '',
        'meeting_type': (session.outcomes or {}).get('meeting_type', 'zoom') if isinstance(session.outcomes, dict) else 'zoom',
        'track_assignment': (session.outcomes or {}).get('track_assignment', '') if isinstance(session.outcomes, dict) else '',
        'recording_url': session.recording_url or None,
        'transcript_url': session.transcript_url or None,
        'status': session_status,
        'attendance': attendance_out,
        'structured_notes': session.structured_notes or None,
        'is_closed': session.is_closed,
        'created_at': session.created_at.isoformat(),
        'updated_at': session.updated_at.isoformat(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentor_influence_index(request, mentor_id):
    """
    GET /api/v1/mentors/{mentor_id}/influence
    Mentor influence index based on TalentScope MentorInfluence records.
    """
    if str(request.user.id) != str(mentor_id):
        return Response({'error': 'You can only access your own influence index'}, status=status.HTTP_403_FORBIDDEN)

    mentor = get_current_mentor(request.user)

    try:
        from talentscope.models import MentorInfluence
    except Exception:
        # Return a stable response shape expected by the frontend.
        now = timezone.now().date()
        start = (now - timedelta(days=30)).isoformat()
        end = now.isoformat()
        return Response({
            'mentor_id': str(mentor_id),
            'overall_influence_score': 0.0,
            'metrics': {
                'total_feedback_given': 0,
                'average_response_time_hours': 0.0,
                'mentee_improvement_rate': 0.0,
                'session_attendance_rate': 0.0,
                'mission_approval_rate': 0.0,
            },
            'correlation_data': {
                'feedback_to_performance': 0.0,
                'sessions_to_engagement': 0.0,
                'reviews_to_mission_quality': 0.0,
            },
            'period': {'start_date': start, 'end_date': end},
            'trend_data': [],
        })

    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    qs = MentorInfluence.objects.filter(mentor=mentor)
    if start_date:
        qs = qs.filter(period_start__date__gte=start_date)
    if end_date:
        qs = qs.filter(period_end__date__lte=end_date)

    qs = qs.order_by('period_start')[:200]

    # period resolution (fall back to last 30 days if no records)
    if start_date and end_date:
        period_start = start_date
        period_end = end_date
    elif qs.exists():
        first = qs.first()
        last = qs.last()
        period_start = first.period_start.date().isoformat() if first and first.period_start else None
        period_end = last.period_end.date().isoformat() if last and last.period_end else None
    else:
        now = timezone.now().date()
        period_start = (now - timedelta(days=30)).isoformat()
        period_end = now.isoformat()

    influences = [float(x.influence_index) for x in qs if x.influence_index is not None]
    # influence_index is 0-10; frontend expects 0-100
    overall = (sum(influences) / len(influences) * 10.0) if influences else 0.0

    # Basic metric averages
    def avg(field):
        vals = [getattr(x, field) for x in qs if getattr(x, field) is not None]
        vals = [float(v) for v in vals]
        return sum(vals) / len(vals) if vals else 0.0

    # Map available TalentScope fields into the frontend's expected metrics.
    # (Some fields are proxies until deeper instrumentation exists.)
    metrics = {
        'total_feedback_given': int(qs.count()),
        'average_response_time_hours': 0.0,
        'mentee_improvement_rate': avg('performance_score'),
        'session_attendance_rate': avg('mission_completion_rate'),
        'mission_approval_rate': avg('code_quality_score'),
    }

    trend_data = [
        {'date': x.period_start.date().isoformat(), 'score': float((x.influence_index or 0) * 10.0)}
        for x in qs if x.period_start
    ]

    return Response({
        'mentor_id': str(mentor_id),
        'overall_influence_score': overall,
        'metrics': metrics,
        'correlation_data': {
            'feedback_to_performance': 0.0,
            'sessions_to_engagement': 0.0,
            'reviews_to_mission_quality': 0.0,
        },
        'period': {'start_date': period_start, 'end_date': period_end},
        'trend_data': trend_data,
    })


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
            structured_notes = session.structured_notes or {}
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
                'recording_url': session.recording_url or None,
                'transcript_url': session.transcript_url or None,
                'status': 'completed' if session.attended else ('in_progress' if session.start_time <= timezone.now() <= session.end_time else 'scheduled'),
                'attendance': [],  # Would need to be populated from a separate model
                'structured_notes': structured_notes,
                'is_closed': session.is_closed,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
            })
        
        return Response(sessions_data)
    
    elif request.method == 'POST':
        # Create group session
        logger.info(f"Creating group session with data: {request.data}")
        logger.info(f"Request data type: {type(request.data)}, keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
        
        # Clean up None/undefined values - convert to empty strings for optional fields
        cleaned_data = {}
        for key, value in request.data.items():
            if value is None or value == 'undefined':
                # For optional string fields, use empty string
                if key in ['meeting_link', 'track_assignment', 'description']:
                    cleaned_data[key] = ''
                else:
                    # Skip None values for other fields (will use defaults)
                    continue
            else:
                cleaned_data[key] = value
        
        logger.info(f"Cleaned data: {cleaned_data}")
        
        try:
            serializer = CreateGroupSessionSerializer(data=cleaned_data)
            logger.info(f"Serializer created, calling is_valid()...")
            is_valid_result = serializer.is_valid()
            logger.info(f"Serializer is_valid() returned: {is_valid_result}")
            
            if not is_valid_result:
                error_dict = dict(serializer.errors)
                error_details = {
                    'errors': error_dict,
                    'raw_data': dict(request.data),
                    'cleaned_data': cleaned_data,
                }
                logger.error(f"Serializer validation failed: {error_details}")
                # Also print to console for immediate visibility
                import sys
                print(f"VALIDATION ERROR: {error_dict}", file=sys.stderr)
                print(f"Data received: {cleaned_data}", file=sys.stderr)
                # Return errors in a format that's easy to debug
                response_data = {
                    'error': 'Validation failed',
                    'details': error_dict,
                    'received_data': cleaned_data
                }
                logger.error(f"Returning error response: {response_data}")
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
            
            # Validation passed, proceed with creating the session
            logger.info("Serializer validation passed, proceeding with session creation...")
            scheduled_at = serializer.validated_data['scheduled_at']
            duration = serializer.validated_data.get('duration_minutes', 60)
            logger.info(f"Parsed scheduled_at: {scheduled_at}, duration: {duration}")
            
            end_time = scheduled_at + timedelta(minutes=duration)
            
            # For group sessions, find cohorts where the mentor is assigned
            # Get cohorts from MentorAssignment (cohort-level assignments)
            from programs.models import MentorAssignment, Cohort, Enrollment
            
            # Check if cohort_id was provided
            cohort_id = serializer.validated_data.get('cohort_id')
            
            if cohort_id:
                # Validate that the mentor is assigned to this cohort
                logger.info(f"Using provided cohort_id: {cohort_id}")
                try:
                    cohort = Cohort.objects.get(id=cohort_id)
                    cohort_assignment = MentorAssignment.objects.filter(
                        mentor=mentor,
                        cohort=cohort,
                        active=True
                    ).first()
                    
                    if not cohort_assignment:
                        logger.error(f"Mentor {mentor.id} is not assigned to cohort {cohort_id}")
                        return Response(
                            {'error': f'You are not assigned to cohort {cohort.name}. Please select a cohort you are assigned to.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Cohort.DoesNotExist:
                    logger.error(f"Cohort {cohort_id} not found")
                    return Response(
                        {'error': 'Selected cohort not found.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Fallback to first assigned cohort if no cohort_id provided
                logger.info(f"No cohort_id provided, looking for cohort assignments for mentor {mentor.id}")
                cohort_assignments = MentorAssignment.objects.filter(
                    mentor=mentor,
                    active=True
                ).select_related('cohort')
                
                if not cohort_assignments.exists():
                    logger.error(f"No active cohort assignments found for mentor {mentor.id}")
                    return Response(
                        {'error': 'No active cohort assignments found. Group sessions require at least one assigned cohort. Please select a cohort.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get the first cohort assignment
                first_cohort_assignment = cohort_assignments.first()
                cohort = first_cohort_assignment.cohort
                logger.info(f"Using first available cohort: {cohort.id} ({cohort.name})")
            
            logger.info(f"Using cohort: {cohort.id} ({cohort.name}), getting enrollments...")
            
            # Get active enrollments from this cohort to use as base for the session
            enrollments = Enrollment.objects.filter(
                cohort=cohort,
                status__in=['active', 'completed']
            ).select_related('user')
            
            if not enrollments.exists():
                logger.error(f"No active enrollments found in cohort {cohort.id}")
                return Response(
                    {'error': f'No active students found in cohort {cohort.name}. Group sessions require at least one enrolled student.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the first enrollment as the base mentee for the session
            # (Group sessions can have multiple mentees, but we need one as a base)
            first_enrollment = enrollments.first()
            first_mentee = first_enrollment.user
            
            # Try to find or create a MenteeMentorAssignment for this mentee
            # This is needed for the MentorSession model which requires an assignment
            mentee_assignment, created = MenteeMentorAssignment.objects.get_or_create(
                mentee=first_mentee,
                mentor=mentor,
                defaults={
                    'status': 'active',
                    'cohort_id': str(cohort.id),
                }
            )
            
            if created:
                logger.info(f"Created MenteeMentorAssignment for mentee {first_mentee.id}")
            else:
                logger.info(f"Using existing MenteeMentorAssignment {mentee_assignment.id}")
            
            logger.info(f"Creating group session with mentee {first_mentee.id} from cohort {cohort.id}...")
            
            # Create group session using the assignment as base (group sessions can have multiple mentees)
            meeting_link = serializer.validated_data.get('meeting_link') or ''
            if not meeting_link:
                # Generate a placeholder Zoom URL if none provided
                meeting_link = f"https://zoom.us/j/{uuid.uuid4().hex[:10]}"
            
            session = MentorSession.objects.create(
                assignment=mentee_assignment,
                mentee=first_mentee,  # Use first mentee as placeholder
                mentor=mentor,
                title=serializer.validated_data['title'],
                type='group',
                start_time=scheduled_at,
                end_time=end_time,
                zoom_url=meeting_link,
                notes=serializer.validated_data.get('description', '') or ''
            )
            
            # Store track assignment and meeting type in outcomes JSON field
            session.outcomes = {
                'track_assignment': serializer.validated_data.get('track_assignment') or '',
                'meeting_type': serializer.validated_data.get('meeting_type') or 'zoom',
                'description': serializer.validated_data.get('description') or ''
            }
            session.save()
            
            logger.info(f"Session created successfully: {session.id}")
            
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
                'recording_url': None,
                'transcript_url': None,
                'status': 'scheduled',
                'attendance': [],
                'structured_notes': {},
                'is_closed': False,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
            }
            
            return Response(session_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Exception during serializer validation or session creation: {str(e)}", exc_info=True)
            import sys
            import traceback
            print(f"EXCEPTION: {str(e)}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            return Response(
                {
                    'error': 'Error processing request',
                    'message': str(e),
                    'type': type(e).__name__
                },
                status=status.HTTP_400_BAD_REQUEST
            )


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
