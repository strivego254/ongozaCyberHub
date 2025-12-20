/**
 * Portfolio Engine - Core Hook
 * Data fetching and mutations for portfolio items
 */

import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  getPortfolioItems,
  getPortfolioItem,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getPortfolioHealthMetrics,
  type CreatePortfolioItemInput,
  type UpdatePortfolioItemInput,
} from '@/lib/portfolio/api';
import { usePortfolioStore } from '@/lib/portfolio/store';
import type { PortfolioItem } from '@/lib/portfolio/types';

const supabase = createClient();

export function usePortfolio(userId?: string) {
  const queryClient = useQueryClient();
  const {
    items,
    setItems,
    healthMetrics,
    setHealthMetrics,
    setLoading,
    setError,
  } = usePortfolioStore();

  // Get current user if not provided
  const getCurrentUserId = useCallback(async () => {
    if (userId) return userId;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }, [userId]);

  // Fetch portfolio items
  const {
    data: portfolioItems,
    isLoading: itemsLoading,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['portfolio-items', userId],
    queryFn: async () => {
      const id = await getCurrentUserId();
      if (!id) throw new Error('User not authenticated');
      return getPortfolioItems(id);
    },
    enabled: !!userId || true,
    staleTime: 30000, // 30 seconds
  });

  // Fetch health metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['portfolio-health', userId],
    queryFn: async () => {
      const id = await getCurrentUserId();
      if (!id) throw new Error('User not authenticated');
      return getPortfolioHealthMetrics(id);
    },
    enabled: !!userId || true,
    staleTime: 60000, // 1 minute
  });

  // Create portfolio item mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreatePortfolioItemInput) => {
      const id = await getCurrentUserId();
      if (!id) throw new Error('User not authenticated');
      return createPortfolioItem(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items', userId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-health', userId] });
      refetchItems();
      refetchMetrics();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Update portfolio item mutation
  const updateMutation = useMutation({
    mutationFn: async ({ itemId, input }: { itemId: string; input: UpdatePortfolioItemInput }) => {
      return updatePortfolioItem(itemId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items', userId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-health', userId] });
      refetchItems();
      refetchMetrics();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Delete portfolio item mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return deletePortfolioItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items', userId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-health', userId] });
      refetchItems();
      refetchMetrics();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Sync store with query data
  useEffect(() => {
    if (portfolioItems) {
      setItems(portfolioItems);
    }
  }, [portfolioItems, setItems]);

  useEffect(() => {
    if (metrics) {
      setHealthMetrics(metrics);
    }
  }, [metrics, setHealthMetrics]);

  useEffect(() => {
    setLoading(itemsLoading || metricsLoading);
  }, [itemsLoading, metricsLoading, setLoading]);

  useEffect(() => {
    if (itemsError) {
      setError(itemsError instanceof Error ? itemsError.message : 'Failed to load portfolio');
    }
  }, [itemsError, setError]);

  // Set up realtime subscription
  useEffect(() => {
    const id = userId;
    if (!id) return;

    const channel = supabase
      .channel('portfolio-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_items',
          filter: `user_id=eq.${id}`,
        },
        () => {
          refetchItems();
          refetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetchItems, refetchMetrics]);

  return {
    // Data
    items: portfolioItems || items,
    healthMetrics: metrics || healthMetrics,
    topSkills: metrics?.topSkills || [],
    pendingReviews: items.filter((item) => item.status === 'in_review'),
    approvedItems: items.filter((item) => item.status === 'approved'),

    // Loading states
    isLoading: itemsLoading || metricsLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Actions
    createItem: createMutation.mutate,
    updateItem: (itemId: string, input: UpdatePortfolioItemInput) =>
      updateMutation.mutate({ itemId, input }),
    deleteItem: deleteMutation.mutate,
    refetch: () => {
      refetchItems();
      refetchMetrics();
    },
  };
}

export function usePortfolioItem(itemId: string) {
  const queryClient = useQueryClient();

  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-item', itemId],
    queryFn: () => getPortfolioItem(itemId),
    enabled: !!itemId,
  });

  // Set up realtime subscription for single item
  useEffect(() => {
    if (!itemId) return;

    const channel = supabase
      .channel(`portfolio-item-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_items',
          filter: `id=eq.${itemId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId, refetch]);

  return {
    item,
    isLoading,
    error,
    refetch,
  };
}
