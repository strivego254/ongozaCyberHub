'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { MentorInfluence } from '@/services/types/mentor'

export function useMentorInfluence(mentorId: string | undefined) {
  const [influence, setInfluence] = useState<MentorInfluence | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getInfluence(mentorId)
      setInfluence(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load influence analytics')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  return { influence, isLoading, error, reload: load }
}


