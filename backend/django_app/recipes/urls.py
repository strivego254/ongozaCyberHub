"""
Recipe Engine URL configuration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RecipeViewSet,
    UserRecipeProgressViewSet,
    RecipeContextLinkViewSet,
    BookmarkedRecipesView,
    RecipeStatsView
)

router = DefaultRouter()
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'my-progress', UserRecipeProgressViewSet, basename='my-recipe-progress')
router.register(r'context-links', RecipeContextLinkViewSet, basename='recipe-context-link')

urlpatterns = [
    path('', include(router.urls)),
    path('bookmarks/', BookmarkedRecipesView.as_view(), name='recipe-bookmarks'),
    path('stats/', RecipeStatsView.as_view(), name='recipe-stats'),
]


