export interface Mission {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  progress_percentage: number
  status: 'not_started' | 'in_progress' | 'completed'
  estimated_duration?: string
  started_at?: string
  completed_at?: string
}

export interface RecommendedMission {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  reason: string
  estimated_duration?: string
}

