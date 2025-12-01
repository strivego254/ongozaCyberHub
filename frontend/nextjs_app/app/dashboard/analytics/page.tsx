'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-och-midnight p-6 flex items-center justify-center">
        <div className="text-och-steel">Loading analytics...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="p-6">
      <AnalyticsDashboard />
    </div>
  )
}

