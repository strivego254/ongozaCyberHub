'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { mockMentorProfile, delay } from '@/services/mockData/mentorMockData'
import type { MentorProfile } from '@/services/types/mentor'

const USE_MOCK_DATA = true // Set to false when backend is ready

export function useMentorProfile(mentorId: string | undefined) {
  const [profile, setProfile] = useState<MentorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      if (USE_MOCK_DATA) {
        await delay(500) // Simulate API delay
        setProfile(mockMentorProfile)
      } else {
        const data = await mentorClient.getMentorProfile(mentorId)
        setProfile(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load mentor profile')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  const updateProfile = useCallback(async (data: {
    bio?: string
    expertise_tags?: string[]
    availability?: MentorProfile['availability']
  }) => {
    if (!mentorId) return
    try {
      if (USE_MOCK_DATA) {
        await delay(300) // Simulate API delay
        const updated = { ...mockMentorProfile, ...data, updated_at: new Date().toISOString() }
        setProfile(updated)
        return updated
      } else {
        const updated = await mentorClient.updateMentorProfile(mentorId, data)
        setProfile(updated)
        return updated
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      throw err
    }
  }, [mentorId])

  return { profile, isLoading, error, reload: load, updateProfile }
}


