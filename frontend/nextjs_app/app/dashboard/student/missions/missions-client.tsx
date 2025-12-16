'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'
import { MissionFunnel } from './components/MissionFunnel'
import { RecommendedMissions } from './components/RecommendedMissions'
import { MissionList } from './components/MissionList'
import { MissionDetail } from './components/MissionDetail'
import { MissionDashboard } from './components/MissionDashboard'
import { MissionDashboardKanban } from './components/MissionDashboardKanban'
import { MissionDashboardKanbanErrorBoundary } from './components/MissionDashboardKanbanErrorBoundary'
import { ErrorDisplay } from './components/ErrorDisplay'
import type { Mission, MissionSubmission, AIFeedback, MentorReview } from './types'

interface MissionFunnelData {
  pending: number
  in_review: number
  in_ai_review: number
  in_mentor_review: number
  approved: number
  success_rate: number
  track_name?: string
  cohort_name?: string
}

export default function MissionsClient() {
  const { user } = useAuth()
  const [funnelData, setFunnelData] = useState<MissionFunnelData | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [recommendedMissions, setRecommendedMissions] = useState<Mission[]>([])
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kanbanError, setKanbanError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: 'all' as string,
    difficulty: 'all' as string,
    track: 'all' as string,
    search: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    has_next: false,
    has_previous: false,
  })

  useEffect(() => {
    loadMissionsData()
  }, [user, pagination.page, filters.status, filters.difficulty, filters.track])

  // Poll for status updates every 30 seconds
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      loadMissionsData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const loadMissionsData = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)
    try {
      // Load mission funnel
      const funnelResponse = await apiGateway.get('/student/missions/funnel') as {
        funnel: {
          pending: number;
          in_ai_review: number;
          in_mentor_review: number;
          approved: number;
          approval_rate?: number;
        };
        track_name?: string;
        cohort_name?: string;
        priorities?: any[];
      }
      setFunnelData({
        pending: funnelResponse.funnel.pending,
        in_review: funnelResponse.funnel.in_ai_review + funnelResponse.funnel.in_mentor_review,
        in_ai_review: funnelResponse.funnel.in_ai_review,
        in_mentor_review: funnelResponse.funnel.in_mentor_review,
        approved: funnelResponse.funnel.approved,
        success_rate: funnelResponse.funnel.approval_rate || 0,
        track_name: funnelResponse.track_name,
        cohort_name: funnelResponse.cohort_name,
      })

      // Load all missions with pagination
      const queryParams: any = {
        page: pagination.page,
        page_size: pagination.page_size,
      }
      if (filters.status !== 'all') queryParams.status = filters.status
      if (filters.difficulty !== 'all') queryParams.difficulty = filters.difficulty
      if (filters.track !== 'all') queryParams.track = filters.track
      if (filters.search) queryParams.search = filters.search
      
      const missionsResponse = await apiGateway.get<{ 
        results: Mission[]
        total: number
        page: number
        page_size: number
        has_next: boolean
        has_previous: boolean
      }>('/student/missions', {
        params: queryParams
      })
      setMissions(missionsResponse.results || [])
      setPagination({
        page: missionsResponse.page || 1,
        page_size: missionsResponse.page_size || 20,
        total: missionsResponse.total || 0,
        has_next: missionsResponse.has_next || false,
        has_previous: missionsResponse.has_previous || false,
      })

      // Load recommended/urgent missions from priorities
      const priorities = funnelResponse.priorities || []
      const priorityMissions = priorities.map((p: any) => ({
        id: p.mission_id,
        code: p.code,
        title: p.title,
        description: p.description || '',
        difficulty: 'intermediate' as const,
        status: 'not_started' as const,
        progress_percent: 0,
        ai_recommendation_reason: p.ai_hint,
        due_date: p.deadline,
      }))
      setRecommendedMissions(priorityMissions)
    } catch (error: any) {
      console.error('Failed to load missions:', error)
      setError(error.message || 'Failed to load missions')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      if (filters.status !== 'all' && mission.status !== filters.status) return false
      if (filters.difficulty !== 'all' && mission.difficulty !== filters.difficulty) return false
      if (filters.track !== 'all' && mission.track_key !== filters.track) return false
      if (filters.search && !mission.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !mission.code?.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [missions, filters])

  const handleStartMission = async (missionId: string) => {
    try {
      // Get mission detail to create submission
      const mission = await apiGateway.get<Mission>(`/student/missions/${missionId}`)
      setSelectedMission(mission)
      await loadMissionsData()
    } catch (error: any) {
      alert(error.message || 'Failed to start mission')
    }
  }

  const handleSubmitForAI = async (missionId: string, submission: Partial<MissionSubmission>) => {
    try {
      const formData = new FormData()
      if (submission.notes) formData.append('notes', submission.notes)
      if (submission.github_url) formData.append('github_url', submission.github_url)
      if (submission.notebook_url) formData.append('notebook_url', submission.notebook_url)
      if (submission.video_url) formData.append('video_url', submission.video_url)
      
      if (submission.files) {
        submission.files.forEach((file: File) => {
          formData.append('files', file)
        })
      }
      
      await apiGateway.post(`/student/missions/${missionId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await loadMissionsData()
      alert('Submitted for AI review')
    } catch (error: any) {
      alert(error.message || 'Failed to submit for AI review')
    }
  }

  const handleSubmitForMentor = async (submissionId: string) => {
    try {
      await apiGateway.post(`/student/missions/submissions/${submissionId}/submit-mentor`, {})
      await loadMissionsData()
      alert('Submitted for mentor review')
    } catch (error: any) {
      alert(error.message || 'Failed to submit for mentor review')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-och-steel/20 rounded w-1/3"></div>
          <div className="h-32 bg-och-steel/20 rounded"></div>
          <div className="h-64 bg-och-steel/20 rounded"></div>
        </div>
      </div>
    )
  }

  // Get user's track from enrollment or default to 'defender'
  const userTrack = funnelData?.track_name?.toLowerCase() || 'defender'
  const userTier = 'beginner' // TODO: Get from user subscription

  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Missions</h1>
        <p className="text-och-steel">
          Complete missions to build your skills and advance your readiness
        </p>
      </div>

      {/* Mission Funnel - Keep for overview */}
      {funnelData && (
        <div className="mb-8">
          <MissionFunnel data={funnelData} />
        </div>
      )}

      {/* NEW MXP Mission Dashboard - Kanban View */}
      <div className="mb-8">
        <MissionDashboardKanbanErrorBoundary>
          <MissionDashboardKanban track={userTrack} tier={userTier} />
        </MissionDashboardKanbanErrorBoundary>
      </div>

      {/* Legacy Recommended/Urgent Missions - Keep for backward compatibility */}
      {recommendedMissions.length > 0 && (
        <div className="mb-8">
          <RecommendedMissions
            missions={recommendedMissions}
            onStartMission={handleStartMission}
            onViewMission={(mission) => setSelectedMission(mission)}
          />
        </div>
      )}

      {/* Legacy Filters and Mission List - Keep for backward compatibility */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-4">All Missions</h2>
        </div>
        <MissionList
          missions={filteredMissions}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters)
            setPagination(prev => ({ ...prev, page: 1 }))
          }}
          onStartMission={handleStartMission}
          onViewMission={(mission) => setSelectedMission(mission)}
          pagination={pagination}
          onPageChange={(page) => {
            setPagination(prev => ({ ...prev, page }))
          }}
        />
      </div>

      {/* Mission Detail Side Sheet */}
      {selectedMission && (
        <MissionDetail
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
          onSubmitForAI={(missionId, submission) => handleSubmitForAI(missionId, submission)}
          onSubmitForMentor={(submissionId) => handleSubmitForMentor(submissionId)}
          onReload={loadMissionsData}
        />
      )}
    </div>
  )
}

