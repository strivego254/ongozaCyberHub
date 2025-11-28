'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AnalyticsClient from './analytics-client'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { data, isLoading: analyticsLoading, error } = useAnalytics({ range: 'week' })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-och-midnight p-6 flex items-center justify-center">
        <div className="text-och-steel">Loading analytics...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-och-midnight p-6 flex items-center justify-center">
        <div className="text-och-orange">Error loading analytics: {error || 'No data available'}</div>
      </div>
    )
  }

  return <AnalyticsClient data={data} />
}

