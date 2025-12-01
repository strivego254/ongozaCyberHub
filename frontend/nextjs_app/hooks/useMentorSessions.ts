'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { mockGroupSessions, delay } from '@/services/mockData/mentorMockData'
import type { GroupMentorshipSession } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

export function useMentorSessions(mentorId: string | undefined, params?: {
  status?: 'scheduled' | 'completed' | 'all'
  start_date?: string
  end_date?: string
}) {
  const [sessions, setSessions] = useState<GroupMentorshipSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      if (USE_MOCK_DATA) {
        await delay(500) // Simulate API delay
        let filtered = [...mockGroupSessions]
        if (params?.status && params.status !== 'all') {
          filtered = filtered.filter(s => s.status === params.status)
        }
        setSessions(filtered)
      } else {
        const data = await mentorClient.getGroupSessions(mentorId, params)
        setSessions(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, params?.status, params?.start_date, params?.end_date])

  useEffect(() => {
    load()
  }, [load])

  const createSession = useCallback(async (data: {
    title: string
    description: string
    scheduled_at: string
    duration_minutes: number
    meeting_type: 'zoom' | 'google_meet' | 'in_person'
    meeting_link?: string
    track_assignment?: string
  }) => {
    if (!mentorId) return
    try {
      if (USE_MOCK_DATA) {
        await delay(300)
        const newSession: GroupMentorshipSession = {
          id: `session-${Date.now()}`,
          mentor_id: mentorId,
          ...data,
          status: 'scheduled',
          attendance: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await load()
        return newSession
      } else {
        const newSession = await mentorClient.createGroupSession(mentorId, data)
        await load()
        return newSession
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create session')
      throw err
    }
  }, [mentorId, load])

  const updateSession = useCallback(async (sessionId: string, data: {
    recording_url?: string
    transcript_url?: string
    attendance?: Array<{
      mentee_id: string
      attended: boolean
      joined_at?: string
      left_at?: string
    }>
  }) => {
    try {
      if (USE_MOCK_DATA) {
        await delay(300)
        await load()
        return
      } else {
        const updated = await mentorClient.updateGroupSession(sessionId, data)
        await load()
        return updated
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update session')
      throw err
    }
  }, [load])

  return { sessions, isLoading, error, reload: load, createSession, updateSession }
}


