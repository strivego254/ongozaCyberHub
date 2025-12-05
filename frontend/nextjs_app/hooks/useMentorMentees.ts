'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { AssignedMentee } from '@/services/types/mentor'

export function useMentorMentees(mentorId: string | undefined) {
  const [mentees, setMentees] = useState<AssignedMentee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getAssignedMentees(mentorId)
      setMentees(data)
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


