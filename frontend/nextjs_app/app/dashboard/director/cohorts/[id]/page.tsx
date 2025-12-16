'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useCohort, useCohortDashboard } from '@/hooks/usePrograms'
import { programsClient, type CalendarEvent, type Enrollment, type MentorAssignment } from '@/services/programsClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export default function CohortDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cohortId = params.id as string
  const { cohort, isLoading: loadingCohort, reload: reloadCohort } = useCohort(cohortId)
  const { dashboard, isLoading: loadingDashboard } = useCohortDashboard(cohortId)
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [mentors, setMentors] = useState<MentorAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Calculate derived values - moved before early returns to satisfy Rules of Hooks
  const activeEnrollments = enrollments.filter(e => e.status === 'active')
  const seatPool = (cohort as any)?.seat_pool || { paid: 0, scholarship: 0, sponsored: 0 }
  const seatUtilization = cohort?.seat_utilization || (activeEnrollments.length / (cohort?.seat_cap || 1) * 100)
  const completionRate = cohort?.completion_rate || 0

  // Prepare seat allocation data for pie chart - moved before early returns
  const seatAllocationData = useMemo(() => {
    if (!cohort) return []
    
    const paid = seatPool.paid || 0
    const scholarship = seatPool.scholarship || 0
    const sponsored = seatPool.sponsored || 0
    const total = paid + scholarship + sponsored
    const available = Math.max(0, (cohort.seat_cap || 0) - total)

    return [
      {
        name: 'Paid Seats',
        value: paid,
        color: '#10B981', // mint green
        percentage: total > 0 ? ((paid / total) * 100).toFixed(1) : '0'
      },
      {
        name: 'Scholarship Seats',
        value: scholarship,
        color: '#F59E0B', // gold/orange
        percentage: total > 0 ? ((scholarship / total) * 100).toFixed(1) : '0'
      },
      {
        name: 'Sponsored Seats',
        value: sponsored,
        color: '#3B82F6', // defender blue
        percentage: total > 0 ? ((sponsored / total) * 100).toFixed(1) : '0'
      },
      ...(available > 0 ? [{
        name: 'Available Seats',
        value: available,
        color: '#6B7280', // steel gray
        percentage: ((available / (cohort.seat_cap || 1)) * 100).toFixed(1)
      }] : [])
    ].filter(item => item.value > 0)
  }, [seatPool, cohort?.seat_cap, cohort])

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-och-mint text-sm">
            {data.value} seats ({data.payload.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Custom label for pie chart
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    )
  }

  useEffect(() => {
    const loadData = async () => {
      if (!cohortId) return
      setIsLoading(true)
      try {
        const [events, enrolls, mentorAssignments] = await Promise.all([
          programsClient.getCohortCalendar(cohortId),
          programsClient.getCohortEnrollments(cohortId),
          programsClient.getCohortMentors(cohortId),
        ])
        setCalendarEvents(events)
        setEnrollments(enrolls)
        setMentors(mentorAssignments)
      } catch (err) {
        console.error('Failed to load cohort data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [cohortId])

  if (loadingCohort || isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading cohort...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (!cohort) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-4">Cohort not found</p>
              <Link href="/dashboard/director/cohorts">
                <Button variant="outline">Back to Cohorts</Button>
              </Link>
            </div>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">{cohort.name}</h1>
                <div className="flex items-center gap-3">
                  <Badge variant="defender">{cohort.status}</Badge>
                  <span className="text-och-steel">{cohort.track_name}</span>
                  {cohort.start_date && (
                    <span className="text-och-steel">
                      {new Date(cohort.start_date).toLocaleDateString()} - {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'Ongoing'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Link href={`/dashboard/director/cohorts/${cohortId}/edit`}>
                  <Button variant="defender" size="sm">
                    Edit Cohort
                  </Button>
                </Link>
                <Link href="/dashboard/director/cohorts">
                  <Button variant="outline" size="sm">
                    ← Back
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Hero Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Seat Utilization</p>
                <p className="text-2xl font-bold text-white">{seatUtilization.toFixed(1)}%</p>
                <ProgressBar value={seatUtilization} variant="mint" className="mt-2" />
                <p className="text-xs text-och-steel mt-1">
                  {activeEnrollments.length} / {cohort.seat_cap} seats
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-white">{completionRate.toFixed(1)}%</p>
                <ProgressBar value={completionRate} variant="defender" className="mt-2" />
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Mentors Assigned</p>
                <p className="text-2xl font-bold text-white">{mentors.length}</p>
                <p className="text-xs text-och-steel mt-1">
                  Ratio: 1:{Math.round(1 / (cohort.mentor_ratio || 0.1))}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Upcoming Events</p>
                <p className="text-2xl font-bold text-white">
                  {calendarEvents.filter(e => new Date(e.start_ts) > new Date()).length}
                </p>
                <p className="text-xs text-och-steel mt-1">Next 30 days</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cohort Details */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Cohort Details</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-och-steel">Mode</span>
                      <span className="text-white capitalize">{cohort.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Start Date</span>
                      <span className="text-white">{cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">End Date</span>
                      <span className="text-white">{cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Seat Capacity</span>
                      <span className="text-white">{cohort.seat_cap}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Mentor Ratio</span>
                      <span className="text-white">1:{Math.round(1 / (cohort.mentor_ratio || 0.1))}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Seat Pool Breakdown */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Seat Allocation</h2>
                  
                  {seatAllocationData.length > 0 ? (
                    <>
                      <div className="mb-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={seatAllocationData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={CustomLabel}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {seatAllocationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              formatter={(value, entry: any) => (
                                <span className="text-och-steel text-sm">
                                  {value}: {entry.payload.value} seats ({entry.payload.percentage}%)
                                </span>
                              )}
                              iconType="circle"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-och-steel/20">
                        {seatAllocationData.map((item) => (
                          <div key={item.name} className="text-center">
                            <div 
                              className="w-3 h-3 rounded-full mx-auto mb-1"
                              style={{ backgroundColor: item.color }}
                            />
                            <p className="text-xs text-och-steel">{item.name}</p>
                            <p className="text-sm font-bold text-white">{item.value}</p>
                            <p className="text-xs text-och-steel">{item.percentage}%</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-och-steel/20">
                        <div className="flex justify-between text-sm">
                          <span className="text-och-steel">Total Allocated:</span>
                          <span className="text-white font-semibold">
                            {(seatPool.paid || 0) + (seatPool.scholarship || 0) + (seatPool.sponsored || 0)} / {cohort.seat_cap}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-och-steel">Available:</span>
                          <span className="text-white font-semibold">
                            {Math.max(0, (cohort.seat_cap || 0) - ((seatPool.paid || 0) + (seatPool.scholarship || 0) + (seatPool.sponsored || 0)))}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-och-steel">
                      <p>No seat allocation data available</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Enrollments */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Enrollments ({enrollments.length})</h2>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {enrollments.slice(0, 5).map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{enrollment.user_name || enrollment.user_email}</p>
                          <p className="text-xs text-och-steel">{enrollment.enrollment_type} • {enrollment.seat_type}</p>
                        </div>
                        <Badge variant={enrollment.status === 'active' ? 'mint' : 'orange'}>
                          {enrollment.status}
                        </Badge>
                      </div>
                    ))}
                    {enrollments.length > 5 && (
                      <p className="text-sm text-och-steel text-center pt-2">
                        +{enrollments.length - 5} more enrollments
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Calendar Events */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                    <Button variant="outline" size="sm">
                      View Calendar
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {calendarEvents
                      .filter(e => new Date(e.start_ts) > new Date())
                      .sort((a, b) => new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime())
                      .slice(0, 5)
                      .map((event) => (
                        <div key={event.id} className="p-3 bg-och-midnight/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-medium">{event.title}</p>
                              <p className="text-xs text-och-steel">
                                {new Date(event.start_ts).toLocaleString()} • {event.type}
                              </p>
                            </div>
                            <Badge variant="defender">{event.status}</Badge>
                          </div>
                        </div>
                      ))}
                    {calendarEvents.filter(e => new Date(e.start_ts) > new Date()).length === 0 && (
                      <p className="text-sm text-och-steel text-center py-4">No upcoming events</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Analytics & Actions */}
            <div className="space-y-6">
              {/* Analytics Summary */}
              {dashboard && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Analytics Summary</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-och-steel text-sm mb-1">Readiness Score</p>
                        <p className="text-2xl font-bold text-white">{dashboard.readiness_delta.toFixed(1)}%</p>
                        <ProgressBar value={dashboard.readiness_delta} variant="mint" className="mt-2" />
                      </div>
                      <div>
                        <p className="text-och-steel text-sm mb-1">Mentor Coverage</p>
                        <p className="text-2xl font-bold text-white">{dashboard.mentor_assignments_count}</p>
                      </div>
                      <div>
                        <p className="text-och-steel text-sm mb-1">Payments</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-och-steel">Complete</span>
                            <span className="text-white">{dashboard.payments_complete}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-och-steel">Pending</span>
                            <span className="text-och-orange">{dashboard.payments_pending}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Mentors */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Mentors ({mentors.length})</h2>
                    <Link href={`/dashboard/director/cohorts/${cohortId}/assign-mentors`}>
                      <Button variant="defender" size="sm">
                        Assign Mentors
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {mentors.map((mentor) => (
                      <div key={mentor.id} className="p-3 bg-och-midnight/50 rounded-lg">
                        <p className="text-white font-medium">{mentor.mentor_name || mentor.mentor_email}</p>
                        <p className="text-xs text-och-steel capitalize">{mentor.role}</p>
                      </div>
                    ))}
                    {mentors.length === 0 && (
                      <p className="text-sm text-och-steel text-center py-4">No mentors assigned</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      📊 Export Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      🎓 Auto-Graduate
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      📅 Manage Calendar
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      👥 Manage Enrollments
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      ⚙️ Program Rules
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

