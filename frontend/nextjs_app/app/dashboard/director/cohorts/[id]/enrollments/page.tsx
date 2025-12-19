'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCohort } from '@/hooks/usePrograms'
import { programsClient, type Enrollment } from '@/services/programsClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface WaitlistEntry {
  id: string
  user: string
  user_email?: string
  user_name?: string
  position: number
  seat_type: string
  enrollment_type: string
  added_at: string
  active: boolean
}

export default function CohortEnrollmentsPage() {
  const params = useParams()
  const router = useRouter()
  const cohortId = params.id as string
  const { cohort, isLoading: loadingCohort } = useCohort(cohortId)

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSeatType, setSelectedSeatType] = useState<string>('all')
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState<string>('all')
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showSeatPoolModal, setShowSeatPoolModal] = useState(false)
  const [seatPool, setSeatPool] = useState<{ paid: number; scholarship: number; sponsored: number }>({
    paid: 0,
    scholarship: 0,
    sponsored: 0,
  })

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!cohortId) return
      setIsLoading(true)
      setError(null)
      try {
        const [enrolls, waitlistData] = await Promise.all([
          programsClient.getCohortEnrollments(cohortId),
          programsClient.getCohortWaitlist(cohortId).catch(() => []),
        ])
        setEnrollments(enrolls)
        setWaitlist(waitlistData)
        
        // Load seat pool from cohort (if available)
        if (cohort && 'seat_pool' in cohort && cohort.seat_pool) {
          setSeatPool(cohort.seat_pool as any)
        }
      } catch (err: any) {
        console.error('Failed to load enrollment data:', err)
        setError(err?.message || 'Failed to load enrollment data')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [cohortId, cohort])

  // Filter enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      if (selectedStatus !== 'all' && e.status !== selectedStatus) return false
      if (selectedSeatType !== 'all' && e.seat_type !== selectedSeatType) return false
      if (selectedEnrollmentType !== 'all' && e.enrollment_type !== selectedEnrollmentType) return false
      return true
    })
  }, [enrollments, selectedStatus, selectedSeatType, selectedEnrollmentType])

  // Calculate statistics
  const stats = useMemo(() => {
    const active = enrollments.filter((e) => e.status === 'active').length
    const pending = enrollments.filter((e) => (e as any).status === 'pending_payment').length
    const withdrawn = enrollments.filter((e) => e.status === 'withdrawn').length
    const completed = enrollments.filter((e) => e.status === 'completed').length
    const seatUtilization = cohort ? (active / cohort.seat_cap) * 100 : 0
    const availableSeats = cohort ? Math.max(0, cohort.seat_cap - active) : 0

    return {
      active,
      pending,
      withdrawn,
      completed,
      total: enrollments.length,
      waitlist: waitlist.filter((w) => w.active).length,
      seatUtilization,
      availableSeats,
    }
  }, [enrollments, waitlist, cohort])

  // Handle enrollment approval
  const handleApproveEnrollment = async (enrollmentId: string) => {
    setIsProcessing(true)
    setError(null)
    try {
      const updated = await programsClient.approveEnrollment(cohortId, enrollmentId)
      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)))
    } catch (err: any) {
      setError(err?.message || 'Failed to approve enrollment')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (selectedEnrollments.size === 0) return
    setIsProcessing(true)
    setError(null)
    try {
      await programsClient.bulkApproveEnrollments(cohortId, Array.from(selectedEnrollments))
      // Reload enrollments
      const enrolls = await programsClient.getCohortEnrollments(cohortId)
      setEnrollments(enrolls)
      setSelectedEnrollments(new Set())
    } catch (err: any) {
      setError(err?.message || 'Failed to approve enrollments')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle status update
  const handleUpdateStatus = async (enrollmentId: string, status: string) => {
    setIsProcessing(true)
    setError(null)
    try {
      // If activating, use approve endpoint
      if (status === 'active') {
        const updated = await programsClient.approveEnrollment(cohortId, enrollmentId)
        setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)))
      } else {
        // For other status updates, reload enrollments and show message
        // TODO: Add backend endpoint for general enrollment status updates
        setError('Status update for non-active statuses requires backend endpoint. Please use approve for activation.')
        // Reload enrollments
        const enrolls = await programsClient.getCohortEnrollments(cohortId)
        setEnrollments(enrolls)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update enrollment status')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle promote from waitlist
  const handlePromoteFromWaitlist = async (count?: number) => {
    setIsProcessing(true)
    setError(null)
    try {
      await programsClient.promoteFromWaitlist(cohortId, count)
      // Reload data
      const [enrolls, waitlistData] = await Promise.all([
        programsClient.getCohortEnrollments(cohortId),
        programsClient.getCohortWaitlist(cohortId).catch(() => []),
      ])
      setEnrollments(enrolls)
      setWaitlist(waitlistData)
    } catch (err: any) {
      setError(err?.message || 'Failed to promote from waitlist')
    } finally {
      setIsProcessing(false)
    }
  }

  // Toggle selection
  const toggleSelection = (enrollmentId: string) => {
    const newSelected = new Set(selectedEnrollments)
    if (newSelected.has(enrollmentId)) {
      newSelected.delete(enrollmentId)
    } else {
      newSelected.add(enrollmentId)
    }
    setSelectedEnrollments(newSelected)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange' | 'steel' | 'gold'> = {
      active: 'mint',
      pending_payment: 'orange',
      suspended: 'orange',
      withdrawn: 'steel',
      completed: 'mint',
      incomplete: 'orange',
    }
    return variants[status] || 'steel'
  }

  const getSeatTypeBadge = (seatType: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange' | 'gold'> = {
      paid: 'mint',
      scholarship: 'gold',
      sponsored: 'defender',
    }
    return variants[seatType] || 'steel'
  }

  if (loadingCohort || isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading enrollments...</p>
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Manage Enrollments</h1>
                <p className="text-och-steel">{cohort.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="defender">{cohort.status}</Badge>
                  <span className="text-sm text-och-steel">
                    {cohort.track_name} • {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href={`/dashboard/director/enrollments/assign?cohort=${cohortId}`}>
                  <Button variant="defender" size="sm">
                    Assign Students
                  </Button>
                </Link>
                <Link href={`/dashboard/director/cohorts/${cohortId}`}>
                  <Button variant="outline" size="sm">
                    ← Back to Cohort
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-och-orange/50">
              <div className="p-4 text-och-orange">{error}</div>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Active Enrollments</p>
                <p className="text-2xl font-bold text-och-mint">{stats.active}</p>
                <p className="text-xs text-och-steel mt-1">
                  {stats.seatUtilization.toFixed(1)}% utilization
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Pending Payment</p>
                <p className="text-2xl font-bold text-och-orange">{stats.pending}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Waitlist</p>
                <p className="text-2xl font-bold text-white">{stats.waitlist}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Available Seats</p>
                <p className="text-2xl font-bold text-och-mint">{stats.availableSeats}</p>
                <p className="text-xs text-och-steel mt-1">of {cohort.seat_cap} total</p>
              </div>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div>
                  <label className="text-sm text-och-steel mb-1 block">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-och-midnight border border-och-steel/20 rounded px-3 py-2 text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-och-steel mb-1 block">Seat Type</label>
                  <select
                    value={selectedSeatType}
                    onChange={(e) => setSelectedSeatType(e.target.value)}
                    className="bg-och-midnight border border-och-steel/20 rounded px-3 py-2 text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="paid">Paid</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="sponsored">Sponsored</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-och-steel mb-1 block">Enrollment Type</label>
                  <select
                    value={selectedEnrollmentType}
                    onChange={(e) => setSelectedEnrollmentType(e.target.value)}
                    className="bg-och-midnight border border-och-steel/20 rounded px-3 py-2 text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="self">Self-enroll</option>
                    <option value="sponsor">Sponsor</option>
                    <option value="invite">Invite</option>
                    <option value="director">Director Assign</option>
                  </select>
                </div>
                <div className="flex-1"></div>
                {selectedEnrollments.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={isProcessing}
                    >
                      Approve Selected ({selectedEnrollments.size})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEnrollments(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </div>

              {/* Seat Pool Summary */}
              <div className="pt-4 border-t border-och-steel/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">Seat Pool Allocation</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSeatPoolModal(true)}
                  >
                    Manage Seat Pool
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-och-steel">Paid:</span>
                    <span className="text-white ml-2 font-medium">{seatPool.paid}</span>
                  </div>
                  <div>
                    <span className="text-och-steel">Scholarship:</span>
                    <span className="text-white ml-2 font-medium">{seatPool.scholarship}</span>
                  </div>
                  <div>
                    <span className="text-och-steel">Sponsored:</span>
                    <span className="text-white ml-2 font-medium">{seatPool.sponsored}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Enrollments Table */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Enrollments ({filteredEnrollments.length})
                </h2>
                <Link href={`/dashboard/director/enrollments/assign?cohort=${cohortId}`}>
                  <Button variant="defender" size="sm">
                    + Assign Student
                  </Button>
                </Link>
              </div>

              {filteredEnrollments.length === 0 ? (
                <div className="text-center py-12 text-och-steel">
                  <p>No enrollments found matching the selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left py-3 px-4 text-sm text-och-steel">
                          <input
                            type="checkbox"
                            checked={selectedEnrollments.size === filteredEnrollments.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEnrollments(new Set(filteredEnrollments.map((e) => e.id)))
                              } else {
                                setSelectedEnrollments(new Set())
                              }
                            }}
                          />
                        </th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Student</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Status</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Seat Type</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Enrollment Type</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Payment</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Joined</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnrollments.map((enrollment) => (
                        <tr
                          key={enrollment.id}
                          className="border-b border-och-steel/10 hover:bg-och-midnight/50"
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedEnrollments.has(enrollment.id)}
                              onChange={() => toggleSelection(enrollment.id)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-white font-medium">
                                {enrollment.user_name || enrollment.user_email || enrollment.user}
                              </p>
                              {enrollment.user_email && enrollment.user_name && (
                                <p className="text-xs text-och-steel">{enrollment.user_email}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getStatusBadge(enrollment.status)}>
                              {enrollment.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getSeatTypeBadge(enrollment.seat_type)}>
                              {enrollment.seat_type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-och-steel capitalize">
                            {enrollment.enrollment_type.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                enrollment.payment_status === 'paid'
                                  ? 'mint'
                                  : enrollment.payment_status === 'waived'
                                  ? 'gold'
                                  : 'orange'
                              }
                            >
                              {enrollment.payment_status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-och-steel">
                            {new Date(enrollment.joined_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {(enrollment as any).status === 'pending_payment' && (
                                <Button
                                  variant="mint"
                                  size="sm"
                                  onClick={() => handleApproveEnrollment(enrollment.id)}
                                  disabled={isProcessing}
                                >
                                  Approve
                                </Button>
                              )}
                              <select
                                value={enrollment.status}
                                onChange={(e) => handleUpdateStatus(enrollment.id, e.target.value)}
                                className="bg-och-midnight border border-och-steel/20 rounded px-2 py-1 text-xs text-white"
                                disabled={isProcessing}
                              >
                                <option value="active">Active</option>
                                <option value="pending_payment">Pending Payment</option>
                                <option value="suspended">Suspended</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Waitlist */}
          {waitlist.filter((w) => w.active).length > 0 && (
            <Card className="mt-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Waitlist ({waitlist.filter((w) => w.active).length})
                  </h2>
                  {stats.availableSeats > 0 && (
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={() => handlePromoteFromWaitlist(stats.availableSeats)}
                      disabled={isProcessing}
                    >
                      Promote All Available ({stats.availableSeats})
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {waitlist
                    .filter((w) => w.active)
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-och-mint font-bold w-8">#{entry.position}</span>
                          <div>
                            <p className="text-white font-medium">
                              {entry.user_name || entry.user_email || entry.user}
                            </p>
                            <p className="text-xs text-och-steel">
                              {entry.seat_type} • {entry.enrollment_type} • Added{' '}
                              {new Date(entry.added_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {stats.availableSeats > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromoteFromWaitlist(1)}
                            disabled={isProcessing}
                          >
                            Promote
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
