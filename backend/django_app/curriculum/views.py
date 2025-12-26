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
        
        progress = get_object_or_404(UserModuleProgress, user=user, module=module)
        
        if progress.status == 'completed':
            return Response({
                'status': 'already_completed',
                'progress': UserModuleProgressSerializer(progress).data
            })
        
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

