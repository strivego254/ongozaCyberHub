"""
Recipe Engine serializers - API responses for recipes and user progress.
"""
from rest_framework import serializers
from django.db.models import Count, Avg, Q
from .models import Recipe, UserRecipeProgress, RecipeContextLink, UserRecipeBookmark


class RecipeListSerializer(serializers.ModelSerializer):
    """Serializer for recipe list views."""
    is_bookmarked = serializers.SerializerMethodField()
    user_status = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    context_labels = serializers.SerializerMethodField()
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'slug', 'summary', 'difficulty', 'estimated_minutes',
            'track_codes', 'skill_codes', 'tools_used', 'thumbnail_url',
            'usage_count', 'avg_rating', 'mentor_curated',
            'is_bookmarked', 'user_status', 'user_rating', 'context_labels'
        ]
        read_only_fields = ['id', 'slug', 'usage_count', 'avg_rating']
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserRecipeBookmark.objects.filter(
                user=request.user,
                recipe=obj
            ).exists()
        return False
    
    def get_user_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = UserRecipeProgress.objects.filter(
                user=request.user,
                recipe=obj
            ).first()
            if progress:
                return progress.status
        return None
    
    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = UserRecipeProgress.objects.filter(
                user=request.user,
                recipe=obj
            ).first()
            if progress and progress.rating:
                return progress.rating
        return None
    
    def get_context_labels(self, obj):
        """Get context labels showing where this recipe is used."""
        # Get a sample of context links (limit to 3 for performance)
        context_links = RecipeContextLink.objects.filter(
            recipe=obj
        ).select_related('recipe')[:3]
        
        labels = []
        for link in context_links:
            if link.context_type == 'mission':
                labels.append(f"Used in Mission")
            elif link.context_type == 'module':
                labels.append(f"Used in Module")
            elif link.context_type == 'project':
                labels.append(f"Used in Project")
            elif link.context_type == 'mentor_session':
                labels.append(f"Used in Mentorship")
        
        return labels[:2]  # Return max 2 labels


class RecipeDetailSerializer(serializers.ModelSerializer):
    """Serializer for recipe detail views."""
    is_bookmarked = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()
    related_recipes = serializers.SerializerMethodField()
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'slug', 'summary', 'description', 'difficulty',
            'estimated_minutes', 'track_codes', 'skill_codes', 'tools_used',
            'prerequisites', 'content', 'validation_steps', 'thumbnail_url',
            'usage_count', 'avg_rating', 'mentor_curated', 'created_by',
            'created_at', 'updated_at',
            'is_bookmarked', 'user_progress', 'related_recipes'
        ]
        read_only_fields = ['id', 'slug', 'usage_count', 'avg_rating', 'created_at', 'updated_at']
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserRecipeBookmark.objects.filter(
                user=request.user,
                recipe=obj
            ).exists()
        return False
    
    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = UserRecipeProgress.objects.filter(
                user=request.user,
                recipe=obj
            ).first()
            if progress:
                return {
                    'status': progress.status,
                    'rating': progress.rating,
                    'notes': progress.notes,
                    'time_spent_minutes': progress.time_spent_minutes,
                    'completed_at': progress.completed_at,
                }
        return None
    
    def get_related_recipes(self, obj):
        """Get recipes with similar skills or tools."""
        related = Recipe.objects.filter(
            Q(is_active=True) &
            (
                Q(skill_codes__overlap=obj.skill_codes) |
                Q(tools_used__overlap=obj.tools_used)
            )
        ).exclude(id=obj.id)[:6]
        
        return RecipeListSerializer(related, many=True, context=self.context).data


class UserRecipeProgressSerializer(serializers.ModelSerializer):
    """Serializer for user recipe progress."""
    recipe_title = serializers.CharField(source='recipe.title', read_only=True)
    recipe_slug = serializers.SlugField(source='recipe.slug', read_only=True)
    
    class Meta:
        model = UserRecipeProgress
        fields = [
            'id', 'recipe', 'recipe_title', 'recipe_slug', 'status',
            'rating', 'notes', 'time_spent_minutes', 'completed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RecipeContextLinkSerializer(serializers.ModelSerializer):
    """Serializer for recipe context links."""
    recipe_title = serializers.CharField(source='recipe.title', read_only=True)
    recipe_slug = serializers.SlugField(source='recipe.slug', read_only=True)
    recipe_summary = serializers.CharField(source='recipe.summary', read_only=True)
    recipe_difficulty = serializers.CharField(source='recipe.difficulty', read_only=True)
    recipe_estimated_minutes = serializers.IntegerField(source='recipe.estimated_minutes', read_only=True)
    
    class Meta:
        model = RecipeContextLink
        fields = [
            'id', 'recipe', 'recipe_title', 'recipe_slug', 'recipe_summary',
            'recipe_difficulty', 'recipe_estimated_minutes',
            'context_type', 'context_id', 'is_required', 'position_order'
        ]
        read_only_fields = ['id']


class RecipeBookmarkSerializer(serializers.ModelSerializer):
    """Serializer for recipe bookmarks."""
    recipe = RecipeListSerializer(read_only=True)
    
    class Meta:
        model = UserRecipeBookmark
        fields = ['id', 'recipe', 'bookmarked_at']
        read_only_fields = ['id', 'bookmarked_at']


class RecipeProgressUpdateSerializer(serializers.Serializer):
    """Serializer for updating recipe progress."""
    status = serializers.ChoiceField(
        choices=['started', 'completed', 'bookmarked'],
        required=False
    )
    rating = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False,
        allow_null=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    time_spent_minutes = serializers.IntegerField(
        min_value=0,
        required=False,
        allow_null=True
    )


