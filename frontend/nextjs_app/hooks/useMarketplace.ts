'use client'

import { useState, useEffect, useCallback } from 'react'
import { marketplaceClient } from '@/services/marketplaceClient'
import type { JobListing, Application, EmployerInterest } from '@/services/types/marketplace'

export function useMarketplace(menteeId: string | undefined) {
  const [recommendations, setRecommendations] = useState<JobListing[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [employerInterest, setEmployerInterest] = useState<EmployerInterest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!menteeId) return

    setIsLoading(true)
    setError(null)

    try {
      const [recs, apps, interest] = await Promise.all([
        marketplaceClient.getRecommendations(menteeId),
        marketplaceClient.getApplications(menteeId),
        marketplaceClient.getEmployerInterest(menteeId),
      ])

      setRecommendations(recs)
      setApplications(apps)
      setEmployerInterest(interest)
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace data')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  const submitApplication = useCallback(async (data: {
    job_id: string
    portfolio_item_ids: string[]
    cover_letter?: string
  }) => {
    if (!menteeId) return

    try {
      const application = await marketplaceClient.submitApplication(menteeId, data)
      setApplications(prev => [...prev, application])
      return application
    } catch (err: any) {
      throw new Error(err.message || 'Failed to submit application')
    }
  }, [menteeId])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    recommendations,
    applications,
    employerInterest,
    isLoading,
    error,
    reload: loadData,
    submitApplication,
  }
}

