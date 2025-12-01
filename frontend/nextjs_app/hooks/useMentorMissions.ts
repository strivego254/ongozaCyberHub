'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { mockMissionSubmissions, delay } from '@/services/mockData/mentorMockData'
import type { MissionSubmission } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

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
        let filtered = [...mockMissionSubmissions]
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

  useEffect(() => {
    load()
  }, [load])

  return { missions, totalCount: count, isLoading, error, reload: load }
}


