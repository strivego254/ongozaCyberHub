'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useDirectorDashboard } from '@/hooks/usePrograms'

export default function AnalyticsPage() {
  const { dashboard, isLoading } = useDirectorDashboard()

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading analytics...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-defender">Analytics & Reports</h1>
              <p className="text-och-steel">Track performance, view reports, and export data</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                Export JSON
              </Button>
            </div>
          </div>

          {dashboard && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Active Programs</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboard.hero_metrics.active_programs}
                    </p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Active Cohorts</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboard.hero_metrics.active_cohorts}
                    </p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Seat Utilization</p>
                    <p className="text-2xl font-bold text-och-mint">
                      {dashboard.hero_metrics.seat_utilization}%
                    </p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Completion Rate</p>
                    <p className="text-2xl font-bold text-och-defender">
                      {dashboard.hero_metrics.avg_completion_rate}%
                    </p>
                  </div>
                </Card>
              </div>

              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Cohort Analytics</h2>
                  {dashboard.cohort_table && dashboard.cohort_table.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-och-steel/20">
                            <th className="text-left p-3 text-och-steel text-sm font-semibold">Cohort</th>
                            <th className="text-left p-3 text-och-steel text-sm font-semibold">Program</th>
                            <th className="text-left p-3 text-och-steel text-sm font-semibold">Seats</th>
                            <th className="text-left p-3 text-och-steel text-sm font-semibold">Readiness</th>
                            <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.cohort_table.map((cohort: any) => (
                            <tr key={cohort.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                              <td className="p-3 text-white font-semibold">{cohort.name}</td>
                              <td className="p-3 text-och-steel text-sm">{cohort.program_name}</td>
                              <td className="p-3 text-och-steel text-sm">
                                {cohort.seats_used}/{cohort.seats_total}
                              </td>
                              <td className="p-3">
                                <Badge variant="defender">{cohort.readiness || 'N/A'}%</Badge>
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    cohort.status === 'running'
                                      ? 'mint'
                                      : cohort.status === 'active'
                                      ? 'defender'
                                      : 'orange'
                                  }
                                >
                                  {cohort.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-och-steel">
                      <p>No cohort data available</p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

