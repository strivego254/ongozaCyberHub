'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCohorts } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'

export default function MentorsClient() {
  const { cohorts, isLoading, reload } = useCohorts()
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const [mentors, setMentors] = useState<any[]>([])
  const [loadingMentors, setLoadingMentors] = useState(false)

  const loadMentors = async (cohortId: string) => {
    setLoadingMentors(true)
    try {
      const data = await programsClient.getCohortMentors(cohortId)
      setMentors(data)
    } catch (err) {
      console.error('Failed to load mentors:', err)
    } finally {
      setLoadingMentors(false)
    }
  }

  const handleCohortChange = (cohortId: string) => {
    setSelectedCohortId(cohortId)
    if (cohortId) {
      loadMentors(cohortId)
    } else {
      setMentors([])
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-orange">Mentor Assignments</h1>
            <p className="text-och-steel">Assign and manage mentors for cohorts.</p>
          </div>
          <Link href="/dashboard/director">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">Select Cohort</label>
          <select
            value={selectedCohortId}
            onChange={(e) => handleCohortChange(e.target.value)}
            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white"
            disabled={isLoading}
          >
            <option value="">Select a cohort</option>
            {cohorts?.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} {cohort.track_name && `(${cohort.track_name})`}
              </option>
            ))}
          </select>
        </Card>

        {selectedCohortId && (
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Assigned Mentors</h2>
            {loadingMentors ? (
              <p className="text-och-steel">Loading mentors...</p>
            ) : mentors.length > 0 ? (
              <div className="space-y-4">
                {mentors.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-4 bg-och-midnight/50 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="text-white font-semibold">
                        {assignment.mentor_name || assignment.mentor_email}
                      </p>
                      <p className="text-sm text-och-steel">{assignment.mentor_email}</p>
                    </div>
                    <Badge variant={assignment.role === 'primary' ? 'mint' : 'defender'}>
                      {assignment.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-och-steel">No mentors assigned to this cohort.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}




