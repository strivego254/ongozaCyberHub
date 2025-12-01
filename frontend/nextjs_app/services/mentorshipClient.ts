/**
 * Mentorship Service Client
 * Handles mentorship sessions, chat, and calendar integration
 */

import { apiGateway } from './apiGateway'
import type {
  MentorshipSession,
  ChatMessage,
  MentorPresence,
  MentorshipFeedback,
} from './types/mentorship'

export const mentorshipClient = {
  /**
   * Get upcoming mentorship sessions
   */
  async getUpcomingSessions(menteeId: string): Promise<MentorshipSession[]> {
    return apiGateway.get(`/mentorships/${menteeId}/sessions/upcoming`)
  },

  /**
   * Get chat messages
   */
  async getChatMessages(menteeId: string, mentorId?: string): Promise<ChatMessage[]> {
    const params = mentorId ? { mentor_id: mentorId } : {}
    return apiGateway.get(`/mentorships/${menteeId}/chat`, { params })
  },

  /**
   * Send chat message
   */
  async sendMessage(menteeId: string, data: {
    message: string
    mentor_id?: string
    attachments?: File[]
  }): Promise<ChatMessage> {
    const formData = new FormData()
    formData.append('message', data.message)
    if (data.mentor_id) formData.append('mentor_id', data.mentor_id)
    if (data.attachments) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file)
      })
    }
    return apiGateway.post(`/mentorships/${menteeId}/chat`, formData)
  },

  /**
   * Get mentor presence status
   */
  async getMentorPresence(menteeId: string): Promise<MentorPresence[]> {
    return apiGateway.get(`/mentorships/${menteeId}/presence`)
  },

  /**
   * Get session feedback
   */
  async getFeedback(sessionId: string): Promise<MentorshipFeedback[]> {
    return apiGateway.get(`/mentorships/sessions/${sessionId}/feedback`)
  },

  /**
   * Sync calendar (Google Calendar/iCal)
   */
  async syncCalendar(menteeId: string, provider: 'google' | 'ical'): Promise<{
    sync_url: string
    calendar_id: string
  }> {
    return apiGateway.post(`/mentorships/${menteeId}/calendar/sync`, { provider })
  },
}

