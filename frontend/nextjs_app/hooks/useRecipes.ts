/**
 * useRecipes Hook
 * 
 * Master hook for recipe library management.
 * Handles fetching, filtering, searching, and bookmarking recipes.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { recipesClient } from '@/services/recipesClient';
import type {
  Recipe,
  RecipeListResponse,
  RecipeFilters,
  RecipeStats,
  RecipeStatus,
} from '@/services/types/recipes';

interface UseRecipesOptions {
  filters?: RecipeFilters;
  autoFetch?: boolean;
}

interface UseRecipesResult {
  recipes: RecipeListResponse[];
  stats: RecipeStats;
  loading: boolean;
  error: string | null;
  bookmarks: string[];
  refetch: () => Promise<void>;
}

export function useRecipes(
  search: string = '',
  filters: RecipeFilters = {},
  options: UseRecipesOptions = {}
): UseRecipesResult {
  const { autoFetch = true } = options;
  
  const [recipes, setRecipes] = useState<RecipeListResponse[]>([]);
  const [stats, setStats] = useState<RecipeStats>({ total: 0, bookmarked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build filters with search
      const recipeFilters: RecipeFilters = {
        ...filters,
        ...(search ? { search } : {}),
      };

      // Fetch recipes and stats in parallel
      const [recipesData, statsData] = await Promise.all([
        recipesClient.getRecipes(recipeFilters),
        recipesClient.getStats(),
      ]);

      setRecipes(recipesData);
      setStats(statsData);
      
      // Extract bookmarked recipe IDs
      const bookmarkedIds = recipesData
        .filter((recipe) => recipe.is_bookmarked)
        .map((recipe) => recipe.id);
      setBookmarks(bookmarkedIds);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipes');
      console.error('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchRecipes();
    }
  }, [fetchRecipes, autoFetch]);

  return {
    recipes,
    stats,
    loading,
    error,
    bookmarks,
    refetch: fetchRecipes,
  };
}

/**
 * useRecipeProgress Hook
 * 
 * Hook for managing user progress on individual recipes.
 * Handles completion, rating, bookmarking, and time tracking.
 */
interface UseRecipeProgressResult {
  progress: {
    status: RecipeStatus | null;
    rating: number | null;
    notes: string | null;
    time_spent_minutes: number | null;
    completed_at: string | null;
  } | null;
  loading: boolean;
  error: string | null;
  markComplete: (rating?: number, notes?: string) => Promise<void>;
  updateRating: (rating: number) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  updateTimeSpent: (minutes: number) => Promise<void>;
  bookmark: () => Promise<void>;
  unbookmark: () => Promise<void>;
  isBookmarked: boolean;
  refetch: () => Promise<void>;
}

export function useRecipeProgress(recipeSlug: string): UseRecipeProgressResult {
  const [progress, setProgress] = useState<UseRecipeProgressResult['progress']>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!recipeSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch recipe details (includes user progress and bookmark status)
      const recipe = await recipesClient.getRecipe(recipeSlug);
      
      if (recipe.user_progress) {
        setProgress({
          status: recipe.user_progress.status as RecipeStatus,
          rating: recipe.user_progress.rating || null,
          notes: recipe.user_progress.notes || null,
          time_spent_minutes: recipe.user_progress.time_spent_minutes || null,
          completed_at: recipe.user_progress.completed_at || null,
        });
      } else {
        setProgress(null);
      }
      
      setIsBookmarked(recipe.is_bookmarked || false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipe progress');
      console.error('Error fetching recipe progress:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeSlug]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const markComplete = useCallback(async (rating?: number, notes?: string) => {
    try {
      await recipesClient.updateProgress(recipeSlug, {
        status: 'completed',
        ...(rating !== undefined ? { rating } : {}),
        ...(notes !== undefined ? { notes } : {}),
      });
      await fetchProgress();
    } catch (err: any) {
      setError(err.message || 'Failed to mark recipe as complete');
      throw err;
    }
  }, [recipeSlug, fetchProgress]);

  const updateRating = useCallback(async (rating: number) => {
    try {
      await recipesClient.updateProgress(recipeSlug, { rating });
      await fetchProgress();
    } catch (err: any) {
      setError(err.message || 'Failed to update rating');
      throw err;
    }
  }, [recipeSlug, fetchProgress]);

  const updateNotes = useCallback(async (notes: string) => {
    try {
      await recipesClient.updateProgress(recipeSlug, { notes });
      await fetchProgress();
    } catch (err: any) {
      setError(err.message || 'Failed to update notes');
      throw err;
    }
  }, [recipeSlug, fetchProgress]);

  const updateTimeSpent = useCallback(async (minutes: number) => {
    try {
      await recipesClient.updateProgress(recipeSlug, { time_spent_minutes: minutes });
      await fetchProgress();
    } catch (err: any) {
      setError(err.message || 'Failed to update time spent');
      throw err;
    }
  }, [recipeSlug, fetchProgress]);

  const bookmark = useCallback(async () => {
    try {
      await recipesClient.bookmarkRecipe(recipeSlug);
      setIsBookmarked(true);
    } catch (err: any) {
      setError(err.message || 'Failed to bookmark recipe');
      throw err;
    }
  }, [recipeSlug]);

  const unbookmark = useCallback(async () => {
    try {
      await recipesClient.unbookmarkRecipe(recipeSlug);
      setIsBookmarked(false);
    } catch (err: any) {
      setError(err.message || 'Failed to unbookmark recipe');
      throw err;
    }
  }, [recipeSlug]);

  return {
    progress,
    loading,
    error,
    markComplete,
    updateRating,
    updateNotes,
    updateTimeSpent,
    bookmark,
    unbookmark,
    isBookmarked,
    refetch: fetchProgress,
  };
}


