'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useCohorts, useTracks, usePrograms } from '@/hooks/usePrograms'
import { programsClient, type Cohort, type Track, type MentorAssignment, type Milestone, type Module, type Enrollment } from '@/services/programsClient'
import { mentorClient } from '@/services/mentorClient'
import type { MenteeFlag } from '@/services/types/mentor'

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

interface AssignmentWithDetails {
  assignment: MentorAssignment
  cohort: Cohort
  track: Track | null
  program: { id: string; name: string } | null
  milestones: Milestone[]
  modules: Module[]
}

export default function MentorCohortsTracksPage() {
  const { user } = useAuth()
  const router = useRouter()
  const mentorId = user?.id?.toString()
  
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 500 })
  const { tracks, isLoading: tracksLoading } = useTracks()
  const { programs, isLoading: programsLoading } = usePrograms()
  
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCohorts, setExpandedCohorts] = useState<Set<string>>(new Set())
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set())
  const [trackDetails, setTrackDetails] = useState<Record<string, { milestones: Milestone[]; modules: Module[] }>>({})
  const [cohortEnrollments, setCohortEnrollments] = useState<Record<string, { enrollments: Enrollment[]; loading: boolean }>>({})
  const [selectedMentees, setSelectedMentees] = useState<Set<string>>(new Set())
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagFormData, setFlagFormData] = useState({
    flag_type: 'needs_attention' as 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
  })
  const [submittingFlag, setSubmittingFlag] = useState(false)
  const [flagError, setFlagError] = useState<string | null>(null)

  // Load mentor assignments
  useEffect(() => {
    const loadAssignments = async () => {
      if (!mentorId || cohortsLoading || cohorts.length === 0) return

      setIsLoading(true)
      setError(null)

      try {
        const mentorAssignments: AssignmentWithDetails[] = []

        // Fetch assignments from each cohort
        for (const cohort of cohorts) {
          try {
            const cohortAssignments = await programsClient.getCohortMentors(String(cohort.id))
            const mentorAssignment = cohortAssignments.find(
              (assignment: MentorAssignment) => 
                String(assignment.mentor) === String(mentorId) && assignment.active
            )

            if (mentorAssignment) {
              // Get track and program details
              const track = tracks.find(t => String(t.id) === String(cohort.track))
              const program = track?.program 
                ? programs.find(p => String(p.id) === String(track.program))
                : null

              mentorAssignments.push({
                assignment: mentorAssignment,
                cohort,
                track: track || null,
                program: program ? { id: program.id || '', name: program.name } : null,
                milestones: [],
                modules: [],
              })
            }
          } catch (err) {
            console.error(`Failed to load assignments for cohort ${cohort.id}:`, err)
          }
        }

        setAssignments(mentorAssignments)
      } catch (err: any) {
        console.error('Failed to load mentor assignments:', err)
        setError(err?.message || 'Failed to load assigned cohorts and tracks')
      } finally {
        setIsLoading(false)
      }
    }

    loadAssignments()
  }, [mentorId, cohorts, cohortsLoading, tracks, tracksLoading, programs, programsLoading])

  // Load track details when expanded
  const loadTrackDetails = async (trackId: string) => {
    if (trackDetails[trackId]) return // Already loaded

    try {
      const [milestones, allModules] = await Promise.all([
        programsClient.getMilestones(trackId),
        programsClient.getModules(undefined, trackId),
      ])

      // Load modules for each milestone
      const modulesByMilestone: Record<string, Module[]> = {}
      for (const milestone of milestones) {
        if (milestone.id) {
          try {
            const milestoneModules = await programsClient.getModules(milestone.id)
            modulesByMilestone[milestone.id] = milestoneModules.sort((a, b) => (a.order || 0) - (b.order || 0))
          } catch (err) {
            console.error(`Failed to load modules for milestone ${milestone.id}:`, err)
            modulesByMilestone[milestone.id] = []
          }
        }
      }

      // Combine all modules
      const allModulesList = Object.values(modulesByMilestone).flat()
      const uniqueModules = Array.from(
        new Map(allModulesList.map(m => [m.id, m])).values()
      )

      setTrackDetails(prev => ({
        ...prev,
        [trackId]: {
          milestones: milestones.sort((a, b) => (a.order || 0) - (b.order || 0)),
          modules: uniqueModules.sort((a, b) => (a.order || 0) - (b.order || 0)),
        },
      }))
    } catch (err) {
      console.error(`Failed to load track details for ${trackId}:`, err)
    }
  }

  // Load enrollments for a cohort
  const loadCohortEnrollments = async (cohortId: string) => {
    if (cohortEnrollments[cohortId]) return // Already loaded

    setCohortEnrollments(prev => ({
      ...prev,
      [cohortId]: { enrollments: [], loading: true },
    }))

    try {
      const enrollments = await programsClient.getCohortEnrollments(cohortId)
      setCohortEnrollments(prev => ({
        ...prev,
        [cohortId]: { enrollments, loading: false },
      }))
    } catch (err) {
      console.error(`Failed to load enrollments for cohort ${cohortId}:`, err)
      setCohortEnrollments(prev => ({
        ...prev,
        [cohortId]: { enrollments: [], loading: false },
      }))
    }
  }

  const toggleCohort = (cohortId: string) => {
    const newExpanded = new Set(expandedCohorts)
    if (newExpanded.has(cohortId)) {
      newExpanded.delete(cohortId)
    } else {
      newExpanded.add(cohortId)
      // Load enrollments when expanding
      loadCohortEnrollments(cohortId)
    }
    setExpandedCohorts(newExpanded)
  }

  const toggleTrack = (trackId: string, assignment: AssignmentWithDetails) => {
    const newExpanded = new Set(expandedTracks)
    if (newExpanded.has(trackId)) {
      newExpanded.delete(trackId)
    } else {
      newExpanded.add(trackId)
      // Load track details when expanding
      loadTrackDetails(trackId)
    }
    setExpandedTracks(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange' | 'steel'> = {
      active: 'mint',
      running: 'mint',
      draft: 'steel',
      closing: 'orange',
      closed: 'steel',
    }
    return variants[status] || 'steel'
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange'> = {
      primary: 'defender',
      support: 'mint',
      guest: 'orange',
    }
    return variants[role] || 'steel'
  }

  const getEnrollmentStatusBadge = (status: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange' | 'steel'> = {
      active: 'mint',
      completed: 'mint',
      withdrawn: 'steel',
      incomplete: 'orange',
      pending_payment: 'orange',
      suspended: 'orange',
    }
    return variants[status] || 'steel'
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'mint' | 'orange' | 'gold'> = {
      paid: 'mint',
      waived: 'gold',
      pending: 'orange',
    }
    return variants[status] || 'orange'
  }

  const getSeatTypeBadge = (seatType: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'gold'> = {
      paid: 'mint',
      scholarship: 'gold',
      sponsored: 'defender',
    }
    return variants[seatType] || 'steel'
  }

  const toggleMenteeSelection = (enrollmentId: string) => {
    const newSelected = new Set(selectedMentees)
    if (newSelected.has(enrollmentId)) {
      newSelected.delete(enrollmentId)
    } else {
      newSelected.add(enrollmentId)
    }
    setSelectedMentees(newSelected)
  }

  const selectAllMentees = (cohortId: string) => {
    const enrollmentData = cohortEnrollments[cohortId]
    if (!enrollmentData) return
    
    const activeEnrollments = enrollmentData.enrollments.filter(
      (e) => e.status === 'active' || e.status === 'completed'
    )
    const allIds = new Set(activeEnrollments.map(e => e.user || e.id))
    setSelectedMentees(new Set([...selectedMentees, ...allIds]))
  }

  const deselectAllMentees = (cohortId: string) => {
    const enrollmentData = cohortEnrollments[cohortId]
    if (!enrollmentData) return
    
    const activeEnrollments = enrollmentData.enrollments.filter(
      (e) => e.status === 'active' || e.status === 'completed'
    )
    const activeIds = new Set(activeEnrollments.map(e => e.user || e.id))
    const newSelected = new Set(selectedMentees)
    activeIds.forEach(id => newSelected.delete(id))
    setSelectedMentees(newSelected)
  }

  const handleRaiseFlag = async () => {
    if (!mentorId || selectedMentees.size === 0 || !flagFormData.description.trim()) {
      setFlagError('Please select at least one mentee and provide a description')
      return
    }

    setSubmittingFlag(true)
    setFlagError(null)

    try {
      const promises = Array.from(selectedMentees).map(async (menteeId) => {
        await mentorClient.flagMentee(mentorId, {
          mentee_id: String(menteeId),
          flag_type: flagFormData.flag_type,
          severity: flagFormData.severity,
          description: flagFormData.description.trim(),
        })
      })

      await Promise.all(promises)

      // Reset form and close modal
      setFlagFormData({
        flag_type: 'needs_attention',
        severity: 'medium',
        description: '',
      })
      setShowFlagModal(false)
      setSelectedMentees(new Set())
    } catch (err: any) {
      console.error('Failed to raise flag:', err)
      setFlagError(err?.message || 'Failed to raise flag. Please try again.')
    } finally {
      setSubmittingFlag(false)
    }
  }

  const getMenteeId = (enrollment: Enrollment): string => {
    return enrollment.user || enrollment.id || ''
  }

  const viewMenteeAnalytics = (menteeId: string) => {
    router.push(`/dashboard/mentor/analytics/${menteeId}`)
  }

  if (isLoading || cohortsLoading || tracksLoading || programsLoading) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <div className="text-center py-12">
            <div className="text-och-steel">Loading your assigned cohorts and tracks...</div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  if (error) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <Card className="p-6">
            <div className="text-och-orange">Error: {error}</div>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Assigned Cohorts & Tracks</h1>
          <p className="text-och-steel">
            View your assigned cohorts, tracks, and curriculum structure in read-only mode.
          </p>
        </div>

        {assignments.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-och-steel mb-4">No assigned cohorts found.</p>
              <p className="text-sm text-och-steel">Contact your Program Director if you believe this is an error.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const { cohort, track, program, assignment: mentorAssignment } = assignment
              const isCohortExpanded = expandedCohorts.has(cohort.id)
              const isTrackExpanded = track ? expandedTracks.has(track.id) : false
              const details = track ? trackDetails[track.id] : null

              return (
                <Card key={cohort.id} className="overflow-hidden">
                  {/* Cohort Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-och-midnight/50 transition-colors"
                    onClick={() => toggleCohort(cohort.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {isCohortExpanded ? (
                          <ChevronDownIcon className="w-5 h-5 text-och-mint" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-och-steel" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-white">{cohort.name}</h2>
                            <Badge variant={getStatusBadge(cohort.status)}>
                              {cohort.status}
                            </Badge>
                            <Badge variant={getRoleBadge(mentorAssignment.role)}>
                              {mentorAssignment.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-och-steel">
                            <span>
                              {new Date(cohort.start_date).toLocaleDateString()} - {new Date(cohort.end_date).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{cohort.mode}</span>
                            <span>•</span>
                            <span>{cohort.enrolled_count || 0} enrolled</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cohort Details */}
                  {isCohortExpanded && (
                    <div className="px-6 pb-6 space-y-4 border-t border-och-steel/20">
                      {/* Enrolled Students Section */}
                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">Enrolled Students</h3>
                          {(() => {
                            const enrollmentData = cohortEnrollments[cohort.id]
                            if (!enrollmentData || enrollmentData.loading) return null
                            const activeEnrollments = enrollmentData.enrollments.filter(
                              (e) => e.status === 'active' || e.status === 'completed'
                            )
                            if (activeEnrollments.length === 0) return null
                            const activeIds = new Set(activeEnrollments.map(e => getMenteeId(e)))
                            const allSelected = activeIds.size > 0 && Array.from(activeIds).every(id => selectedMentees.has(id))
                            return (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => allSelected ? deselectAllMentees(cohort.id) : selectAllMentees(cohort.id)}
                                >
                                  {allSelected ? 'Deselect All' : 'Select All'}
                                </Button>
                                {selectedMentees.size > 0 && (
                                  <Button
                                    variant="defender"
                                    size="sm"
                                    onClick={() => setShowFlagModal(true)}
                                  >
                                    Raise Flag ({selectedMentees.size})
                                  </Button>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                        {(() => {
                          const enrollmentData = cohortEnrollments[cohort.id]
                          if (!enrollmentData) {
                            return (
                              <div className="text-sm text-och-steel">Loading students...</div>
                            )
                          }
                          if (enrollmentData.loading) {
                            return (
                              <div className="text-sm text-och-steel">Loading students...</div>
                            )
                          }
                          const activeEnrollments = enrollmentData.enrollments.filter(
                            (e) => e.status === 'active' || e.status === 'completed'
                          )
                          if (activeEnrollments.length === 0) {
                            return (
                              <div className="text-sm text-och-steel">No active students enrolled in this cohort.</div>
                            )
                          }
                          return (
                            <div className="space-y-3">
                              {activeEnrollments.map((enrollment) => {
                                const menteeId = getMenteeId(enrollment)
                                const isSelected = selectedMentees.has(menteeId)
                                return (
                                  <div
                                    key={enrollment.id}
                                    className={`p-4 bg-och-midnight/50 rounded-lg border ${
                                      isSelected ? 'border-och-mint/50 bg-och-mint/10' : 'border-och-steel/20'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleMenteeSelection(menteeId)}
                                        className="mt-1 w-4 h-4 text-och-mint bg-och-midnight border-och-steel/30 rounded focus:ring-och-mint focus:ring-2"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <div>
                                            <p className="text-white font-medium">
                                              {enrollment.user_name || enrollment.user_email || enrollment.user}
                                            </p>
                                            {enrollment.user_email && enrollment.user_name && (
                                              <p className="text-xs text-och-steel mt-1">{enrollment.user_email}</p>
                                            )}
                                          </div>
                                          <Badge variant={getEnrollmentStatusBadge(enrollment.status)}>
                                            {enrollment.status.replace('_', ' ')}
                                          </Badge>
                                          <Badge variant={getSeatTypeBadge(enrollment.seat_type)}>
                                            {enrollment.seat_type}
                                          </Badge>
                                          <Badge variant={getPaymentStatusBadge(enrollment.payment_status)}>
                                            {enrollment.payment_status}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-och-steel mt-2">
                                          <span>
                                            Joined: {new Date(enrollment.joined_at).toLocaleDateString()}
                                          </span>
                                          {enrollment.completed_at && (
                                            <>
                                              <span>•</span>
                                              <span>
                                                Completed: {new Date(enrollment.completed_at).toLocaleDateString()}
                                              </span>
                                            </>
                                          )}
                                          <span>•</span>
                                          <span className="capitalize">{enrollment.enrollment_type}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => viewMenteeAnalytics(menteeId)}
                                        >
                                          View Analytics
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Program & Track Info */}
                      {program && (
                        <div className="pt-4 border-t border-och-steel/20">
                          <div className="mb-2 text-sm text-och-steel">Program</div>
                          <div className="text-white font-medium">{program.name}</div>
                        </div>
                      )}

                      {track ? (
                        <div>
                          <div
                            className="flex items-center justify-between p-4 bg-och-midnight/50 rounded-lg cursor-pointer hover:bg-och-midnight/70 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleTrack(track.id!, assignment)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {isTrackExpanded ? (
                                <ChevronDownIcon className="w-5 h-5 text-och-mint" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5 text-och-steel" />
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-white">{track.name}</h3>
                                <p className="text-sm text-och-steel mt-1">{track.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">{track.track_type}</Badge>
                                  {track.key && (
                                    <Badge variant="outline">{track.key}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Track Content (Milestones & Modules) */}
                          {isTrackExpanded && details && (
                            <div className="mt-4 ml-8 space-y-4">
                              {/* Milestones */}
                              {details.milestones.length > 0 ? (
                                <div>
                                  <h4 className="text-md font-semibold text-white mb-3">
                                    Milestones ({details.milestones.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {details.milestones.map((milestone) => {
                                      const milestoneModules = details.modules.filter(
                                        m => m.milestone === milestone.id
                                      )
                                      return (
                                        <div
                                          key={milestone.id}
                                          className="p-4 bg-och-midnight/30 rounded-lg border border-och-steel/20"
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <div>
                                              <h5 className="text-white font-medium">
                                                {milestone.order}. {milestone.name}
                                              </h5>
                                              {milestone.description && (
                                                <p className="text-sm text-och-steel mt-1">
                                                  {milestone.description}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {milestone.duration_weeks && (
                                                <Badge variant="outline" className="text-xs">
                                                  {milestone.duration_weeks} weeks
                                                </Badge>
                                              )}
                                              <Badge variant="outline" className="text-xs">
                                                Order: {milestone.order}
                                              </Badge>
                                            </div>
                                          </div>

                                          {/* Modules in this milestone */}
                                          {milestoneModules.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-och-steel/20">
                                              <div className="text-xs text-och-steel mb-2">
                                                Modules ({milestoneModules.length})
                                              </div>
                                              <div className="space-y-2">
                                                {milestoneModules.map((module) => (
                                                  <div
                                                    key={module.id}
                                                    className="p-3 bg-och-midnight/50 rounded text-sm"
                                                  >
                                                    <div className="flex items-center justify-between">
                                                      <div>
                                                        <div className="text-white font-medium">
                                                          {module.order}. {module.name}
                                                        </div>
                                                        {module.description && (
                                                          <div className="text-xs text-och-steel mt-1">
                                                            {module.description}
                                                          </div>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                          {module.content_type}
                                                        </Badge>
                                                        {module.estimated_hours && (
                                                          <Badge variant="outline" className="text-xs">
                                                            {module.estimated_hours}h
                                                          </Badge>
                                                        )}
                                                      </div>
                                                    </div>
                                                    {module.skills && module.skills.length > 0 && (
                                                      <div className="mt-2 flex flex-wrap gap-1">
                                                        {module.skills.map((skill, idx) => (
                                                          <span
                                                            key={idx}
                                                            className="text-xs px-2 py-0.5 bg-och-defender/20 text-och-mint rounded"
                                                          >
                                                            {skill}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    )}
                                                    {module.content_url && (
                                                      <div className="mt-2 text-xs text-och-steel">
                                                        <span className="text-och-mint">URL:</span>{' '}
                                                        <a
                                                          href={module.content_url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="underline hover:text-och-mint"
                                                        >
                                                          {module.content_url}
                                                        </a>
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-och-steel">
                                  No milestones defined for this track.
                                </div>
                              )}

                              {/* All Modules Summary */}
                              {details.modules.length > 0 && (
                                <div className="pt-4 border-t border-och-steel/20">
                                  <div className="text-sm text-och-steel">
                                    Total Modules: <span className="text-white font-medium">{details.modules.length}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pt-4 text-sm text-och-steel">
                          No track assigned to this cohort.
                        </div>
                      )}

                      {/* Cohort Additional Info */}
                      <div className="pt-4 border-t border-och-steel/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-och-steel">Seat Capacity</div>
                          <div className="text-white font-medium">{cohort.seat_cap}</div>
                        </div>
                        <div>
                          <div className="text-och-steel">Mentor Ratio</div>
                          <div className="text-white font-medium">1:{cohort.mentor_ratio}</div>
                        </div>
                        <div>
                          <div className="text-och-steel">Utilization</div>
                          <div className="text-white font-medium">
                            {cohort.seat_utilization?.toFixed(1) || 0}%
                          </div>
                        </div>
                        <div>
                          <div className="text-och-steel">Assigned At</div>
                          <div className="text-white font-medium">
                            {new Date(mentorAssignment.assigned_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        {assignments.length > 0 && (
          <Card className="mt-6 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-och-steel">Total Cohorts</div>
                <div className="text-2xl font-bold text-och-mint">{assignments.length}</div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Unique Tracks</div>
                <div className="text-2xl font-bold text-och-mint">
                  {new Set(assignments.map(a => a.track?.id).filter(Boolean)).size}
                </div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Unique Programs</div>
                <div className="text-2xl font-bold text-och-mint">
                  {new Set(assignments.map(a => a.program?.id).filter(Boolean)).size}
                </div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Total Students</div>
                <div className="text-2xl font-bold text-och-mint">
                  {assignments.reduce((sum, a) => sum + (a.cohort.enrolled_count || 0), 0)}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Flag Modal */}
        {showFlagModal && (
          <div className="fixed inset-0 bg-och-midnight/90 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Raise Flag for Selected Mentees</h2>
                <p className="text-sm text-och-steel mb-4">
                  Raising flag for {selectedMentees.size} mentee{selectedMentees.size !== 1 ? 's' : ''}
                </p>
                
                {flagError && (
                  <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange/50 rounded text-sm text-och-orange">
                    {flagError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-och-steel mb-2">Flag Type</label>
                    <select
                      value={flagFormData.flag_type}
                      onChange={(e) => setFlagFormData({ ...flagFormData, flag_type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-mint"
                    >
                      <option value="needs_attention">Needs Attention</option>
                      <option value="struggling">Struggling</option>
                      <option value="at_risk">At Risk</option>
                      <option value="technical_issue">Technical Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-och-steel mb-2">Severity</label>
                    <select
                      value={flagFormData.severity}
                      onChange={(e) => setFlagFormData({ ...flagFormData, severity: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-mint"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-och-steel mb-2">Description</label>
                    <textarea
                      value={flagFormData.description}
                      onChange={(e) => setFlagFormData({ ...flagFormData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-mint"
                      placeholder="Describe the issue or concern..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <Button
                    variant="defender"
                    onClick={handleRaiseFlag}
                    disabled={submittingFlag || !flagFormData.description.trim()}
                  >
                    {submittingFlag ? 'Raising Flag...' : 'Raise Flag'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFlagModal(false)
                      setFlagError(null)
                    }}
                    disabled={submittingFlag}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}



