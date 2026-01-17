/**
 * Coaching OS - Zustand State Management
 * Central store for habits, goals, reflections, and metrics
 */

import { create } from 'zustand'
import type {
  Habit,
  HabitLog,
  Goal,
  Reflection,
  AICoachMessage,
  CoachingMetrics
} from './types'
import { habitsAPI, goalsAPI, reflectionsAPI, aiCoachAPI, metricsAPI } from './api'

interface CoachingState {
  // State
  habits: Habit[]
  habitLogs: HabitLog[]
  goals: Goal[]
  reflections: Reflection[]
  aiMessages: AICoachMessage[]
  metrics: CoachingMetrics
  isLoading: boolean
  error: string | null
  
  // Actions
  setHabits: (habits: Habit[]) => void
  addHabit: (habit: Habit) => void
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void

  setHabitLogs: (logs: HabitLog[]) => void
  logHabit: (habitId: string, status: HabitLog['status'], notes?: string) => Promise<void>

  setGoals: (goals: Goal[]) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  completeGoal: (id: string) => void

  setReflections: (reflections: Reflection[]) => void
  addReflection: (reflection: Reflection) => void

  setAIMessages: (messages: AICoachMessage[]) => void
  addAIMessage: (message: AICoachMessage) => void

  setMetrics: (metrics: CoachingMetrics) => void
  updateAlignmentScore: (score: number) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Data loading actions
  loadAllData: () => Promise<void>
  loadHabits: () => Promise<void>
  loadGoals: () => Promise<void>
  loadReflections: () => Promise<void>
  loadAIMessages: () => Promise<void>
  loadMetrics: () => Promise<void>
  
  // Computed
  getTodayHabits: () => (Habit & { todayStatus: 'completed' | 'pending' | 'skipped' })[]
  getActiveGoals: () => Goal[]
  getTodayReflection: () => Reflection | null
}

