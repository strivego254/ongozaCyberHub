/**
 * Main Dashboard Coordination Hook
 * Aggregates ALL dashboard data with real-time synchronization
 * Coordinates updates across 8 core modules
 */

import { useQueries } from '@tanstack/react-query'
import { useDashboardStore } from '../store/dashboardStore'
import { useRealtimeDashboard } from './useRealtimeDashboard'
import {
  useDashboardOverview,
  useDashboardMetrics,
  useNextActions,
  useDashboardEvents,
  useTrackOverview,
  useCommunityFeed,
  useLeaderboard,
  useHabits,
  useAICoachNudge,
  useLogHabit,
  useRSVPEvent,
} from './useDashboard'
import { apiGateway } from '@/services/apiGateway'

/**
 * Main coordination hook that:
 * 1. Fetches ALL dashboard data in parallel
 * 2. Sets up real-time subscriptions
 * 3. Provides action handlers that trigger cascade updates
 */
export function useDashboardCoordination() {
  // Initialize real-time subscriptions
  useRealtimeDashboard()

  // Fetch all dashboard data in parallel
  const overview = useDashboardOverview()
  const metrics = useDashboardMetrics()
  const nextActions = useNextActions()
  const events = useDashboardEvents()
  const trackOverview = useTrackOverview()
  const communityFeed = useCommunityFeed()
  const leaderboard = useLeaderboard()
  const habits = useHabits()
  const aiCoachNudge = useAICoachNudge()

  // Action handlers
  const logHabitMutation = useLogHabit()
  const rsvpEventMutation = useRSVPEvent()

  const store = useDashboardStore()

  /**
   * COORDINATION CASCADE: Log habit → Updates multiple modules
   * 
   * When a student logs a habit:
   * 1. POST to /api/student/coaching/habits/{id}/log
   * 2. Backend updates habit_logs table
   * 3. Backend awards points → updates points_ledger
   * 4. Backend recalculates readiness → updates ts_readiness_snapshots
   * 5. SSE broadcasts updates to ALL cohort members
   * 6. React Query invalidates queries → UI updates
   */
  const logHabit = async (habitId: string, completed: boolean) => {
    try {
      await logHabitMutation.mutateAsync({ habitId, completed })
      
      // The mutation already invalidates queries, but we can trigger additional updates
      // Real-time SSE will handle the cascade updates
      
      return { success: true }
    } catch (error) {
      console.error('Failed to log habit:', error)
      return { success: false, error }
    }
  }

  /**
   * COORDINATION CASCADE: RSVP to event → Updates events + notifications
   */
  const rsvpToEvent = async (eventId: string, status: 'accepted' | 'declined') => {
    try {
      await rsvpEventMutation.mutateAsync({ eventId, status })
      return { success: true }
    } catch (error) {
      console.error('Failed to RSVP:', error)
      return { success: false, error }
    }
  }

  /**
   * Refetch all dashboard data (manual refresh)
   */
  const refetchAll = async () => {
    await Promise.all([
      overview.refetch(),
      metrics.refetch(),
      nextActions.refetch(),
      events.refetch(),
      trackOverview.refetch(),
      communityFeed.refetch(),
      leaderboard.refetch(),
      habits.refetch(),
      aiCoachNudge.refetch(),
    ])
  }

  // Check if any query is loading
  const isLoading =
    overview.isLoading ||
    metrics.isLoading ||
    nextActions.isLoading ||
    events.isLoading ||
    trackOverview.isLoading ||
    communityFeed.isLoading ||
    leaderboard.isLoading ||
    habits.isLoading ||
    aiCoachNudge.isLoading

  // Check if any query has error
  const hasError =
    overview.isError ||
    metrics.isError ||
    nextActions.isError ||
    events.isError ||
    trackOverview.isError ||
    communityFeed.isError ||
    leaderboard.isError ||
    habits.isError ||
    aiCoachNudge.isError

  return {
    // Data
    data: {
      overview: overview.data,
      metrics: metrics.data,
      nextActions: nextActions.data || [],
      events: events.data || [],
      trackOverview: trackOverview.data,
      communityFeed: communityFeed.data || [],
      leaderboard: leaderboard.data || [],
      habits: habits.data || [],
      aiCoachNudge: aiCoachNudge.data,
    },
    // Store state (for components that need direct access)
    store,
    // Actions
    logHabit,
    rsvpToEvent,
    refetchAll,
    // Status
    isLoading,
    hasError,
    // Individual query statuses
    queries: {
      overview,
      metrics,
      nextActions,
      events,
      trackOverview,
      communityFeed,
      leaderboard,
      habits,
      aiCoachNudge,
    },
  }
}

