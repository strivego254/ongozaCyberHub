/**
 * Entitlements Hook
 * Real-time feature flags based on subscription and settings
 */

import { useQuery } from '@tanstack/react-query';
import { getUserEntitlements } from '@/lib/settings/api';
import { checkFeatureAccess, getAllFeatureGates } from '@/lib/settings/entitlements';
import { useSettingsMaster } from './useSettingsMaster';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function useEntitlements(userId?: string) {
  const { settings } = useSettingsMaster(userId);

  const {
    data: entitlements,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-entitlements', userId],
    queryFn: async () => {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        const id = user?.id;
        if (!id) throw new Error('User not authenticated');
        return getUserEntitlements(id);
      }
      return getUserEntitlements(userId);
    },
    enabled: !!userId || true,
    staleTime: 30000,
  });

  const checkAccess = (feature: string) => {
    return checkFeatureAccess(entitlements || null, settings, feature);
  };

  const featureGates = getAllFeatureGates(entitlements || null, settings);

  return {
    entitlements,
    isLoading,
    error,
    refetch,
    checkAccess,
    featureGates,
    hasMarketplaceAccess: entitlements?.marketplaceFullAccess || false,
    hasAICoachAccess: entitlements?.aiCoachFullAccess || false,
    hasMentorAccess: entitlements?.mentorAccess || false,
    canExportPortfolio: entitlements?.portfolioExportEnabled || false,
  };
}

