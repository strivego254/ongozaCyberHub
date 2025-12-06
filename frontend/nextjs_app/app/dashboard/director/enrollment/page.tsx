'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function EnrollmentPage() {
  // TODO: Replace with actual API data
  const pendingEnrollments = [
    { id: 1, studentName: 'John Doe', email: 'john@example.com', cohort: 'Cohort A', requestedAt: '2024-01-15' },
    { id: 2, studentName: 'Jane Smith', email: 'jane@example.com', cohort: 'Cohort B', requestedAt: '2024-01-14' },
  ]

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Enrollment & Placement</h1>
            <p className="text-och-steel">Approve enrollments, override placements, and manage seat allocation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Pending Approvals</p>
                <p className="text-2xl font-bold text-och-orange">{pendingEnrollments.length}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Total Enrollments</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Available Seats</p>
                <p className="text-2xl font-bold text-och-mint">0</p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Pending Enrollment Approvals</h2>
                <Badge variant="orange">{pendingEnrollments.length} Pending</Badge>
              </div>
              {pendingEnrollments.length > 0 ? (
                <div className="space-y-3">
                  {pendingEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{enrollment.studentName}</p>
                          <p className="text-sm text-och-steel">{enrollment.email}</p>
                          <p className="text-xs text-och-steel mt-1">Cohort: {enrollment.cohort}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="mint" size="sm">
                            Approve
                          </Button>
                          <Button variant="outline" size="sm">
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-och-steel">
                  <p>No pending enrollment approvals</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

