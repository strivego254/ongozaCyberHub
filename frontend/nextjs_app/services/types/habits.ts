export interface Habit {
  id: string
  name: string
  type: 'learn' | 'practice' | 'reflect'
  streak_count: number
  completed_today: boolean
  last_completed?: string
}

export interface Goal {
  id: string
  title: string
  description: string
  due_date?: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}

export interface Reflection {
  id: string
  content: string
  created_at: string
  sentiment?: 'positive' | 'neutral' | 'negative'
}

