/**
 * Coaching OS - Utility Functions
 * Date helpers, streak calculations, formatting
 */

import type { Habit, HabitLog, StreakData } from './types'

/**
 * Calculate streak from habit logs
 */
export function calculateStreak(habit: Habit, logs: HabitLog[]): StreakData {
  if (!logs.length) {
    return {
      current: 0,
      longest: habit.longestStreak || 0,
      isAtRisk: false,
      nextMilestone: 7,
    }
  }

  // Sort logs by date descending
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0]
  const todayLog = sortedLogs.find(log => log.date === today)
  
  // Calculate current streak
  let currentStreak = 0
  const checkDate = new Date()
  
  // If today is completed, start from today, otherwise from yesterday
  if (todayLog?.status === 'completed') {
    currentStreak = 1
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  // Count backwards
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    const log = sortedLogs.find(l => l.date === dateStr)
    
    if (log?.status === 'completed') {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (log?.status === 'skipped') {
      // Skipped doesn't break streak but doesn't count
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      // Missed or no log breaks streak
      break
    }
    
    // Safety limit
    if (currentStreak > 365) break
  }
  
  // Check if at risk (last completion was > 23 hours ago)
  const lastCompleted = sortedLogs.find(l => l.status === 'completed')
  const isAtRisk = lastCompleted 
    ? (Date.now() - new Date(lastCompleted.loggedAt || lastCompleted.date).getTime()) > 23 * 60 * 60 * 1000
    : true
  
  // Find next milestone
  const milestones = [7, 14, 30, 60, 90, 180, 365]
  const nextMilestone = milestones.find(m => m > currentStreak) || 365
  
  return {
    current: currentStreak,
    longest: Math.max(habit.longestStreak || 0, currentStreak),
    isAtRisk,
    nextMilestone,
  }
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get today's date string
 */
export function getToday(): string {
  return formatDate(new Date())
}

/**
 * Get date string for N days ago
 */
export function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatDate(date)
}

/**
 * Check if date is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday()
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

/**
 * Get progress percentage
 */
export function getProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

/**
 * Get streak emoji based on days
 */
export function getStreakEmoji(streak: number): string {
  if (streak >= 365) return '🏆'
  if (streak >= 180) return '🔥🔥🔥'
  if (streak >= 90) return '🔥🔥'
  if (streak >= 30) return '🔥'
  if (streak >= 14) return '✨'
  if (streak >= 7) return '⭐'
  return '💫'
}


