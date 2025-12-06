export type MissionStatus = 
  | 'not_started' 
  | 'draft'
  | 'in_progress' 
  | 'submitted' 
  | 'in_ai_review' 
  | 'ai_reviewed'
  | 'in_mentor_review' 
  | 'approved' 
  | 'failed'
  | 'rejected'
  | 'revised'
  | 'changes_requested'

export type MissionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'capstone'

export interface Mission {
  id: string
  code: string
  title: string
  description: string
  brief?: string
  objectives?: string[]
  difficulty: MissionDifficulty
  type?: string
  status: MissionStatus
  progress_percent: number
  estimated_time_minutes?: number
  estimated_time?: string
  due_date?: string
  track_key?: string
  track_name?: string
  module_name?: string
  competency_tags?: string[]
  mission_type?: 'scenario-based' | 'practical-lab' | 'research' | 'capstone'
  attachments?: MissionAttachment[]
  external_links?: ExternalLink[]
  ai_recommendation_reason?: string
  submission?: {
    id: string
    notes: string
    file_urls: string[]
    github_url?: string
    notebook_url?: string
    video_url?: string
  }
  artifacts?: Array<{
    id: string
    type: string
    url: string
    filename?: string
  }>
  ai_feedback?: AIFeedback
  mentor_review?: MentorReview
  portfolio_linked?: boolean
  readiness_impact?: {
    competencies: Array<{ name: string; points: number }>
    readiness_points: number
  }
  last_updated?: string
  artifacts_uploaded?: number
  artifacts_required?: number
  submission_id?: string
  ai_score?: number
}

export interface MissionAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}

export interface ExternalLink {
  id: string
  label: string
  url: string
  type: 'github' | 'lab' | 'documentation' | 'video' | 'other'
}

export interface MissionSubmission {
  id?: string
  mission_id: string
  files?: File[]
  file_urls?: string[]
  github_url?: string
  notebook_url?: string
  video_url?: string
  notes?: string
  draft?: boolean
  submitted_at?: string
}

export interface AIFeedback {
  score: number
  max_score: number
  strengths: string[]
  gaps: string[]
  full_feedback?: {
    correctness: string
    missed_requirements: string[]
    suggested_improvements: string[]
    tagged_competencies: Array<{ name: string; level: number }>
  }
  feedback_date?: string
}

export interface MentorReview {
  status: 'waiting' | 'changes_requested' | 'approved' | 'rejected'
  rubric_summary?: {
    configuration?: number
    documentation?: number
    reasoning?: number
  }
  decision?: 'pass' | 'fail'
  comments?: string
  reviewed_at?: string
  reviewer_name?: string
}

