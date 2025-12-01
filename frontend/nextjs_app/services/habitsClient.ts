/**
 * Habits Service Client
 * Handles habits, goals, and reflections
 */

import { apiGateway } from './apiGateway'
import type { Habit, Goal, Reflection } from './types/habits'

export const habitsClient = {
  /**
   * Get today's habits
   */
  async getTodayHabits(menteeId: string): Promise<Habit[]> {
    return apiGateway.get(`/habits/mentees/${menteeId}/today`)
  },

  /**
   * Toggle habit completion
   */
  async toggleHabit(menteeId: string, habitId: string, completed: boolean): Promise<Habit> {
    return apiGateway.patch(`/habits/mentees/${menteeId}/habits/${habitId}`, { completed })
  },

  /**
   * Get today's goals
   */
  async getTodayGoals(menteeId: string): Promise<Goal[]> {
    return apiGateway.get(`/goals/mentees/${menteeId}/today`)
  },

  /**
   * Mark goal as complete
   */
  async completeGoal(menteeId: string, goalId: string): Promise<Goal> {
    return apiGateway.patch(`/goals/mentees/${menteeId}/goals/${goalId}`, { completed: true })
  },

  /**
   * Get latest reflection
   */
  async getLatestReflection(menteeId: string): Promise<Reflection | null> {
    return apiGateway.get(`/reflections/mentees/${menteeId}/latest`)
  },

  /**
   * Submit reflection
   */
  async submitReflection(menteeId: string, content: string): Promise<Reflection> {
    return apiGateway.post(`/reflections/mentees/${menteeId}`, { content })
  },
}

