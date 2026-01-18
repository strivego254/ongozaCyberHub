"""
Recipe Engine views - API endpoints for recipes and user progress.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count, Prefetch, Q, Subquery, OuterRef, Avg
from django.utils import timezone
from django.utils.text import slugify

from .models import Recipe, UserRecipeProgress, RecipeContextLink, UserRecipeBookmark, RecipeSource, RecipeLLMJob
from .serializers import (
    RecipeListSerializer, RecipeDetailSerializer,
    UserRecipeProgressSerializer, RecipeContextLinkSerializer,
    RecipeBookmarkSerializer, RecipeProgressUpdateSerializer,
    RecipeSourceSerializer
)


class RecipeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for recipes.
    
    Endpoints:
    - GET /recipes/ - List all active recipes (with search/filter)
    - GET /recipes/{slug}/ - Get recipe details
    - GET /recipes/{slug}/related/ - Get related recipes
    - POST /recipes/{slug}/progress/ - Update user progress
    - POST /recipes/{slug}/bookmark/ - Bookmark/unbookmark recipe
    """
    queryset = Recipe.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Allow browsing without auth
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RecipeDetailSerializer
        return RecipeListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(summary__icontains=search) |
                Q(description__icontains=search) |
                Q(skill_codes__icontains=search) |
                Q(tools_used__icontains=search)
            )
        
        # Filters
        track = self.request.query_params.get('track', None)
        if track:
            queryset = queryset.filter(track_codes__contains=[track])
        
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        max_time = self.request.query_params.get('max_time', None)
        if max_time:
            try:
                queryset = queryset.filter(estimated_minutes__lte=int(max_time))
            except ValueError:
                pass
        
        # Context filter (mission, module, project)
        context_type = self.request.query_params.get('context', None)
        if context_type:
            # Filter recipes that have context links of this type
            context_ids = RecipeContextLink.objects.filter(
                context_type=context_type
            ).values_list('recipe_id', flat=True)
            queryset = queryset.filter(id__in=context_ids)
        
        # Sort
        sort = self.request.query_params.get('sort', 'relevance')
        if sort == 'popular':
            queryset = queryset.order_by('-usage_count', '-avg_rating')
        elif sort == 'recent':
            queryset = queryset.order_by('-created_at')
        elif sort == 'rating':
            queryset = queryset.order_by('-avg_rating', '-usage_count')
        else:  # relevance default
            queryset = queryset.order_by('-usage_count', '-avg_rating')
        
        return queryset.select_related('created_by').prefetch_related('context_links')
    
    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        """Get related recipes based on skills/tools."""
        recipe = self.get_object()
        related = Recipe.objects.filter(
            Q(is_active=True) &
            (
                Q(skill_codes__overlap=recipe.skill_codes) |
                Q(tools_used__overlap=recipe.tools_used)
            )
        ).exclude(id=recipe.id)[:6]
        
        serializer = RecipeListSerializer(related, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post', 'get'], permission_classes=[permissions.IsAuthenticated])
    def progress(self, request, slug=None):
        """Update user progress for a recipe."""
        recipe = self.get_object()
        user = request.user
        
        if request.method == 'GET':
            progress = UserRecipeProgress.objects.filter(user=user, recipe=recipe).first()
            if progress:
                serializer = UserRecipeProgressSerializer(progress)
                return Response(serializer.data)
            return Response({'status': None})
        
        # POST - Update progress
        progress, created = UserRecipeProgress.objects.get_or_create(
            user=user,
            recipe=recipe
        )
        
        serializer = RecipeProgressUpdateSerializer(data=request.data)
        if serializer.is_valid():
            if 'status' in serializer.validated_data:
                progress.status = serializer.validated_data['status']
                if serializer.validated_data['status'] == 'completed' and not progress.completed_at:
                    progress.completed_at = timezone.now()
                    # Update recipe stats
                    recipe.usage_count += 1
                    recipe.save(update_fields=['usage_count'])
            
            if 'rating' in serializer.validated_data:
                progress.rating = serializer.validated_data['rating']
                # Update recipe avg_rating
                avg_rating = UserRecipeProgress.objects.filter(
                    recipe=recipe,
                    rating__isnull=False
                ).aggregate(Avg('rating'))['rating__avg']
                if avg_rating:
                    recipe.avg_rating = round(avg_rating, 2)
                    recipe.save(update_fields=['avg_rating'])
            
            if 'notes' in serializer.validated_data:
                progress.notes = serializer.validated_data['notes']
            
            if 'time_spent_minutes' in serializer.validated_data:
                progress.time_spent_minutes = serializer.validated_data['time_spent_minutes']
            
            progress.save()
            
            response_serializer = UserRecipeProgressSerializer(progress)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post', 'delete'], permission_classes=[permissions.IsAuthenticated])
    def bookmark(self, request, slug=None):
        """Bookmark or unbookmark a recipe."""
        recipe = self.get_object()
        user = request.user
        
        if request.method == 'DELETE':
            UserRecipeBookmark.objects.filter(user=user, recipe=recipe).delete()
            return Response({'bookmarked': False}, status=status.HTTP_200_OK)
        
        # POST - Create bookmark
        bookmark, created = UserRecipeBookmark.objects.get_or_create(
            user=user,
            recipe=recipe
        )
        
        serializer = RecipeBookmarkSerializer(bookmark)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class UserRecipeProgressViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user recipe progress."""
    serializer_class = UserRecipeProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserRecipeProgress.objects.filter(
            user=self.request.user
        ).select_related('recipe').order_by('-updated_at')


class RecipeContextLinkViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for recipe context links."""
    serializer_class = RecipeContextLinkSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = RecipeContextLink.objects.select_related('recipe')
        
        context_type = self.request.query_params.get('context_type', None)
        if context_type:
            queryset = queryset.filter(context_type=context_type)
        
        context_id = self.request.query_params.get('context_id', None)
        if context_id:
            queryset = queryset.filter(context_id=context_id)
        
        return queryset.order_by('position_order')


class BookmarkedRecipesView(APIView):
    """View for user's bookmarked recipes."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        bookmarks = UserRecipeBookmark.objects.filter(
            user=request.user
        ).select_related('recipe').order_by('-bookmarked_at')
        
        serializer = RecipeBookmarkSerializer(bookmarks, many=True)
        return Response(serializer.data)


class RecipeStatsView(APIView):
    """View for recipe library statistics."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        total = Recipe.objects.filter(is_active=True).count()
        user = request.user

        bookmarked = 0
        if user.is_authenticated:
            bookmarked = UserRecipeBookmark.objects.filter(user=user).count()

        return Response({
            'total': total,
            'bookmarked': bookmarked
        })


class UserRecipesView(APIView):
    """View for user's recipe progress."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        # Check if user can access this data
        if str(request.user.id) != user_id:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Get recipes with user progress
        recipes_with_progress = Recipe.objects.filter(
            is_active=True,
            user_progress__user=request.user
        ).select_related('created_by').prefetch_related(
            'user_progress',
            Prefetch('context_links', queryset=RecipeContextLink.objects.select_related('recipe'))
        ).annotate(
            user_status=Subquery(
                UserRecipeProgress.objects.filter(
                    user=request.user,
                    recipe=OuterRef('pk')
                ).values('status')[:1]
            ),
            user_rating=Subquery(
                UserRecipeProgress.objects.filter(
                    user=request.user,
                    recipe=OuterRef('pk')
                ).values('rating')[:1]
            )
        )

        serializer = RecipeListSerializer(recipes_with_progress, many=True, context={'request': request})
        return Response(serializer.data)


class UserRecipeProgressView(APIView):
    """View for updating user recipe progress."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id, recipe_id):
        # Check if user can access this data
        if str(request.user.id) != user_id:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            recipe = Recipe.objects.get(id=recipe_id, is_active=True)
        except Recipe.DoesNotExist:
            return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get or create progress record
        progress, created = UserRecipeProgress.objects.get_or_create(
            user=request.user,
            recipe=recipe
        )

        # Update progress
        serializer = RecipeProgressUpdateSerializer(data=request.data)
        if serializer.is_valid():
            old_status = progress.status
            new_status = serializer.validated_data.get('status', progress.status)

            progress.status = new_status
            if new_status == 'completed' and old_status != 'completed':
                progress.completed_at = timezone.now()
                # Update recipe stats
                recipe.usage_count += 1
                recipe.save(update_fields=['usage_count'])

            if 'rating' in serializer.validated_data:
                progress.rating = serializer.validated_data['rating']
                # Update recipe avg_rating
                avg_rating = UserRecipeProgress.objects.filter(
                    recipe=recipe,
                    rating__isnull=False
                ).aggregate(Avg('rating'))['rating__avg']
                if avg_rating:
                    recipe.avg_rating = round(avg_rating, 2)
                    recipe.save(update_fields=['avg_rating'])

            if 'notes' in serializer.validated_data:
                progress.notes = serializer.validated_data['notes']

            if 'time_spent_minutes' in serializer.validated_data:
                progress.time_spent_minutes = serializer.validated_data['time_spent_minutes']

            progress.save()

            # Emit skill signal (placeholder - integrate with TalentScope)
            # emitSkillSignalFromRecipeCompletion(request.user.id, recipe, new_status)

            response_serializer = UserRecipeProgressSerializer(progress)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecipeSourceViewSet(viewsets.ModelViewSet):
    """ViewSet for recipe sources."""
    queryset = RecipeSource.objects.all()
    serializer_class = RecipeSourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Only admin/system can create sources
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)


class RecipeSourceIngestView(APIView):
    """View for triggering recipe source ingestion."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, source_id):
        # Only admin/system can trigger ingestion
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            source = RecipeSource.objects.get(id=source_id)
        except RecipeSource.DoesNotExist:
            return Response({'error': 'Source not found'}, status=status.HTTP_404_NOT_FOUND)

        # Placeholder - implement actual ingestion logic
        # This would create RecipeLLMJob records based on source config

        return Response({'message': 'Ingestion started', 'source_id': source_id})


class LLMNormalizeRecipesView(APIView):
    """View for triggering LLM normalization worker."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Only admin/system can trigger LLM jobs
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Placeholder - implement LLM worker logic
        # This would pick pending RecipeLLMJob records and process them

        return Response({'message': 'LLM normalization worker triggered'})
