'use client'

import { useState, useEffect, useMemo } from 'react'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useCohorts, useTracks, usePrograms } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'

interface Mentor {
  id: string
  email: string
  name: string
  first_name?: string
  last_name?: string
  active_assignments: number
  total_mentees: number
  max_capacity: number
  capacity_utilization: number
  session_completion_rate: number
  feedback_average: number
  impact_score: number
  flags: string[]
  cohorts: Array<{ id: string; name: string }>
  skills: string[]
  availability: string
}

interface MentorAnalytics {
  mentor_id: string
  mentor_name: string
  metrics: {
    total_mentees: number
    active_cohorts: number
    session_completion_rate: number
    feedback_average: number
    mentee_completion_rate: number
    impact_score: number
    sessions_scheduled: number
    sessions_completed: number
    sessions_missed: number
    average_session_rating: number
    mentee_satisfaction_score: number
  }
  assignments: Array<{
    id: string
    cohort_id: string
    cohort_name: string
    role: string
    mentees_count: number
    start_date: string
    end_date?: string
  }>
  cohorts: Array<{ id: string; name: string }>
  reviews: Array<{
    id: string
    cohort_id: string
    cohort_name: string
    rating: number
    feedback: string
    reviewed_at: string
  }>
  mentee_goals: Array<{
    mentee_id: string
    mentee_name: string
    goal_id: string
    goal_title: string
    status: string
    progress: number
  }>
}

interface MentorshipCycle {
  duration_weeks: number
  frequency: 'weekly' | 'bi-weekly' | 'monthly'
  milestones: string[]
  goals: string[]
  program_type: 'builders' | 'leaders' | 'custom'
}

