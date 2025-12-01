export interface MentorMentee {
  id: string
  name: string
  email?: string
  avatar_url?: string
  track?: string
  cohort?: string
  subscription_tier?: string
  readiness_score: number
  readiness_label?: string
  last_activity_at?: string
  risk_level?: 'low' | 'medium' | 'high'
  missions_completed?: number
}

export interface MentorMenteeDetail extends MentorMentee {
  recent_activities?: {
    type: string
    label: string
    at: string
  }[]
  latest_mission_status?: string
  latest_notes?: string
}

export interface MentorMissionPending {
  id: string
  title: string
  mentee_id: string
  mentee_name: string
  submitted_at: string
  ai_score?: number
  status: 'pending' | 'needs_review' | 'in_review'
}

export interface MentorInfluence {
  impact_score: number
  sessions_held: number
  mentees_engaged: number
  feedback_count: number
  history: Array<{
    date: string
    impact_score: number
    sessions: number
  }>
}

export interface MentorAlert {
  id: string
  mentee_id: string
  mentee_name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  message: string
  created_at: string
  resolved_at?: string
}


