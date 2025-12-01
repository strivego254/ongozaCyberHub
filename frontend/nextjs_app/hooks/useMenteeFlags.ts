'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { mockFlags, delay } from '@/services/mockData/mentorMockData'
import type { MenteeFlag } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

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
      if (USE_MOCK_DATA) {
        await delay(500) // Simulate API delay
        let filtered = [...mockFlags]
        if (params?.status && params.status !== 'all') {
          filtered = filtered.filter(f => f.status === params.status)
        }
        if (params?.severity) {
          filtered = filtered.filter(f => f.severity === params.severity)
        }
        setFlags(filtered)
      } else {
        const data = await mentorClient.getMenteeFlags(mentorId, params)
        setFlags(data)
      }
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
      if (USE_MOCK_DATA) {
        await delay(300)
        await load()
        return
      } else {
        const newFlag = await mentorClient.flagMentee(mentorId, data)
        await load()
        return newFlag
      }
    } catch (err: any) {
      setError(err.message || 'Failed to flag mentee')
      throw err
    }
  }, [mentorId, load])

  return { flags, isLoading, error, reload: load, flagMentee }
}


