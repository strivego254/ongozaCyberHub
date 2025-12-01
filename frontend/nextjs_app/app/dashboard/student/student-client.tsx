'use client'

import { useAuth } from '@/hooks/useAuth'
import { FutureYouCard } from '@/components/dashboard/FutureYouCard'
import { CoachingPanel } from '@/components/dashboard/CoachingPanel'
import { MissionsCard } from '@/components/dashboard/MissionsCard'
import { ReadinessCard } from '@/components/dashboard/ReadinessCard'
import { PortfolioCard } from '@/components/dashboard/PortfolioCard'
import { MentorshipCommunityCard } from '@/components/dashboard/MentorshipCommunityCard'
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard'

export default function StudentClient() {
  const { user, isLoading: authLoading } = useAuth()

  // Show loading state
  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-och-steel">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Dashboard</h1>
        <p className="text-och-steel">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}! Here's your learning overview.
        </p>
      </div>

      {/* Top Row: Future-You & Subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <FutureYouCard />
        </div>
        <div>
          <SubscriptionCard />
        </div>
      </div>

      {/* Second Row: Coaching Panel */}
      <CoachingPanel />

      {/* Third Row: Missions & Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MissionsCard />
        <ReadinessCard />
      </div>

      {/* Fourth Row: Portfolio & Mentorship/Community */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PortfolioCard />
        <MentorshipCommunityCard />
      </div>
    </div>
  )
}

