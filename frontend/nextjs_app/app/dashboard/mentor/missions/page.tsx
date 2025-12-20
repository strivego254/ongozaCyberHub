'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MissionsPending } from '@/components/mentor/MissionsPending'
import { MissionReviewForm } from '@/components/mentor/MissionReviewForm'
import { CapstoneScoringForm } from '@/components/mentor/CapstoneScoringForm'
import { mentorClient } from '@/services/mentorClient'
import { useAuth } from '@/hooks/useAuth'
import type { MissionSubmission, CapstoneProject } from '@/services/types/mentor'

export default function MissionsPage() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const searchParams = useSearchParams()
  const [selectedSubmission, setSelectedSubmission] = useState<MissionSubmission | null>(null)
  const [selectedCapstone, setSelectedCapstone] = useState<CapstoneProject | null>(null)
  const [capstones, setCapstones] = useState<CapstoneProject[]>([])
  const [loadingCapstones, setLoadingCapstones] = useState(false)
  const [loadingSubmission, setLoadingSubmission] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const loadCapstones = useCallback(async () => {
    if (!mentorId) return
    setLoadingCapstones(true)
    try {
      const data = await mentorClient.getCapstoneProjects(mentorId, { status: 'pending_scoring' })
      setCapstones(data)
    } catch (err) {
      console.error('Failed to load capstones:', err)
    } finally {
      setLoadingCapstones(false)
    }
  }, [mentorId])

  useEffect(() => {
    loadCapstones()
  }, [loadCapstones])

  // If a submission id is provided (e.g. from the dashboard "Review now" button), open it directly.
  useEffect(() => {
    const submissionId = searchParams.get('submission')
    if (!submissionId) return
    if (selectedSubmission?.id === submissionId) return

    let cancelled = false
    setLoadingSubmission(true)
    setSubmissionError(null)

    mentorClient
      .getMissionSubmission(submissionId)
      .then((data) => {
        if (cancelled) return
        setSelectedSubmission(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Failed to load submission')
        setSubmissionError(message)
      })
      .finally(() => {
        if (cancelled) return
        setLoadingSubmission(false)
      })

    return () => {
      cancelled = true
    }
  }, [searchParams, selectedSubmission?.id])

  if (loadingSubmission && !selectedSubmission) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="text-och-steel text-sm">Loading submission…</div>
      </div>
    )
  }

  if (submissionError && !selectedSubmission) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="text-och-orange text-sm">Error: {submissionError}</div>
      </div>
    )
  }

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
        <p className="text-och-steel mb-4">
          As an OCH Mentor, your responsibility in Mission Review is critical. You perform human-in-the-loop validation 
          for mentees on the $7 Premium tier, confirming skill mastery and guiding development according to the core 
          philosophy: <span className="text-och-mint font-semibold">"We guide the transformation"</span>.
        </p>
        <div className="bg-och-midnight/50 border border-och-steel/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Your Mission Review Responsibilities:</h3>
          <ul className="text-xs text-och-steel space-y-1 list-disc list-inside">
            <li>Review submissions for <strong className="text-white">Professional tier ($7 Premium) mentees</strong> completing Intermediate, Advanced, Mastery, and Capstone missions</li>
            <li>Provide <strong className="text-white">deeper analysis</strong> complementing AI feedback, issue pass/fail grades, and add written feedback</li>
            <li><strong className="text-white">Tag technical competencies</strong> proven or missed to update mentee skill profiles (TalentScope Analytics)</li>
            <li>Use <strong className="text-white">rubric-based scoring</strong> for Capstones and Advanced/Mastery missions</li>
            <li>Recommend <strong className="text-white">next missions or recipes</strong> based on skill gaps detected</li>
            <li>All actions are logged in the <strong className="text-white">immutable Activity Audit Trail</strong></li>
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <MissionsPending onReviewClick={(submission) => setSelectedSubmission(submission)} />
        
        <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Capstone Projects</h2>
              <p className="text-sm text-och-steel">
                Score capstone projects using assigned rubrics. Capstones are complex projects required in the $7 Premium tier and Mastery Tracks.
              </p>
            </div>
            <button
              onClick={loadCapstones}
              className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-opacity-90 text-sm"
            >
              {loadingCapstones ? 'Loading...' : 'Refresh Capstones'}
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
                  className="p-4 bg-och-midnight/50 rounded-lg flex justify-between items-center hover:bg-och-midnight/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{capstone.title}</h3>
                      <span className="px-2 py-1 bg-och-orange/20 text-och-orange text-xs rounded">Capstone</span>
                    </div>
                    <p className="text-sm text-och-steel mt-1">
                      <span className="text-white font-medium">{capstone.mentee_name}</span> • 
                      Submitted: {new Date(capstone.submitted_at).toLocaleString()}
                    </p>
                    {capstone.rubric_id && (
                      <p className="text-xs text-och-mint mt-1">
                        ✓ Rubric assigned for scoring
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCapstone(capstone)}
                    className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-opacity-90 text-sm shrink-0"
                  >
                    Score with Rubric
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


