'use client'

import { useParams } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { MissionView } from '../components/MissionView'
import { MissionViewEnhanced } from '../components/MissionViewEnhanced'
import { MissionSubmission } from '../components/MissionSubmission'
import { ReviewFeedback } from '../components/ReviewFeedback'
import { useMissionStore } from '@/app/dashboard/student/missions/lib/store/missionStore'
import { useQuery } from '@tanstack/react-query'
import { apiGateway } from '@/services/apiGateway'

export default function MissionDetailPage() {
  const params = useParams()
  const missionId = params.id as string
  const { currentProgress, userTier } = useMissionStore()

  // Fetch progress for this mission
  const { data: progressData } = useQuery({
    queryKey: ['mission-progress', missionId],
    queryFn: async () => {
      // TODO: Add endpoint to get progress by mission_id
      return null
    },
  })

  const showSubmission = currentProgress?.status === 'in_progress' && 
    Object.values(currentProgress.subtasks_progress || {}).every((p: any) => p.completed)

  const showReview = currentProgress?.status === 'submitted' || 
    currentProgress?.status === 'ai_reviewed' || 
    currentProgress?.status === 'mentor_review'

  return (
    <RouteGuard>
      <div className="container mx-auto px-4 py-6">
        <MissionViewEnhanced missionId={missionId} />
        
        {showSubmission && currentProgress && (
          <div className="mt-6">
            <MissionSubmission progressId={currentProgress.id} missionId={missionId} />
          </div>
        )}

        {showReview && currentProgress && (
          <div className="mt-6">
            <ReviewFeedback progressId={currentProgress.id} userTier={userTier} />
          </div>
        )}
      </div>
    </RouteGuard>
  )
}

