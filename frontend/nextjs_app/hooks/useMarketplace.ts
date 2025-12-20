/**
 * Marketplace Hook
 * Handles marketplace profile data fetching
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getMarketplaceProfile,
  incrementMarketplaceProfileViews,
} from '@/lib/portfolio/api';

export function useMarketplace(username: string, trackView = false) {
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['marketplace-profile', username],
    queryFn: () => getMarketplaceProfile(username),
    enabled: !!username,
    staleTime: 300000, // 5 minutes
  });

  // Track view on mount if enabled
  useEffect(() => {
    if (trackView && profile && username) {
      incrementMarketplaceProfileViews(username).catch(console.error);
    }
  }, [trackView, profile, username]);

  return {
    profile,
    isLoading,
    error,
    refetch,
  };
}
