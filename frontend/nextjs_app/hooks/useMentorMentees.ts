'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { mockMentees, delay } from '@/services/mockData/mentorMockData'
import type { AssignedMentee } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

export function useMentorMentees(mentorId: string | undefined) {
  const [mentees, setMentees] = useState<AssignedMentee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      if (USE_MOCK_DATA) {
        await delay(500) // Simulate API delay
        setMentees(mockMentees)
      } else {
        const data = await mentorClient.getAssignedMentees(mentorId)
        setMentees(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load mentees')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  return { mentees, isLoading, error, reload: load }
}


