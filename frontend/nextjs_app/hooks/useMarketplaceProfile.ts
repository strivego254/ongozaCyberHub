/**
 * Marketplace Profile Hook
 * Fetches marketplace profile for current user
 */

import { useQuery } from '@tanstack/react-query';
import { apiGateway } from '@/services/apiGateway';

// Stub function - TODO: Implement actual Django API endpoint
const getMarketplaceProfileByUserId = async (userId: string) => {
  try {
    // TODO: Replace with actual Django endpoint when available
    // const response = await apiGateway.get(`/marketplace/profiles/${userId}`);
    // return response;
    
    // Return null for now until API is implemented
    return null;
  } catch (error) {
    console.error('Error fetching marketplace profile:', error);
    return null;
  }
};

export function useMarketplaceProfile(userId?: string) {
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


