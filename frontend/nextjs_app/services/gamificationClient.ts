/**
 * Gamification Service Client
 * Handles badges, streaks, leaderboards, and points
 */

import { apiGateway } from './apiGateway'
import type {
  Badge,
  Streak,
  LeaderboardEntry,
  Points,
} from './types/gamification'

export const gamificationClient = {
  /**
   * Get earned badges for a mentee
   */
  async getBadges(menteeId: string): Promise<Badge[]> {
    return apiGateway.get(`/gamification/mentees/${menteeId}/badges`)
  },

  /**
   * Get streaks
   */
  async getStreaks(menteeId: string): Promise<Streak[]> {
    return apiGateway.get(`/gamification/mentees/${menteeId}/streaks`)
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(trackId?: string, category?: string): Promise<LeaderboardEntry[]> {
    const params: any = {}
    if (trackId) params.track_id = trackId
    if (category) params.category = category
    return apiGateway.get('/gamification/leaderboards', { params })
  },

  /**
   * Get points summary
   */
  async getPoints(menteeId: string): Promise<Points> {
    return apiGateway.get(`/gamification/mentees/${menteeId}/points`)
  },
}

