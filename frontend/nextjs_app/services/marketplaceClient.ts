/**
 * Marketplace Service Client
 * Handles job recommendations and portfolio connections
 */

import { apiGateway } from './apiGateway'
import type {
  JobListing,
  Application,
  EmployerInterest,
} from './types/marketplace'

export const marketplaceClient = {
  /**
   * Get job recommendations for a mentee
   */
  async getRecommendations(menteeId: string): Promise<JobListing[]> {
    return apiGateway.get(`/marketplace/recommendations/${menteeId}`)
  },

  /**
   * Get portfolio items
   */
  async getPortfolioItems(menteeId: string): Promise<any[]> {
    return apiGateway.get(`/portfolio/${menteeId}/items`)
  },

  /**
   * Submit application
   */
  async submitApplication(menteeId: string, data: {
    job_id: string
    portfolio_item_ids: string[]
    cover_letter?: string
  }): Promise<Application> {
    return apiGateway.post(`/marketplace/applications`, { mentee_id: menteeId, ...data })
  },

  /**
   * Get applications
   */
  async getApplications(menteeId: string): Promise<Application[]> {
    return apiGateway.get(`/marketplace/applications`, { params: { mentee_id: menteeId } })
  },

  /**
   * Get employer interest
   */
  async getEmployerInterest(menteeId: string): Promise<EmployerInterest[]> {
    return apiGateway.get(`/marketplace/mentees/${menteeId}/interest`)
  },
}

