"""
Curriculum Engine views - API endpoints for tracks, modules, lessons, and progress.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count, Prefetch, Q
from django.utils import timezone

from .models import (
    CurriculumTrack, CurriculumModule, Lesson, ModuleMission,
    RecipeRecommendation, UserTrackProgress, UserModuleProgress,
    UserLessonProgress, UserMissionProgress, CurriculumActivity
)
from .serializers import (
    CurriculumTrackListSerializer, CurriculumTrackDetailSerializer,
    CurriculumModuleListSerializer, CurriculumModuleDetailSerializer,
    LessonSerializer, ModuleMissionSerializer, RecipeRecommendationSerializer,
    UserTrackProgressSerializer, UserModuleProgressSerializer,
    UserLessonProgressSerializer, UserMissionProgressSerializer,
    CurriculumActivitySerializer, LessonProgressUpdateSerializer,
    MissionProgressUpdateSerializer, TrackEnrollmentSerializer
)


def get_user_subscription_tier(user):
    """
    Get user's subscription tier for entitlement checks.
    Returns: 'free', 'starter_normal', 'starter_enhanced', 'professional'
    """
    # TODO: Integrate with subscriptions app
    # For now, return a default
    try:
        from subscriptions.models import Subscription
        subscription = Subscription.objects.filter(
            user=user,
            status='active'
        ).order_by('-start_date').first()
        
        if subscription:
            if subscription.plan_id == 'professional':
                return 'professional'
            if subscription.enhanced_access_until and subscription.enhanced_access_until > timezone.now():
                return 'starter_enhanced'
            return 'starter_normal'
    except Exception:
        pass
    return 'free'


class CurriculumTrackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for curriculum tracks.
    
    Endpoints:
    - GET /tracks/ - List all active tracks
    - GET /tracks/{code}/ - Get track details with modules
    - POST /tracks/{code}/enroll/ - Enroll in a track
    - GET /tracks/{code}/progress/ - Get user's progress in track
    """
    queryset = CurriculumTrack.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Allow browsing without auth
    lookup_field = 'code'
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CurriculumTrackDetailSerializer
        return CurriculumTrackListSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.user.is_authenticated:
            context['subscription_tier'] = get_user_subscription_tier(self.request.user)
        return context
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.action == 'retrieve':
            # Prefetch modules with lessons and missions
            queryset = queryset.prefetch_related(
                Prefetch(
                    'modules',
                    queryset=CurriculumModule.objects.filter(is_active=True)
                    .prefetch_related('lessons', 'module_missions', 'recipe_recommendations')
                    .order_by('order_index')
                )
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, code=None):
        """Enroll user in a track."""
        track = self.get_object()
        user = request.user
        
        # Check if already enrolled
        progress, created = UserTrackProgress.objects.get_or_create(
            user=user,
            track=track,
            defaults={
                'current_module': track.modules.filter(is_active=True).order_by('order_index').first()
            }
        )
        
        if created:
            # Log activity
            CurriculumActivity.objects.create(
                user=user,
                activity_type='track_started',
                track=track,
                points_awarded=10
            )
            
            return Response({
                'status': 'enrolled',
                'message': f'Successfully enrolled in {track.name}',
                'progress': UserTrackProgressSerializer(progress).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'already_enrolled',
            'message': 'You are already enrolled in this track',
            'progress': UserTrackProgressSerializer(progress).data
        })
    
    @action(detail=True, methods=['get'])
    def progress(self, request, code=None):
        """Get user's progress in a track."""
        track = self.get_object()
        progress = UserTrackProgress.objects.filter(
            user=request.user,
            track=track
        ).first()
        
        if not progress:
            return Response({
                'enrolled': False,
                'message': 'Not enrolled in this track'
            })
        
        return Response({
            'enrolled': True,
            'progress': UserTrackProgressSerializer(progress).data
        })
    
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, code=None):
        """Get track leaderboard."""
        track = self.get_object()
        
        leaderboard = UserTrackProgress.objects.filter(
            track=track
        ).select_related('user').order_by('-total_points', '-completion_percentage')[:50]
        
        return Response({
            'track': track.code,
            'leaderboard': [
                {
                    'rank': i + 1,
                    'user_id': str(p.user.id),
                    'user_name': f"{p.user.first_name} {p.user.last_name}",
                    'avatar_url': getattr(p.user, 'avatar_url', None),
                    'total_points': p.total_points,
                    'completion_percentage': float(p.completion_percentage),
                    'circle_level': p.circle_level,
                    'current_streak_days': p.current_streak_days,
                }
                for i, p in enumerate(leaderboard)
            ]
        })


class CurriculumModuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for curriculum modules.
    
    Endpoints:
    - GET /modules/ - List modules (filterable by track)
    - GET /modules/{id}/ - Get module details with lessons and missions
    - POST /modules/{id}/start/ - Start a module
    - POST /modules/{id}/complete/ - Mark module as complete
    """
    queryset = CurriculumModule.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CurriculumModuleDetailSerializer
        return CurriculumModuleListSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.user.is_authenticated:
            context['subscription_tier'] = get_user_subscription_tier(self.request.user)
        return context
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by track
        track_code = self.request.query_params.get('track')
        if track_code:
            queryset = queryset.filter(
                Q(track__code=track_code) | Q(track_key=track_code)
            )
        
        # Filter by level
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
        
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related(
                'lessons', 'module_missions', 'recipe_recommendations'
            )
        
        return queryset.order_by('order_index')
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a module."""
        module = self.get_object()
        user = request.user
        
        # Check entitlement
        tier = get_user_subscription_tier(user)
        if module.entitlement_tier == 'professional' and tier != 'professional':
            return Response({
                'error': 'upgrade_required',
                'message': 'This module requires Professional subscription',
                'required_tier': 'professional'
            }, status=status.HTTP_403_FORBIDDEN)
        
        progress, created = UserModuleProgress.objects.get_or_create(
            user=user,
            module=module,
            defaults={'status': 'in_progress', 'started_at': timezone.now()}
        )
        
        if not created and progress.status == 'not_started':
            progress.status = 'in_progress'
            progress.started_at = timezone.now()
            progress.save()
        
        # Update track progress
        if module.track:
            track_progress = UserTrackProgress.objects.filter(
                user=user, track=module.track
            ).first()
            if track_progress:
                track_progress.current_module = module
                track_progress.save()
        
        # Log activity
        CurriculumActivity.objects.create(
            user=user,
            activity_type='module_started',
            track=module.track,
            module=module,
            points_awarded=5
        )
        
        return Response({
            'status': 'started',
            'progress': UserModuleProgressSerializer(progress).data
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark module as complete."""
        module = self.get_object()
        user = request.user
        
        progress, created = UserModuleProgress.objects.get_or_create(
            user=user, 
            module=module,
            defaults={'status': 'completed', 'completed_at': timezone.now(), 'completion_percentage': 100}
        )
        
        if not created and progress.status == 'completed':
            return Response({
                'status': 'already_completed',
                'progress': UserModuleProgressSerializer(progress).data
            })
        
        if not created:
            progress.status = 'completed'
            progress.completion_percentage = 100
            progress.completed_at = timezone.now()
            progress.save()
        
        # Update track progress
        self._update_track_progress(user, module)
        
        # Log activity
        CurriculumActivity.objects.create(
            user=user,
            activity_type='module_completed',
            track=module.track,
            module=module,
            points_awarded=50,
            metadata={'module_title': module.title}
        )
        
        return Response({
            'status': 'completed',
            'progress': UserModuleProgressSerializer(progress).data
        })
    
    def _update_track_progress(self, user, module):
        """Update track progress when a module is completed."""
        if not module.track:
            return
        
        track = module.track
        track_progress = UserTrackProgress.objects.filter(user=user, track=track).first()
        if not track_progress:
            return
        
        # Count completed modules
        completed_count = UserModuleProgress.objects.filter(
            user=user,
            module__track=track,
            status='completed'
        ).count()
        
        total_modules = track.modules.filter(is_active=True, is_required=True).count()
        
        track_progress.modules_completed = completed_count
        track_progress.completion_percentage = (completed_count / total_modules * 100) if total_modules > 0 else 0
        
        # Move to next module
        next_module = track.modules.filter(
            is_active=True,
            order_index__gt=module.order_index
        ).order_by('order_index').first()
        
        if next_module:
            track_progress.current_module = next_module
        elif completed_count >= total_modules:
            track_progress.completed_at = timezone.now()
        
        track_progress.save()


class LessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for lessons.
    
    Endpoints:
    - GET /lessons/ - List lessons (filterable by module)
    - GET /lessons/{id}/ - Get lesson details
    - POST /lessons/{id}/progress/ - Update lesson progress
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        return queryset.order_by('order_index')
    
    @action(detail=True, methods=['post'])
    def progress(self, request, pk=None):
        """Update lesson progress."""
        lesson = self.get_object()
        user = request.user
        
        serializer = LessonProgressUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        progress, created = UserLessonProgress.objects.get_or_create(
            user=user,
            lesson=lesson,
            defaults={'status': data.get('status', 'in_progress')}
        )
        
        # Update fields
        if 'status' in data:
            progress.status = data['status']
        if 'progress_percentage' in data:
            progress.progress_percentage = data['progress_percentage']
        if 'time_spent_minutes' in data:
            progress.time_spent_minutes += data['time_spent_minutes']
        if 'quiz_score' in data:
            progress.quiz_score = data['quiz_score']
            progress.quiz_attempts += 1
        
        if progress.status == 'in_progress' and not progress.started_at:
            progress.started_at = timezone.now()
        
        if progress.status == 'completed' and not progress.completed_at:
            progress.completed_at = timezone.now()
            
            # Log activity
            CurriculumActivity.objects.create(
                user=user,
                activity_type='lesson_completed',
                track=lesson.module.track if lesson.module else None,
                module=lesson.module,
                lesson=lesson,
                points_awarded=10,
                metadata={'lesson_title': lesson.title}
            )
            
            # Update module progress
            self._update_module_progress(user, lesson.module)
        
        progress.save()
        
        return Response({
            'status': 'updated',
            'progress': UserLessonProgressSerializer(progress).data
        })
    
    def _update_module_progress(self, user, module):
        """Update module progress when a lesson is completed."""
        if not module:
            return
        
        module_progress, _ = UserModuleProgress.objects.get_or_create(
            user=user,
            module=module,
            defaults={'status': 'in_progress'}
        )
        
        completed_lessons = UserLessonProgress.objects.filter(
            user=user,
            lesson__module=module,
            status='completed'
        ).count()
        
        total_lessons = module.lessons.filter(is_required=True).count()
        
        module_progress.lessons_completed = completed_lessons
        module_progress.completion_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        module_progress.save()


class MissionProgressView(APIView):
    """
    API endpoint for receiving mission progress updates from Missions Engine.
    
    POST /curriculum/mission-progress/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Update mission progress from Missions Engine."""
        serializer = MissionProgressUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        user = request.user
        
        module_mission = get_object_or_404(
            ModuleMission, 
            id=data['module_mission_id']
        )
        
        progress, created = UserMissionProgress.objects.get_or_create(
            user=user,
            module_mission=module_mission,
            defaults={'status': data['status']}
        )
        
        # Update fields
        progress.status = data['status']
        if 'mission_submission_id' in data:
            progress.mission_submission_id = data['mission_submission_id']
        if 'score' in data:
            progress.score = data['score']
        if 'grade' in data:
            progress.grade = data['grade']
        if 'feedback' in data:
            progress.feedback = data['feedback']
        
        if progress.status == 'in_progress' and not progress.started_at:
            progress.started_at = timezone.now()
        if progress.status == 'submitted' and not progress.submitted_at:
            progress.submitted_at = timezone.now()
        if progress.status == 'completed' and not progress.completed_at:
            progress.completed_at = timezone.now()
            progress.attempts += 1
            
            # Log activity
            module = module_mission.module
            CurriculumActivity.objects.create(
                user=user,
                activity_type='mission_completed',
                track=module.track if module else None,
                module=module,
                points_awarded=100,
                metadata={
                    'mission_title': module_mission.mission_title,
                    'score': float(progress.score) if progress.score else None,
                    'grade': progress.grade
                }
            )
            
            # Update module progress
            self._update_module_progress(user, module)
        
        progress.save()
        
        return Response({
            'status': 'updated',
            'progress': UserMissionProgressSerializer(progress).data
        })
    
    def _update_module_progress(self, user, module):
        """Update module progress when a mission is completed."""
        if not module:
            return
        
        module_progress, _ = UserModuleProgress.objects.get_or_create(
            user=user,
            module=module,
            defaults={'status': 'in_progress'}
        )
        
        completed_missions = UserMissionProgress.objects.filter(
            user=user,
            module_mission__module=module,
            status='completed'
        ).count()
        
        total_missions = module.module_missions.filter(is_required=True).count()
        
        module_progress.missions_completed = completed_missions
        
        # Check if module should be unblocked
        if module_progress.is_blocked:
            pending_required = module.module_missions.filter(
                is_required=True
            ).exclude(
                user_progress__user=user,
                user_progress__status='completed'
            ).exists()
            
            if not pending_required:
                module_progress.is_blocked = False
                module_progress.blocked_by_mission_id = None
        
        module_progress.save()


class UserProgressView(APIView):
    """
    API endpoint for user's overall curriculum progress.
    
    GET /curriculum/my-progress/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user's progress across all enrolled tracks."""
        user = request.user
        
        track_progress = UserTrackProgress.objects.filter(
            user=user
        ).select_related('track', 'current_module').order_by('-last_activity_at')
        
        # Recent activities
        recent_activities = CurriculumActivity.objects.filter(
            user=user
        ).select_related('track', 'module', 'lesson').order_by('-created_at')[:10]
        
        # Stats
        stats = {
            'total_tracks_enrolled': track_progress.count(),
            'total_tracks_completed': track_progress.filter(completed_at__isnull=False).count(),
            'total_points': sum(p.total_points for p in track_progress),
            'total_time_spent_minutes': sum(p.total_time_spent_minutes for p in track_progress),
            'current_streak_days': max((p.current_streak_days for p in track_progress), default=0),
            'total_badges': sum(p.total_badges for p in track_progress),
        }
        
        return Response({
            'tracks': UserTrackProgressSerializer(track_progress, many=True).data,
            'recent_activities': CurriculumActivitySerializer(recent_activities, many=True).data,
            'stats': stats,
            'subscription_tier': get_user_subscription_tier(user)
        })


class RecentActivityView(APIView):
    """
    API endpoint for user's recent curriculum activities.
    
    GET /curriculum/activities/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user's recent activities."""
        user = request.user
        limit = int(request.query_params.get('limit', 20))
        
        track_code = request.query_params.get('track')
        
        activities = CurriculumActivity.objects.filter(user=user)
        
        if track_code:
            activities = activities.filter(track__code=track_code)
        
        activities = activities.select_related(
            'track', 'module', 'lesson'
        ).order_by('-created_at')[:limit]
        
        return Response(CurriculumActivitySerializer(activities, many=True).data)


class Tier2TrackStatusView(APIView):
    """
    GET /curriculum/tier2/tracks/{code}/status
    Get Tier 2 track completion status and requirements.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, code):
        """Get Tier 2 track completion status and requirements."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True)
        
        if track.tier != 2:
            return Response({
                'error': 'not_tier2',
                'message': 'This endpoint is only for Tier 2 (Beginner) tracks'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        progress, _ = UserTrackProgress.objects.get_or_create(
            user=user,
            track=track
        )
        
        # Check completion requirements
        is_complete, missing = progress.check_tier2_completion(require_mentor_approval=False)
        
        # Get track details
        mandatory_modules = CurriculumModule.objects.filter(
            track=track,
            is_required=True,
            is_active=True
        ).order_by('order_index')
        
        # Get quiz count
        required_quizzes = Lesson.objects.filter(
            module__track=track,
            module__is_required=True,
            lesson_type='quiz',
            is_required=True
        ).count()
        
        # Get mini-mission count
        mini_missions = ModuleMission.objects.filter(
            module__track=track,
            module__is_required=True,
            is_required=True
        ).count()
        
        return Response({
            'track_code': track.code,
            'track_name': track.name,
            'completion_percentage': float(progress.completion_percentage),
            'is_complete': is_complete,
            'tier2_completion_requirements_met': progress.tier2_completion_requirements_met,
            'requirements': {
                'mandatory_modules_total': mandatory_modules.count(),
                'mandatory_modules_completed': UserModuleProgress.objects.filter(
                    user=user,
                    module__in=mandatory_modules,
                    status='completed'
                ).count(),
                'quizzes_total': required_quizzes,
                'quizzes_passed': progress.tier2_quizzes_passed,
                'mini_missions_total': mini_missions,
                'mini_missions_completed': progress.tier2_mini_missions_completed,
                'reflections_submitted': progress.tier2_reflections_submitted,
                'mentor_approval': progress.tier2_mentor_approval,
            },
            'missing_requirements': missing,
            'can_progress_to_tier3': is_complete,
        })


class Tier2SubmitQuizView(APIView):
    """POST /curriculum/tier2/tracks/{code}/submit-quiz - Submit quiz result"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, code):
        """Submit quiz result and update Tier 2 tracking."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        
        lesson_id = request.data.get('lesson_id')
        score = request.data.get('score')
        answers = request.data.get('answers', {})
        
        if not lesson_id or score is None:
            return Response({
                'error': 'missing_fields',
                'message': 'lesson_id and score are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        lesson = get_object_or_404(Lesson, id=lesson_id, lesson_type='quiz')
        
        # Update lesson progress
        lesson_progress, _ = UserLessonProgress.objects.get_or_create(
            user=user,
            lesson=lesson
        )
        
        previous_score = lesson_progress.quiz_score
        lesson_progress.quiz_score = float(score)
        lesson_progress.quiz_attempts += 1
        
        # Mark as completed if score >= 70%
        if float(score) >= 70:
            lesson_progress.status = 'completed'
            lesson_progress.completed_at = timezone.now()
            
            # Update Tier 2 quiz count if this is a new pass
            if previous_score is None or previous_score < 70:
                progress.tier2_quizzes_passed += 1
                progress.save(update_fields=['tier2_quizzes_passed'])
        
        lesson_progress.save()
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'quiz_passed': float(score) >= 70,
            'score': float(score),
            'tier2_quizzes_passed': progress.tier2_quizzes_passed,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })


class Tier2SubmitReflectionView(APIView):
    """POST /curriculum/tier2/tracks/{code}/submit-reflection - Submit reflection"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, code):
        """Submit reflection and update Tier 2 tracking."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        
        module_id = request.data.get('module_id')
        reflection_text = request.data.get('reflection_text')
        
        if not module_id or not reflection_text:
            return Response({
                'error': 'missing_fields',
                'message': 'module_id and reflection_text are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        module = get_object_or_404(CurriculumModule, id=module_id, track=track)
        
        # Store reflection (could be in portfolio or separate model)
        # For now, increment counter
        progress.tier2_reflections_submitted += 1
        progress.save(update_fields=['tier2_reflections_submitted'])
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'reflections_submitted': progress.tier2_reflections_submitted,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })


class Tier2SubmitMiniMissionView(APIView):
    """POST /curriculum/tier2/tracks/{code}/submit-mini-mission - Submit mini-mission"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, code):
        """Submit mini-mission and update Tier 2 tracking."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        
        module_mission_id = request.data.get('module_mission_id')
        submission_data = request.data.get('submission_data', {})
        
        if not module_mission_id:
            return Response({
                'error': 'missing_fields',
                'message': 'module_mission_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        module_mission = get_object_or_404(ModuleMission, id=module_mission_id, module__track=track)
        
        # Update mission progress
        mission_progress, created = UserMissionProgress.objects.get_or_create(
            user=user,
            module_mission=module_mission
        )
        
        was_completed = mission_progress.status == 'completed'
        mission_progress.status = 'submitted'
        mission_progress.submitted_at = timezone.now()
        mission_progress.save()
        
        # Update Tier 2 mini-mission count if this is a new completion
        if not was_completed:
            progress.tier2_mini_missions_completed += 1
            progress.save(update_fields=['tier2_mini_missions_completed'])
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'mini_missions_completed': progress.tier2_mini_missions_completed,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })


class Tier2CompleteView(APIView):
    """POST /curriculum/tier2/tracks/{code}/complete - Complete Tier 2 and unlock Tier 3"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, code):
        """Complete Tier 2 and unlock Tier 3."""
        user = request.user
        track = get_object_or_404(CurriculumTrack, code=code, is_active=True, tier=2)
        progress, _ = UserTrackProgress.objects.get_or_create(user=user, track=track)
        
        # Verify all requirements are met
        is_complete, missing = progress.check_tier2_completion()
        
        if not is_complete:
            return Response({
                'error': 'requirements_not_met',
                'message': 'All Tier 2 requirements must be met before completion',
                'missing_requirements': missing
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark track as completed
        progress.completed_at = timezone.now()
        progress.completion_percentage = 100
        progress.save()
        
        # Log activity
        CurriculumActivity.objects.create(
            user=user,
            activity_type='tier2_completed',
            track=track,
            points_awarded=500,
            metadata={'tier': 2, 'track': track.code}
        )
        
        return Response({
            'success': True,
            'message': 'Tier 2 (Beginner Track) completed successfully. You can now access Tier 3 (Intermediate Tracks).',
            'completed_at': progress.completed_at.isoformat(),
            'tier3_unlocked': True,
        })
    
    def _submit_quiz(self, request, progress):
        """Submit quiz result and update Tier 2 tracking."""
        lesson_id = request.data.get('lesson_id')
        score = request.data.get('score')
        answers = request.data.get('answers', {})
        
        if not lesson_id or score is None:
            return Response({
                'error': 'missing_fields',
                'message': 'lesson_id and score are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        lesson = get_object_or_404(Lesson, id=lesson_id, lesson_type='quiz')
        
        # Update lesson progress
        lesson_progress, _ = UserLessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson
        )
        
        lesson_progress.quiz_score = float(score)
        lesson_progress.quiz_attempts += 1
        
        # Mark as completed if score >= 70%
        if float(score) >= 70:
            lesson_progress.status = 'completed'
            lesson_progress.completed_at = timezone.now()
            
            # Update Tier 2 quiz count if this is a new pass
            if lesson_progress.quiz_attempts == 1 or (lesson_progress.quiz_attempts > 1 and lesson_progress.quiz_score < 70):
                progress.tier2_quizzes_passed += 1
                progress.save(update_fields=['tier2_quizzes_passed'])
        
        lesson_progress.save()
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'quiz_passed': float(score) >= 70,
            'score': float(score),
            'tier2_quizzes_passed': progress.tier2_quizzes_passed,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })
    
    def _submit_reflection(self, request, progress):
        """Submit reflection and update Tier 2 tracking."""
        module_id = request.data.get('module_id')
        reflection_text = request.data.get('reflection_text')
        
        if not module_id or not reflection_text:
            return Response({
                'error': 'missing_fields',
                'message': 'module_id and reflection_text are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        module = get_object_or_404(CurriculumModule, id=module_id)
        
        # Store reflection (could be in portfolio or separate model)
        # For now, increment counter
        progress.tier2_reflections_submitted += 1
        progress.save(update_fields=['tier2_reflections_submitted'])
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'reflections_submitted': progress.tier2_reflections_submitted,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })
    
    def _submit_mini_mission(self, request, progress):
        """Submit mini-mission and update Tier 2 tracking."""
        module_mission_id = request.data.get('module_mission_id')
        submission_data = request.data.get('submission_data', {})
        
        if not module_mission_id:
            return Response({
                'error': 'missing_fields',
                'message': 'module_mission_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        module_mission = get_object_or_404(ModuleMission, id=module_mission_id)
        
        # Update mission progress
        mission_progress, created = UserMissionProgress.objects.get_or_create(
            user=request.user,
            module_mission=module_mission
        )
        
        mission_progress.status = 'submitted'
        mission_progress.submitted_at = timezone.now()
        mission_progress.save()
        
        # Update Tier 2 mini-mission count if this is a new completion
        if created or mission_progress.status != 'completed':
            progress.tier2_mini_missions_completed += 1
            progress.save(update_fields=['tier2_mini_missions_completed'])
        
        # Check completion
        is_complete, missing = progress.check_tier2_completion()
        
        return Response({
            'success': True,
            'mini_missions_completed': progress.tier2_mini_missions_completed,
            'is_complete': is_complete,
            'missing_requirements': missing,
        })
    
    def _complete_tier2(self, request, progress):
        """Complete Tier 2 and unlock Tier 3."""
        # Verify all requirements are met
        is_complete, missing = progress.check_tier2_completion()
        
        if not is_complete:
            return Response({
                'error': 'requirements_not_met',
                'message': 'All Tier 2 requirements must be met before completion',
                'missing_requirements': missing
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark track as completed
        progress.completed_at = timezone.now()
        progress.status = 'completed'
        progress.completion_percentage = 100
        progress.save()
        
        # Log activity
        CurriculumActivity.objects.create(
            user=request.user,
            activity_type='tier2_completed',
            track=progress.track,
            points_awarded=500,
            metadata={'tier': 2, 'track': progress.track.code}
        )
        
        return Response({
            'success': True,
            'message': 'Tier 2 (Beginner Track) completed successfully. You can now access Tier 3 (Intermediate Tracks).',
            'completed_at': progress.completed_at.isoformat(),
            'tier3_unlocked': True,
        })

