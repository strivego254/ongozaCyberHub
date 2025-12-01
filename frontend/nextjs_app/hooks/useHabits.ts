'use client'

import { useState, useEffect, useCallback } from 'react'
import { habitsClient } from '@/services/habitsClient'
import type { Habit, Goal, Reflection } from '@/services/types/habits'

export function useHabits(menteeId: string | undefined) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [latestReflection, setLatestReflection] = useState<Reflection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!menteeId) return

    setIsLoading(true)
    setError(null)

    try {
      const [habitsData, goalsData, reflectionData] = await Promise.all([
        habitsClient.getTodayHabits(menteeId),
        habitsClient.getTodayGoals(menteeId),
        habitsClient.getLatestReflection(menteeId).catch(() => null),
      ])

      setHabits(habitsData)
      setGoals(goalsData)
      setLatestReflection(reflectionData)
    } catch (err: any) {
      setError(err.message || 'Failed to load habits data')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  const toggleHabit = useCallback(async (habitId: string, completed: boolean) => {
    if (!menteeId) return

    try {
      const updated = await habitsClient.toggleHabit(menteeId, habitId, completed)
      setHabits(prev => prev.map(h => h.id === habitId ? updated : h))
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update habit')
    }
  }, [menteeId])

  const completeGoal = useCallback(async (goalId: string) => {
    if (!menteeId) return

    try {
      const updated = await habitsClient.completeGoal(menteeId, goalId)
      setGoals(prev => prev.map(g => g.id === goalId ? updated : g))
    } catch (err: any) {
      throw new Error(err.message || 'Failed to complete goal')
    }
  }, [menteeId])

  const submitReflection = useCallback(async (content: string) => {
    if (!menteeId) return

    try {
      const reflection = await habitsClient.submitReflection(menteeId, content)
      setLatestReflection(reflection)
      return reflection
    } catch (err: any) {
      throw new Error(err.message || 'Failed to submit reflection')
    }
  }, [menteeId])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    habits,
    goals,
    latestReflection,
    isLoading,
    error,
    reload: loadData,
    toggleHabit,
    completeGoal,
    submitReflection,
  }
}

