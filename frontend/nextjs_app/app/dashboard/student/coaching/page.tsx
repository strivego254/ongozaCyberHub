'use client'

import { useState, useEffect } from 'react'
import { CoachingHub } from '@/components/ui/coaching/CoachingHub'
import { CoachingSidebar } from '@/components/ui/coaching/CoachingSidebar'
import { useCoachingStore } from '@/lib/coaching/store'
import { habitsAPI, goalsAPI, reflectionsAPI, metricsAPI } from '@/lib/coaching/api'
import { RouteGuard } from '@/components/auth/RouteGuard'

type CoachingSection = 'overview' | 'habits' | 'goals' | 'reflect'

export default function CoachingPage() {
  const [activeSection, setActiveSection] = useState<CoachingSection>('overview')
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
        const [habits, goals, reflections, metrics, habitLogs] = await Promise.all([
          habitsAPI.getAll().catch(() => []),
          goalsAPI.getAll().catch(() => []),
          reflectionsAPI.getAll().catch(() => []),
          metricsAPI.get().catch(() => ({
            habits_streak: 0,
            goals_completed: 0,
            reflections_count: 0,
            weekly_completion_rate: 0,
            alignmentScore: 0, // Will be fetched from real API
          })),
          habitsAPI.getAll().then(async (habs) => {
            const logs = await Promise.all(
              habs.map(habit => habitsAPI.getLogs(habit.id).catch(() => []))
            )
            return logs.flat()
          }).catch(() => []),
        ])
        
        setHabits(habits)
        setGoals(goals)
        setReflections(reflections)
        setMetrics(metrics)
        setHabitLogs(habitLogs)
      } catch (error) {
        console.error('Failed to load coaching data:', error)
        setError('Failed to load coaching data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    
    loadCoachingData()
  }, [setHabits, setGoals, setReflections, setMetrics, setHabitLogs, setLoading, setError])
  
  const handleNavigate = (section: CoachingSection) => {
    setActiveSection(section)
    // Scroll to top when switching sections for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  return (
    <div className="flex bg-och-midnight">
        {/* Enhanced Sidebar for Desktop */}
        <div className="pr-8 hidden lg:block sticky top-8 h-[calc(100vh-80px)]">
          <CoachingSidebar 
            onNavigate={handleNavigate} 
            activeSection={activeSection}
          />
        </div>
        
        {/* Main Hub Content */}
        <div className="flex-1 lg:pl-0">
          <CoachingHub 
            activeSection={activeSection} 
            setActiveSection={handleNavigate} 
          />
        </div>
    </div>
  )
}
