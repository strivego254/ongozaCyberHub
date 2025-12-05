'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { MenteeFlag } from '@/services/types/mentor'

const USE_MOCK_DATA = false // Backend is ready

export function useMenteeFlags(mentorId: string | undefined, params?: {
  status?: 'open' | 'resolved' | 'all'
  severity?: 'low' | 'medium' | 'high' | 'critical'
}) {
  const [flags, setFlags] = useState<MenteeFlag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getMenteeFlags(mentorId, params)
      setFlags(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load flags')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, params?.status, params?.severity])

  useEffect(() => {
    load()
  }, [load])

  const flagMentee = useCallback(async (data: {
    mentee_id: string
    flag_type: 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }) => {
    if (!mentorId) return
    try {
      const newFlag = await mentorClient.flagMentee(mentorId, data)
      await load()
      return newFlag
    } catch (err: any) {
      setError(err.message || 'Failed to flag mentee')
      throw err
    }
  }, [mentorId, load])

  return { flags, isLoading, error, reload: load, flagMentee }
}


