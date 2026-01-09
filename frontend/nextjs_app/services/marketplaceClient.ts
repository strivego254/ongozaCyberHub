/**
 * Marketplace API Client
 * Handles employer-talent interactions, job postings, and marketplace profiles
 */

import { apiGateway } from './apiGateway'

export interface MarketplaceProfile {
  id: string
  mentee_id: string
  mentee_name: string
  mentee_email: string
  tier: 'free' | 'starter' | 'professional'
  readiness_score: number | null
  job_fit_score: number | null
  hiring_timeline_days: number | null
  profile_status: 'foundation_mode' | 'emerging_talent' | 'job_ready'
  primary_role: string | null
  primary_track_key: string | null
  skills: string[]
  portfolio_depth: 'basic' | 'moderate' | 'deep'
  is_visible: boolean
  employer_share_consent: boolean
  updated_at: string
}

export interface Employer {
  id: string
  user_id: string
  company_name: string
  website: string | null
  sector: string | null
  country: string | null
  logo_url: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface JobPosting {
  id: string
  employer_id: string
  title: string
  description: string
  location: string | null
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
  required_skills: string[]
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  is_active: boolean
  application_deadline: string | null
  posted_at: string
}

export interface EmployerInterestLog {
  id: string
  employer_id: string
  profile_id: string
  action: 'view' | 'favorite' | 'shortlist' | 'contact_request'
  metadata: Record<string, any>
  created_at: string
}

export interface TalentBrowseParams {
  contactable_only?: boolean
  status?: 'foundation_mode' | 'emerging_talent' | 'job_ready'
  min_readiness?: number
  skills?: string[]
  q?: string
  page?: number
  page_size?: number
}

export const marketplaceClient = {
  /**
   * Browse talent (employers only)
   */
  async browseTalent(params?: TalentBrowseParams): Promise<{
    results: MarketplaceProfile[]
    count: number
    page: number
    page_size: number
  }> {
    const queryParams = new URLSearchParams()
    if (params?.contactable_only) queryParams.append('contactable_only', 'true')
    if (params?.status) queryParams.append('status', params.status)
    if (params?.min_readiness) queryParams.append('min_readiness', params.min_readiness.toString())
    if (params?.skills && params.skills.length > 0) {
      queryParams.append('skills', params.skills.join(','))
    }
    if (params?.q) queryParams.append('q', params.q)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())

    const queryString = queryParams.toString()
    const url = `/marketplace/talent${queryString ? `?${queryString}` : ''}`
    return apiGateway.get(url)
  },

  /**
   * Get marketplace profile for current user (mentee)
   */
  async getMyProfile(): Promise<MarketplaceProfile> {
    return apiGateway.get('/marketplace/profile/me')
  },

  /**
   * Update marketplace profile visibility (mentee)
   */
  async updateProfileVisibility(isVisible: boolean): Promise<MarketplaceProfile> {
    return apiGateway.patch('/marketplace/profile/me', {
      is_visible: isVisible,
    })
  },

  /**
   * Log employer interest in a talent profile
   */
  async logInterest(profileId: string, action: 'view' | 'favorite' | 'shortlist' | 'contact_request', metadata?: Record<string, any>): Promise<EmployerInterestLog> {
    return apiGateway.post('/marketplace/interest', {
      profile_id: profileId,
      action,
      metadata: metadata || {},
    })
  },

  /**
   * Get job postings for current employer
   */
  async getJobPostings(): Promise<JobPosting[]> {
    return apiGateway.get('/marketplace/jobs')
  },

  /**
   * Create a new job posting
   */
  async createJobPosting(data: {
    title: string
    description: string
    location?: string
    job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
    required_skills: string[]
    salary_min?: number
    salary_max?: number
    salary_currency?: string
    application_deadline?: string
  }): Promise<JobPosting> {
    return apiGateway.post('/marketplace/jobs', data)
  },

  /**
   * Update a job posting
   */
  async updateJobPosting(jobId: string, data: Partial<JobPosting>): Promise<JobPosting> {
    return apiGateway.patch(`/marketplace/jobs/${jobId}`, data)
  },

  /**
   * Delete a job posting
   */
  async deleteJobPosting(jobId: string): Promise<void> {
    return apiGateway.delete(`/marketplace/jobs/${jobId}`)
  },

  /**
   * Get employer profile for current user
   */
  async getEmployerProfile(): Promise<Employer> {
    return apiGateway.get('/marketplace/employer/me')
  },

  /**
   * Create or update employer profile
   */
  async updateEmployerProfile(data: {
    company_name: string
    website?: string
    sector?: string
    country?: string
    logo_url?: string
    description?: string
  }): Promise<Employer> {
    return apiGateway.post('/marketplace/employer/me', data)
  },
}

