export interface FutureYou {
  id: string
  persona_name: string
  description: string
  created_at: string
  updated_at: string
}

export interface UserTrack {
  id: string
  track_name: string
  track_description: string
  track_slug: string
  enrolled_at: string
  progress_percentage: number
}

export interface ReadinessWindow {
  label: string
  estimated_date?: string
  confidence: 'high' | 'medium' | 'low'
}

