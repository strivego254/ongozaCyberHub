/**
 * Mentor Service Client
 * Handles mentor-centric views: mentees, missions, influence, alerts
 */

import { apiGateway } from './apiGateway'
import type {
  MentorMentee,
  MentorMenteeDetail,
  MentorMissionPending,
  MentorInfluence,
  MentorAlert,
} from './types/mentor'

export const mentorClient = {
  /**
   * Get mentees overview for a mentor
   */
  async getMentees(mentorId: string): Promise<MentorMentee[]> {
    return apiGateway.get(`/mentors/${mentorId}/mentees`)
  },

  /**
   * Get detailed mentee information for a mentor
   */
  async getMenteesDetails(mentorId: string): Promise<MentorMenteeDetail[]> {
    return apiGateway.get(`/mentors/${mentorId}/mentees/details`)
  },

  /**
   * Get missions pending review for a mentor
   */
  async getPendingMissions(
    mentorId: string,
    params?: { page?: number; page_size?: number }
  ): Promise<{ results: MentorMissionPending[]; count: number }> {
    return apiGateway.get(`/missions/mentors/${mentorId}/pending-review`, { params })
  },

  /**
   * Get mentor influence / engagement analytics
   */
  async getInfluence(mentorId: string): Promise<MentorInfluence> {
    return apiGateway.get(`/talentscope/mentors/${mentorId}/influence`)
  },

  /**
   * Get mentor alerts / flags
   */
  async getAlerts(
    mentorId: string,
    params?: { severity?: string; resolved?: boolean }
  ): Promise<MentorAlert[]> {
    return apiGateway.get(`/alerts/mentors/${mentorId}`, { params })
  },
}


