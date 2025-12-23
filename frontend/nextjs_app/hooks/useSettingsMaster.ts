/**
 * Settings Master Hook
 * Orchestrates ALL platform coordination
 */

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Type definitions
export interface UserSettings {
  portfolioVisibility?: 'private' | 'marketplace_preview' | 'public';
  profileCompleteness?: number;
  marketplaceContactEnabled?: boolean;
  [key: string]: any;
}

export interface UserEntitlements {
  tier?: 'starter' | 'professional';
  mentorAccess?: boolean;
  enhancedAccessUntil?: string;
  [key: string]: any;
}

export interface SettingsUpdate {
  portfolioVisibility?: 'private' | 'marketplace_preview' | 'public';
  marketplaceContactEnabled?: boolean;
  [key: string]: any;
}

// Stub functions - TODO: Implement Django API endpoints
const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    // TODO: Replace with actual Django endpoint
    // const response = await apiGateway.get(`/settings/${userId}`);
    // return response;
    return null;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
};

const updateUserSettings = async (
  userId: string,
  updates: SettingsUpdate,
  hasPortfolioItems?: boolean
): Promise<UserSettings> => {
  try {
    // TODO: Replace with actual Django endpoint
    // const response = await apiGateway.patch(`/settings/${userId}`, updates);
    // return response;
    return updates as UserSettings;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

const getUserEntitlements = async (userId: string): Promise<UserEntitlements | null> => {
  try {
    // TODO: Replace with actual Django endpoint
    // const response = await apiGateway.get(`/entitlements/${userId}`);
    // return response;
    return null;
  } catch (error) {
    console.error('Error fetching user entitlements:', error);
    return null;
  }
};

const triggerSystemUpdates = async (userId: string, updates: SettingsUpdate): Promise<void> => {
  // TODO: Implement system update triggers
  console.log('System updates triggered for user:', userId, updates);
};

const calculateProfileCompleteness = (
  settings: UserSettings,
  hasPortfolioItems: boolean
): number => {
  // Simple completeness calculation
  let completeness = 0;
  if (settings.portfolioVisibility) completeness += 30;
  if (hasPortfolioItems) completeness += 40;
  if (settings.marketplaceContactEnabled) completeness += 30;
  return Math.min(100, completeness);
};

export function useSettingsMaster(userId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);

  // Use provided userId or get from auth
  const currentUserId = userId || user?.id;

  // Fetch settings
  const {
    data: settingsData,
    isLoading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['user-settings', currentUserId],
    queryFn: async () => {
      if (!currentUserId) {
        // Return null instead of throwing - let the component handle unauthenticated state
        return null;
      }
      return getUserSettings(currentUserId);
    },
    enabled: !!currentUserId,
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
    queryKey: ['user-entitlements', currentUserId],
    queryFn: async () => {
      if (!currentUserId) {
        // Return null instead of throwing - let the component handle unauthenticated state
        return null;
      }
      return getUserEntitlements(currentUserId);
    },
    enabled: !!currentUserId,
    staleTime: 30000,
    retry: false,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: SettingsUpdate & { hasPortfolioItems?: boolean }) => {
      if (!currentUserId) throw new Error('User not authenticated');
      
      const { hasPortfolioItems, ...updateData } = updates;
      
      // Update settings
      const result = await updateUserSettings(currentUserId, updateData, hasPortfolioItems);
      
      // Trigger cross-system updates
      await triggerSystemUpdates(currentUserId, updateData);
      
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
      queryClient.invalidateQueries({ queryKey: ['user-settings', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-entitlements', currentUserId] });
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

  // Note: Realtime subscriptions removed - using polling/refetch instead
  // TODO: Implement Django WebSocket or polling for real-time updates if needed

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

