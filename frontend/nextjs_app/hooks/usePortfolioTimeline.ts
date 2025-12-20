/**
 * Portfolio Timeline Hook
 * Fetches timeline events for portfolio activity
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { TimelineEvent } from '@/lib/portfolio/types';

const supabase = createClient();

export function usePortfolioTimeline(userId?: string) {
  const {
    data: timelineData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-timeline', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Fetch portfolio items to create timeline events
      const { data: items, error: itemsError } = await supabase
        .from('portfolio_items')
        .select('id, title, status, created_at, approved_at, published_at, marketplace_views')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (itemsError) throw itemsError;

      // Transform items into timeline events
      const events: TimelineEvent[] = [];

      items?.forEach((item) => {
        // Item created event
        events.push({
          id: `${item.id}-created`,
          type: 'item_created',
          title: 'Portfolio item created',
          description: item.title,
          portfolioItemId: item.id,
          createdAt: item.created_at,
        });

        // Item approved event
        if (item.approved_at) {
          events.push({
            id: `${item.id}-approved`,
            type: 'item_approved',
            title: 'Item approved',
            description: item.title,
            portfolioItemId: item.id,
            createdAt: item.approved_at,
          });
        }

        // Marketplace view events (only if significant)
        if (item.marketplace_views > 0 && item.marketplace_views % 10 === 0) {
          events.push({
            id: `${item.id}-view-${item.marketplace_views}`,
            type: 'marketplace_view',
            title: 'Marketplace milestone',
            description: `${item.title} reached ${item.marketplace_views} views`,
            portfolioItemId: item.id,
            createdAt: item.updated_at || item.created_at,
            metadata: { views: item.marketplace_views },
          });
        }
      });

      // Fetch reviews for review events
      const { data: reviews } = await supabase
        .from('portfolio_reviews')
        .select('id, portfolio_item_id, created_at, total_score')
        .in(
          'portfolio_item_id',
          items?.map((i) => i.id) || []
        )
        .order('created_at', { ascending: false })
        .limit(20);

      reviews?.forEach((review) => {
        const item = items?.find((i) => i.id === review.portfolio_item_id);
        if (item) {
          events.push({
            id: `review-${review.id}`,
            type: 'review_received',
            title: 'Mentor review received',
            description: `${item.title} - Score: ${review.total_score}/10`,
            portfolioItemId: review.portfolio_item_id,
            createdAt: review.created_at,
            metadata: { score: review.total_score },
          });
        }
      });

      // Sort by date (most recent first)
      return events.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });

  return {
    timelineData: timelineData || [],
    isLoading,
    error,
    refetch,
  };
}

