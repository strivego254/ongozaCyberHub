'use client'

import { useState, useEffect } from 'react'
import { MissionsPending } from '@/components/mentor/MissionsPending'
import { MissionReviewForm } from '@/components/mentor/MissionReviewForm'
import { CapstoneScoringForm } from '@/components/mentor/CapstoneScoringForm'
import { mentorClient } from '@/services/mentorClient'
import { mockCapstoneProjects, delay } from '@/services/mockData/mentorMockData'
import { useAuth } from '@/hooks/useAuth'
import type { MissionSubmission, CapstoneProject } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

export default function MissionsPage() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const [selectedSubmission, setSelectedSubmission] = useState<MissionSubmission | null>(null)
  const [selectedCapstone, setSelectedCapstone] = useState<CapstoneProject | null>(null)
  const [capstones, setCapstones] = useState<CapstoneProject[]>([])
  const [loadingCapstones, setLoadingCapstones] = useState(false)

  const loadCapstones = async () => {
    if (!mentorId) return
    setLoadingCapstones(true)
    try {
      if (USE_MOCK_DATA) {
        await delay(500)
        setCapstones(mockCapstoneProjects)
      } else {
        const data = await mentorClient.getCapstoneProjects(mentorId, { status: 'pending_scoring' })
        setCapstones(data)
      }
    } catch (err) {
      console.error('Failed to load capstones:', err)
    } finally {
      setLoadingCapstones(false)
    }
  }

  useEffect(() => {
    loadCapstones()
  }, [mentorId])

  if (selectedSubmission) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <MissionReviewForm
          submission={selectedSubmission}
          onReviewComplete={() => setSelectedSubmission(null)}
        />
      </div>
    )
  }

  if (selectedCapstone) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <CapstoneScoringForm
          capstone={selectedCapstone}
          onScoringComplete={() => {
            setSelectedCapstone(null)
            loadCapstones()
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Mission Review</h1>
        <p className="text-och-steel">
          Review mission submissions and score capstone projects for Professional tier mentees.
        </p>
      </div>

      <div className="space-y-6">
        <MissionsPending onReviewClick={(submission) => setSelectedSubmission(submission)} />
        
        <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Capstone Projects</h2>
              <p className="text-sm text-och-steel">
                Score capstone projects pending review.
              </p>
            </div>
            <button
              onClick={loadCapstones}
              className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-opacity-90 text-sm"
            >
              {loadingCapstones ? 'Loading...' : 'Load Capstones'}
            </button>
          </div>

          {capstones.length === 0 && !loadingCapstones && (
            <div className="text-och-steel text-sm">No capstones pending scoring.</div>
          )}

          {capstones.length > 0 && (
            <div className="space-y-3">
              {capstones.map((capstone) => (
                <div
                  key={capstone.id}
                  className="p-4 bg-och-midnight/50 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white">{capstone.title}</h3>
                    <p className="text-sm text-och-steel mt-1">{capstone.mentee_name}</p>
                    <p className="text-xs text-och-steel mt-1">
                      Submitted: {new Date(capstone.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCapstone(capstone)}
                    className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-opacity-90 text-sm"
                  >
                    Score Capstone
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


