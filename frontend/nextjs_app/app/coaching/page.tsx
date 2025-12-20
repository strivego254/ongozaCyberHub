/**
 * Coaching OS Dashboard Page
 * Main entry point for the Coaching OS experience
 */
'use client'

import { useEffect } from 'react'
import { CoachingHub } from '@/components/ui/coaching/CoachingHub'
import { CoachingSidebar } from '@/components/ui/coaching/CoachingSidebar'
import { useCoachingStore } from '@/lib/coaching/store'
import { habitsAPI, goalsAPI, reflectionsAPI, metricsAPI } from '@/lib/coaching/api'

export default function CoachingPage() {
  const { 
    setHabits, 
    setGoals, 
    setReflections, 
    setMetrics, 
    setHabitLogs,
    setLoading,
    setError 
  } = useCoachingStore()
  
  useEffect(() => {
    const loadCoachingData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Load all data in parallel (userId handled by auth in API)
        const [habits, goals, reflections, metrics, habitLogs] = await Promise.all([
          habitsAPI.getAll().catch(() => []),
          goalsAPI.getAll().catch(() => []),
          reflectionsAPI.getAll().catch(() => []),
          metricsAPI.get().catch(() => ({
            habits_streak: 0,
            goals_completed: 0,
            reflections_count: 0,
            weekly_completion_rate: 0,
          })),
          // Load logs for all habits
          Promise.all(
            (await habitsAPI.getAll()).map(habit => 
              habitsAPI.getLogs(habit.id).catch(() => [])
            )
          ).then(logs => logs.flat()).catch(() => []),
        ])
        
        setHabits(habits)
        setGoals(goals)
        setReflections(reflections)
        setMetrics(metrics)
        setHabitLogs(habitLogs)
        
        // Core habits are created automatically when Profiler is completed
        // No need to initialize here
      } catch (error) {
        console.error('Failed to load coaching data:', error)
        setError('Failed to load coaching data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    
    loadCoachingData()
  }, [setHabits, setGoals, setReflections, setMetrics, setHabitLogs, setLoading, setError])
  
  const handleNavigate = (section: 'habits' | 'goals' | 'reflect' | 'coach') => {
    // Scroll to section or open modal
    const element = document.getElementById(`coaching-${section}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  return (
    <div className="relative min-h-screen">
      <CoachingSidebar onNavigate={handleNavigate} />
      <CoachingHub />
    </div>
  )
}

