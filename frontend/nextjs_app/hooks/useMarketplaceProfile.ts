/**
 * Marketplace Profile Hook
 * Fetches marketplace profile for current user
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMarketplaceProfileByUserId } from '@/lib/portfolio/api';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function useMarketplaceProfile(userId?: string) {
  const [username, setUsername] = useState<string | undefined>();

  // Get username from user settings or profile
  useEffect(() => {
    if (userId) {
      supabase
        .from('marketplace_profiles')
        .select('username')
        .eq('user_id', userId)
        .single()
        .then(({ data }) => {
          if (data) setUsername(data.username);
        });
    }
  }, [userId]);

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['marketplace-profile', userId],
    queryFn: () => getMarketplaceProfileByUserId(userId!),
    enabled: !!userId,
    staleTime: 300000, // 5 minutes
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
  };
}


