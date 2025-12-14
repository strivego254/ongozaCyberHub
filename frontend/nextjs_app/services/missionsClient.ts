/**
 * Missions Service Client
 * Handles mission-related endpoints
 */

import { apiGateway } from './apiGateway'
import type { Mission, RecommendedMission } from './types/missions'

export interface MissionTemplate {
  id?: string
  code: string
  title: string
  description?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone'
  type: 'lab' | 'scenario' | 'project' | 'capstone'
  track_id?: string
  track_key?: string
  est_hours?: number
  estimated_time_minutes?: number
  competencies?: string[]
  requirements?: Record<string, any>
  created_at?: string
}

export const missionsClient = {
  /**
   * Get all missions (for directors/admin)
   */
  async getAllMissions(params?: {
    track_id?: string
    track_key?: string
    difficulty?: string
    type?: string
    search?: string
    page?: number
    page_size?: number
  }): Promise<{ results: MissionTemplate[]; count: number; next?: string | null; previous?: string | null }> {
    return apiGateway.get('/missions/', { params })
  },

  /**
   * Get mission by ID
   */
  async getMission(id: string): Promise<MissionTemplate> {
    return apiGateway.get(`/missions/${id}/`)
  },

  /**
   * Create mission
   */
  async createMission(data: Partial<MissionTemplate>): Promise<MissionTemplate> {
    return apiGateway.post('/missions/', data)
  },

  /**
   * Update mission
   */
  async updateMission(id: string, data: Partial<MissionTemplate>): Promise<MissionTemplate> {
    return apiGateway.patch(`/missions/${id}/`, data)
  },

  /**
   * Delete mission
   */
  async deleteMission(id: string): Promise<void> {
    return apiGateway.delete(`/missions/${id}/`)
  },

  /**
   * Get mission submissions (for analytics)
   */
  async getMissionSubmissions(missionId: string): Promise<{ submissions: any[]; count: number }> {
    return apiGateway.get(`/missions/${missionId}/submissions/`)
  },

  /**
   * Get in-progress missions
   */
  async getInProgressMissions(menteeId: string): Promise<Mission[]> {
    return apiGateway.get(`/missions/mentees/${menteeId}/in-progress`)
  },

  /**
   * Get next recommended mission
   */
  async getNextRecommended(menteeId: string): Promise<RecommendedMission | null> {
    return apiGateway.get(`/missions/mentees/${menteeId}/next-recommended`)
  },

  /**
   * Start mission
   */
  async startMission(menteeId: string, missionId: string): Promise<Mission> {
    return apiGateway.post(`/missions/mentees/${menteeId}/missions/${missionId}/start`, {})
  },
}
