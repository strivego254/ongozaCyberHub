'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCreateCohort, useTracks, usePrograms } from '@/hooks/usePrograms'
import { programsClient, type Cohort, type CalendarEvent } from '@/services/programsClient'
import { apiGateway } from '@/services/apiGateway'

interface SeatPool {
  paid: number
  scholarship: number
  sponsored: number
}

interface MilestoneEvent {
  type: 'orientation' | 'mentorship' | 'session' | 'project_review' | 'submission' | 'closure'
  title: string
  description: string
  start_ts: string
  end_ts: string
  timezone: string
  location?: string
  link?: string
  completion_tracked: boolean
  milestone_id?: string
}

interface ProgramRule {
  attendance_percent?: number
  portfolio_approved?: boolean
  feedback_score?: number
  payment_complete?: boolean
}

export default function CreateCohortClient() {
  const router = useRouter()
  const { createCohort, isLoading, error } = useCreateCohort()
  const { programs, isLoading: programsLoading } = usePrograms()
  const { tracks, isLoading: tracksLoading } = useTracks()
  
  const [step, setStep] = useState<'core' | 'capacity' | 'schedule' | 'rules' | 'review'>('core')
  
  const [formData, setFormData] = useState<Partial<Cohort>>({
    track: '',
    name: '',
    start_date: '',
    end_date: '',
    mode: 'virtual',
    seat_cap: 20,
    mentor_ratio: 0.1,
    status: 'draft',
    seat_pool: { paid: 0, scholarship: 0, sponsored: 0 },
    coordinator: null,
  })

  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [availableTracks, setAvailableTracks] = useState<any[]>([])
  const [timezone, setTimezone] = useState('UTC')
  const [calendarTemplateId, setCalendarTemplateId] = useState<string>('')
  const [milestoneEvents, setMilestoneEvents] = useState<MilestoneEvent[]>([])
  const [enrollmentMethods, setEnrollmentMethods] = useState<string[]>(['director', 'invite'])
  const [programRules, setProgramRules] = useState<ProgramRule>({})
  const [mentorAssignmentMode, setMentorAssignmentMode] = useState<'auto' | 'manual'>('auto')
  const [selectedMentors, setSelectedMentors] = useState<string[]>([])

  // Filter tracks by selected program
  useEffect(() => {
    if (selectedProgramId && tracks) {
      const programTracks = tracks.filter(t => t.program === selectedProgramId)
      setAvailableTracks(programTracks)
      if (programTracks.length > 0 && !formData.track) {
        setFormData({ ...formData, track: programTracks[0].id })
      }
    }
  }, [selectedProgramId, tracks])

  const selectedProgram = useMemo(() => {
    return programs.find(p => p.id === selectedProgramId)
  }, [programs, selectedProgramId])

  const selectedTrack = useMemo(() => {
    return tracks.find(t => t.id === formData.track)
  }, [tracks, formData.track])

  const addMilestoneEvent = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextDay = new Date(tomorrow)
    nextDay.setDate(nextDay.getDate() + 1)
    
    setMilestoneEvents([
      ...milestoneEvents,
      {
        type: 'orientation',
        title: '',
        description: '',
        start_ts: tomorrow.toISOString().slice(0, 16),
        end_ts: nextDay.toISOString().slice(0, 16),
        timezone: timezone,
        completion_tracked: false,
      }
    ])
  }

  const updateMilestoneEvent = (index: number, data: Partial<MilestoneEvent>) => {
    const updated = [...milestoneEvents]
    updated[index] = { ...updated[index], ...data }
    setMilestoneEvents(updated)
  }

  const removeMilestoneEvent = (index: number) => {
    setMilestoneEvents(milestoneEvents.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Prepare cohort data
      const cohortData = {
        ...formData,
        seat_pool: formData.seat_pool || { paid: 0, scholarship: 0, sponsored: 0 },
        calendar_template_id: calendarTemplateId || null,
      }

      // Create cohort
      const cohort = await createCohort(cohortData)

      // Create calendar events if milestones are defined
      if (milestoneEvents.length > 0 && cohort.id) {
        for (const event of milestoneEvents) {
          try {
            await programsClient.createCalendarEvent(cohort.id, {
              type: event.type,
              title: event.title,
              description: event.description,
              start_ts: event.start_ts,
              end_ts: event.end_ts,
              timezone: event.timezone,
              location: event.location || '',
              link: event.link || '',
              completion_tracked: event.completion_tracked,
              milestone_id: event.milestone_id,
            })
          } catch (err) {
            console.error('Failed to create calendar event:', err)
          }
        }
      }

      // Assign mentors if manual mode
      if (mentorAssignmentMode === 'manual' && selectedMentors.length > 0 && cohort.id) {
        for (const mentorId of selectedMentors) {
          try {
            await programsClient.assignMentor(cohort.id, {
              mentor: mentorId,
              role: 'support',
            })
          } catch (err) {
            console.error('Failed to assign mentor:', err)
          }
        }
      }

      // Create program rules if defined
      if (Object.keys(programRules).length > 0 && selectedProgramId) {
        try {
          await programsClient.createProgramRule({
            program: selectedProgramId,
            rule: {
              criteria: programRules,
              thresholds: {},
              dependencies: [],
            },
            active: true,
          })
        } catch (err) {
          console.error('Failed to create program rule:', err)
        }
      }

      router.push(`/dashboard/director/cohorts/${cohort.id}`)
    } catch (err) {
      console.error('Failed to create cohort:', err)
    }
  }

  const totalSeatsAllocated = useMemo(() => {
    const pool = formData.seat_pool as SeatPool || { paid: 0, scholarship: 0, sponsored: 0 }
    return (pool.paid || 0) + (pool.scholarship || 0) + (pool.sponsored || 0)
  }, [formData.seat_pool])

  const seatsRemaining = useMemo(() => {
    return (formData.seat_cap || 0) - totalSeatsAllocated
  }, [formData.seat_cap, totalSeatsAllocated])

  return (
    <DirectorLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-defender">Create New Cohort</h1>
          <p className="text-och-steel">Define a cohort with complete operational context, schedule, and rules</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto">
          {(['core', 'capacity', 'schedule', 'rules', 'review'] as const).map((stepName, idx) => (
            <div key={stepName} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step === stepName
                    ? 'bg-och-defender text-white'
                    : ['core', 'capacity', 'schedule', 'rules'].indexOf(step) >= idx
                    ? 'bg-och-mint text-och-midnight'
                    : 'bg-och-midnight/50 text-och-steel'
                }`}
              >
                {idx + 1}
              </div>
              <span className={`text-sm font-medium ${
                step === stepName ? 'text-och-defender' : 'text-och-steel'
              }`}>
                {stepName === 'core' ? 'Core' : stepName === 'capacity' ? 'Capacity' : stepName === 'schedule' ? 'Schedule' : stepName === 'rules' ? 'Rules' : 'Review'}
              </span>
              {idx < 4 && <span className="text-och-steel mx-2">→</span>}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Core Definition */}
          {step === 'core' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Core Definition</h2>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Program *
                  </label>
                  <select
                    required
                    value={selectedProgramId}
                    onChange={(e) => {
                      setSelectedProgramId(e.target.value)
                      setFormData({ ...formData, track: '' })
                    }}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    disabled={programsLoading}
                  >
                    <option value="">Select a program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProgramId && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Track *
                    </label>
                    <select
                      required
                      value={formData.track}
                      onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      disabled={tracksLoading || !selectedProgramId}
                    >
                      <option value="">Select a track</option>
                      {availableTracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Cohort Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="e.g., Jan 2026 Cohort"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Delivery Mode *
                  </label>
                  <select
                    required
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="virtual">Virtual</option>
                    <option value="onsite">Onsite</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="running">Running</option>
                  </select>
                  <p className="text-xs text-och-steel mt-1">
                    Lifecycle: draft → active → running → closing → closed
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="defender"
                    onClick={() => setStep('capacity')}
                  >
                    Next: Capacity & Resources
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Capacity and Resource Allocation */}
          {step === 'capacity' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Capacity & Resource Allocation</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Seat Capacity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.seat_cap}
                      onChange={(e) => setFormData({ ...formData, seat_cap: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Mentor Ratio (e.g., 0.1 = 1:10) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.mentor_ratio}
                      onChange={(e) => setFormData({ ...formData, mentor_ratio: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                    <p className="text-xs text-och-steel mt-1">
                      Recommended: 0.1 (1 mentor per 10 students)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Seat Pool Breakdown
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-och-steel mb-1">Paid Seats</label>
                      <input
                        type="number"
                        min="0"
                        value={(formData.seat_pool as SeatPool)?.paid || 0}
                        onChange={(e) => {
                          const pool = { ...(formData.seat_pool as SeatPool || { paid: 0, scholarship: 0, sponsored: 0 }), paid: parseInt(e.target.value) || 0 }
                          setFormData({ ...formData, seat_pool: pool })
                        }}
                        className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-och-steel mb-1">Scholarship Seats</label>
                      <input
                        type="number"
                        min="0"
                        value={(formData.seat_pool as SeatPool)?.scholarship || 0}
                        onChange={(e) => {
                          const pool = { ...(formData.seat_pool as SeatPool || { paid: 0, scholarship: 0, sponsored: 0 }), scholarship: parseInt(e.target.value) || 0 }
                          setFormData({ ...formData, seat_pool: pool })
                        }}
                        className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-och-steel mb-1">Sponsored Seats</label>
                      <input
                        type="number"
                        min="0"
                        value={(formData.seat_pool as SeatPool)?.sponsored || 0}
                        onChange={(e) => {
                          const pool = { ...(formData.seat_pool as SeatPool || { paid: 0, scholarship: 0, sponsored: 0 }), sponsored: parseInt(e.target.value) || 0 }
                          setFormData({ ...formData, seat_pool: pool })
                        }}
                        className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-och-steel">Total Allocated:</span>
                    <span className={`font-medium ${totalSeatsAllocated > (formData.seat_cap || 0) ? 'text-och-orange' : 'text-white'}`}>
                      {totalSeatsAllocated}
                    </span>
                    <span className="text-och-steel">/ {formData.seat_cap}</span>
                    {seatsRemaining < 0 && (
                      <Badge variant="orange" className="ml-2">Over capacity!</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Mentor Assignment Mode
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="auto"
                        checked={mentorAssignmentMode === 'auto'}
                        onChange={(e) => setMentorAssignmentMode(e.target.value as 'auto' | 'manual')}
                        className="text-och-defender"
                      />
                      <span className="text-white">Auto-match (by availability & skillset)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="manual"
                        checked={mentorAssignmentMode === 'manual'}
                        onChange={(e) => setMentorAssignmentMode(e.target.value as 'auto' | 'manual')}
                        className="text-och-defender"
                      />
                      <span className="text-white">Manual Assignment</span>
                    </label>
                  </div>
                  {mentorAssignmentMode === 'manual' && (
                    <div>
                      <p className="text-sm text-och-steel mb-2">
                        Manual mentor assignment will be available after cohort creation
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('core')}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    variant="defender"
                    onClick={() => setStep('schedule')}
                  >
                    Next: Schedule & Milestones
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Scheduling and Milestones */}
          {step === 'schedule' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Scheduling & Milestones</h2>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Timezone *
                  </label>
                  <select
                    required
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                    <option value="America/Denver">America/Denver (MST/MDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Calendar Template (Optional)
                  </label>
                  <select
                    value={calendarTemplateId}
                    onChange={(e) => setCalendarTemplateId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="">Create from scratch</option>
                    <option value="template-1">Standard 6-Month Program</option>
                    <option value="template-2">Intensive 3-Month Program</option>
                  </select>
                  <p className="text-xs text-och-steel mt-1">
                    Select a template or create a custom calendar
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-white">
                      Milestone Events
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMilestoneEvent}
                    >
                      + Add Event
                    </Button>
                  </div>

                  {milestoneEvents.length === 0 ? (
                    <div className="text-center py-8 text-och-steel border border-och-steel/20 rounded-lg">
                      <p>No milestone events added yet.</p>
                      <p className="text-xs mt-1">Add orientation, sessions, reviews, and closure events</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {milestoneEvents.map((event, index) => (
                        <Card key={index} className="border-och-defender/30">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-och-defender">
                                Event {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeMilestoneEvent(index)}
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Event Type *</label>
                                  <select
                                    required
                                    value={event.type}
                                    onChange={(e) => updateMilestoneEvent(index, { type: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                  >
                                    <option value="orientation">Orientation</option>
                                    <option value="mentorship">Mentorship Session</option>
                                    <option value="session">Training Session</option>
                                    <option value="project_review">Project Review</option>
                                    <option value="submission">Submission Deadline</option>
                                    <option value="closure">Closure</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Title *</label>
                                  <input
                                    type="text"
                                    required
                                    value={event.title}
                                    onChange={(e) => updateMilestoneEvent(index, { title: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                    placeholder="e.g., Orientation Session"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs text-och-steel mb-1">Description</label>
                                <textarea
                                  value={event.description}
                                  onChange={(e) => updateMilestoneEvent(index, { description: e.target.value })}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Start Date & Time *</label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={event.start_ts}
                                    onChange={(e) => updateMilestoneEvent(index, { start_ts: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">End Date & Time *</label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={event.end_ts}
                                    onChange={(e) => updateMilestoneEvent(index, { end_ts: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={event.location || ''}
                                    onChange={(e) => updateMilestoneEvent(index, { location: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                    placeholder="Physical location or meeting room"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Meeting Link</label>
                                  <input
                                    type="url"
                                    value={event.link || ''}
                                    onChange={(e) => updateMilestoneEvent(index, { link: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                    placeholder="https://..."
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={event.completion_tracked}
                                    onChange={(e) => updateMilestoneEvent(index, { completion_tracked: e.target.checked })}
                                    className="text-och-defender"
                                  />
                                  <span className="text-xs text-och-steel">Track completion for this event</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('capacity')}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    variant="defender"
                    onClick={() => setStep('rules')}
                  >
                    Next: Enrollment & Rules
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 4: Enrollment and Closure Rules */}
          {step === 'rules' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Enrollment & Closure Rules</h2>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Allowed Enrollment Methods
                  </label>
                  <div className="space-y-2">
                    {['self', 'invite', 'sponsor', 'director'].map((method) => (
                      <label key={method} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enrollmentMethods.includes(method)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEnrollmentMethods([...enrollmentMethods, method])
                            } else {
                              setEnrollmentMethods(enrollmentMethods.filter(m => m !== method))
                            }
                          }}
                          className="text-och-defender"
                        />
                        <span className="text-white capitalize">
                          {method === 'self' ? 'Self-enroll' : method === 'invite' ? 'Invite' : method === 'sponsor' ? 'Sponsor assign' : 'Director assign'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Program Success Metrics (Auto-Graduation Rules)
                  </label>
                  <div className="space-y-4 bg-och-midnight/30 p-4 rounded-lg">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={programRules.portfolio_approved || false}
                          onChange={(e) => setProgramRules({ ...programRules, portfolio_approved: e.target.checked })}
                          className="text-och-defender"
                        />
                        <span className="text-white">Portfolio Approval Required</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={programRules.payment_complete || false}
                          onChange={(e) => setProgramRules({ ...programRules, payment_complete: e.target.checked })}
                          className="text-och-defender"
                        />
                        <span className="text-white">Payment Complete Required</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm text-och-steel mb-2">
                        Minimum Attendance Percentage
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={programRules.attendance_percent || ''}
                          onChange={(e) => setProgramRules({ ...programRules, attendance_percent: parseInt(e.target.value) || undefined })}
                          className="w-24 px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          placeholder="80"
                        />
                        <span className="text-och-steel">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-och-steel mb-2">
                        Minimum Feedback Score
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={programRules.feedback_score || ''}
                          onChange={(e) => setProgramRules({ ...programRules, feedback_score: parseFloat(e.target.value) || undefined })}
                          className="w-24 px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          placeholder="4.0"
                        />
                        <span className="text-och-steel">out of 5.0</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-och-steel mt-2">
                    These rules will be used for auto-graduation when all criteria are met
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('schedule')}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    variant="defender"
                    onClick={() => setStep('review')}
                  >
                    Review & Create
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 5: Review */}
          {step === 'review' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Review Cohort Configuration</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-och-defender mb-2">Core Details</h3>
                    <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-och-steel">Program:</span> <span className="text-white">{selectedProgram?.name || 'N/A'}</span></p>
                      <p><span className="text-och-steel">Track:</span> <span className="text-white">{selectedTrack?.name || 'N/A'}</span></p>
                      <p><span className="text-och-steel">Cohort Name:</span> <span className="text-white">{formData.name}</span></p>
                      <p><span className="text-och-steel">Duration:</span> <span className="text-white">{formData.start_date} to {formData.end_date}</span></p>
                      <p><span className="text-och-steel">Mode:</span> <span className="text-white capitalize">{formData.mode}</span></p>
                      <p><span className="text-och-steel">Status:</span> <span className="text-white capitalize">{formData.status}</span></p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-och-defender mb-2">Capacity</h3>
                    <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-och-steel">Seat Capacity:</span> <span className="text-white">{formData.seat_cap}</span></p>
                      <p><span className="text-och-steel">Mentor Ratio:</span> <span className="text-white">1:{Math.round(1 / (formData.mentor_ratio || 0.1))}</span></p>
                      <p><span className="text-och-steel">Seat Pool:</span> <span className="text-white">
                        Paid: {(formData.seat_pool as SeatPool)?.paid || 0}, 
                        Scholarship: {(formData.seat_pool as SeatPool)?.scholarship || 0}, 
                        Sponsored: {(formData.seat_pool as SeatPool)?.sponsored || 0}
                      </span></p>
                      <p><span className="text-och-steel">Mentor Assignment:</span> <span className="text-white capitalize">{mentorAssignmentMode}</span></p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-och-defender mb-2">Schedule</h3>
                    <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-och-steel">Timezone:</span> <span className="text-white">{timezone}</span></p>
                      <p><span className="text-och-steel">Milestone Events:</span> <span className="text-white">{milestoneEvents.length}</span></p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-och-defender mb-2">Enrollment & Rules</h3>
                    <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-och-steel">Enrollment Methods:</span> <span className="text-white">{enrollmentMethods.map(m => m === 'self' ? 'Self-enroll' : m === 'invite' ? 'Invite' : m === 'sponsor' ? 'Sponsor' : 'Director').join(', ')}</span></p>
                      <p><span className="text-och-steel">Program Rules:</span> <span className="text-white">
                        {Object.keys(programRules).length > 0 ? Object.entries(programRules).map(([k, v]) => `${k}: ${v}`).join(', ') : 'None'}
                      </span></p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-och-orange/20 border border-och-orange rounded-lg text-och-orange">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('rules')}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    variant="defender"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Cohort'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </form>
      </div>
    </DirectorLayout>
  )
}
