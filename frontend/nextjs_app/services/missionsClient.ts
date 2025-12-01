/**
 * Missions Service Client
 * Handles mission-related endpoints
 */

import { apiGateway } from './apiGateway'
import type { Mission, RecommendedMission } from './types/missions'

export const missionsClient = {
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
