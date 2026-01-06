/**
 * Coaching OS - API Integration
 * API calls for habits, goals, reflections, and AI coach
 */

import { apiGateway } from '@/services/apiGateway'
import type { Habit, HabitLog, Goal, Reflection, AICoachMessage } from './types'

/**
 * Habits API
 */
export const habitsAPI = {
  getAll: async (userId?: string): Promise<Habit[]> => {
    const response = await apiGateway.get<Habit[]>('/api/v1/coaching/habits')
    return response || []
  },
  
  create: async (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> => {
    return await apiGateway.post<Habit>('/api/v1/coaching/habits', habit)
  },
  
  update: async (id: string, updates: Partial<Habit>): Promise<Habit> => {
    return await apiGateway.patch<Habit>(`/api/v1/coaching/habits/${id}`, updates)
  },
  
  delete: async (id: string): Promise<void> => {
    await apiGateway.delete(`/api/v1/coaching/habits/${id}`)
  },
  
  log: async (log: { habitId: string; status: HabitLog['status']; date?: string; notes?: string }): Promise<HabitLog> => {
    return await apiGateway.post<HabitLog>('/api/v1/coaching/habits/log', log)
  },
  
  getLogs: async (habitId: string, startDate?: string, endDate?: string): Promise<HabitLog[]> => {
    const response = await apiGateway.get<HabitLog[]>(`/api/v1/coaching/habits/${habitId}/logs?${startDate ? `start_date=${startDate}&` : ''}${endDate ? `end_date=${endDate}` : ''}`)
    return response || []
  },
}

/**
 * Goals API
 */
export const goalsAPI = {
  getAll: async (userId?: string): Promise<Goal[]> => {
    const response = await apiGateway.get<Goal[]>('/api/v1/coaching/goals')
    return response || []
  },
  
  create: async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
    return await apiGateway.post<Goal>('/api/v1/coaching/goals', goal)
  },
  
  update: async (id: string, updates: Partial<Goal>): Promise<Goal> => {
    return await apiGateway.patch<Goal>(`/api/v1/coaching/goals/${id}`, updates)
  },
  
  complete: async (id: string): Promise<Goal> => {
    return await apiGateway.patch<Goal>(`/api/v1/coaching/goals/${id}`, { status: 'completed', progress: 100 })
  },
}

/**
 * Reflections API
 */
export const reflectionsAPI = {
  getAll: async (userId?: string): Promise<Reflection[]> => {
    const response = await apiGateway.get<Reflection[]>('/api/v1/coaching/reflections')
    return response || []
  },
  
  create: async (reflection: Omit<Reflection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reflection> => {
    return await apiGateway.post<Reflection>('/api/v1/coaching/reflections', reflection)
  },
  
  getAIInsights: async (reflectionId: string): Promise<string> => {
    // TODO: Implement AI insights endpoint
    return ''
  },
}

/**
 * AI Coach API
 */
export const aiCoachAPI = {
  sendMessage: async (message: string, context?: AICoachMessage['context'], metadata?: AICoachMessage['metadata']): Promise<{ session_id: string; user_message_id: string; task_id: string; status: string }> => {
    return await apiGateway.post('/api/v1/coaching/ai-coach/message', {
      message,
      context,
      metadata,
    })
  },
  
  getContextualNudge: async (context: AICoachMessage['context'], metadata?: AICoachMessage['metadata']): Promise<AICoachMessage> => {
    // TODO: Implement contextual nudge endpoint
    return await aiCoachAPI.sendMessage('', context, metadata) as any
  },
  
  getHistory: async (userId?: string, limit?: number): Promise<AICoachMessage[]> => {
    const params = limit ? `?limit=${limit}` : ''
    const response = await apiGateway.get<AICoachMessage[]>(`/api/v1/coaching/ai-coach/history${params}`)
    return response || []
  },
}

/**
 * Metrics API
 */
export const metricsAPI = {
  getMetrics: async (userId?: string): Promise<{
    alignmentScore: number
    totalStreakDays: number
    activeHabits: number
    completedGoals: number
    reflectionCount: number
    lastReflectionDate?: string
  }> => {
    const response = await apiGateway.get('/api/v1/coaching/metrics') as any
    return response || {
      alignmentScore: 87,
      totalStreakDays: 0,
      activeHabits: 0,
      completedGoals: 0,
      reflectionCount: 0,
    }
  },
}


