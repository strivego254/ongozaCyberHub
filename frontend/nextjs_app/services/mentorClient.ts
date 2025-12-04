/**
 * Mentor Service Client
 * Handles all mentor-specific API endpoints for mentee management, mission reviews, sessions, and analytics
 */

import { apiGateway } from './apiGateway'
import type {
  AssignedMentee,
  MentorProfile,
  MissionSubmission,
  MissionReview,
  CapstoneProject,
  CapstoneScore,
  GroupMentorshipSession,
  MenteeGoal,
  MenteeFlag,
  TrackAssignment,
  MenteePerformance,
  TalentScopeMentorView,
  MentorInfluenceIndex,
} from './types/mentor'

export const mentorClient = {
  /**
   * I. Mentee Management and Assignment Features
   */

  /**
   * Get list of assigned mentees
   */
  async getAssignedMentees(mentorId: string): Promise<AssignedMentee[]> {
    return apiGateway.get(`/mentors/${mentorId}/mentees`)
  },

  /**
   * Get mentor profile
   */
  async getMentorProfile(mentorId: string): Promise<MentorProfile> {
    return apiGateway.get(`/mentors/${mentorId}/profile`)
  },

  /**
   * Update mentor profile
   */
  async updateMentorProfile(mentorId: string, data: {
    bio?: string
    expertise_tags?: string[]
    availability?: MentorProfile['availability']
  }): Promise<MentorProfile> {
    return apiGateway.patch(`/mentors/${mentorId}/profile`, data)
  },

  /**
   * II. Mission Review and Feedback Features
   */

  /**
   * Get mission submission queue (only Professional tier submissions)
   */
  async getMissionSubmissionQueue(mentorId: string, params?: {
    status?: 'pending_review' | 'in_review' | 'all'
    limit?: number
    offset?: number
  }): Promise<{ results: MissionSubmission[]; count: number }> {
    return apiGateway.get(`/mentors/${mentorId}/missions/submissions`, { params })
  },

  /**
   * Get detailed mission submission
   */
  async getMissionSubmission(submissionId: string): Promise<MissionSubmission> {
    return apiGateway.get(`/mentors/missions/submissions/${submissionId}`)
  },

  /**
   * Submit mission review with detailed analysis
   */
  async submitMissionReview(submissionId: string, data: {
    overall_status: 'pass' | 'fail' | 'needs_revision'
    feedback?: {
      written?: string
      audio_url?: string
    }
    comments?: Array<{
      comment: string
      section?: string
    }>
    technical_competencies?: string[]
    score_breakdown?: Record<string, number>
    recommended_next_missions?: string[]
  }): Promise<MissionReview> {
    return apiGateway.post(`/mentors/missions/submissions/${submissionId}/review`, data)
  },

  /**
   * Get capstone projects pending scoring
   */
  async getCapstoneProjects(mentorId: string, params?: {
    status?: 'pending_scoring' | 'all'
  }): Promise<CapstoneProject[]> {
    return apiGateway.get(`/mentors/${mentorId}/capstones`, { params })
  },

  /**
   * Score capstone project
   */
  async scoreCapstone(capstoneId: string, data: {
    overall_score: number
    score_breakdown: {
      technical_quality: number
      problem_solving: number
      documentation: number
      presentation: number
      innovation: number
    }
    feedback: string
    recommendations?: string[]
  }): Promise<CapstoneScore> {
    return apiGateway.post(`/mentors/capstones/${capstoneId}/score`, data)
  },

  /**
   * III. Coaching and Session Management
   */

  /**
   * Get group mentorship sessions
   */
  async getGroupSessions(mentorId: string, params?: {
    status?: 'scheduled' | 'completed' | 'all'
    start_date?: string
    end_date?: string
  }): Promise<GroupMentorshipSession[]> {
    return apiGateway.get(`/mentors/${mentorId}/sessions`, { params })
  },

  /**
   * Create group mentorship session
   */
  async createGroupSession(mentorId: string, data: {
    title: string
    description: string
    scheduled_at: string
    duration_minutes: number
    meeting_type: 'zoom' | 'google_meet' | 'in_person'
    meeting_link?: string
    track_assignment?: string
  }): Promise<GroupMentorshipSession> {
    return apiGateway.post(`/mentors/${mentorId}/sessions`, data)
  },

  /**
   * Update group session (post-session management)
   */
  async updateGroupSession(sessionId: string, data: {
    recording_url?: string
    transcript_url?: string
    attendance?: Array<{
      mentee_id: string
      attended: boolean
      joined_at?: string
      left_at?: string
    }>
  }): Promise<GroupMentorshipSession> {
    return apiGateway.patch(`/mentors/sessions/${sessionId}`, data)
  },

  /**
   * Get mentee goals (monthly/weekly) for Professional tier
   */
  async getMenteeGoals(mentorId: string, params?: {
    mentee_id?: string
    goal_type?: 'monthly' | 'weekly'
    status?: 'pending' | 'in_progress' | 'completed'
  }): Promise<MenteeGoal[]> {
    return apiGateway.get(`/mentors/${mentorId}/goals`, { params })
  },

  /**
   * Provide feedback on mentee goal
   */
  async provideGoalFeedback(goalId: string, data: {
    feedback: string
  }): Promise<MenteeGoal> {
    return apiGateway.post(`/mentors/goals/${goalId}/feedback`, data)
  },

  /**
   * Flag a mentee who is struggling
   */
  async flagMentee(mentorId: string, data: {
    mentee_id: string
    flag_type: 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }): Promise<MenteeFlag> {
    return apiGateway.post(`/mentors/${mentorId}/flags`, data)
  },

  /**
   * Get mentee flags
   */
  async getMenteeFlags(mentorId: string, params?: {
    status?: 'open' | 'resolved' | 'all'
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }): Promise<MenteeFlag[]> {
    return apiGateway.get(`/mentors/${mentorId}/flags`, { params })
  },

  /**
   * Assign user to a track (track assignment override)
   */
  async assignTrack(data: {
    user_id: string
    track_key: string
    reason?: string
  }): Promise<TrackAssignment> {
    return apiGateway.post(`/mentors/track-assignments`, data)
  },

  /**
   * IV. Performance Tracking and Analytics
   */

  /**
   * Get mentee performance tracking
   */
  async getMenteePerformance(mentorId: string, menteeId: string): Promise<MenteePerformance> {
    return apiGateway.get(`/mentors/${mentorId}/mentees/${menteeId}/performance`)
  },

  /**
   * Get TalentScope mentor view for a mentee
   */
  async getTalentScopeView(mentorId: string, menteeId: string): Promise<TalentScopeMentorView> {
    return apiGateway.get(`/mentors/${mentorId}/mentees/${menteeId}/talentscope`)
  },

  /**
   * Get mentor influence index
   */
  async getInfluenceIndex(mentorId: string, params?: {
    start_date?: string
    end_date?: string
  }): Promise<MentorInfluenceIndex> {
    return apiGateway.get(`/mentors/${mentorId}/influence`, { params })
  },

  /**
   * Get alerts for mentor (flags, overdue items, etc.)
   */
  async getAlerts(mentorId: string): Promise<import('./types/mentor').MentorAlert[]> {
    // Get flags and convert to alerts format
    const flags = await this.getMenteeFlags(mentorId, { status: 'open' })
    return flags.map(flag => ({
      id: flag.id,
      type: 'flag' as const,
      severity: flag.severity,
      title: `${flag.flag_type} - ${flag.mentee_name}`,
      description: flag.description,
      mentee_id: flag.mentee_id,
      mentee_name: flag.mentee_name,
      related_id: flag.id,
      created_at: flag.raised_at,
      resolved: flag.status === 'resolved',
    }))
  },
}
