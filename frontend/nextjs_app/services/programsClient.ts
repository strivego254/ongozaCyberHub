/**
 * Programs API Client
 * Handles all program, track, cohort, and enrollment operations
 */

import { apiGateway } from './apiGateway'

export interface Program {
  id: string
  name: string
  category: 'technical' | 'leadership' | 'mentorship'
  description: string
  duration_months: number
  default_price: number
  currency: string
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
}

export interface Track {
  id: string
  program: string
  program_name?: string
  name: string
  key: string
  description: string
  competencies: Record<string, any>
  director: string | null
  created_at: string
  updated_at: string
}

export interface Cohort {
  id: string
  track: string
  track_name?: string
  name: string
  start_date: string
  end_date: string
  mode: 'onsite' | 'virtual' | 'hybrid'
  seat_cap: number
  mentor_ratio: number
  calendar_id: string | null
  status: 'draft' | 'active' | 'running' | 'closing' | 'closed'
  seat_utilization?: number
  completion_rate?: number
  enrolled_count?: number
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  cohort: string
  cohort_name?: string
  user: string
  user_email?: string
  user_name?: string
  org: string | null
  enrollment_type: 'self' | 'sponsor' | 'invite'
  seat_type: 'paid' | 'scholarship' | 'sponsored'
  payment_status: 'pending' | 'paid' | 'waived'
  status: 'active' | 'withdrawn' | 'completed' | 'incomplete'
  joined_at: string
  completed_at: string | null
}

export interface CalendarEvent {
  id: string
  cohort: string
  cohort_name?: string
  type: 'orientation' | 'session' | 'submission' | 'holiday' | 'closure'
  title: string
  description: string
  start_ts: string
  end_ts: string
  location: string
  link: string
  status: 'scheduled' | 'done' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface MentorAssignment {
  id: string
  cohort: string
  cohort_name?: string
  mentor: string
  mentor_email?: string
  mentor_name?: string
  role: 'primary' | 'support' | 'guest'
  assigned_at: string
  active: boolean
}

export interface ProgramRule {
  id: string
  program: string
  program_name?: string
  rule: {
    criteria: {
      attendance_percent?: number
      portfolio_approved?: boolean
      feedback_score?: number
      payment_complete?: boolean
    }
    thresholds?: Record<string, any>
    dependencies?: string[]
  }
  version: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CohortDashboard {
  cohort_id: string
  cohort_name: string
  track_name: string
  enrollments_count: number
  seat_utilization: number
  mentor_assignments_count: number
  readiness_delta: number
  completion_percentage: number
  payments_complete: number
  payments_pending: number
}

class ProgramsClient {
  // Programs
  async getPrograms(): Promise<Program[]> {
    return apiGateway.get('/programs/')
  }

  async getProgram(id: string): Promise<Program> {
    return apiGateway.get(`/programs/${id}/`)
  }

  async createProgram(data: Partial<Program>): Promise<Program> {
    return apiGateway.post('/programs/', data)
  }

  async updateProgram(id: string, data: Partial<Program>): Promise<Program> {
    return apiGateway.put(`/programs/${id}/`, data)
  }

  // Tracks
  async getTracks(programId?: string): Promise<Track[]> {
    const params = programId ? { program_id: programId } : {}
    const queryString = programId ? `?program_id=${programId}` : ''
    return apiGateway.get(`/tracks/${queryString}`)
  }

  async getTrack(id: string): Promise<Track> {
    return apiGateway.get(`/tracks/${id}/`)
  }

  async createTrack(data: Partial<Track>): Promise<Track> {
    return apiGateway.post('/tracks/', data)
  }

  async updateTrack(id: string, data: Partial<Track>): Promise<Track> {
    return apiGateway.put(`/tracks/${id}/`, data)
  }

  // Cohorts
  async getCohorts(trackId?: string, status?: string): Promise<Cohort[]> {
    const params: string[] = []
    if (trackId) params.push(`track_id=${trackId}`)
    if (status) params.push(`status=${status}`)
    const queryString = params.length > 0 ? `?${params.join('&')}` : ''
    return apiGateway.get(`/cohorts/${queryString}`)
  }

  async getCohort(id: string): Promise<Cohort> {
    return apiGateway.get(`/cohorts/${id}/`)
  }

  async createCohort(data: Partial<Cohort>): Promise<Cohort> {
    return apiGateway.post('/cohorts/', data)
  }

  async updateCohort(id: string, data: Partial<Cohort>): Promise<Cohort> {
    return apiGateway.put(`/cohorts/${id}/`, data)
  }

  async getCohortDashboard(cohortId: string): Promise<CohortDashboard> {
    return apiGateway.get(`/cohorts/${cohortId}/dashboard/`)
  }

  // Calendar Events
  async getCohortCalendar(cohortId: string): Promise<CalendarEvent[]> {
    return apiGateway.get(`/cohorts/${cohortId}/calendar/`)
  }

  async createCalendarEvent(cohortId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return apiGateway.post(`/cohorts/${cohortId}/calendar/`, data)
  }

  // Enrollments
  async getCohortEnrollments(cohortId: string): Promise<Enrollment[]> {
    return apiGateway.get(`/cohorts/${cohortId}/enrollments/`)
  }

  async createEnrollment(cohortId: string, data: Partial<Enrollment>): Promise<Enrollment> {
    return apiGateway.post(`/cohorts/${cohortId}/enrollments/`, data)
  }

  // Mentor Assignments
  async getCohortMentors(cohortId: string): Promise<MentorAssignment[]> {
    return apiGateway.get(`/cohorts/${cohortId}/mentors/`)
  }

  async assignMentor(cohortId: string, data: Partial<MentorAssignment>): Promise<MentorAssignment> {
    return apiGateway.post(`/cohorts/${cohortId}/mentors/`, data)
  }

  // Program Rules
  async getProgramRules(programId?: string): Promise<ProgramRule[]> {
    const queryString = programId ? `?program_id=${programId}` : ''
    return apiGateway.get(`/rules/${queryString}`)
  }

  async createProgramRule(data: Partial<ProgramRule>): Promise<ProgramRule> {
    return apiGateway.post('/rules/', data)
  }

  async updateProgramRule(id: string, data: Partial<ProgramRule>): Promise<ProgramRule> {
    return apiGateway.put(`/rules/${id}/`, data)
  }

  // Auto-graduation
  async autoGraduateCohort(cohortId: string, ruleId?: string): Promise<{
    completed: number
    incomplete: number
    certificates_generated: number
    errors: string[]
  }> {
    return apiGateway.post(`/cohorts/${cohortId}/auto_graduate/`, { rule_id: ruleId })
  }

  // Export Reports
  async exportCohortReport(cohortId: string, format: 'csv' | 'json' = 'json'): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}/api/v1/cohorts/${cohortId}/export/?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      }
    )
    if (!response.ok) {
      throw new Error('Export failed')
    }
    return response.blob()
  }
}

export const programsClient = new ProgramsClient()