export const useCoachingStore = create<CoachingState>((set, get) => ({
  // Initial state
  habits: [],
  habitLogs: [],
  goals: [],
  reflections: [],
  aiMessages: [],
  metrics: {
    alignmentScore: 0,
    totalStreakDays: 0,
    activeHabits: 0,
    completedGoals: 0,
    reflectionCount: 0,
  },
  isLoading: false,
  error: null,
  
  // Habit actions
  setHabits: (habits) => set({ habits }),
  
  addHabit: (habit) => set((state) => ({ 
    habits: [...state.habits, habit] 
  })),
  
  updateHabit: (id, updates) => set((state) => ({
    habits: state.habits.map(h => 
      h.id === id ? { ...h, ...updates } : h
    )
  })),
  
  deleteHabit: (id) => set((state) => ({
    habits: state.habits.filter(h => h.id !== id)
  })),
  
  // Habit log actions
  setHabitLogs: (logs) => set({ habitLogs: logs }),
  
  logHabit: async (habitId, status, notes) => {
    const today = new Date().toISOString().split('T')[0]
    const state = get()
    
    // Optimistic update
    const existingLog = state.habitLogs.find(
      log => log.habitId === habitId && log.date === today
    )
    
    const newLog: HabitLog = existingLog 
      ? { ...existingLog, status, notes }
      : {
          id: `log-${Date.now()}`,
          habitId,
          date: today,
          status,
          notes,
          loggedAt: new Date().toISOString(),
        }
    
    set((state) => ({
      habitLogs: existingLog
        ? state.habitLogs.map(log => 
            log.id === existingLog.id ? newLog : log
          )
        : [...state.habitLogs, newLog]
    }))
    
    // Update habit streak
    if (status === 'completed') {
      const habit = state.habits.find(h => h.id === habitId)
      if (habit) {
        set((state) => ({
          habits: state.habits.map(h =>
            h.id === habitId
              ? { ...h, streak: h.streak + 1, longestStreak: Math.max(h.longestStreak, h.streak + 1) }
              : h
          )
        }))
      }
    } else if (status === 'missed') {
      set((state) => ({
        habits: state.habits.map(h =>
          h.id === habitId ? { ...h, streak: 0 } : h
        )
      }))
    }
    
    // TODO: API call
    // await apiGateway.post('/coaching/habits/log', newLog)
  },
  
  // Goal actions
  setGoals: (goals) => set({ goals }),
  
  addGoal: (goal) => set((state) => ({
    goals: [...state.goals, goal]
  })),
  
  updateGoal: (id, updates) => set((state) => ({
    goals: state.goals.map(g =>
      g.id === id ? { ...g, ...updates } : g
    )
  })),
  
  completeGoal: (id) => set((state) => ({
    goals: state.goals.map(g =>
      g.id === id ? { ...g, status: 'completed' as const, progress: 100 } : g
    ),
    metrics: {
      ...state.metrics,
      completedGoals: state.metrics.completedGoals + 1,
    }
  })),
  
  // Reflection actions
  setReflections: (reflections) => set({ reflections }),
  
  addReflection: (reflection) => set((state) => ({
    reflections: [...state.reflections, reflection],
    metrics: {
      ...state.metrics,
      reflectionCount: state.metrics.reflectionCount + 1,
      lastReflectionDate: reflection.date,
    }
  })),
  
  // AI Message actions
  setAIMessages: (messages) => set({ aiMessages: messages }),
  
  addAIMessage: (message) => set((state) => ({
    aiMessages: [...state.aiMessages, message]
  })),
  
  // Metrics actions
  setMetrics: (metrics) => set({ metrics }),
  
  updateAlignmentScore: (score) => set((state) => ({
    metrics: {
      ...state.metrics,
      alignmentScore: Math.max(0, Math.min(100, score)),
    }
  })),
  
  // UI state
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Data loading actions
  loadAllData: async () => {
    set({ isLoading: true, error: null })
    try {
      await Promise.all([
        get().loadHabits(),
        get().loadGoals(),
        get().loadReflections(),
        get().loadAIMessages(),
        get().loadMetrics(),
      ])
    } catch (error) {
      console.error('Failed to load coaching data:', error)
      set({ error: 'Failed to load coaching data' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadHabits: async () => {
    try {
      const habits = await habitsAPI.getAll()
      set({ habits })
    } catch (error) {
      console.error('Failed to load habits:', error)
    }
  },

  loadGoals: async () => {
    try {
      const goals = await goalsAPI.getAll()
      set({ goals })
    } catch (error) {
      console.error('Failed to load goals:', error)
    }
  },

  loadReflections: async () => {
    try {
      const reflections = await reflectionsAPI.getAll()
      set({ reflections })
    } catch (error) {
      console.error('Failed to load reflections:', error)
    }
  },

  loadAIMessages: async () => {
    try {
      const messages = await aiCoachAPI.getHistory()
      set({ aiMessages: messages })
    } catch (error) {
      console.error('Failed to load AI messages:', error)
    }
  },

  loadMetrics: async () => {
    try {
      const metrics = await metricsAPI.getMetrics()
      set({ metrics })
    } catch (error) {
      console.error('Failed to load metrics:', error)
      // Keep default metrics if API fails
    }
  },

  // Computed getters
  getTodayHabits: () => {
    const state = get()
    const today = new Date().toISOString().split('T')[0]
    return state.habits.filter(h => h.isActive).map(habit => {
      const todayLog = state.habitLogs.find(
        log => log.habitId === habit.id && log.date === today
      )
      return {
        ...habit,
        todayStatus: (todayLog?.status || 'pending') as 'completed' | 'pending' | 'skipped',
      }
    })
  },
  
  getActiveGoals: () => {
    return get().goals.filter(g => g.status === 'active')
  },
  
  getTodayReflection: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().reflections.find(r => r.date === today) || null
  },
}))


