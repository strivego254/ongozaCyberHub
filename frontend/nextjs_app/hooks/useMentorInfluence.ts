'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { mockInfluenceIndex, delay } from '@/services/mockData/mentorMockData'
import type { MentorInfluenceIndex } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

export function useMentorInfluence(mentorId: string | undefined, params?: {
  start_date?: string
  end_date?: string
}) {
  const [influence, setInfluence] = useState<MentorInfluenceIndex | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      if (USE_MOCK_DATA) {
        await delay(500) // Simulate API delay
        setInfluence(mockInfluenceIndex)
      } else {
        const data = await mentorClient.getInfluenceIndex(mentorId, params)
        setInfluence(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load influence analytics')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, params?.start_date, params?.end_date])

  useEffect(() => {
    load()
  }, [load])

  return { influence, isLoading, error, reload: load }
}


