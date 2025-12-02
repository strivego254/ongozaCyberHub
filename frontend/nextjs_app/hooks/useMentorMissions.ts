'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { mockMissionSubmissions, delay } from '@/services/mockData/mentorMockData'
import type { MissionSubmission } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

// Store mock missions in module scope to persist updates
let mockMissionsCache: MissionSubmission[] = [...mockMissionSubmissions]

export function useMentorMissions(mentorId: string | undefined, params?: {
  status?: 'pending_review' | 'in_review' | 'all'
  limit?: number
  offset?: number
}) {
  const [missions, setMissions] = useState<MissionSubmission[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      if (USE_MOCK_DATA) {
        await delay(500) // Simulate API delay
        let filtered = [...mockMissionsCache]
        if (params?.status && params.status !== 'all') {
          filtered = filtered.filter(m => m.status === params.status)
        }
        const offset = params?.offset || 0
        const limit = params?.limit || 10
        setMissions(filtered.slice(offset, offset + limit))
        setCount(filtered.length)
      } else {
        const data = await mentorClient.getMissionSubmissionQueue(mentorId, params)
        setMissions(data.results)
        setCount(data.count)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load missions')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, params?.status, params?.limit, params?.offset])

  const updateMissionStatus = useCallback(async (submissionId: string, status: 'approved' | 'needs_revision') => {
    if (USE_MOCK_DATA) {
      await delay(300) // Simulate API delay
      mockMissionsCache = mockMissionsCache.map(m => 
        m.id === submissionId ? { ...m, status } : m
      )
      // Reload to reflect changes
      setIsLoading(true)
      setError(null)
      try {
        await delay(200)
        let filtered = [...mockMissionsCache]
        if (params?.status && params.status !== 'all') {
          filtered = filtered.filter(m => m.status === params.status)
        }
        const offset = params?.offset || 0
        const limit = params?.limit || 10
        setMissions(filtered.slice(offset, offset + limit))
        setCount(filtered.length)
      } catch (err: any) {
        setError(err.message || 'Failed to reload missions')
      } finally {
        setIsLoading(false)
      }
      return { success: true }
    } else {
      // When backend is ready, call the actual API
      try {
        if (status === 'approved') {
          await mentorClient.submitMissionReview(submissionId, {
            overall_status: 'pass',
            feedback: { written: 'Approved' }
          })
        } else {
          await mentorClient.submitMissionReview(submissionId, {
            overall_status: 'needs_revision',
            feedback: { written: 'Please resubmit with improvements' }
          })
        }
        await load()
        return { success: true }
      } catch (err: any) {
        throw new Error(err.message || 'Failed to update mission status')
      }
    }
  }, [params, load])

  useEffect(() => {
    load()
  }, [load])

  return { missions, totalCount: count, isLoading, error, reload: load, updateMissionStatus }
}


