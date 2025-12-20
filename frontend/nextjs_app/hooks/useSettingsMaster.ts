/**
 * Settings Master Hook
 * Orchestrates ALL platform coordination
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  getUserSettings,
  updateUserSettings,
  getUserEntitlements,
} from '@/lib/settings/api';
import { subscribeToSettingsChanges } from '@/lib/settings/realtime';
import { triggerSystemUpdates } from '@/lib/settings/system-triggers';
import { calculateProfileCompleteness } from '@/lib/settings/profile-completeness';
import type { UserSettings, UserEntitlements, SettingsUpdate } from '@/lib/settings/types';

const supabase = createClient();

export function useSettingsMaster(userId?: string) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);

  // Get current user if not provided
  const getCurrentUserId = useCallback(async () => {
    if (userId) return userId;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }, [userId]);

  // Fetch settings
  const {
    data: settingsData,
    isLoading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['user-settings', userId],
    queryFn: async () => {
      const id = await getCurrentUserId();
      if (!id) {
        // Return null instead of throwing - let the component handle unauthenticated state
        return null;
      }
      return getUserSettings(id);
    },
    enabled: !!userId,
    staleTime: 30000,
    retry: false,
  });

  // Fetch entitlements
  const {
    data: entitlementsData,
    isLoading: entitlementsLoading,
    error: entitlementsError,
    refetch: refetchEntitlements,
  } = useQuery({
    queryKey: ['user-entitlements', userId],
    queryFn: async () => {
      const id = await getCurrentUserId();
      if (!id) {
        // Return null instead of throwing - let the component handle unauthenticated state
        return null;
      }
      return getUserEntitlements(id);
    },
    enabled: !!userId,
    staleTime: 30000,
    retry: false,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: SettingsUpdate & { hasPortfolioItems?: boolean }) => {
      const id = await getCurrentUserId();
      if (!id) throw new Error('User not authenticated');
      
      const { hasPortfolioItems, ...updateData } = updates;
      
      // Update settings
      const result = await updateUserSettings(id, updateData, hasPortfolioItems);
      
      // Trigger cross-system updates
      await triggerSystemUpdates(id, updateData);
      
      return result;
    },
    onMutate: async (updates) => {
      // Optimistic update with completeness recalculation
      if (settings) {
        const { hasPortfolioItems = false, ...updateData } = updates;
        const mergedSettings = { ...settings, ...updateData } as UserSettings;
        const newCompleteness = calculateProfileCompleteness(mergedSettings, hasPortfolioItems);
        setSettings({ 
          ...mergedSettings, 
          profileCompleteness: newCompleteness 
        } as UserSettings);
      }
    },
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: ['user-settings', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-entitlements', userId] });
      refetchSettings();
      refetchEntitlements();
    },
    onError: (error) => {
      // Revert optimistic update
      refetchSettings();
      throw error;
    },
  });

  // Sync store with query data
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  useEffect(() => {
    if (entitlementsData) {
      setEntitlements(entitlementsData);
    }
  }, [entitlementsData]);

  // MASTER REALTIME SUBSCRIPTION (ALL SYSTEMS)
  useEffect(() => {
    const id = userId;
    if (!id) return;

    // Master channel for ALL settings coordination
    const channel = supabase
      .channel(`settings_master_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${id}`,
        },
        (payload) => {
          // Settings changed - update local state
          if (payload.new) {
            setSettings(payload.new as UserSettings);
          }
          // Trigger refetch to get calculated completeness
          refetchSettings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${id}`,
        },
        () => {
          // Subscription changed - refetch entitlements
          refetchEntitlements();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_items',
          filter: `user_id=eq.${id}`,
        },
        () => {
          // Portfolio items changed - may affect completeness
          refetchSettings();
        }
      )
      .subscribe();

    // Also subscribe to custom notifications from triggers
    const notificationChannel = supabase
      .channel(`settings_notifications_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_profiles',
          filter: `user_id=eq.${id}`,
        },
        () => {
          // Marketplace profile updated from settings trigger
          refetchEntitlements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(notificationChannel);
    };
  }, [userId, refetchSettings, refetchEntitlements]);

  return {
    // Data
    settings,
    entitlements,
    
    // Loading states
    isLoading: settingsLoading || entitlementsLoading,
    isUpdating: updateMutation.isPending,
    
    // Errors
    error: settingsError || entitlementsError,
    
    // Actions
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    refetch: () => {
      refetchSettings();
      refetchEntitlements();
    },
  };
}

