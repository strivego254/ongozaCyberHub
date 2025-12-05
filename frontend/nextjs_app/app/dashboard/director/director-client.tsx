'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DirectorSidebar } from '@/components/dashboard/DirectorSidebar'
import { ActionCenter } from '@/components/dashboard/ActionCenter'
import { CreateProgramView } from '@/components/dashboard/CreateProgramView'
import { ViewProgramsView } from '@/components/dashboard/ViewProgramsView'
import { DirectorAnalytics } from '@/components/dashboard/DirectorAnalytics'
import {
  useDirectorDashboard,
  useCohorts,
  usePrograms,
} from '@/hooks/usePrograms'
import type { DirectorAlert } from '@/services/programsClient'

type ViewType = 'dashboard' | 'create-program' | 'view-programs' | 'cohorts' | 'analytics'

export default function DirectorClient() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const { dashboard, isLoading, error, reload } = useDirectorDashboard()
  const { cohorts } = useCohorts()
  const { programs } = usePrograms()

  // Mock data for pending requests and reviews (replace with actual API calls)
  const [pendingRequests, setPendingRequests] = useState<
    Array<{
      id: string
      type: 'enrollment' | 'mentor_assignment' | 'cohort_placement'
      title: string
      description: string
      cohortName?: string
      userName?: string
      timestamp: string
      onApprove?: () => void
      onReject?: () => void
    }>
  >([])

  const [reviews, setReviews] = useState<
    Array<{
      id: string
      type: 'cohort_placement' | 'enrollment_review'
      title: string
      description: string
      cohortName: string
      count: number
      timestamp: string
      onReview?: () => void
    }>
  >([])

  // Load pending requests and reviews (mock for now - replace with actual API)
  useEffect(() => {
    // Simulate loading pending requests
    const mockRequests = [
      {
        id: '1',
        type: 'enrollment' as const,
        title: 'Enrollment Request',
        description: 'New student enrollment request pending approval',
        cohortName: cohorts?.[0]?.name || 'Cohort A',
        userName: 'John Doe',
        timestamp: new Date().toISOString(),
        onApprove: () => {
          console.log('Approving enrollment')
          setPendingRequests((prev) => prev.filter((r) => r.id !== '1'))
        },
        onReject: () => {
          console.log('Rejecting enrollment')
          setPendingRequests((prev) => prev.filter((r) => r.id !== '1'))
        },
      },
      {
        id: '2',
        type: 'cohort_placement' as const,
        title: 'Cohort Placement Review',
        description: 'Review required for student cohort placement',
        cohortName: cohorts?.[1]?.name || 'Cohort B',
        userName: 'Jane Smith',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        onApprove: () => {
          console.log('Approving placement')
          setPendingRequests((prev) => prev.filter((r) => r.id !== '2'))
        },
        onReject: () => {
          console.log('Rejecting placement')
          setPendingRequests((prev) => prev.filter((r) => r.id !== '2'))
        },
      },
    ]

    const mockReviews = [
      {
        id: '1',
        type: 'cohort_placement' as const,
        title: 'Cohort Placement Reviews',
        description: 'Multiple cohort placement reviews pending',
        cohortName: cohorts?.[0]?.name || 'Cohort A',
        count: 5,
        timestamp: new Date().toISOString(),
        onReview: () => {
          console.log('Opening review panel')
          setActiveView('cohorts')
        },
      },
    ]

    setPendingRequests(mockRequests)
    setReviews(mockReviews)
  }, [cohorts])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-center">
          <p className="text-och-steel text-lg">Loading director dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-och-midnight p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-och-orange mb-4">Error loading dashboard: {error}</p>
            <Button onClick={reload} variant="outline">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const { hero_metrics, alerts, cohort_table } = dashboard

  // Render main content based on active view
  const renderMainContent = () => {
    switch (activeView) {
      case 'create-program':
        return <CreateProgramView />
      case 'view-programs':
        return <ViewProgramsView />
      case 'analytics':
        return <DirectorAnalytics />
      case 'cohorts':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Cohorts Management</h2>
              <p className="text-och-steel">View and manage all cohorts</p>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">
                        Cohort
                      </th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">
                        Status
                      </th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">
                        Seats
                      </th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">
                        Readiness
                      </th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">
                        Completion
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohort_table.map((cohort) => (
                      <tr
                        key={cohort.id}
                        className="border-b border-och-steel/10 hover:bg-och-midnight/50 transition-colors"
                      >
                        <td className="p-3">
                          <div>
                            <p className="text-white font-semibold">{cohort.name}</p>
                            <p className="text-xs text-och-steel">
                              {cohort.program_name} • {cohort.track_name}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              cohort.status === 'running'
                                ? 'bg-och-mint/20 text-och-mint'
                                : cohort.status === 'active'
                                ? 'bg-och-defender/20 text-och-defender'
                                : 'bg-och-orange/20 text-och-orange'
                            }`}
                          >
                            {cohort.status}
                          </span>
                        </td>
                        <td className="p-3 text-white text-sm">
                          {cohort.seats_used}/{cohort.seats_total}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-sm font-semibold ${
                              cohort.readiness_delta > 0 ? 'text-och-mint' : 'text-och-orange'
                            }`}
                          >
                            {cohort.readiness_delta > 0 ? '+' : ''}
                            {cohort.readiness_delta.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-white text-sm">{cohort.completion_rate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cohort_table.length === 0 && (
                  <div className="p-8 text-center text-och-steel">
                    No cohorts found
                  </div>
                )}
              </div>
            </Card>
          </div>
        )
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-mint">
                Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
              </h1>
              <p className="text-och-steel">Command center for programs, cohorts, and outcomes</p>
            </div>

            {/* Hero Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card gradient="leadership" className="col-span-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-och-steel text-sm mb-1">Active Programs</p>
                    <p className="text-3xl font-bold text-white">{hero_metrics.active_programs}</p>
                  </div>
                </div>
              </Card>

              <Card gradient="leadership">
                <div>
                  <p className="text-och-steel text-sm mb-1">Active Cohorts</p>
                  <p className="text-3xl font-bold text-white">{hero_metrics.active_cohorts}</p>
                </div>
              </Card>

              <Card gradient="leadership">
                <div>
                  <p className="text-och-steel text-sm mb-1">Seat Utilization</p>
                  <p className="text-3xl font-bold text-white">
                    {hero_metrics.seat_utilization}%
                  </p>
                </div>
              </Card>

              <Card gradient="leadership">
                <div>
                  <p className="text-och-steel text-sm mb-1">Avg Readiness</p>
                  <p className="text-3xl font-bold text-white">{hero_metrics.avg_readiness}%</p>
                </div>
              </Card>

              <Card gradient="leadership">
                <div>
                  <p className="text-och-steel text-sm mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-white">
                    {hero_metrics.avg_completion_rate}%
                  </p>
                </div>
              </Card>
            </div>

            {/* Action Center - Notifications, Requests, Reviews */}
            <ActionCenter
              alerts={alerts}
              pendingRequests={pendingRequests}
              reviews={reviews}
            />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight flex">
      {/* Sidebar */}
      <DirectorSidebar
        activeView={activeView}
        onViewChange={(view) => setActiveView(view as ViewType)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{renderMainContent()}</div>
      </div>
    </div>
  )
}
