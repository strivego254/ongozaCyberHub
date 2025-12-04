 'use client'

import { MenteesOverview } from '@/components/mentor/MenteesOverview'
import { MissionsPending } from '@/components/mentor/MissionsPending'
import { InfluenceAnalytics } from '@/components/mentor/InfluenceAnalytics'
import { TalentScopeView } from '@/components/mentor/TalentScopeView'
import { MentorProfileManagement } from '@/components/mentor/MentorProfileManagement'
import { GoalFeedback } from '@/components/mentor/GoalFeedback'
import { MenteeFlagging } from '@/components/mentor/MenteeFlagging'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function MentorClient() {
  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Mentor Dashboard</h1>
        <p className="text-och-steel">
          Monitor mentees, review missions, manage sessions, and track your impact.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/dashboard/mentor/mentees">
          <div className="p-4 bg-och-midnight border border-och-steel/20 rounded-lg hover:bg-och-midnight/80 transition-colors">
            <div className="text-sm font-medium text-white">Mentees</div>
          </div>
        </Link>
        <Link href="/dashboard/mentor/missions">
          <div className="p-4 bg-och-midnight border border-och-steel/20 rounded-lg hover:bg-och-midnight/80 transition-colors">
            <div className="text-sm font-medium text-white">Missions</div>
          </div>
        </Link>
        <Link href="/dashboard/mentor/sessions">
          <div className="p-4 bg-och-midnight border border-och-steel/20 rounded-lg hover:bg-och-midnight/80 transition-colors">
            <div className="text-sm font-medium text-white">Sessions</div>
          </div>
        </Link>
        <Link href="/dashboard/mentor/analytics">
          <div className="p-4 bg-och-midnight border border-och-steel/20 rounded-lg hover:bg-och-midnight/80 transition-colors">
            <div className="text-sm font-medium text-white">Analytics</div>
          </div>
        </Link>
      </div>

      {/* Top: Mentees overview */}
      <MenteesOverview />

      {/* Middle: Missions + Influence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MissionsPending />
        <InfluenceAnalytics />
      </div>

      {/* Bottom: Sessions + TalentScope */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recent Sessions</h2>
            <Link href="/dashboard/mentor/sessions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <p className="text-sm text-och-steel">View and manage group mentorship sessions.</p>
        </div>
        <TalentScopeView />
      </div>

      {/* Profile & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MentorProfileManagement />
        <GoalFeedback />
      </div>

      {/* Flags */}
      <div className="mt-6">
        <MenteeFlagging />
      </div>
    </div>
  )
}


