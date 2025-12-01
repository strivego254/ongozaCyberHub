'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { MentorMissionPending } from '@/services/types/mentor'

export function useMentorMissions(mentorId: string | undefined, page: number = 1, pageSize: number = 10) {
  const [missions, setMissions] = useState<MentorMissionPending[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getPendingMissions(mentorId, { page, page_size: pageSize })
      setMissions(data.results)
      setCount(data.count)
    } catch (err: any) {
      setError(err.message || 'Failed to load missions')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  return { missions, totalCount: count, isLoading, error, reload: load }
}


