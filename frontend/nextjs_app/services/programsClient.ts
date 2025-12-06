/**
 * Programs API Client
 * Handles all program, track, cohort, and enrollment operations
 */

import { apiGateway } from './apiGateway'

export interface Program {
  id?: string
  name: string
  category: 'technical' | 'leadership' | 'mentorship' | 'executive'
  description: string
  duration_months: number
  default_price: number
  currency: string
  outcomes: string[]
  structure?: Record<string, any>
  missions_registry_link?: string
  status: 'active' | 'inactive' | 'archived'
  tracks?: Track[]
  tracks_count?: number
  created_at?: string
  updated_at?: string
}

export interface Module {
  id?: string
  milestone?: string
  milestone_name?: string
  name: string
  description: string
  content_type: 'video' | 'article' | 'quiz' | 'assignment' | 'lab' | 'workshop'
  content_url: string
  order: number
  estimated_hours?: number
  skills: string[]
  applicable_tracks?: string[] | Track[]
  applicable_track_names?: string[]
  created_at?: string
  updated_at?: string
}

export interface Milestone {
  id?: string
  track?: string
  track_name?: string
  name: string
  description: string
  order: number
  duration_weeks?: number
  modules?: Module[]
  created_at?: string
  updated_at?: string
}

export interface Track {
  id?: string
  program?: string
  program_name?: string
  name: string
  key: string
  track_type: 'primary' | 'cross_track'
  description: string
  competencies: Record<string, any>
  missions: string[]
  director: string | null
  milestones?: Milestone[]
  created_at?: string
  updated_at?: string
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
  /**
   * Get all programs from /api/v1/programs/
   * Used by the "View Programs" view in director dashboard
   */
  async getPrograms(): Promise<Program[]> {
    try {
      console.log('📡 Fetching programs from /api/v1/programs/')
      const data = await apiGateway.get<any>('/programs/')
      console.log('📡 API Response:', {
        type: typeof data,
        isArray: Array.isArray(data),
        hasResults: data?.results !== undefined,
        hasData: data?.data !== undefined,
        count: Array.isArray(data) ? data.length : data?.results?.length || data?.count || 'N/A',
        totalCount: data?.count,
        hasNext: data?.next,
        keys: Object.keys(data || {}),
        data: data
      })
      
      // Handle paginated response (DRF default pagination)
      if (data?.results && Array.isArray(data.results)) {
        const programs = data.results
        console.log(`✅ Found ${programs.length} programs in paginated response (total: ${data.count || programs.length})`)
        
        // If there are more pages, fetch them all
        if (data.next) {
          console.log('📄 Multiple pages detected, fetching all pages...')
          let allPrograms = [...programs]
          let nextUrl = data.next
          
          while (nextUrl) {
            // Extract path from full URL
            const url = new URL(nextUrl)
            const path = url.pathname + url.search
            console.log(`📄 Fetching next page: ${path}`)
            
            const nextData = await apiGateway.get<any>(path.replace('/api/v1', ''))
            if (nextData?.results && Array.isArray(nextData.results)) {
              allPrograms = [...allPrograms, ...nextData.results]
              nextUrl = nextData.next
            } else {
              break
            }
          }
          
          console.log(`✅ Fetched all ${allPrograms.length} programs across all pages`)
          return allPrograms
        }
        
        return programs
      }
      
      // Handle direct array response
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} programs in array response`)
        return data
      }
      
      // Handle data wrapper
      if (data?.data && Array.isArray(data.data)) {
        console.log(`✅ Found ${data.data.length} programs in data wrapper`)
        return data.data
      }
      
      console.warn('⚠️ Unexpected response format, returning empty array')
      return []
    } catch (error: any) {
      console.error('❌ Error in getPrograms:', error)
      throw error
    }
  }

  async getProgram(id: string): Promise<Program> {
    return apiGateway.get(`/programs/${id}/`)
  }

  async createProgram(data: Partial<Program>): Promise<Program> {
    // Use program-management endpoint for full structure support
    return apiGateway.post('/programs-management/', data)
  }

  async updateProgram(id: string, data: Partial<Program>): Promise<Program> {
    // Use program-management endpoint for full structure support
    return apiGateway.patch(`/programs-management/${id}/`, data)
  }

  async deleteProgram(id: string): Promise<void> {
    return apiGateway.delete(`/programs/${id}/`)
  }

  // Milestones
  async getMilestones(trackId?: string): Promise<Milestone[]> {
    const queryString = trackId ? `?track_id=${trackId}` : ''
    return apiGateway.get(`/milestones/${queryString}`)
  }

  async createMilestone(data: Partial<Milestone>): Promise<Milestone> {
    return apiGateway.post('/milestones/', data)
  }

  async updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone> {
    return apiGateway.patch(`/milestones/${id}/`, data)
  }

  async deleteMilestone(id: string): Promise<void> {
    return apiGateway.delete(`/milestones/${id}/`)
  }

  // Modules
  async getModules(milestoneId?: string, trackId?: string): Promise<Module[]> {
    const params: string[] = []
    if (milestoneId) params.push(`milestone_id=${milestoneId}`)
    if (trackId) params.push(`track_id=${trackId}`)
    const queryString = params.length > 0 ? `?${params.join('&')}` : ''
    return apiGateway.get(`/modules/${queryString}`)
  }

  async createModule(data: Partial<Module>): Promise<Module> {
    return apiGateway.post('/modules/', data)
  }

  async updateModule(id: string, data: Partial<Module>): Promise<Module> {
    return apiGateway.patch(`/modules/${id}/`, data)
  }

  async deleteModule(id: string): Promise<void> {
    return apiGateway.delete(`/modules/${id}/`)
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
    return apiGateway.patch(`/tracks/${id}/`, data)
  }

  async deleteTrack(id: string): Promise<void> {
    return apiGateway.delete(`/tracks/${id}/`)
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
    return apiGateway.patch(`/cohorts/${id}/`, data)
  }

  async deleteCohort(id: string): Promise<void> {
    return apiGateway.delete(`/cohorts/${id}/`)
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

  // Director Dashboard
  async getDirectorDashboard(): Promise<DirectorDashboard> {
    return apiGateway.get('/programs/director/dashboard/')
  }
}

export interface DirectorAlert {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  cohort_id?: string
  action_url: string
}

export interface CohortTableRow {
  id: string
  name: string
  track_name: string
  program_name: string
  status: string
  seats_used: number
  seats_available: number
  seats_total: number
  readiness_delta: number
  completion_rate: number
  mentor_coverage: number
  upcoming_milestones: Array<{
    title: string
    date: string
    type: string
  }>
  start_date: string | null
  end_date: string | null
}

export interface DirectorDashboard {
  hero_metrics: {
    active_programs: number
    active_cohorts: number
    seats_used: number
    seats_available: number
    seat_utilization: number
    avg_readiness: number
    avg_completion_rate: number
    revenue_per_seat: number
  }
  alerts: DirectorAlert[]
  cohort_table: CohortTableRow[]
  programs: Program[]
}

export const programsClient = new ProgramsClient()
