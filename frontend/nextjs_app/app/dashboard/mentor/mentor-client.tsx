'use client'

import { useState } from 'react'
import { MenteesOverview } from '@/components/mentor/MenteesOverview'
import { MissionsPending } from '@/components/mentor/MissionsPending'
import { InfluenceAnalytics } from '@/components/mentor/InfluenceAnalytics'
import { TalentScopeView } from '@/components/mentor/TalentScopeView'
import { MentorProfileManagement } from '@/components/mentor/MentorProfileManagement'
import { GoalFeedback } from '@/components/mentor/GoalFeedback'
import { MenteeFlagging } from '@/components/mentor/MenteeFlagging'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
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
    status: 'pending_review',
    limit: 5,
  })
  
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
    </div>
  )
}
