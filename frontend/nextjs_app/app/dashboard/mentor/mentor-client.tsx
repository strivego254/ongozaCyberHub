'use client'

<<<<<<< HEAD
import { useState } from 'react'
import { MenteesOverview } from '@/components/mentor/MenteesOverview'
import { MissionsPending } from '@/components/mentor/MissionsPending'
import { InfluenceAnalytics } from '@/components/mentor/InfluenceAnalytics'
import { TalentScopeView } from '@/components/mentor/TalentScopeView'
import { MentorProfileManagement } from '@/components/mentor/MentorProfileManagement'
import { GoalFeedback } from '@/components/mentor/GoalFeedback'
import { MenteeFlagging } from '@/components/mentor/MenteeFlagging'
=======
import { useCallback, useEffect, useMemo, useState } from 'react'
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
<<<<<<< HEAD
import { useAuth } from '@/hooks/useAuth'
import { useMentorMissions } from '@/hooks/useMentorMissions'
import { useMentorMentees } from '@/hooks/useMentorMentees'
import { mentorClient } from '@/services/mentorClient'
import type { MissionSubmission } from '@/services/types/mentor'

export default function MentorClient() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const [selectedSubmission, setSelectedSubmission] = useState<MissionSubmission | null>(null)
  
  // Load mission queue stats
  const { missions: pendingMissions, totalCount: pendingCount } = useMentorMissions(mentorId, {
=======
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useMentorMissions } from '@/hooks/useMentorMissions'
import { useMentorMentees } from '@/hooks/useMentorMentees'
import { useMentorAssignedTracks } from '@/hooks/useMentorAssignedTracks'
import { useTrackMissions } from '@/hooks/useTrackMissions'
import { mentorClient } from '@/services/mentorClient'
import type { GroupMentorshipSession, MentorAlert, MissionSubmission } from '@/services/types/mentor'

type BadgeVariant = 'defender' | 'mint' | 'gold' | 'orange' | 'steel'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

export default function MentorClient() {
  const { user } = useAuth()
  const router = useRouter()
  const mentorId = user?.id?.toString()

  const { tracks: assignedTracks, trackIds, isLoading: tracksLoading } = useMentorAssignedTracks(mentorId)
  const [selectedTrackId, setSelectedTrackId] = useState<string>('')
  const [missionSearch, setMissionSearch] = useState('')
  const [missionsPage, setMissionsPage] = useState(1)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const activeTrackId = selectedTrackId || trackIds[0]
  const { missions: trackMissions, count: trackMissionsCount, isLoading: missionsLoading } = useTrackMissions({
    track_id: activeTrackId,
    search: missionSearch || undefined,
    page: missionsPage,
    page_size: 10,
  })
  
  // Mission review queue (action-first)
  const {
    missions: pendingMissions,
    totalCount: pendingCount,
    isLoading: pendingLoading,
    error: pendingError,
    reload: reloadPending,
  } = useMentorMissions(mentorId, {
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
    status: 'pending_review',
    limit: 5,
  })
  
<<<<<<< HEAD
  const { missions: inReviewMissions } = useMentorMissions(mentorId, {
    status: 'in_review',
    limit: 5,
  })

  const { mentees } = useMentorMentees(mentorId)

  // Calculate session stats (would come from backend)
  const upcomingSessions = 0 // TODO: Fetch from backend
  const todaySessions = 0 // TODO: Fetch from backend

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Mentor Dashboard</h1>
        <p className="text-och-steel">
          Centralize all tasks related to guiding your assigned mentees, fulfilling your responsibilities in mission review, and tracking performance.
        </p>
        <p className="text-sm text-och-gold mt-2 italic">"We guide the transformation"</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-och-steel mb-1">Pending Reviews</div>
          <div className="text-2xl font-bold text-white">{pendingCount || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-och-steel mb-1">Active Mentees</div>
          <div className="text-2xl font-bold text-white">{mentees.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-och-steel mb-1">Upcoming Sessions</div>
          <div className="text-2xl font-bold text-white">{upcomingSessions}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-och-steel mb-1">Today's Sessions</div>
          <div className="text-2xl font-bold text-white">{todaySessions}</div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/dashboard/mentor/mentees">
          <div className="p-4 bg-och-midnight border border-och-steel/20 rounded-lg hover:bg-och-midnight/80 transition-colors cursor-pointer">
            <div className="text-sm font-medium text-white mb-1">👥 Mentees</div>
            <div className="text-xs text-och-steel">View assigned mentees</div>
          </div>
        </Link>
        <Link href="/dashboard/mentor/missions">
          <div className="p-4 bg-och-midnight border border-och-steel/20 rounded-lg hover:bg-och-midnight/80 transition-colors cursor-pointer">
            <div className="text-sm font-medium text-white mb-1">📋 Mission Review</div>
            <div className="text-xs text-och-steel">Review submissions</div>
          </div>
        </Link>
        <Link href="/dashboard/mentor/sessions">
          <div className="p-4 bg-och-midnight border border-och-steel/20 rounded-lg hover:bg-och-midnight/80 transition-colors cursor-pointer">
            <div className="text-sm font-medium text-white mb-1">💬 Sessions</div>
            <div className="text-xs text-och-steel">Manage sessions</div>
          </div>
        </Link>
        <Link href="/dashboard/mentor/analytics">
          <div className="p-4 bg-och-midnight border border-och-steel/20 rounded-lg hover:bg-och-midnight/80 transition-colors cursor-pointer">
            <div className="text-sm font-medium text-white mb-1">📊 Analytics</div>
            <div className="text-xs text-och-steel">View performance</div>
          </div>
        </Link>
      </div>

      {/* 1. Access and Security */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">🔐 Access and Security</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-och-midnight/50 rounded-lg">
              <div className="text-och-steel mb-1">Access Control</div>
              <div className="text-white">Role-Based Access Control (RBAC) enabled</div>
              <div className="text-xs text-och-steel mt-1">
                You can only access mentees assigned to you with explicit consent
              </div>
            </div>
            <div className="p-3 bg-och-midnight/50 rounded-lg">
              <div className="text-och-steel mb-1">Session Control</div>
              <div className="text-white">Session tokens auto-expire after 12 hours</div>
              <div className="text-xs text-och-steel mt-1">
                For security, your session will expire after inactivity
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Mission Review Queue Management */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">📥 Mission Review Queue</h2>
              <p className="text-sm text-och-steel">
                Your submission inbox for $7 Premium tier mentees. Review missions, provide feedback, and issue pass/fail grades.
              </p>
            </div>
            <Link href="/dashboard/mentor/missions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {/* Workflow Status Indicators */}
          <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
            <div className="p-2 bg-och-midnight/50 rounded text-center">
              <div className="text-white font-semibold">{pendingCount || 0}</div>
              <div className="text-och-steel">Submitted</div>
            </div>
            <div className="p-2 bg-och-midnight/50 rounded text-center">
              <div className="text-white font-semibold">{inReviewMissions.length}</div>
              <div className="text-och-steel">AI Reviewed</div>
            </div>
            <div className="p-2 bg-och-midnight/50 rounded text-center">
              <div className="text-white font-semibold">0</div>
              <div className="text-och-steel">Mentor Review</div>
            </div>
            <div className="p-2 bg-och-midnight/50 rounded text-center">
              <div className="text-white font-semibold">0</div>
              <div className="text-och-steel">Revision Requested</div>
            </div>
          </div>

          <MissionsPending onReviewClick={(submission) => {
            // Navigate to mission review page
            window.location.href = `/dashboard/mentor/missions?submission=${submission.id}`
          }} />
        </div>
      </Card>

      {/* 3. Mentee Performance and Progress Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* TalentScope Analytics */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-2">📊 Mentee Performance Tracking</h2>
            <p className="text-sm text-och-steel mb-4">
              TalentScope Analytics Engine metrics: Mentor Influence Index, Core Readiness Score, and Learning Velocity.
            </p>
            <TalentScopeView />
          </div>
        </Card>

        {/* Goals and Milestones */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-2">🎯 Goals and Milestones</h2>
            <p className="text-sm text-och-steel mb-4">
              Review mentee adherence to goals and progress against defined milestones. Edit and update goals, track status changes.
            </p>
            <GoalFeedback />
          </div>
        </Card>
      </div>

      {/* Risk Flags and Profiler Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Risk Flags */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-2">🚩 Risk and Flags</h2>
            <p className="text-sm text-och-steel mb-4">
              Raise flags for struggling mentees to trigger intervention playbooks.
            </p>
            <MenteeFlagging />
          </div>
        </Card>

        {/* Profiler Context */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-2">👤 Profiler Context</h2>
            <p className="text-sm text-och-steel mb-4">
              View mentee Profiler results, Future-You Projection, and Recommended track to guide mentorship.
            </p>
            <div className="text-sm text-och-steel">
              <p className="mb-2">Profiler data helps you understand:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Mentee's learning style and preferences</li>
                <li>Recommended track alignment</li>
                <li>Future career projection</li>
                <li>Strengths and areas for improvement</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Session and Communication Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Session Queue */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">💬 Session Queue</h2>
                <p className="text-sm text-och-steel">
                  View upcoming mentorship sessions. Confirm or reschedule sessions requested by students.
                </p>
              </div>
              <Link href="/dashboard/mentor/sessions">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-sm font-medium">Upcoming Sessions</span>
                  <Badge variant="defender">{upcomingSessions}</Badge>
                </div>
                <div className="text-xs text-och-steel">
                  Sessions scheduled for the next 7 days
                </div>
              </div>
              
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-sm font-medium">Today's Sessions</span>
                  <Badge variant="mint">{todaySessions}</Badge>
                </div>
                <div className="text-xs text-och-steel">
                  Sessions scheduled for today
                </div>
              </div>

              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <div className="text-white text-sm font-medium mb-1">Reminders</div>
                <div className="text-xs text-och-steel">
                  You receive Email/SMS/In-App reminders for upcoming sessions, milestones, and overdue feedback via NAS.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes and Feedback */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-2">📝 Notes and Feedback</h2>
            <p className="text-sm text-och-steel mb-4">
              Record structured discussion notes and session notes (editable until session is closed). Access two-way feedback system.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <div className="text-white text-sm font-medium mb-1">Session Notes</div>
                <div className="text-xs text-och-steel">
                  Record and edit notes until the session is closed
                </div>
              </div>
              
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <div className="text-white text-sm font-medium mb-1">Mentee Feedback</div>
                <div className="text-xs text-och-steel">
                  View mentee ratings and comments on your mentorship
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 5. Portfolio Integration */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">🎨 Portfolio Integration</h2>
          <p className="text-sm text-och-steel mb-4">
            Your review actions determine portfolio item status lifecycle (in_review → approved). Review uploaded evidence files and links.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-och-midnight/50 rounded-lg">
              <div className="text-white font-semibold mb-2">Portfolio Status</div>
              <div className="text-xs text-och-steel mb-2">
                Review actions update portfolio item status:
              </div>
              <div className="flex gap-2 text-xs">
                <Badge variant="steel">in_review</Badge>
                <span className="text-och-steel">→</span>
                <Badge variant="mint">approved</Badge>
              </div>
            </div>
            
            <div className="p-4 bg-och-midnight/50 rounded-lg">
              <div className="text-white font-semibold mb-2">Evidence Review</div>
              <div className="text-xs text-och-steel">
                Review uploaded evidence files and links submitted by mentees before providing approval.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Mentor Influence */}
        <InfluenceAnalytics />

        {/* Mentees Overview */}
        <div>
          <MenteesOverview />
        </div>
      </div>

      {/* Profile Management */}
      <div className="mb-6">
        <MentorProfileManagement />
      </div>
=======
  const { mentees, isLoading: menteesLoading, error: menteesError, reload: reloadMentees } = useMentorMentees(mentorId)

  const [sessions, setSessions] = useState<GroupMentorshipSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [alerts, setAlerts] = useState<MentorAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [alertsError, setAlertsError] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    if (!mentorId) return
    setSessionsLoading(true)
    setSessionsError(null)
    try {
      const start = new Date()
      const end = new Date()
      end.setDate(end.getDate() + 7)
      const startDate = start.toISOString().slice(0, 10)
      const endDate = end.toISOString().slice(0, 10)

      const data = await mentorClient.getGroupSessions(mentorId, {
        status: 'scheduled',
        start_date: startDate,
        end_date: endDate,
        page: 1,
        page_size: 50,
      })

      const sorted = (data.results || [])
        .slice()
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      setSessions(sorted)
    } catch (err: unknown) {
      setSessionsError(getErrorMessage(err) || 'Failed to load sessions')
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [mentorId])

  const loadAlerts = useCallback(async () => {
    if (!mentorId) return
    setAlertsLoading(true)
    setAlertsError(null)
    try {
      const data = await mentorClient.getAlerts(mentorId)
      const sorted = (data || [])
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setAlerts(sorted)
    } catch (err: unknown) {
      setAlertsError(getErrorMessage(err) || 'Failed to load alerts')
      setAlerts([])
    } finally {
      setAlertsLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    // Load non-hook dashboard data (sessions + alerts)
    loadSessions()
    loadAlerts()
    setLastUpdatedAt(new Date())
  }, [loadSessions, loadAlerts])

  const refreshAll = useCallback(async () => {
    await Promise.all([reloadPending(), reloadMentees(), loadSessions(), loadAlerts()])
    setLastUpdatedAt(new Date())
  }, [reloadPending, reloadMentees, loadSessions, loadAlerts])

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const todaySessions = useMemo(
    () => sessions.filter((s) => s.scheduled_at?.slice(0, 10) === todayKey).length,
    [sessions, todayKey]
  )
  const upcomingSessions = sessions.length

  const atRiskMentees = useMemo(() => {
    const severity = (risk?: string) => (risk === 'high' ? 3 : risk === 'medium' ? 2 : 1)
    return mentees
      .slice()
      .sort((a, b) => {
        const byRisk = severity(b.risk_level) - severity(a.risk_level)
        if (byRisk !== 0) return byRisk
        return (a.readiness_score ?? 0) - (b.readiness_score ?? 0)
      })
      .slice(0, 5)
  }, [mentees])

  const handleReviewNow = (submissionId: string) => {
    router.push(`/dashboard/mentor/missions?submission=${encodeURIComponent(submissionId)}`)
  }

  const handleOpenMentee = (menteeId: string) => {
    router.push(`/dashboard/mentor/mentees/${encodeURIComponent(menteeId)}`)
  }

  const severityVariant = (sev: MentorAlert['severity']): BadgeVariant => {
    if (sev === 'critical') return 'orange'
    if (sev === 'high') return 'orange'
    if (sev === 'medium') return 'gold'
    return 'steel'
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Mentor Dashboard</h1>
          <p className="text-sm text-och-steel mt-1">
            Focus on what needs attention now: reviews, at‑risk mentees, and upcoming sessions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdatedAt && (
            <div className="text-xs text-och-steel">
              Last updated: <span className="text-white">{lastUpdatedAt.toLocaleTimeString()}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={refreshAll}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Action-first KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-och-steel mb-1">Pending Reviews</div>
          <div className="text-2xl font-bold text-white">{pendingCount || 0}</div>
          <div className="mt-2">
            <Link href="/dashboard/mentor/missions">
              <Button variant="outline" size="sm">Open Review Queue</Button>
            </Link>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-och-steel mb-1">At‑Risk Mentees</div>
          <div className="text-2xl font-bold text-white">
            {mentees.filter(m => m.risk_level === 'high' || m.risk_level === 'medium').length}
          </div>
          <div className="mt-2">
            <Link href="/dashboard/mentor/mentees">
              <Button variant="outline" size="sm">View Mentees</Button>
            </Link>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-och-steel mb-1">Sessions (7d)</div>
          <div className="text-2xl font-bold text-white">{upcomingSessions}</div>
          <div className="mt-2">
            <Link href="/dashboard/mentor/sessions">
              <Button variant="outline" size="sm">Manage Sessions</Button>
            </Link>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-och-steel mb-1">Today</div>
          <div className="text-2xl font-bold text-white">{todaySessions}</div>
          <div className="mt-2 text-xs text-och-steel">
            Next: {sessions[0]?.scheduled_at ? new Date(sessions[0].scheduled_at).toLocaleTimeString() : '—'}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Queue */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Priority Queue</h2>
                <p className="text-sm text-och-steel">
                  Start here: the items that unblock your mentees fastest.
                </p>
              </div>
              <Link href="/dashboard/mentor/missions">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>

            {/* Pending Reviews */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white">Pending mission reviews</div>
                <Badge variant="defender" className="text-xs">{pendingCount || 0}</Badge>
              </div>

              {pendingLoading ? (
                <div className="text-sm text-och-steel">Loading review queue…</div>
              ) : pendingError ? (
                <div className="text-sm text-och-orange">Failed to load reviews: {pendingError}</div>
              ) : pendingMissions.length === 0 ? (
                <div className="text-sm text-och-steel">All clear — no submissions waiting.</div>
              ) : (
                <div className="space-y-2">
                  {pendingMissions.map((s: MissionSubmission) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg bg-och-midnight/50 border border-och-steel/20 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-white font-medium truncate">{s.mission_title}</div>
                        <div className="text-xs text-och-steel mt-0.5">
                          <span className="text-white/90">{s.mentee_name}</span>
                          {' • '}
                          {new Date(s.submitted_at).toLocaleString()}
                        </div>
                      </div>
                      <Button variant="defender" size="sm" onClick={() => handleReviewNow(s.id)}>
                        Review now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alerts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white">Alerts</div>
                <Badge variant="steel" className="text-xs">{alerts.length}</Badge>
              </div>

              {alertsLoading ? (
                <div className="text-sm text-och-steel">Loading alerts…</div>
              ) : alertsError ? (
                <div className="text-sm text-och-orange">Failed to load alerts: {alertsError}</div>
              ) : alerts.length === 0 ? (
                <div className="text-sm text-och-steel">No active alerts.</div>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 4).map((a) => (
                    <div key={a.id} className="p-3 rounded-lg bg-och-midnight/50 border border-och-steel/20">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-white truncate">{a.title}</div>
                          <div className="text-xs text-och-steel mt-0.5 line-clamp-2">{a.description}</div>
                        </div>
                        <Badge variant={severityVariant(a.severity)} className="text-xs capitalize">
                          {a.severity}
                        </Badge>
                      </div>
                      {a.mentee_id && (
                        <div className="mt-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenMentee(a.mentee_id!)}>
                            Open mentee
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Right rail: sessions + at-risk mentees + quick actions */}
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Upcoming sessions</h3>
                <Link href="/dashboard/mentor/sessions">
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
              </div>

              {sessionsLoading ? (
                <div className="text-sm text-och-steel">Loading sessions…</div>
              ) : sessionsError ? (
                <div className="text-sm text-och-orange">Failed to load sessions: {sessionsError}</div>
              ) : sessions.length === 0 ? (
                <div className="text-sm text-och-steel">No sessions scheduled in the next 7 days.</div>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 3).map((s) => (
                    <div key={s.id} className="p-3 rounded-lg bg-och-midnight/50 border border-och-steel/20">
                      <div className="text-sm text-white font-medium">{s.title}</div>
                      <div className="text-xs text-och-steel mt-0.5">
                        {new Date(s.scheduled_at).toLocaleString()} • {s.duration_minutes}m
                      </div>
                      {s.meeting_link && (
                        <div className="mt-2">
                          <a href={s.meeting_link} target="_blank" rel="noreferrer">
                            <Button variant="defender" size="sm">Join</Button>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">At‑risk mentees</h3>
                <Link href="/dashboard/mentor/mentees">
                  <Button variant="outline" size="sm">View all</Button>
                </Link>
              </div>

              {menteesLoading ? (
                <div className="text-sm text-och-steel">Loading mentees…</div>
              ) : menteesError ? (
                <div className="text-sm text-och-orange">Failed to load mentees: {menteesError}</div>
              ) : atRiskMentees.length === 0 ? (
                <div className="text-sm text-och-steel">No mentees assigned yet.</div>
              ) : (
                <div className="space-y-2">
                  {atRiskMentees.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleOpenMentee(m.id)}
                      className="w-full text-left p-3 rounded-lg bg-och-midnight/50 border border-och-steel/20 hover:bg-och-midnight/70 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-white font-medium truncate">{m.name}</div>
                          <div className="text-xs text-och-steel mt-0.5">
                            Readiness: <span className="text-white/90">{m.readiness_score}%</span>
                            {m.last_activity_at ? ` • Last activity: ${new Date(m.last_activity_at).toLocaleDateString()}` : ''}
                          </div>
                        </div>
                        <Badge
                          variant={(m.risk_level === 'high' ? 'orange' : m.risk_level === 'medium' ? 'gold' : 'mint')}
                          className="text-xs capitalize"
                        >
                          {m.risk_level}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Quick actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/mentor/missions">
                  <div className="p-3 rounded-lg bg-och-midnight/50 border border-och-steel/20 hover:bg-och-midnight/70 transition-colors">
                    <div className="text-sm text-white font-medium">Mission review</div>
                    <div className="text-xs text-och-steel mt-1">Approve / request revision</div>
                  </div>
                </Link>
                <Link href="/dashboard/mentor/mentees">
                  <div className="p-3 rounded-lg bg-och-midnight/50 border border-och-steel/20 hover:bg-och-midnight/70 transition-colors">
                    <div className="text-sm text-white font-medium">Mentees</div>
                    <div className="text-xs text-och-steel mt-1">Progress & risk overview</div>
                  </div>
                </Link>
                <Link href="/dashboard/mentor/sessions">
                  <div className="p-3 rounded-lg bg-och-midnight/50 border border-och-steel/20 hover:bg-och-midnight/70 transition-colors">
                    <div className="text-sm text-white font-medium">Sessions</div>
                    <div className="text-xs text-och-steel mt-1">Schedule / reschedule</div>
                  </div>
                </Link>
                <Link href="/dashboard/mentor/analytics">
                  <div className="p-3 rounded-lg bg-och-midnight/50 border border-och-steel/20 hover:bg-och-midnight/70 transition-colors">
                    <div className="text-sm text-white font-medium">Analytics</div>
                    <div className="text-xs text-och-steel mt-1">TalentScope view</div>
                  </div>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Mission Management: browse missions by assigned track */}
      <Card className="mt-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Mission management</h2>
              <p className="text-sm text-och-steel">
                Browse missions in your assigned track(s) and jump into review when submissions arrive.
              </p>
            </div>
            <Link href="/dashboard/mentor/missions">
              <Button variant="outline" size="sm">Open Mission Review</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-och-steel mb-1">Track</label>
              <select
                value={activeTrackId || ''}
                onChange={(e) => {
                  setSelectedTrackId(e.target.value)
                  setMissionsPage(1)
                }}
                disabled={tracksLoading || assignedTracks.length === 0}
                className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender disabled:opacity-60"
              >
                {assignedTracks.length === 0 ? (
                  <option value="">No assigned tracks</option>
                ) : (
                  assignedTracks.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-och-steel mb-1">Search Missions</label>
              <input
                value={missionSearch}
                onChange={(e) => {
                  setMissionSearch(e.target.value)
                  setMissionsPage(1)
                }}
                placeholder="Search by code, title, description..."
                className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </div>

          {tracksLoading ? (
            <div className="text-och-steel text-sm">Loading assigned tracks…</div>
          ) : assignedTracks.length === 0 ? (
            <div className="text-och-steel text-sm">No cohort/track assignments found for your mentor account.</div>
          ) : missionsLoading ? (
            <div className="text-och-steel text-sm">Loading missions…</div>
          ) : (
            <>
              <div className="text-xs text-och-steel mb-3">
                Showing <span className="text-white font-semibold">{trackMissions.length}</span> of{' '}
                <span className="text-white font-semibold">{trackMissionsCount}</span> missions
              </div>
              <div className="space-y-2">
                {trackMissions.map((m) => (
                  <div key={m.id} className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:bg-och-midnight/70 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold">{m.code}</span>
                          <Badge variant="steel">{m.type}</Badge>
                          <Badge variant="gold" className="capitalize">{m.difficulty}</Badge>
                          {m.requirements?.requires_mentor_review && <Badge variant="defender">Mentor Review</Badge>}
                        </div>
                        <div className="text-sm text-white mt-1">{m.title}</div>
                        {m.description && <div className="text-xs text-och-steel mt-1 line-clamp-2">{m.description}</div>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href="/dashboard/mentor/missions">
                          <Button variant="outline" size="sm">Review</Button>
                        </Link>
                        <Link href={`/dashboard/mentor/missions`}>
                          <Button variant="outline" size="sm">Open</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {trackMissionsCount > 10 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-och-steel">
                    Page {missionsPage} of {Math.ceil(trackMissionsCount / 10)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setMissionsPage((p) => Math.max(1, p - 1))} disabled={missionsPage === 1}>
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMissionsPage((p) => p + 1)}
                      disabled={missionsPage >= Math.ceil(trackMissionsCount / 10)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
    </div>
  )
}
