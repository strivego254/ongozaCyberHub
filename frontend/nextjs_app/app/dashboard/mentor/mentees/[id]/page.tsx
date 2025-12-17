'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { mentorClient } from '@/services/mentorClient'
import { profilerClient } from '@/services/profilerClient'
import { programsClient, type Enrollment, type Cohort } from '@/services/programsClient'
import { useCohorts } from '@/hooks/usePrograms'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type {
  MenteeGoal,
  MenteeFlag,
  TalentScopeMentorView,
  MenteePerformance,
  AssignedMentee,
} from '@/services/types/mentor'

export default function MenteeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const menteeId = params.id as string

  const [menteeData, setMenteeData] = useState<AssignedMentee | null>(null)
  const [profilerData, setProfilerData] = useState<any>(null)
  const [talentscopeData, setTalentscopeData] = useState<TalentScopeMentorView | null>(null)
  const [performanceData, setPerformanceData] = useState<MenteePerformance | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [goals, setGoals] = useState<MenteeGoal[]>([])
  const [flags, setFlags] = useState<MenteeFlag[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'performance' | 'missions' | 'sessions' | 'flags'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [submittingFlag, setSubmittingFlag] = useState(false)
  const [flagFormData, setFlagFormData] = useState({
    flag_type: 'needs_attention' as 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
  })

  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 500 })

  // Load mentee data from assigned cohorts
  useEffect(() => {
    const loadMenteeData = async () => {
      if (!mentorId || !menteeId) {
        setLoading(false)
        return
      }

      // Wait for cohorts to finish loading
      if (cohortsLoading) {
        return
      }
      
      setLoading(true)
      setError(null)
      
      try {
        console.log('[MenteeDetail] Loading mentee data for:', menteeId, 'from mentor:', mentorId)
        
        // Step 1: Find all cohorts where this mentor is assigned
        const assignedCohorts: Cohort[] = []
        
        for (const cohort of cohorts) {
          try {
            const cohortMentors = await programsClient.getCohortMentors(String(cohort.id))
            const isAssigned = cohortMentors.some(
              (assignment: any) => String(assignment.mentor) === String(mentorId) && assignment.active !== false
            )
            
            if (isAssigned) {
              assignedCohorts.push(cohort)
            }
          } catch (err) {
            console.error(`[MenteeDetail] Failed to check mentor assignment for cohort ${cohort.id}:`, err)
          }
        }

        console.log('[MenteeDetail] Assigned cohorts found:', assignedCohorts.length)

        // Step 2: Find the mentee in enrollments from assigned cohorts
        let foundMentee: AssignedMentee | null = null
        let foundEnrollment: Enrollment | null = null

        for (const cohort of assignedCohorts) {
          try {
            const enrollments = await programsClient.getCohortEnrollments(String(cohort.id))
            const enrollment = enrollments.find(
              (e) => (String(e.user) === String(menteeId) || String(e.id) === String(menteeId)) &&
                     (e.status === 'active' || e.status === 'completed')
            )

            if (enrollment) {
              foundEnrollment = enrollment
              foundMentee = {
                id: enrollment.user,
                user_id: enrollment.user,
                name: enrollment.user_name || enrollment.user_email || 'Unknown',
                email: enrollment.user_email || '',
                track: cohort.track_name || '',
                cohort: cohort.name || enrollment.cohort_name || '',
                readiness_score: 0,
                risk_level: 'low',
                missions_completed: 0,
                subscription_tier: enrollment.seat_type === 'paid' ? 'professional' : enrollment.seat_type === 'scholarship' ? 'professional' : 'free',
                assigned_at: enrollment.joined_at,
                status: enrollment.status === 'active' ? 'active' : enrollment.status === 'completed' ? 'active' : 'inactive',
              }
              console.log('[MenteeDetail] Found mentee in cohort:', cohort.name)
              break
            }
          } catch (err) {
            console.error(`[MenteeDetail] Failed to load enrollments for cohort ${cohort.id}:`, err)
          }
        }

        if (!foundMentee) {
          // Fallback: Try direct API
          console.log('[MenteeDetail] Mentee not found in cohorts, trying direct API...')
          try {
            const directMentees = await mentorClient.getAssignedMentees(mentorId)
            const mentee = directMentees.find((m: AssignedMentee) => m.id === menteeId || m.user_id === menteeId)
            if (mentee) {
              foundMentee = mentee
              console.log('[MenteeDetail] Found mentee via direct API')
            }
          } catch (fallbackErr) {
            console.error('[MenteeDetail] Direct API also failed:', fallbackErr)
          }
        }

        if (!foundMentee) {
          setError('Mentee not found. This mentee may not be enrolled in any of your assigned cohorts.')
          setLoading(false)
          return
        }

        setMenteeData(foundMentee)
        if (foundEnrollment) {
          setEnrollments([foundEnrollment])
        }

        // Load additional data in parallel
        try {
          const [performance, profiler, talentscope] = await Promise.all([
            mentorClient.getMenteePerformance(mentorId, menteeId).catch(() => null),
            profilerClient.getFutureYou(menteeId).catch(() => null),
            mentorClient.getTalentScopeView(mentorId, menteeId).catch(() => null),
          ])

          setPerformanceData(performance)
          setProfilerData(profiler)
          setTalentscopeData(talentscope)
        } catch (err) {
          console.error('[MenteeDetail] Failed to load additional data:', err)
          // Don't fail the whole page if additional data fails
        }
      } catch (err: any) {
        console.error('[MenteeDetail] Failed to load mentee data:', err)
        setError(err?.message || 'Failed to load mentee data')
      } finally {
        setLoading(false)
      }
    }

    loadMenteeData()
  }, [mentorId, menteeId, cohorts, cohortsLoading])

  // Load goals when goals tab is active
  useEffect(() => {
    if (activeTab === 'goals' && mentorId) {
      const loadGoals = async () => {
        try {
          const data = await mentorClient.getMenteeGoals(mentorId, { mentee_id: menteeId })
          setGoals(data.filter((g: MenteeGoal) => g.mentee_id === menteeId))
        } catch (err) {
          console.error('Failed to load goals:', err)
        }
      }
      loadGoals()
    }
  }, [activeTab, mentorId, menteeId])

  // Load flags when flags tab is active
  const loadFlags = async () => {
    if (!mentorId) return
    try {
      const data = await mentorClient.getMenteeFlags(mentorId)
      setFlags(data.filter((f: MenteeFlag) => f.mentee_id === menteeId))
    } catch (err) {
      console.error('Failed to load flags:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'flags' && mentorId) {
      loadFlags()
    }
  }, [activeTab, mentorId, menteeId])

  // Handle flag submission
  const handleRaiseFlag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mentorId || !menteeId || !flagFormData.description.trim()) {
      setError('Please provide a description for the flag')
      return
    }

    setSubmittingFlag(true)
    setError(null)

    try {
      const newFlag = await mentorClient.flagMentee(mentorId, {
        mentee_id: menteeId,
        flag_type: flagFormData.flag_type,
        severity: flagFormData.severity,
        description: flagFormData.description.trim(),
      })

      // Add the new flag to the list
      setFlags((prev) => [newFlag, ...prev])

      // Reset form and close modal
      setFlagFormData({
        flag_type: 'needs_attention',
        severity: 'medium',
        description: '',
      })
      setShowFlagModal(false)

      // Optionally switch to flags tab
      if (activeTab !== 'flags') {
        setActiveTab('flags')
      }
    } catch (err: any) {
      console.error('Failed to raise flag:', err)
      setError(err?.message || 'Failed to raise flag. Please try again.')
    } finally {
      setSubmittingFlag(false)
    }
  }

  if (loading) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <div className="text-center py-12">
            <div className="text-och-steel">Loading mentee details...</div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  if (error || !menteeData) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <Card className="p-6">
            <div className="text-och-orange mb-4">
              {error || 'Mentee not found'}
            </div>
            <Link href="/dashboard/mentor/mentees">
              <Button variant="outline">← Back to Mentees</Button>
            </Link>
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
          <Link href="/dashboard/mentor/mentees">
            <Button variant="outline" size="sm" className="mb-4">
              ← Back to Mentees
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-mint">{menteeData.name}</h1>
              <p className="text-och-steel">{menteeData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {menteeData.track && (
                  <Badge variant="outline">{menteeData.track}</Badge>
                )}
                {menteeData.cohort && (
                  <Badge variant="outline">{menteeData.cohort}</Badge>
                )}
                {menteeData.subscription_tier === 'professional' && (
                  <Badge variant="defender">$7 Professional</Badge>
                )}
                <Badge variant={menteeData.risk_level === 'high' ? 'orange' : menteeData.risk_level === 'medium' ? 'gold' : 'mint'}>
                  {menteeData.risk_level || 'low'} risk
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-och-steel/20">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'goals'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => {
                router.push('/dashboard/mentor/missions')
              }}
              className="px-4 py-2 text-sm font-medium text-och-steel hover:text-white transition-colors"
            >
              Missions
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'sessions'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('flags')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'flags'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Flags
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Profiler Data */}
            {profilerData && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Profiler Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-och-steel mb-1">Future-You Persona</div>
                      <div className="text-white font-medium">{profilerData.persona || 'Not available'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel mb-1">Track Recommendation</div>
                      <div className="text-white font-medium">{profilerData.recommended_track || 'Not available'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel mb-1">Mission Difficulty</div>
                      <div className="text-white font-medium">{profilerData.mission_difficulty || 'Not available'}</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* TalentScope Baseline */}
            {talentscopeData && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">TalentScope Analytics</h3>
                  {talentscopeData.ingested_signals && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-white mb-2">Ingested Signals</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-och-steel">Mission Scores</div>
                          <div className="text-white font-medium">{talentscopeData.ingested_signals.mission_scores}</div>
                        </div>
                        <div>
                          <div className="text-och-steel">Habit Logs</div>
                          <div className="text-white font-medium">{talentscopeData.ingested_signals.habit_logs}</div>
                        </div>
                        <div>
                          <div className="text-och-steel">Mentor Evaluations</div>
                          <div className="text-white font-medium">{talentscopeData.ingested_signals.mentor_evaluations}</div>
                        </div>
                        <div>
                          <div className="text-och-steel">Community Engagement</div>
                          <div className="text-white font-medium">{talentscopeData.ingested_signals.community_engagement}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {talentscopeData.skills_heatmap && Object.keys(talentscopeData.skills_heatmap).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Skills Heatmap</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {Object.entries(talentscopeData.skills_heatmap).map(([skill, score]: [string, any]) => (
                          <div key={skill} className="flex items-center justify-between text-xs p-2 bg-och-midnight/50 rounded">
                            <span className="text-och-steel">{skill}</span>
                            <span className="text-white font-medium">{score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Performance Summary */}
            {performanceData && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-och-steel">Overall Score</div>
                      <div className="text-2xl font-bold text-och-mint">{performanceData.overall_score || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel">Readiness Score</div>
                      <div className="text-2xl font-bold text-och-mint">{performanceData.readiness_score || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel">Mission Completion</div>
                      <div className="text-2xl font-bold text-och-mint">{performanceData.mission_completion_rate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel">Engagement</div>
                      <div className="text-2xl font-bold text-och-mint">{performanceData.engagement_score || 0}%</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Goals</h3>
                  <Button variant="defender" size="sm">
                    + New Goal
                  </Button>
                </div>
                {goals.length === 0 ? (
                  <div className="text-center py-8 text-och-steel">
                    <p>No goals found for this mentee.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <Card key={goal.id} className="border border-och-steel/20">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="text-white font-semibold">{goal.title}</h4>
                              <p className="text-sm text-och-steel mt-1">{goal.description}</p>
                            </div>
                            <Badge variant={goal.status === 'completed' ? 'mint' : goal.status === 'in_progress' ? 'defender' : 'orange'}>
                              {goal.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-och-steel mb-3">
                            <span>Type: {goal.goal_type}</span>
                            <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
                          </div>
                          {goal.mentor_feedback && (
                            <div className="mt-3 p-3 bg-och-midnight/50 rounded">
                              <div className="text-xs text-och-steel mb-1">Your Feedback:</div>
                              <div className="text-sm text-white">{goal.mentor_feedback.feedback}</div>
                            </div>
                          )}
                          {goal.status === 'pending' && (
                            <Button variant="defender" size="sm" className="mt-3">
                              Provide Feedback
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Tracking</h3>
                <p className="text-sm text-och-steel mb-4">
                  Track mentee performance using TalentScope analytics, mission scores, and engagement metrics.
                </p>
                <Button variant="outline" size="sm" className="mb-4">
                  Recommend Recipe
                </Button>
                {/* Performance charts and metrics would go here */}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sessions</h3>
                <p className="text-sm text-och-steel mb-4">
                  Manage mentorship sessions with this mentee. Schedule sessions, take notes, and track outcomes.
                </p>
                <Button variant="defender" size="sm">
                  Schedule Session
                </Button>
                {/* Session list would go here */}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Flags</h3>
                  <Button
                    variant="orange"
                    size="sm"
                    onClick={() => setShowFlagModal(true)}
                  >
                    Raise Flag
                  </Button>
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg text-sm text-och-orange">
                    {error}
                  </div>
                )}
                {flags.length === 0 ? (
                  <div className="text-center py-8 text-och-steel">
                    <p>No flags raised for this mentee.</p>
                    <p className="text-sm mt-2">Click "Raise Flag" to flag issues that need attention.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flags.map((flag) => (
                      <Card key={flag.id} className="border border-och-steel/20">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-semibold capitalize">
                                  {flag.flag_type.replace(/_/g, ' ')}
                                </h4>
                                <Badge
                                  variant={
                                    flag.status === 'resolved'
                                      ? 'mint'
                                      : flag.status === 'acknowledged'
                                      ? 'defender'
                                      : 'steel'
                                  }
                                  className="text-xs"
                                >
                                  {flag.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-och-steel mt-1">{flag.description}</p>
                            </div>
                            <Badge
                              variant={
                                flag.severity === 'critical' || flag.severity === 'high'
                                  ? 'orange'
                                  : flag.severity === 'medium'
                                  ? 'gold'
                                  : 'steel'
                              }
                              className="ml-4 shrink-0"
                            >
                              {flag.severity}
                            </Badge>
                          </div>
                          <div className="text-xs text-och-steel mt-2">
                            Raised: {new Date(flag.raised_at).toLocaleDateString()} at {new Date(flag.raised_at).toLocaleTimeString()}
                            {flag.status === 'resolved' && flag.resolved_at && (
                              <> • Resolved: {new Date(flag.resolved_at).toLocaleDateString()}</>
                            )}
                            {flag.resolution_notes && (
                              <div className="mt-2 p-2 bg-och-midnight/50 rounded text-xs text-white">
                                <span className="font-semibold">Resolution:</span> {flag.resolution_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Raise Flag Modal */}
        {showFlagModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Raise Flag for {menteeData?.name}</h2>
                  <button
                    onClick={() => {
                      setShowFlagModal(false)
                      setError(null)
                      setFlagFormData({
                        flag_type: 'needs_attention',
                        severity: 'medium',
                        description: '',
                      })
                    }}
                    className="text-och-steel hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleRaiseFlag} className="space-y-4">
                  {/* Flag Type */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Flag Type *
                    </label>
                    <select
                      value={flagFormData.flag_type}
                      onChange={(e) =>
                        setFlagFormData({
                          ...flagFormData,
                          flag_type: e.target.value as typeof flagFormData.flag_type,
                        })
                      }
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      required
                    >
                      <option value="needs_attention">Needs Attention</option>
                      <option value="struggling">Struggling</option>
                      <option value="at_risk">At Risk</option>
                      <option value="technical_issue">Technical Issue</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Severity *
                    </label>
                    <select
                      value={flagFormData.severity}
                      onChange={(e) =>
                        setFlagFormData({
                          ...flagFormData,
                          severity: e.target.value as typeof flagFormData.severity,
                        })
                      }
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Description *
                    </label>
                    <textarea
                      value={flagFormData.description}
                      onChange={(e) =>
                        setFlagFormData({ ...flagFormData, description: e.target.value })
                      }
                      placeholder="Describe the issue or concern..."
                      rows={4}
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender resize-none"
                      required
                    />
                    <p className="text-xs text-och-steel mt-1">
                      Provide specific details about why you're raising this flag.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg text-sm text-och-orange">
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowFlagModal(false)
                        setError(null)
                        setFlagFormData({
                          flag_type: 'needs_attention',
                          severity: 'medium',
                          description: '',
                        })
                      }}
                      disabled={submittingFlag}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="orange"
                      disabled={submittingFlag || !flagFormData.description.trim()}
                      className="flex-1"
                    >
                      {submittingFlag ? 'Raising Flag...' : 'Raise Flag'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}