export default function MentorsClient() {
  const { cohorts, isLoading: cohortsLoading, reload: reloadCohorts } = useCohorts()
  const { tracks } = useTracks()
  const { programs } = usePrograms()
  
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [mentorAnalytics, setMentorAnalytics] = useState<MentorAnalytics | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  
  const [assignmentMode, setAssignmentMode] = useState<'list' | 'assign' | 'auto-match' | 'cycle'>('list')
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const [selectedTrackId, setSelectedTrackId] = useState<string>('')
  const [selectedMentorId, setSelectedMentorId] = useState<string>('')
  const [assignmentRole, setAssignmentRole] = useState<'primary' | 'support' | 'guest'>('support')
  const [isAssigning, setIsAssigning] = useState(false)

  // Mentorship Cycle Configuration
  const [mentorshipCycle, setMentorshipCycle] = useState<MentorshipCycle>({
    duration_weeks: 12,
    frequency: 'bi-weekly',
    milestones: [],
    goals: [],
    program_type: 'builders',
  })
  const [newMilestone, setNewMilestone] = useState('')
  const [newGoal, setNewGoal] = useState('')

  // Reassignment
  const [reassigningAssignmentId, setReassigningAssignmentId] = useState<string | null>(null)
  const [newMentorId, setNewMentorId] = useState<string>('')

  // Cycle Closure
  const [closingCohortId, setClosingCohortId] = useState<string | null>(null)
  const [closingMentorId, setClosingMentorId] = useState<string | null>(null)

  // Notifications
  const [notificationMode, setNotificationMode] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'reminder' | 'update' | 'announcement'>('reminder')

  useEffect(() => {
    loadMentors()
  }, [searchQuery])

  const loadMentors = async () => {
    setIsLoading(true)
    try {
      const data = await programsClient.listMentors(searchQuery || undefined)
      setMentors(data)
    } catch (err) {
      console.error('Failed to load mentors:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMentorAnalytics = async (mentorId: string) => {
    setLoadingAnalytics(true)
    try {
      const data = await programsClient.getMentorAnalytics(mentorId)
      setMentorAnalytics(data)
    } catch (err) {
      console.error('Failed to load mentor analytics:', err)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const handleAutoMatch = async () => {
    if (!selectedCohortId) {
      alert('Please select a cohort')
      return
    }
    
    setIsAssigning(true)
    try {
      const result = await programsClient.autoMatchMentors(
        selectedCohortId,
        selectedTrackId || undefined,
        assignmentRole
      )
      alert(`Successfully assigned ${result.assignments.length} mentors`)
      setAssignmentMode('list')
      await reloadCohorts()
      await loadMentors()
    } catch (err: any) {
      alert(err.message || 'Failed to auto-match mentors')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleManualAssign = async () => {
    if (!selectedCohortId || !selectedMentorId) {
      alert('Please select both cohort and mentor')
      return
    }
    
    setIsAssigning(true)
    try {
      await programsClient.assignMentor(selectedCohortId, {
        mentor: selectedMentorId,
        role: assignmentRole,
      })
      alert('Mentor assigned successfully')
      setAssignmentMode('list')
      await reloadCohorts()
      await loadMentors()
    } catch (err: any) {
      alert(err.message || 'Failed to assign mentor')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this mentor assignment?')) {
      return
    }
    
    try {
      await programsClient.removeMentorAssignment(assignmentId)
      await loadMentors()
      await reloadCohorts()
      if (mentorAnalytics) {
        await loadMentorAnalytics(selectedMentor!.id)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove assignment')
    }
  }

  const handleReassign = async () => {
    if (!reassigningAssignmentId || !newMentorId) {
      alert('Please select a new mentor')
      return
    }
    
    try {
      await programsClient.reassignMentor(reassigningAssignmentId, newMentorId)
      alert('Mentor reassigned successfully')
      setReassigningAssignmentId(null)
      setNewMentorId('')
      await loadMentors()
      if (mentorAnalytics) {
        await loadMentorAnalytics(selectedMentor!.id)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reassign mentor')
    }
  }

  const handleApproveCycleClosure = async () => {
    if (!closingCohortId || !closingMentorId) {
      alert('Missing cohort or mentor information')
      return
    }
    
    if (!confirm('Approve closure of this mentorship cycle? This will finalize all feedback and generate a closure report.')) {
      return
    }
    
    try {
      await programsClient.approveCycleClosure(closingCohortId, closingMentorId)
      alert('Cycle closure approved successfully')
      setClosingCohortId(null)
      setClosingMentorId(null)
      await loadMentors()
      if (mentorAnalytics) {
        await loadMentorAnalytics(selectedMentor!.id)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve cycle closure')
    }
  }

  const handleSendNotification = async () => {
    if (!selectedCohortId || !notificationMessage) {
      alert('Please select a cohort and enter a message')
      return
    }
    
    try {
      await programsClient.sendCohortNotification(selectedCohortId, {
        type: notificationType,
        message: notificationMessage,
      })
      alert('Notification sent successfully')
      setNotificationMode(false)
      setNotificationMessage('')
    } catch (err: any) {
      alert(err.message || 'Failed to send notification')
    }
  }

  const addMilestone = () => {
    if (newMilestone.trim()) {
      setMentorshipCycle({
        ...mentorshipCycle,
        milestones: [...mentorshipCycle.milestones, newMilestone.trim()],
      })
      setNewMilestone('')
    }
  }

  const removeMilestone = (index: number) => {
    setMentorshipCycle({
      ...mentorshipCycle,
      milestones: mentorshipCycle.milestones.filter((_, i) => i !== index),
    })
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      setMentorshipCycle({
        ...mentorshipCycle,
        goals: [...mentorshipCycle.goals, newGoal.trim()],
      })
      setNewGoal('')
    }
  }

  const removeGoal = (index: number) => {
    setMentorshipCycle({
      ...mentorshipCycle,
      goals: mentorshipCycle.goals.filter((_, i) => i !== index),
    })
  }

  const filteredMentors = useMemo(() => {
    return mentors.filter(mentor => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          mentor.name.toLowerCase().includes(query) ||
          mentor.email.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [mentors, searchQuery])

  const mentorsWithFlags = useMemo(() => {
    return filteredMentors.filter(m => m.flags && m.flags.length > 0)
  }, [filteredMentors])

  const selectedCohort = useMemo(() => {
    return cohorts?.find(c => c.id === selectedCohortId)
  }, [cohorts, selectedCohortId])

  return (
    <DirectorLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-defender">Mentor Management</h1>
              <p className="text-och-steel">Manage mentors, assignments, and track performance</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/director">
                <Button variant="outline">← Back</Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={assignmentMode === 'list' ? 'defender' : 'outline'}
              size="sm"
              onClick={() => setAssignmentMode('list')}
            >
              All Mentors
            </Button>
            <Button
              variant={assignmentMode === 'assign' ? 'defender' : 'outline'}
              size="sm"
              onClick={() => setAssignmentMode('assign')}
            >
              Manual Assignment
            </Button>
            <Button
              variant={assignmentMode === 'auto-match' ? 'defender' : 'outline'}
              size="sm"
              onClick={() => setAssignmentMode('auto-match')}
            >
              Auto-Match
            </Button>
            <Button
              variant={assignmentMode === 'cycle' ? 'defender' : 'outline'}
              size="sm"
              onClick={() => setAssignmentMode('cycle')}
            >
              Define Mentorship Cycle
            </Button>
          </div>
        </div>

        {/* Mentorship Cycle Definition */}
        {assignmentMode === 'cycle' && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Define Mentorship Cycle Structure</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Duration (Weeks) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={mentorshipCycle.duration_weeks}
                      onChange={(e) => setMentorshipCycle({ ...mentorshipCycle, duration_weeks: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Session Frequency *
                    </label>
                    <select
                      value={mentorshipCycle.frequency}
                      onChange={(e) => setMentorshipCycle({ ...mentorshipCycle, frequency: e.target.value as any })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Program Type Template
                  </label>
                  <select
                    value={mentorshipCycle.program_type}
                    onChange={(e) => setMentorshipCycle({ ...mentorshipCycle, program_type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="builders">Builders (Default)</option>
                    <option value="leaders">Leaders</option>
                    <option value="custom">Custom</option>
                  </select>
                  <p className="text-xs text-och-steel mt-1">
                    Select a template or use custom configuration
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Milestones
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addMilestone()}
                      placeholder="Add milestone (e.g., Week 4: Skills Assessment)"
                      className="flex-1 px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                    <Button variant="outline" onClick={addMilestone}>Add</Button>
                  </div>
                  <div className="space-y-2">
                    {mentorshipCycle.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-och-midnight/50 rounded-lg">
                        <span className="text-white">{milestone}</span>
                        <Button variant="outline" size="sm" onClick={() => removeMilestone(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Goals
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                      placeholder="Add goal (e.g., Complete portfolio review)"
                      className="flex-1 px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                    <Button variant="outline" onClick={addGoal}>Add</Button>
                  </div>
                  <div className="space-y-2">
                    {mentorshipCycle.goals.map((goal, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-och-midnight/50 rounded-lg">
                        <span className="text-white">{goal}</span>
                        <Button variant="outline" size="sm" onClick={() => removeGoal(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setAssignmentMode('list')}>
                    Cancel
                  </Button>
                  <Button variant="defender" onClick={() => {
                    // Save mentorship cycle configuration
                    alert('Mentorship cycle configuration saved')
                    setAssignmentMode('list')
                  }}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Manual Assignment / Auto-Match Form */}
        {(assignmentMode === 'assign' || assignmentMode === 'auto-match') && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {assignmentMode === 'auto-match' ? 'Auto-Match Mentors' : 'Manual Assignment'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Select Cohort *
                  </label>
                  <select
                    required
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    disabled={cohortsLoading}
                  >
                    <option value="">Select a cohort</option>
                    {cohorts?.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name} {cohort.track_name && `(${cohort.track_name})`}
                      </option>
                    ))}
                  </select>
                </div>

                {assignmentMode === 'auto-match' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Track (Optional - for track-specific matching)
                      </label>
                      <select
                        value={selectedTrackId}
                        onChange={(e) => setSelectedTrackId(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="">All tracks</option>
                        {tracks?.map((track) => (
                          <option key={track.id} value={track.id}>
                            {track.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Assignment Role
                      </label>
                      <select
                        value={assignmentRole}
                        onChange={(e) => setAssignmentRole(e.target.value as any)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="primary">Primary</option>
                        <option value="support">Support</option>
                        <option value="guest">Guest</option>
                      </select>
                    </div>

                    <div className="bg-och-mint/10 border border-och-mint/30 rounded-lg p-4">
                      <p className="text-sm text-och-steel mb-2">
                        <strong>Auto-Match Algorithm:</strong> Matches mentors to mentees based on:
                      </p>
                      <ul className="text-xs text-och-steel space-y-1 list-disc list-inside">
                        <li>Skills overlap from Profiling Module (profiling.matching_features)</li>
                        <li>Mentor availability and capacity</li>
                        <li>Track alignment</li>
                        <li>Career alignment and preferences</li>
                        <li>Personality compatibility (if available)</li>
                      </ul>
                      <p className="text-xs text-och-steel mt-2">
                        <strong>Weighted Scoring:</strong> The algorithm uses weighted factors to generate optimal matches.
                      </p>
                    </div>
                  </>
                )}

                {assignmentMode === 'assign' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Select Mentor *
                      </label>
                      <select
                        required
                        value={selectedMentorId}
                        onChange={(e) => setSelectedMentorId(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="">Select a mentor</option>
                        {mentors.map((mentor) => (
                          <option key={mentor.id} value={mentor.id}>
                            {mentor.name} ({mentor.total_mentees} mentees, {mentor.capacity_utilization.toFixed(0)}% capacity)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Assignment Role
                      </label>
                      <select
                        value={assignmentRole}
                        onChange={(e) => setAssignmentRole(e.target.value as any)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="primary">Primary</option>
                        <option value="support">Support</option>
                        <option value="guest">Guest</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAssignmentMode('list')}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="defender"
                    onClick={assignmentMode === 'auto-match' ? handleAutoMatch : handleManualAssign}
                    disabled={isAssigning || !selectedCohortId || (assignmentMode === 'assign' && !selectedMentorId)}
                  >
                    {isAssigning ? 'Processing...' : assignmentMode === 'auto-match' ? 'Run Auto-Match' : 'Assign Mentor'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Mentors List View */}
        {assignmentMode === 'list' && (
          <>
            {/* Search and Filters */}
            <Card className="mb-6">
              <div className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search mentors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  {selectedCohortId && (
                    <Button
                      variant="outline"
                      onClick={() => setNotificationMode(true)}
                    >
                      📧 Send Notification
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Notification Modal */}
            {notificationMode && (
              <Card className="mb-6 border-och-defender/50">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Send Cohort Notification</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Select Cohort
                      </label>
                      <select
                        value={selectedCohortId}
                        onChange={(e) => setSelectedCohortId(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="">Select a cohort</option>
                        {cohorts?.map((cohort) => (
                          <option key={cohort.id} value={cohort.id}>
                            {cohort.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Notification Type
                      </label>
                      <select
                        value={notificationType}
                        onChange={(e) => setNotificationType(e.target.value as any)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="reminder">Reminder</option>
                        <option value="update">Update</option>
                        <option value="announcement">Announcement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Message *
                      </label>
                      <textarea
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        placeholder="Enter notification message..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => {
                        setNotificationMode(false)
                        setNotificationMessage('')
                      }}>
                        Cancel
                      </Button>
                      <Button variant="defender" onClick={handleSendNotification}>
                        Send Notification
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Alerts for Mentors with Flags */}
            {mentorsWithFlags.length > 0 && (
              <Card className="mb-6 border-och-orange/30">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">⚠️</span>
                    <h3 className="text-lg font-semibold text-och-orange">
                      Mentors Requiring Attention ({mentorsWithFlags.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {mentorsWithFlags.slice(0, 3).map((mentor) => (
                      <div key={mentor.id} className="flex items-center justify-between p-2 bg-och-midnight/50 rounded">
                        <span className="text-white">{mentor.name}</span>
                        <div className="flex gap-2">
                          {mentor.flags.map((flag) => (
                            <Badge key={flag} variant="orange" className="text-xs">
                              {flag.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Mentors Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
                <p className="text-och-steel">Loading mentors...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
                  <Card
                    key={mentor.id}
                    className={`cursor-pointer transition-all hover:border-och-defender ${
                      mentor.flags && mentor.flags.length > 0 ? 'border-och-orange/30' : ''
                    }`}
                    onClick={() => {
                      setSelectedMentor(mentor)
                      loadMentorAnalytics(mentor.id)
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{mentor.name}</h3>
                          <p className="text-sm text-och-steel">{mentor.email}</p>
                        </div>
                        {mentor.flags && mentor.flags.length > 0 && (
                          <Badge variant="orange">⚠️</Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-och-steel">Capacity Utilization</span>
                            <span className={`font-medium ${
                              mentor.capacity_utilization > 100 ? 'text-och-orange' :
                              mentor.capacity_utilization > 80 ? 'text-och-gold' :
                              'text-white'
                            }`}>
                              {mentor.capacity_utilization.toFixed(0)}%
                            </span>
                          </div>
                          <ProgressBar
                            value={Math.min(mentor.capacity_utilization, 100)}
                            variant={mentor.capacity_utilization > 100 ? 'orange' : 'mint'}
                            className="h-2"
                          />
                          <p className="text-xs text-och-steel mt-1">
                            {mentor.total_mentees} / {mentor.max_capacity} mentees
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-och-steel">Session Completion</p>
                            <p className="text-white font-semibold">{mentor.session_completion_rate.toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-och-steel">Feedback Avg</p>
                            <p className="text-white font-semibold">{mentor.feedback_average.toFixed(1)}/5.0</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-och-steel text-sm mb-1">Impact Score</p>
                          <div className="flex items-center gap-2">
                            <ProgressBar value={mentor.impact_score} variant="defender" className="flex-1 h-2" />
                            <span className="text-white font-semibold text-sm">{mentor.impact_score.toFixed(0)}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-och-steel text-xs mb-1">Active Assignments</p>
                          <p className="text-white font-medium">{mentor.active_assignments} cohorts</p>
                        </div>

                        {mentor.cohorts && mentor.cohorts.length > 0 && (
                          <div>
                            <p className="text-och-steel text-xs mb-1">Cohorts</p>
                            <div className="flex flex-wrap gap-1">
                              {mentor.cohorts.slice(0, 3).map((cohort) => (
                                <Badge key={cohort.id} variant="defender" className="text-xs">
                                  {cohort.name}
                                </Badge>
                              ))}
                              {mentor.cohorts.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{mentor.cohorts.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {filteredMentors.length === 0 && !isLoading && (
              <Card>
                <div className="p-12 text-center">
                  <p className="text-och-steel mb-4">No mentors found</p>
                  {searchQuery && (
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Mentor Analytics Modal/Sidebar */}
        {selectedMentor && mentorAnalytics && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedMentor.name}</h2>
                    <p className="text-och-steel">{selectedMentor.email}</p>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setSelectedMentor(null)
                    setMentorAnalytics(null)
                  }}>
                    Close
                  </Button>
                </div>

                {loadingAnalytics ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading analytics...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Performance Metrics */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Performance Analytics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Total Mentees</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.total_mentees}</p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Active Cohorts</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.active_cohorts}</p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Session Completion</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.session_completion_rate.toFixed(0)}%</p>
                            <ProgressBar value={mentorAnalytics.metrics.session_completion_rate} variant="mint" className="mt-2 h-2" />
                            <p className="text-xs text-och-steel mt-1">
                              {mentorAnalytics.metrics.sessions_completed} / {mentorAnalytics.metrics.sessions_scheduled} sessions
                            </p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Feedback Average</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.feedback_average.toFixed(1)}</p>
                            <p className="text-xs text-och-steel mt-1">out of 5.0</p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Mentee Completion</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.mentee_completion_rate.toFixed(0)}%</p>
                            <ProgressBar value={mentorAnalytics.metrics.mentee_completion_rate} variant="defender" className="mt-2 h-2" />
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Impact Score</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.impact_score.toFixed(0)}</p>
                            <ProgressBar value={mentorAnalytics.metrics.impact_score} variant="gold" className="mt-2 h-2" />
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Sessions Missed</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.sessions_missed}</p>
                            {mentorAnalytics.metrics.sessions_missed > 0 && (
                              <Badge variant="orange" className="mt-2">⚠️ Below SLA</Badge>
                            )}
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Avg Session Rating</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.average_session_rating.toFixed(1)}</p>
                            <p className="text-xs text-och-steel mt-1">out of 5.0</p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Mentee Satisfaction</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.mentee_satisfaction_score.toFixed(0)}%</p>
                            <ProgressBar value={mentorAnalytics.metrics.mentee_satisfaction_score} variant="mint" className="mt-2 h-2" />
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Assignments with Reassignment */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Active Assignments</h3>
                      <div className="space-y-2">
                        {mentorAnalytics.assignments.map((assignment) => (
                          <div key={assignment.id} className="p-4 bg-och-midnight/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-white font-medium">{assignment.cohort_name}</p>
                                <p className="text-sm text-och-steel">
                                  Role: {assignment.role} • {assignment.mentees_count} mentees
                                </p>
                                {assignment.start_date && (
                                  <p className="text-xs text-och-steel">
                                    {new Date(assignment.start_date).toLocaleDateString()} - {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Ongoing'}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={assignment.role === 'primary' ? 'mint' : 'defender'}>
                                  {assignment.role}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReassigningAssignmentId(assignment.id)
                                    setNewMentorId('')
                                  }}
                                >
                                  Reassign
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAssignment(assignment.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                            {reassigningAssignmentId === assignment.id && (
                              <div className="mt-3 p-3 bg-och-midnight rounded-lg border border-och-defender/30">
                                <label className="block text-sm font-medium text-white mb-2">
                                  Select New Mentor
                                </label>
                                <div className="flex gap-2">
                                  <select
                                    value={newMentorId}
                                    onChange={(e) => setNewMentorId(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                  >
                                    <option value="">Select mentor...</option>
                                    {mentors.filter(m => m.id !== selectedMentor.id).map((mentor) => (
                                      <option key={mentor.id} value={mentor.id}>
                                        {mentor.name} ({mentor.capacity_utilization.toFixed(0)}% capacity)
                                      </option>
                                    ))}
                                  </select>
                                  <Button variant="defender" size="sm" onClick={handleReassign} disabled={!newMentorId}>
                                    Confirm
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setReassigningAssignmentId(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mentor Reviews */}
                    {mentorAnalytics.reviews && mentorAnalytics.reviews.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Mentor Reviews</h3>
                        <div className="space-y-2">
                          {mentorAnalytics.reviews.map((review) => (
                            <div key={review.id} className="p-4 bg-och-midnight/50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-white font-medium">{review.cohort_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-och-gold text-sm">⭐ {review.rating}/5</span>
                                    <span className="text-xs text-och-steel">
                                      {new Date(review.reviewed_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-och-steel mt-2">{review.feedback}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mentee Goals Management */}
                    {mentorAnalytics.mentee_goals && mentorAnalytics.mentee_goals.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Mentee Goals</h3>
                        <div className="space-y-2">
                          {mentorAnalytics.mentee_goals.map((goal) => (
                            <div key={goal.goal_id} className="p-4 bg-och-midnight/50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-white font-medium">{goal.goal_title}</p>
                                  <p className="text-sm text-och-steel">Mentee: {goal.mentee_name}</p>
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-och-steel">Progress</span>
                                      <span className="text-white">{goal.progress}%</span>
                                    </div>
                                    <ProgressBar value={goal.progress} variant="mint" className="h-2" />
                                  </div>
                                  <Badge variant={goal.status === 'completed' ? 'mint' : 'defender'} className="mt-2">
                                    {goal.status}
                                  </Badge>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const updates = prompt('Enter goal updates (JSON format):')
                                    if (updates) {
                                      try {
                                        await programsClient.updateMenteeGoal(goal.mentee_id, goal.goal_id, JSON.parse(updates))
                                        alert('Goal updated successfully')
                                        await loadMentorAnalytics(selectedMentor.id)
                                      } catch (err) {
                                        alert('Failed to update goal')
                                      }
                                    }
                                  }}
                                >
                                  Adjust
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cycle Closure Approval */}
                    {mentorAnalytics.assignments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Cycle Closure</h3>
                        <div className="space-y-2">
                          {mentorAnalytics.assignments.map((assignment) => (
                            <div key={assignment.id} className="p-4 bg-och-midnight/50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-medium">{assignment.cohort_name}</p>
                                  <p className="text-sm text-och-steel">
                                    Check all feedback submitted and flag missing sessions before closure
                                  </p>
                                </div>
                                <Button
                                  variant="defender"
                                  size="sm"
                                  onClick={() => {
                                    setClosingCohortId(assignment.cohort_id)
                                    setClosingMentorId(selectedMentor.id)
                                  }}
                                >
                                  Approve Closure
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cohorts */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Cohorts</h3>
                      <div className="flex flex-wrap gap-2">
                        {mentorAnalytics.cohorts.map((cohort) => (
                          <Link key={cohort.id} href={`/dashboard/director/cohorts/${cohort.id}`}>
                            <Badge variant="defender" className="cursor-pointer hover:bg-och-defender/80">
                              {cohort.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Cycle Closure Confirmation Modal */}
        {closingCohortId && closingMentorId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Approve Cycle Closure</h3>
                <p className="text-och-steel mb-4">
                  This will finalize all feedback and generate a closure report. Are you sure?
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => {
                    setClosingCohortId(null)
                    setClosingMentorId(null)
                  }}>
                    Cancel
                  </Button>
                  <Button variant="defender" onClick={handleApproveCycleClosure}>
                    Approve Closure
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DirectorLayout>
  )
}
