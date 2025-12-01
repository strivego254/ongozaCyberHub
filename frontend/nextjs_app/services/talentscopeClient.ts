/**
 * TalentScope Service Client
 * Handles readiness scores and overview
 */

import { apiGateway } from './apiGateway'

export interface TalentScopeOverview {
  readiness_score: number
  missions_completed: number
  habit_streak: number
  portfolio_count: number
  preview_mode?: boolean
  breakdown?: {
    technical: number
    behavioral: number
    portfolio: number
  }
}

export const talentscopeClient = {
  /**
   * Get TalentScope overview
   */
  async getOverview(menteeId: string): Promise<TalentScopeOverview> {
    return apiGateway.get(`/talentscope/mentees/${menteeId}/overview`)
  },
}

