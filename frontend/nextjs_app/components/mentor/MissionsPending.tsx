'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMentorMissions } from '@/hooks/useMentorMissions'
import { useAuth } from '@/hooks/useAuth'
import type { MissionSubmission } from '@/services/types/mentor'

interface MissionsPendingProps {
  onReviewClick?: (submission: MissionSubmission) => void
}

export function MissionsPending({ onReviewClick }: MissionsPendingProps) {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const [page, setPage] = useState(1)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { missions, totalCount, isLoading, error, updateMissionStatus } = useMentorMissions(mentorId, {
    status: 'pending_review',
    limit: 10,
    offset: (page - 1) * 10,
  })

  const handleReview = (submission: MissionSubmission) => {
    if (onReviewClick) {
      onReviewClick(submission)
    } else {
      alert(`Open detailed review UI for mission ${submission.id}`)
    }
  }

  const handleApprove = async (submission: MissionSubmission) => {
    if (!updateMissionStatus) return
    
    setProcessingId(submission.id)
    setSuccessMessage(null)
    
    try {
      await updateMissionStatus(submission.id, 'approved')
      setSuccessMessage(`Mission "${submission.mission_title}" approved successfully`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Failed to approve mission:', err)
      alert('Failed to approve mission. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRequestResubmission = async (submission: MissionSubmission) => {
    if (!updateMissionStatus) return
    
    setProcessingId(submission.id)
    setSuccessMessage(null)
    
    try {
      await updateMissionStatus(submission.id, 'needs_revision')
      setSuccessMessage(`Resubmission requested for "${submission.mission_title}"`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Failed to request resubmission:', err)
      alert('Failed to request resubmission. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleBulkApprove = () => {
    alert('Bulk approve selected missions (wire to backend).')
  }

  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Missions Pending Review</h2>
          <p className="text-sm text-och-steel">
            Grade missions, provide feedback, and approve submissions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkApprove}>
            Bulk Approve
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-och-defender/20 border border-och-defender/40 rounded-lg text-och-defender text-sm">
          {successMessage}
        </div>
      )}

      {isLoading && (
        <div className="text-och-steel text-sm">Loading missions...</div>
      )}

      {error && !isLoading && (
        <div className="text-och-orange text-sm">Error loading missions: {error}</div>
      )}

      {!isLoading && !error && missions.length === 0 && (
        <div className="text-och-steel text-sm">No missions pending review.</div>
      )}

      {!isLoading && !error && missions.length > 0 && (
        <div className="space-y-3">
          {missions.map((m) => (
            <div
              key={m.id}
              className="p-3 bg-och-midnight/50 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">{m.mission_title}</span>
                  <Badge variant="defender" className="text-[11px] capitalize">
                    {m.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-xs text-och-steel">
                  {m.mentee_name} • Submitted{' '}
                  {new Date(m.submitted_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleReview(m)}>
                  Review
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRequestResubmission(m)}
                  disabled={processingId === m.id}
                >
                  {processingId === m.id ? 'Processing...' : 'Request Resubmission'}
                </Button>
                <Button 
                  variant="defender" 
                  size="sm"
                  onClick={() => handleApprove(m)}
                  disabled={processingId === m.id}
                >
                  {processingId === m.id ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalCount > 10 && (
        <div className="flex justify-end gap-2 mt-4 text-xs text-och-steel">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={missions.length < 10}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  )
}


