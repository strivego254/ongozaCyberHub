"""
Student-facing mission API views.
Implements complete MXP specification.
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg, F
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from users.models import User
from programs.models import Enrollment
from .models import Mission, MissionSubmission, MissionArtifact, AIFeedback
from .serializers import (
    MissionSerializer,
    MissionSubmissionSerializer,
)
from subscriptions.utils import get_user_tier
from subscriptions.models import UserSubscription, SubscriptionPlan
from .tasks import process_mission_ai_review
from student_dashboard.services import DashboardAggregationService
from django.core.cache import cache
from .services import upload_file_to_storage, generate_presigned_upload_url
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mission_funnel(request):
    """
    GET /api/v1/student/missions/funnel
    Get mission funnel summary with priorities.
    """
    user = request.user
    
    # Cache key
    cache_key = f'mission_funnel:{user.id}'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data, status=status.HTTP_200_OK)
    
    # Get user's enrollment for track/cohort info
    enrollment = Enrollment.objects.filter(user=user, status='active').first()
    track_name = enrollment.track.name if enrollment and enrollment.track else None
    cohort_name = enrollment.cohort.name if enrollment and enrollment.cohort else None
    
    # Count submissions by status
    submissions = MissionSubmission.objects.filter(user=user)
    
    pending = submissions.filter(status__in=['draft', 'submitted']).count()
    in_progress = submissions.filter(status='draft').count()
    in_ai_review = submissions.filter(status='in_ai_review').count()
    in_mentor_review = submissions.filter(status='in_mentor_review').count()
    approved = submissions.filter(status='approved').count()
    failed = submissions.filter(status='failed').count()
    
    total_reviewed = approved + failed
    approval_rate = (approved / total_reviewed * 100) if total_reviewed > 0 else 0
    
    # Get priorities (urgent/recommended)
    priorities = []
    
    # Urgent: missions with deadlines approaching
    urgent_submissions = submissions.filter(
        status__in=['draft', 'submitted'],
        mission__requirements__deadline__isnull=False
    ).select_related('mission')[:3]
    
    for sub in urgent_submissions:
        deadline = sub.mission.requirements.get('deadline')
        if deadline:
            deadline_dt = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            if deadline_dt < timezone.now() + timedelta(days=1):
                priorities.append({
                    'mission_id': str(sub.mission.id),
                    'code': sub.mission.code,
                    'title': sub.mission.title,
                    'priority': 'urgent',
                    'deadline': deadline,
                    'ai_hint': 'Due soon - complete to maintain progress',
                })
    
    # Recommended: based on AI recommendations from dashboard
    try:
        dashboard_data = DashboardAggregationService.get_dashboard(user.id)
        if dashboard_data and dashboard_data.get('top_recommendation'):
            rec = dashboard_data['top_recommendation']
            if rec.get('mission_id'):
                try:
                    mission = Mission.objects.get(id=rec['mission_id'])
                    if not submissions.filter(mission=mission, status='approved').exists():
                        priorities.append({
                            'mission_id': str(mission.id),
                            'code': mission.code,
                            'title': mission.title,
                            'priority': 'recommended',
                            'ai_hint': rec.get('reason', 'Fills competency gap'),
                        })
                except Mission.DoesNotExist:
                    pass
    except Exception:
        pass
    
    response_data = {
        'funnel': {
            'pending': pending,
            'in_progress': in_progress,
            'in_ai_review': in_ai_review,
            'in_mentor_review': in_mentor_review,
            'approved': approved,
            'failed': failed,
            'approval_rate': round(approval_rate, 1),
        },
        'track_name': track_name,
        'cohort_name': cohort_name,
        'priorities': priorities[:5],
    }
    
    # Cache for 30 seconds
    cache.set(cache_key, response_data, 30)
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_student_missions(request):
    """
    GET /api/v1/student/missions
    List missions with filters (status, difficulty, track, search).
    """
    user = request.user
    
    # Check entitlement
    tier = get_user_tier(user.id)
    if tier == 'free':
        return Response({
            'error': 'Missions require Starter 3 or higher subscription',
            'upgrade_required': True
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check starter3_normal limits (5 submissions/month)
    if tier in ['starter_3', 'starter_normal']:
        try:
            subscription = UserSubscription.objects.filter(user=user, status='active').first()
            if subscription and subscription.plan:
                plan_name = subscription.plan.name.lower()
                if 'normal' in plan_name or (plan_name == 'starter_3' and not getattr(subscription.plan, 'max_missions_monthly', None)):
                    max_missions = getattr(subscription.plan, 'max_missions_monthly', 5)
                    month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    month_submissions = MissionSubmission.objects.filter(
                        user=user,
                        submitted_at__gte=month_start
                    ).count()
                    if month_submissions >= max_missions:
                        return Response({
                            'error': f'Monthly limit of {max_missions} missions reached. Upgrade for unlimited.',
                            'upgrade_required': True,
                            'limit_reached': True
                        }, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            pass
    
    # Get filters
    status_filter = request.query_params.get('status', 'all')
    difficulty_filter = request.query_params.get('difficulty', 'all')
    track_filter = request.query_params.get('track', 'all')
    search = request.query_params.get('search', '').strip()
    recommended = request.query_params.get('recommended', 'false').lower() == 'true'
    urgent = request.query_params.get('urgent', 'false').lower() == 'true'
    
    # Base queryset
    missions = Mission.objects.all()
    
    # Apply filters
    if difficulty_filter != 'all':
        missions = missions.filter(difficulty=difficulty_filter)
    
    if track_filter != 'all':
        missions = missions.filter(track_key=track_filter)
    
    if search:
        missions = missions.filter(
            Q(title__icontains=search) |
            Q(code__icontains=search) |
            Q(description__icontains=search)
        )
    
    # Get user submissions to add status
    user_submissions = {
        str(sub.mission_id): sub
        for sub in MissionSubmission.objects.filter(user=user).select_related('mission', 'ai_feedback_detail')
    }
    
    # Pagination
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    offset = (page - 1) * page_size
    
    total_count = missions.count()
    missions_page = missions[offset:offset + page_size]
    
    # Build response with submission status
    results = []
    for mission in missions_page:
        submission = user_submissions.get(str(mission.id))
        
        mission_data = {
            'id': str(mission.id),
            'code': mission.code,
            'title': mission.title,
            'description': mission.description,
            'difficulty': mission.difficulty,
            'type': mission.type,
            'estimated_time_minutes': mission.estimated_time_minutes or (mission.est_hours * 60 if mission.est_hours else None),
            'competency_tags': mission.competencies or [],
            'track_key': mission.track_key,
            'requirements': mission.requirements or {},
        }
        
        if submission:
            mission_data['status'] = submission.status
            mission_data['progress_percent'] = 0  # Calculate based on artifacts
            mission_data['ai_score'] = float(submission.ai_score) if submission.ai_score else None
            mission_data['submission_id'] = str(submission.id)
            
            # Count artifacts
            artifacts = MissionArtifact.objects.filter(submission=submission)
            mission_data['artifacts_uploaded'] = artifacts.count()
            mission_data['artifacts_required'] = len(mission.requirements.get('required_artifacts', []))
            
            # AI feedback summary
            if submission.ai_feedback_detail:
                mission_data['ai_feedback'] = {
                    'score': float(submission.ai_feedback_detail.score),
                    'strengths': submission.ai_feedback_detail.strengths[:3],
                    'gaps': submission.ai_feedback_detail.gaps[:3],
                }
        else:
            mission_data['status'] = 'not_started'
            mission_data['progress_percent'] = 0
        
        # Apply status filter
        if status_filter != 'all':
            if mission_data['status'] != status_filter:
                continue
        
        results.append(mission_data)
    
    return Response({
        'results': results,
        'count': len(results),
        'total': total_count,
        'page': page,
        'page_size': page_size,
        'has_next': offset + page_size < total_count,
        'has_previous': page > 1,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mission_detail(request, mission_id):
    """
    GET /api/v1/student/missions/:mission_id
    Get full mission details with submission state.
    """
    user = request.user
    
    try:
        mission = Mission.objects.get(id=mission_id)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get or create submission
    submission, created = MissionSubmission.objects.get_or_create(
        mission=mission,
        user=user,
        defaults={'status': 'draft'}
    )
    
    # Get artifacts
    artifacts = MissionArtifact.objects.filter(submission=submission)
    
    # Get AI feedback
    ai_feedback = None
    if submission.ai_feedback_detail:
        ai_feedback = {
            'score': float(submission.ai_feedback_detail.score),
            'strengths': submission.ai_feedback_detail.strengths,
            'gaps': submission.ai_feedback_detail.gaps,
            'suggestions': submission.ai_feedback_detail.suggestions,
            'full_feedback': submission.ai_feedback_detail.full_feedback,
            'competencies_detected': submission.ai_feedback_detail.competencies_detected,
            'feedback_date': submission.ai_feedback_detail.created_at.isoformat(),
        }
    
    # Get mentor review (if exists)
    mentor_review = None
    if submission.mentor_reviewed_at:
        mentor_review = {
            'status': 'approved' if submission.status == 'approved' else 'changes_requested' if submission.status == 'failed' else 'waiting',
            'decision': 'pass' if submission.status == 'approved' else 'fail' if submission.status == 'failed' else None,
            'comments': submission.mentor_feedback,
            'reviewed_at': submission.mentor_reviewed_at.isoformat(),
        }
    
    # Build response
    response_data = {
        'id': str(mission.id),
        'code': mission.code,
        'title': mission.title,
        'description': mission.description,
        'brief': mission.description,  # Use description as brief for now
        'objectives': mission.requirements.get('objectives', []),
        'difficulty': mission.difficulty,
        'type': mission.type,
        'estimated_time_minutes': mission.estimated_time_minutes or (mission.est_hours * 60 if mission.est_hours else None),
        'competency_tags': mission.competencies or [],
        'track_key': mission.track_key,
        'requirements': mission.requirements or {},
        'status': submission.status,
        'submission': {
            'id': str(submission.id),
            'notes': submission.notes,
            'file_urls': [a.url for a in artifacts if a.kind == 'file'],
            'github_url': next((a.url for a in artifacts if a.kind == 'github'), None),
            'notebook_url': next((a.url for a in artifacts if a.kind == 'notebook'), None),
            'video_url': next((a.url for a in artifacts if a.kind == 'video'), None),
        },
        'artifacts': [
            {
                'id': str(a.id),
                'type': a.kind,
                'url': a.url,
                'filename': a.filename,
            }
            for a in artifacts
        ],
        'ai_feedback': ai_feedback,
        'mentor_review': mentor_review,
        'portfolio_linked': submission.portfolio_item_id is not None,
    }
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def submit_mission_for_ai(request, mission_id):
    """
    POST /api/v1/student/missions/:mission_id/submit
    Submit mission for AI review.
    """
    user = request.user
    
    # Check entitlement
    tier = get_user_tier(user.id)
    if tier == 'free':
        return Response({
            'error': 'AI feedback requires Starter 3 or higher subscription',
            'upgrade_required': True
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check starter3_normal limits
    if tier in ['starter_3', 'starter_normal']:
        try:
            subscription = UserSubscription.objects.filter(user=user, status='active').first()
            if subscription and subscription.plan:
                plan_name = subscription.plan.name.lower()
                if 'normal' in plan_name or (plan_name == 'starter_3' and not getattr(subscription.plan, 'max_missions_monthly', None)):
                    max_missions = getattr(subscription.plan, 'max_missions_monthly', 5)
                    month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    month_submissions = MissionSubmission.objects.filter(
                        user=user,
                        submitted_at__gte=month_start
                    ).count()
                    if month_submissions >= max_missions:
                        return Response({
                            'error': f'Monthly limit of {max_missions} missions reached. Upgrade for unlimited.',
                            'upgrade_required': True,
                            'limit_reached': True
                        }, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            pass
    
    try:
        mission = Mission.objects.get(id=mission_id)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get or create submission
    submission, created = MissionSubmission.objects.get_or_create(
        mission=mission,
        user=user,
        defaults={'status': 'draft'}
    )
    
    # Update notes
    if 'notes' in request.data:
        submission.notes = request.data['notes']
    
    # Handle file uploads
    files = request.FILES.getlist('files', [])
    
    for file in files:
        try:
            # Upload to S3 or local storage
            file_url = upload_file_to_storage(file, str(submission.id))
            
            # Create artifact
            MissionArtifact.objects.create(
                submission=submission,
                kind='file',
                url=file_url,
                filename=file.name,
                size_bytes=file.size,
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"File upload error: {e}")
            return Response(
                {'error': 'Failed to upload file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Handle URLs
    if 'github_url' in request.data and request.data['github_url']:
        MissionArtifact.objects.create(
            submission=submission,
            kind='github',
            url=request.data['github_url'],
        )
    
    if 'notebook_url' in request.data and request.data['notebook_url']:
        MissionArtifact.objects.create(
            submission=submission,
            kind='notebook',
            url=request.data['notebook_url'],
        )
    
    if 'video_url' in request.data and request.data['video_url']:
        MissionArtifact.objects.create(
            submission=submission,
            kind='video',
            url=request.data['video_url'],
        )
    
    # Update submission status
    submission.status = 'submitted'
    submission.submitted_at = timezone.now()
    submission.save()
    
    # Trigger AI review
    from .tasks import process_mission_ai_review
    process_mission_ai_review.delay(str(submission.id))
    
    # Invalidate cache
    cache_key = f'mission_funnel:{user.id}'
    cache.delete(cache_key)
    
    # Queue dashboard update
    DashboardAggregationService.queue_update(user, 'mission_submitted', 'high')
    
    serializer = MissionSubmissionSerializer(submission)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_mission_artifacts(request, submission_id):
    """
    POST /api/v1/student/missions/submissions/:submission_id/artifacts
    Upload artifacts (files, links) to existing submission.
    """
    user = request.user
    
    try:
        submission = MissionSubmission.objects.get(id=submission_id, user=user)
    except MissionSubmission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if submission.status == 'approved':
        return Response({'error': 'Cannot modify approved submission'}, status=status.HTTP_400_BAD_REQUEST)
    
    artifacts = []
    
    # Handle file uploads
    files = request.FILES.getlist('files', [])
    for file in files:
        try:
            # Upload to S3 or local storage
            file_url = upload_file_to_storage(file, str(submission.id))
            
            artifact = MissionArtifact.objects.create(
                submission=submission,
                kind='file',
                url=file_url,
                filename=file.name,
                size_bytes=file.size,
            )
            artifacts.append(artifact)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"File upload error: {e}")
            return Response(
                {'error': 'Failed to upload file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Handle URLs
    if 'github_url' in request.data and request.data['github_url']:
        artifact = MissionArtifact.objects.create(
            submission=submission,
            kind='github',
            url=request.data['github_url'],
        )
        artifacts.append(artifact)
    
    if 'notebook_url' in request.data and request.data['notebook_url']:
        artifact = MissionArtifact.objects.create(
            submission=submission,
            kind='notebook',
            url=request.data['notebook_url'],
        )
        artifacts.append(artifact)
    
    if 'video_url' in request.data and request.data['video_url']:
        artifact = MissionArtifact.objects.create(
            submission=submission,
            kind='video',
            url=request.data['video_url'],
        )
        artifacts.append(artifact)
    
    return Response({
        'artifacts': [
            {
                'id': str(a.id),
                'type': a.kind,
                'url': a.url,
                'filename': a.filename,
            }
            for a in artifacts
        ]
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def save_mission_draft(request, mission_id):
    """
    POST /api/v1/student/missions/:mission_id/draft
    Save mission submission as draft.
    """
    user = request.user
    
    try:
        mission = Mission.objects.get(id=mission_id)
    except Mission.DoesNotExist:
        return Response({'error': 'Mission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    submission, created = MissionSubmission.objects.get_or_create(
        mission=mission,
        user=user,
        defaults={'status': 'draft'}
    )
    
    if 'notes' in request.data:
        submission.notes = request.data['notes']
    
    submission.status = 'draft'
    submission.save()
    
    serializer = MissionSubmissionSerializer(submission)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def submit_for_mentor_review(request, submission_id):
    """
    POST /api/v1/student/missions/submissions/:submission_id/submit-mentor
    Submit for mentor review (7-tier only).
    """
    user = request.user
    
    # Check entitlement
    tier = get_user_tier(user.id)
    if tier != 'professional_7':
        return Response({
            'error': 'Mentor review requires Professional 7 subscription',
            'upgrade_required': True
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        submission = MissionSubmission.objects.get(id=submission_id, user=user)
    except MissionSubmission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if submission.status != 'ai_reviewed' and submission.status != 'in_ai_review':
        return Response({
            'error': 'Submission must be AI reviewed before mentor review'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    submission.status = 'in_mentor_review'
    submission.save()
    
    # Invalidate cache
    cache_key = f'mission_funnel:{user.id}'
    cache.delete(cache_key)
    
    # Create mentor work queue item
    try:
        from mentorship_coordination.tasks import create_mission_review_queue_item
        from mentorship_coordination.models import MenteeMentorAssignment
        
        assignment = MenteeMentorAssignment.objects.filter(
            mentee=user,
            status='active'
        ).first()
        
        if assignment:
            create_mission_review_queue_item.delay(
                str(submission.id),
                str(assignment.mentor.id)
            )
    except Exception:
        pass
    
    serializer = MissionSubmissionSerializer(submission)
    return Response(serializer.data, status=status.HTTP_200_OK)
