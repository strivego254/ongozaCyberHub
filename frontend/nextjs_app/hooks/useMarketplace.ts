/**
 * useMarketplace Hook
 * Provides job recommendations and marketplace data for students
 */
import { useState, useEffect } from 'react'
import { marketplaceClient, type JobPosting, type JobApplication } from '@/services/marketplaceClient'

export interface JobRecommendation extends JobPosting {
  match_score: number
  has_applied: boolean
}

export function useMarketplace(menteeId?: string | null) {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!menteeId) {
      setIsLoading(false)
      return
    }

    loadRecommendations()
  }, [menteeId])

  const loadRecommendations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const jobs = await marketplaceClient.browseJobs()
      // Sort by match score descending
      const sorted = jobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
      setRecommendations(sorted as JobRecommendation[])
    } catch (err: any) {
      console.error('Failed to load job recommendations:', err)
      setError(err.message || 'Failed to load job recommendations')
      setRecommendations([])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    recommendations,
    isLoading,
    error,
    refetch: loadRecommendations,
  }
}

export function useJobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await marketplaceClient.getMyApplications()
      // Handle both array and paginated response
      const apps = Array.isArray(response) ? response : (response?.results || [])
      setApplications(apps)
    } catch (err: any) {
      console.error('Failed to load applications:', err)
      setError(err.message || 'Failed to load applications')
      setApplications([])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    applications,
    isLoading,
    error,
    refetch: loadApplications,
  }
}
