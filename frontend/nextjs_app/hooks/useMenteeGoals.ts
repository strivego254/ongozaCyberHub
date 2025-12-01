'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { mockGoals, delay } from '@/services/mockData/mentorMockData'
import type { MenteeGoal } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

export function useMenteeGoals(mentorId: string | undefined, params?: {
  mentee_id?: string
  goal_type?: 'monthly' | 'weekly'
  status?: 'pending' | 'in_progress' | 'completed'
}) {
  const [goals, setGoals] = useState<MenteeGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      if (USE_MOCK_DATA) {
        await delay(500) // Simulate API delay
        let filtered = [...mockGoals]
        if (params?.mentee_id) {
          filtered = filtered.filter(g => g.mentee_id === params.mentee_id)
        }
        if (params?.goal_type) {
          filtered = filtered.filter(g => g.goal_type === params.goal_type)
        }
        if (params?.status) {
          filtered = filtered.filter(g => g.status === params.status)
        }
        setGoals(filtered)
      } else {
        const data = await mentorClient.getMenteeGoals(mentorId, params)
        setGoals(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load goals')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, params?.mentee_id, params?.goal_type, params?.status])

  useEffect(() => {
    load()
  }, [load])

  const provideFeedback = useCallback(async (goalId: string, feedback: string) => {
    try {
      if (USE_MOCK_DATA) {
        await delay(300)
        await load()
        return
      } else {
        const updated = await mentorClient.provideGoalFeedback(goalId, { feedback })
        await load()
        return updated
      }
    } catch (err: any) {
      setError(err.message || 'Failed to provide feedback')
      throw err
    }
  }, [load])

  return { goals, isLoading, error, reload: load, provideFeedback }
}


