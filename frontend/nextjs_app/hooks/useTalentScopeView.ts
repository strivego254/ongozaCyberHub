'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { mockTalentScopeView, delay } from '@/services/mockData/mentorMockData'
import type { TalentScopeMentorView } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

export function useTalentScopeView(mentorId: string | undefined, menteeId: string | undefined) {
  const [view, setView] = useState<TalentScopeMentorView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId || !menteeId) return
    setIsLoading(true)
    setError(null)
    try {
      if (USE_MOCK_DATA) {
        await delay(500) // Simulate API delay
        setView(mockTalentScopeView)
      } else {
        const data = await mentorClient.getTalentScopeView(mentorId, menteeId)
        setView(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load TalentScope view')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, menteeId])

  useEffect(() => {
    load()
  }, [load])

  return { view, isLoading, error, reload: load }
}


