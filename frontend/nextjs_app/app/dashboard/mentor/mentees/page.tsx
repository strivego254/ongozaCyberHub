'use client'

import { MenteesOverview } from '@/components/mentor/MenteesOverview'
import { MentorProfileManagement } from '@/components/mentor/MentorProfileManagement'
import { GoalFeedback } from '@/components/mentor/GoalFeedback'
import { MenteeFlagging } from '@/components/mentor/MenteeFlagging'

export default function MenteesPage() {
  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Mentee Management</h1>
        <p className="text-och-steel">
          Manage assigned mentees, provide goal feedback, and flag mentees who need attention.
        </p>
      </div>

      <div className="space-y-6">
        <MenteesOverview />
        <MentorProfileManagement />
        <GoalFeedback />
        <MenteeFlagging />
      </div>
    </div>
  )
}


