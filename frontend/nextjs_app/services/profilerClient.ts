/**
 * Profiler Service Client
 * Handles Future-You and track-related endpoints
 */

import { apiGateway } from './apiGateway'
import type { FutureYou, UserTrack, ReadinessWindow } from './types/profiler'

export const profilerClient = {
  /**
   * Get Future-You persona for a mentee
   */
  async getFutureYou(menteeId: string): Promise<FutureYou> {
    return apiGateway.get(`/profiler/mentees/${menteeId}/future-you`)
  },

  /**
   * Get user tracks
   */
  async getUserTracks(menteeId: string): Promise<UserTrack[]> {
    return apiGateway.get(`/usertracks/${menteeId}`)
  },

  /**
   * Get readiness window
   */
  async getReadinessWindow(menteeId: string): Promise<ReadinessWindow> {
    return apiGateway.get(`/talentscope/mentees/${menteeId}/readiness-window`)
  },

  /**
   * Update user track
   */
  async updateTrack(menteeId: string, trackId: string): Promise<{ detail: string; track: UserTrack }> {
    return apiGateway.post(`/usertracks/${menteeId}/change`, { track_id: trackId })
  },
}
