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

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)


const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'running' | 'closing' | 'closed'>('all')
  const [viewMode, setViewMode] = useState<'cohorts' | 'tracks'>('cohorts')
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)

  // Load mentor assignments efficiently using getMentorAssignments API
  useEffect(() => {
    const loadAssignments = async () => {
      if (!mentorId) return

      setIsLoading(true)
      setError(null)

      try {
        // Use the efficient API endpoint that filters by mentor
        const mentorAssignmentsList = await programsClient.getMentorAssignments(mentorId)
        
        // Filter only active assignments
        const activeAssignments = mentorAssignmentsList.filter(a => a.active)
        
        if (activeAssignments.length === 0) {
          setAssignments([])
          setIsLoading(false)
          return
        }

        // Get unique cohort IDs
        const cohortIds = Array.from(new Set(activeAssignments.map(a => String(a.cohort))))
        
        // Fetch cohort details in parallel
        const cohortPromises = cohortIds.map(async (cohortId) => {
          try {
            return await programsClient.getCohort(cohortId)
          } catch (err) {
            console.error(`Failed to load cohort ${cohortId}:`, err)
            return null
          }
        })
        
        const cohortDetails = (await Promise.all(cohortPromises)).filter(Boolean) as Cohort[]
        
        // Build assignments with details
        const assignmentsWithDetails: AssignmentWithDetails[] = []
        
        for (const assignment of activeAssignments) {
          const cohort = cohortDetails.find(c => String(c.id) === String(assignment.cohort))
          if (!cohort) continue
          
          const track = tracks.find(t => String(t.id) === String(cohort.track))
          const program = track?.program 
            ? programs.find(p => String(p.id) === String(track.program))
            : null

          assignmentsWithDetails.push({
            assignment,
            cohort,
            track: track || null,
            program: program ? { id: program.id || '', name: program.name } : null,
            milestones: [],
            modules: [],
          })
        }

        setAssignments(assignmentsWithDetails)
      } catch (err: any) {
        console.error('Failed to load mentor assignments:', err)
        setError(err?.message || 'Failed to load assigned cohorts and tracks')
      } finally {
        setIsLoading(false)
      }
    }

    // Only load when mentorId is available and tracks/programs are loaded
    if (mentorId && !tracksLoading && !programsLoading) {
      loadAssignments()
    }
  }, [mentorId, tracks, tracksLoading, programs, programsLoading])

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
      // Load track details if track exists
      const assignment = assignments.find(a => a.cohort.id === cohortId)
      if (assignment?.track?.id) {
        loadTrackDetails(assignment.track.id)
      }
    }
    setExpandedCohorts(newExpanded)
  }

  // Filter assignments based on search and status
  const filteredAssignments = useMemo(() => {
    let filtered = assignments

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.cohort.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.cohort.name.toLowerCase().includes(query) ||
        a.track?.name.toLowerCase().includes(query) ||
        a.program?.name.toLowerCase().includes(query) ||
        a.cohort.track_name?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [assignments, statusFilter, searchQuery])

  // Auto-load data when cohort is selected
  useEffect(() => {
    if (selectedCohortId) {
      const assignment = filteredAssignments.find(a => a.cohort.id === selectedCohortId)
      if (assignment) {
        // Load enrollments
        if (!cohortEnrollments[selectedCohortId]) {
          loadCohortEnrollments(selectedCohortId)
        }
        // Load track details
        if (assignment.track?.id && !trackDetails[assignment.track.id]) {
          loadTrackDetails(assignment.track.id)
        }
        // Auto-expand
        if (!expandedCohorts.has(selectedCohortId)) {
          setExpandedCohorts(prev => new Set([...Array.from(prev), selectedCohortId]))
        }
      }
    }
  }, [selectedCohortId, filteredAssignments])

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
    setSelectedMentees(new Set([...Array.from(selectedMentees), ...Array.from(allIds)]))
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

  // Group assignments by track for track view
  const assignmentsByTrack = useMemo(() => {
    const grouped: Record<string, AssignmentWithDetails[]> = {}
    filteredAssignments.forEach(assignment => {
      const trackId = assignment.track?.id || 'no-track'
      if (!grouped[trackId]) {
        grouped[trackId] = []
      }
      grouped[trackId].push(assignment)
    })
    return grouped
  }, [filteredAssignments])

  // Compute unique tracks with details for summary
  const uniqueTracks = useMemo(() => {
    const trackMap = new Map<string, Track>()
    assignments.forEach(assignment => {
      if (assignment.track?.id) {
        const trackId = String(assignment.track.id)
        if (!trackMap.has(trackId)) {
          trackMap.set(trackId, assignment.track)
        }
      }
    })
    return Array.from(trackMap.values())
  }, [assignments])

  if (isLoading || tracksLoading || programsLoading) {
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
            View and manage your assigned cohorts, tracks, and curriculum structure.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Search cohorts, tracks, or programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-mint focus:border-och-mint"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-mint"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="running">Running</option>
                <option value="closing">Closing</option>
                <option value="closed">Closed</option>
              </select>
              <div className="flex gap-2 bg-och-midnight/50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'cohorts' ? 'defender' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cohorts')}
                >
                  By Cohort
                </Button>
                <Button
                  variant={viewMode === 'tracks' ? 'defender' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('tracks')}
                >
                  By Track
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {filteredAssignments.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-och-steel mb-4">
                {assignments.length === 0 
                  ? 'No assigned cohorts found.'
                  : 'No cohorts match your search criteria.'}
              </p>
              {assignments.length === 0 && (
                <p className="text-sm text-och-steel">Contact your Program Director if you believe this is an error.</p>
              )}
            </div>
          </Card>
        ) : viewMode === 'tracks' ? (
          // Track Grouped View
          <div className="space-y-6">
            {Object.entries(assignmentsByTrack).map(([trackId, trackAssignments]) => {
              const track = trackAssignments[0].track
              if (!track) return null
              
              return (
                <Card key={trackId} className="overflow-hidden">
                  <div className="p-6 border-b border-och-steel/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{track.name}</h2>
                        <p className="text-och-steel">{track.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="outline">{track.track_type}</Badge>
                          {track.key && <Badge variant="outline">{track.key}</Badge>}
                          <span className="text-sm text-och-steel">
                            {trackAssignments.length} cohort{trackAssignments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (track.id) {
                            toggleTrack(track.id, trackAssignments[0])
                          }
                        }}
                      >
                        {track.id && expandedTracks.has(track.id) ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Track Details */}
                  {track.id && expandedTracks.has(track.id) && trackDetails[track.id] && (
                    <div className="p-6 space-y-4">
                      {trackDetails[track.id].milestones.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Milestones</h3>
                          <div className="space-y-2">
                            {trackDetails[track.id].milestones.map((milestone) => (
                              <div key={milestone.id} className="p-3 bg-och-midnight/50 rounded">
                                <div className="text-white font-medium">
                                  {milestone.order}. {milestone.name}
                                </div>
                                {milestone.description && (
                                  <div className="text-sm text-och-steel mt-1">{milestone.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Cohorts in this track */}
                  <div className="px-6 pb-6 space-y-3">
                    {trackAssignments.map((assignment) => {
                      const isCohortExpanded = expandedCohorts.has(assignment.cohort.id)
                      return (
                        <div key={assignment.cohort.id} className="border border-och-steel/20 rounded-lg overflow-hidden">
                          <div
                            className="p-4 cursor-pointer hover:bg-och-midnight/50 transition-colors"
                            onClick={() => toggleCohort(assignment.cohort.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isCohortExpanded ? (
                                  <ChevronDownIcon className="w-5 h-5 text-och-mint" />
                                ) : (
                                  <ChevronRightIcon className="w-5 h-5 text-och-steel" />
                                )}
                                <div>
                                  <h3 className="text-lg font-semibold text-white">{assignment.cohort.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={getStatusBadge(assignment.cohort.status)}>
                                      {assignment.cohort.status}
                                    </Badge>
                                    <span className="text-sm text-och-steel">
                                      {assignment.cohort.enrolled_count || 0} enrolled
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {isCohortExpanded && (
                            <div className="px-4 pb-4 border-t border-och-steel/20">
                              {/* Student list and other details - reuse existing code */}
                              {(() => {
                                const enrollmentData = cohortEnrollments[assignment.cohort.id]
                                if (!enrollmentData) {
                                  loadCohortEnrollments(assignment.cohort.id)
                                  return <div className="text-sm text-och-steel mt-4">Loading students...</div>
                                }
                                if (enrollmentData.loading) {
                                  return <div className="text-sm text-och-steel mt-4">Loading students...</div>
                                }
                                const activeEnrollments = enrollmentData.enrollments.filter(
                                  (e) => e.status === 'active' || e.status === 'completed'
                                )
                                if (activeEnrollments.length === 0) {
                                  return <div className="text-sm text-och-steel mt-4">No active students.</div>
                                }
                                return (
                                  <div className="mt-4 space-y-2">
                                    {activeEnrollments.slice(0, 5).map((enrollment) => (
                                      <div key={enrollment.id} className="p-2 bg-och-midnight/30 rounded text-sm">
                                        <div className="text-white">
                                          {enrollment.user_name || enrollment.user_email || enrollment.user}
                                        </div>
                                      </div>
                                    ))}
                                    {activeEnrollments.length > 5 && (
                                      <div className="text-xs text-och-steel text-center">
                                        +{activeEnrollments.length - 5} more students
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          // Cohort View - Show list of cohorts to select from
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cohort Selection List */}
            <div className="lg:col-span-1">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Select a Cohort</h2>
                  <p className="text-sm text-och-steel mb-4">
                    Choose a cohort to view its details, track, and enrolled students.
                  </p>
                  
                  {filteredAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-och-steel text-sm">No cohorts match your filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {filteredAssignments.map((assignment) => {
                        const { cohort, track, assignment: mentorAssignment } = assignment
                        const isSelected = selectedCohortId === cohort.id
                        
                        return (
                          <div
                            key={cohort.id}
                            onClick={() => {
                              setSelectedCohortId(cohort.id)
                              // Auto-expand when selected
                              if (!expandedCohorts.has(cohort.id)) {
                                toggleCohort(cohort.id)
                              }
                            }}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-och-mint bg-och-mint/10'
                                : 'border-och-steel/20 bg-och-midnight/50 hover:border-och-steel/40 hover:bg-och-midnight/70'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-white font-semibold">{cohort.name}</h3>
                              <Badge variant={getStatusBadge(cohort.status)} className="text-xs">
                                {cohort.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs text-och-steel">
                              {track && (
                                <div className="flex items-center gap-1">
                                  <span>Track:</span>
                                  <span className="text-och-mint">{track.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span>{cohort.enrolled_count || 0} students</span>
                                <span>•</span>
                                <span>{cohort.mode}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getRoleBadge(mentorAssignment.role)} className="text-xs">
                                  {mentorAssignment.role}
                                </Badge>
                                <span>
                                  {new Date(cohort.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Selected Cohort Details */}
            <div className="lg:col-span-2">
              {selectedCohortId ? (
                (() => {
                  const assignment = filteredAssignments.find(a => a.cohort.id === selectedCohortId)
                  if (!assignment) return null
                  
                  const { cohort, track, program, assignment: mentorAssignment } = assignment
                  const isCohortExpanded = expandedCohorts.has(cohort.id)
                  const details = track?.id ? trackDetails[track.id] : null

                  return (
                    <Card className="overflow-hidden">
                      {/* Cohort Header */}
                      <div className="p-6 border-b border-och-steel/20">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white mb-2">{cohort.name}</h2>
                            <div className="flex items-center gap-3">
                              <Badge variant={getStatusBadge(cohort.status)}>
                                {cohort.status}
                              </Badge>
                              <Badge variant={getRoleBadge(mentorAssignment.role)}>
                                {mentorAssignment.role}
                              </Badge>
                              <span className="text-sm text-och-steel">
                                {cohort.enrolled_count || 0} enrolled
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCohortId(null)}
                          >
                            Change Cohort
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-och-steel">
                          <span>
                            {new Date(cohort.start_date).toLocaleDateString()} - {new Date(cohort.end_date).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{cohort.mode}</span>
                          <span>•</span>
                          <span>Seat Capacity: {cohort.seat_cap}</span>
                        </div>
                      </div>

                      {/* Cohort Details */}
                      <div className="p-6 space-y-6">
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
                        <div className="pt-4 border-t border-och-steel/20">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Track Details</h3>
                            {track.id && (
                              <Button
                                variant="defender"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/dashboard/mentor/tracks/${track.id}`)
                                }}
                              >
                                View Full Track Details →
                              </Button>
                            )}
                          </div>
                          
                          <div
                            className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-mint/50 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              // When clicking track, redirect to track details page
                              if (track.id) {
                                router.push(`/dashboard/mentor/tracks/${track.id}`)
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-white">{track.name}</h3>
                                  <Badge variant="outline">{track.track_type}</Badge>
                                  {track.key && (
                                    <Badge variant="outline">{track.key}</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-och-steel mb-2">{track.description}</p>
                                {details && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="mint" className="text-xs">
                                      {details.milestones.length} milestone{details.milestones.length !== 1 ? 's' : ''}
                                    </Badge>
                                    <Badge variant="mint" className="text-xs">
                                      {details.modules.length} module{details.modules.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <span className="text-och-mint text-sm font-medium">View Details →</span>
                              </div>
                            </div>
                          </div>

                          {/* Track Content (Milestones & Modules) - Show when cohort is expanded */}
                          {isCohortExpanded && details && (
                            <div className="mt-4 space-y-4">
                              {/* Milestones */}
                              {details.milestones.length > 0 ? (
                                <div>
                                  <h4 className="text-md font-semibold text-white mb-3">
                                    Milestones ({details.milestones.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {details.milestones.map((milestone: Milestone) => {
                                      const milestoneModules = details.modules.filter(
                                        (m: Module) => m.milestone === milestone.id
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
                                                {milestoneModules.map((module: Module) => (
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
                                                        {module.skills.map((skill: string, idx: number) => (
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
                      <div className="pt-4 border-t border-och-steel/20">
                        {/* Track Information */}
                        {track && (
                          <div className="mb-4 pb-4 border-b border-och-steel/20">
                            <h4 className="text-sm font-semibold text-och-steel mb-3">Track Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-och-steel mb-1">Track Name</div>
                                <div className="text-white font-medium">{track.name}</div>
                              </div>
                              {track.key && (
                                <div>
                                  <div className="text-xs text-och-steel mb-1">Track Key</div>
                                  <div className="text-white font-medium">{track.key}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Other Cohort Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                    </div>
                  </Card>
                )
              })()
            ) : (
              <Card>
                <div className="p-6 text-center py-12">
                  <p className="text-och-steel mb-2">No cohort selected</p>
                  <p className="text-sm text-och-steel">Select a cohort from the list to view its details</p>
                </div>
              </Card>
            )}
          </div>
          </div>
        )}

        {/* Summary Stats */}
        {assignments.length > 0 && (
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Summary</h3>
              <Button
                variant="defender"
                onClick={() => router.push('/dashboard/mentor/tracks')}
              >
                View Tracks
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-och-steel">Total Cohorts</div>
                <div className="text-2xl font-bold text-och-mint">{assignments.length}</div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Unique Tracks</div>
                <div className="text-2xl font-bold text-och-mint">
                  {uniqueTracks.length}
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




