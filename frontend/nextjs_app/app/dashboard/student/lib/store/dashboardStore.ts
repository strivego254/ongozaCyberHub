import { create } from 'zustand'
import type { DashboardState, ReadinessData, CohortProgress, PortfolioMetrics, MentorshipData, GamificationData, EventItem, ActionItem, HabitStatus, TrackOverview, CommunityActivity, LeaderboardEntry, AICoachNudge, QuickStats, SubscriptionTier } from '../types'

interface DashboardStore extends DashboardState {
  // UI State
  isSidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Data setters
  setReadiness: (readiness: ReadinessData) => void
  setCohortProgress: (progress: CohortProgress) => void
  setPortfolio: (portfolio: PortfolioMetrics) => void
  setMentorship: (mentorship: MentorshipData) => void
  setGamification: (gamification: GamificationData) => void
  setSubscription: (tier: SubscriptionTier, expiry?: string, daysLeft?: number) => void
  setNextActions: (actions: ActionItem[]) => void
  setEvents: (events: EventItem[]) => void
  setHabits: (habits: HabitStatus[]) => void
  setTrackOverview: (track: TrackOverview) => void
  setCommunityFeed: (feed: CommunityActivity[]) => void
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void
  setAICoachNudge: (nudge?: AICoachNudge) => void
  setQuickStats: (stats: QuickStats) => void
  updatePoints: (delta: number) => void
  updateStreak: (delta: number) => void
  updateReadiness: (delta: number) => void
  updateEvents: (count: number) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState: DashboardState = {
  readiness: {
    score: 0,
    maxScore: 100,
    trend: 0,
    trendDirection: 'stable',
    countdownDays: 0,
    countdownLabel: '',
  },
  cohortProgress: {
    percentage: 0,
    currentModule: '',
    totalModules: 0,
    completedModules: 0,
    estimatedTimeRemaining: 0,
  },
  portfolio: {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    percentage: 0,
  },
  mentorship: {
    nextSessionDate: '',
    nextSessionTime: '',
    mentorName: '',
    sessionType: '1-on-1',
    status: 'pending',
  },
  gamification: {
    points: 0,
    streak: 0,
    badges: 0,
    rank: '',
    level: '',
  },
  subscription: 'free',
  nextActions: [],
  events: [],
  habits: [],
  trackOverview: {
    trackName: '',
    trackKey: '',
    milestones: [],
    completedMilestones: 0,
    totalMilestones: 0,
  },
  communityFeed: [],
  leaderboard: [],
  quickStats: {
    points: 0,
    streak: 0,
    badges: 0,
    mentorRating: 0,
  },
  isLoading: true,
  lastUpdated: new Date().toISOString(),
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  ...initialState,
  
  // UI State
  isSidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  setReadiness: (readiness) => set({ readiness, lastUpdated: new Date().toISOString() }),

  setCohortProgress: (progress) => set({ cohortProgress: progress, lastUpdated: new Date().toISOString() }),

  setPortfolio: (portfolio) => set({ portfolio, lastUpdated: new Date().toISOString() }),

  setMentorship: (mentorship) => set({ mentorship, lastUpdated: new Date().toISOString() }),

  setGamification: (gamification) => set({ gamification, lastUpdated: new Date().toISOString() }),

  setSubscription: (tier, expiry, daysLeft) =>
    set({
      subscription: tier,
      subscriptionExpiry: expiry,
      subscriptionDaysLeft: daysLeft,
      lastUpdated: new Date().toISOString(),
    }),

  setNextActions: (actions) => set({ nextActions: actions, lastUpdated: new Date().toISOString() }),

  setEvents: (events) => set({ events, lastUpdated: new Date().toISOString() }),

  setHabits: (habits) => set({ habits, lastUpdated: new Date().toISOString() }),

  setTrackOverview: (track) => set({ trackOverview: track, lastUpdated: new Date().toISOString() }),

  setCommunityFeed: (feed) => set({ communityFeed: feed, lastUpdated: new Date().toISOString() }),

  setLeaderboard: (leaderboard) => set({ leaderboard, lastUpdated: new Date().toISOString() }),

  setAICoachNudge: (nudge) => set({ aiCoachNudge: nudge, lastUpdated: new Date().toISOString() }),

  setQuickStats: (stats) => set({ quickStats: stats, lastUpdated: new Date().toISOString() }),

  updatePoints: (delta) =>
    set((state) => ({
      gamification: { ...state.gamification, points: Math.max(0, state.gamification.points + delta) },
      quickStats: { ...state.quickStats, points: Math.max(0, state.quickStats.points + delta) },
      lastUpdated: new Date().toISOString(),
    })),

  updateStreak: (delta) =>
    set((state) => ({
      gamification: { ...state.gamification, streak: Math.max(0, state.gamification.streak + delta) },
      quickStats: { ...state.quickStats, streak: Math.max(0, state.quickStats.streak + delta) },
      lastUpdated: new Date().toISOString(),
    })),

  updateReadiness: (delta) =>
    set((state) => ({
      readiness: {
        ...state.readiness,
        score: Math.max(0, Math.min(100, state.readiness.score + delta)),
      },
      lastUpdated: new Date().toISOString(),
    })),

  updateEvents: (count) =>
    set((state) => ({
      events: state.events, // Events array is managed by setEvents, this just triggers refresh
      lastUpdated: new Date().toISOString(),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set(initialState),
}))

