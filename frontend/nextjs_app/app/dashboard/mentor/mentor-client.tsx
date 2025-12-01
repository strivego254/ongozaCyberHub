 'use client'

import { MenteesOverview } from '@/components/mentor/MenteesOverview'
import { MissionsPending } from '@/components/mentor/MissionsPending'
import { InfluenceAnalytics } from '@/components/mentor/InfluenceAnalytics'
import { AlertsPanel } from '@/components/mentor/AlertsPanel'
import { CommunityFeed } from '@/components/mentor/CommunityFeed'

export default function MentorClient() {
  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Mentor Dashboard</h1>
          <p className="text-och-steel">
            Monitor mentees, review missions, manage sessions, and track your impact.
          </p>
        </div>

        {/* Top: Mentees overview */}
        <MenteesOverview />

        {/* Middle: Missions + Influence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MissionsPending />
          <InfluenceAnalytics />
        </div>

        {/* Bottom: Alerts + Community */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsPanel />
          <CommunityFeed />
        </div>
      </div>
    </div>
  )
}

