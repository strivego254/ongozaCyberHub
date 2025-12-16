'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePrograms, useCohorts, useTracks, useCohort, useTrack } from '@/hooks/usePrograms'
import { programsClient, type Milestone } from '@/services/programsClient'
import Link from 'next/link'

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

interface AssessmentWindow {
  id?: string
  name: string
  description?: string
  cohort_id: string
  cohort_name?: string
  start_date: string
  end_date: string
  start_datetime?: string // Full datetime with time
  end_datetime?: string // Full datetime with time
  timezone?: string
  type: 'profiler' | 'mission' | 'capstone' | 'portfolio' | 'milestone' | 'final'
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  milestone_id?: string
  milestone_name?: string
  recurrence_rule?: string // RRULE for recurring assessments
  requirements?: {
    min_submissions?: number
    passing_score?: number
    mandatory?: boolean
  }
  reminder_hours_before?: number // Hours before deadline to send reminder
  created_at?: string
}

export default function AssessmentsPage() {
  const { programs } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  // Fetch tracks for the selected program
  const { tracks, isLoading: tracksLoading } = useTracks(selectedProgramId || undefined)
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 9999 })

  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const { cohort: selectedCohortData, isLoading: loadingCohortData } = useCohort(selectedCohortId || '')
  const { track: selectedTrackData, isLoading: loadingTrackData } = useTrack(selectedCohortData?.track || '')

  const [assessmentWindows, setAssessmentWindows] = useState<AssessmentWindow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<AssessmentWindow | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Get user's timezone or default to UTC
  const userTimezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }, [])

  const [formData, setFormData] = useState<Partial<AssessmentWindow>>({
    name: '',
    description: '',
    cohort_id: '',
    start_date: '',
    end_date: '',
    start_datetime: '',
    end_datetime: '',
    timezone: userTimezone,
    type: 'mission',
    status: 'scheduled',
    milestone_id: '',
    recurrence_rule: '',
    reminder_hours_before: 48,
    requirements: {
      min_submissions: 1,
      passing_score: 70,
      mandatory: true,
    },
  })

  // Filter cohorts based on selected program's tracks
  const filteredCohorts = selectedProgramId && tracks.length > 0
    ? cohorts.filter(c => {
        // Check if cohort's track belongs to the selected program
        const track = tracks.find(t => t.id === c.track)
        return track !== undefined
      })
    : selectedProgramId
    ? [] // If program is selected but no tracks loaded yet, show empty
    : cohorts // If no program selected, show all cohorts

  useEffect(() => {
    if (selectedCohortId) {
      loadAssessmentWindows()
    } else {
      setAssessmentWindows([])
    }
  }, [selectedCohortId])

  const loadAssessmentWindows = async () => {
    if (!selectedCohortId) return

    setIsLoading(true)
    try {
      // Load calendar events for the cohort (assessment windows are calendar events)
      const calendarEvents = await programsClient.getCohortCalendar(selectedCohortId)
      
      // Filter calendar events that are assessment-related
      // Include orientation for profiler, submission for missions, project_review for capstone
      const assessmentTypes = ['orientation', 'project_review', 'submission', 'closure']
      const assessments = calendarEvents
        .filter(event => assessmentTypes.includes(event.type))
        .map(event => {
          // Map calendar event status back to assessment status
          const statusMap: Record<string, 'scheduled' | 'active' | 'completed' | 'cancelled'> = {
            'scheduled': 'scheduled',
            'done': 'completed',
            'cancelled': 'cancelled',
          }
          
          // Map calendar event type to assessment type
          const typeMap: Record<string, 'profiler' | 'mission' | 'capstone' | 'portfolio' | 'milestone' | 'final'> = {
            'orientation': 'profiler', // Profiler window is typically during orientation
            'submission': 'mission',
            'project_review': 'capstone',
            'closure': 'final',
          }

          // Extract date and datetime from event
          const startDate = event.start_ts ? (event.start_ts.includes('T') ? event.start_ts.split('T')[0] : event.start_ts) : ''
          const endDate = event.end_ts ? (event.end_ts.includes('T') ? event.end_ts.split('T')[0] : event.end_ts) : ''
          
          // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
          const formatForDatetimeInput = (isoString: string) => {
            if (!isoString) return ''
            const date = new Date(isoString)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${year}-${month}-${day}T${hours}:${minutes}`
          }

          return {
            id: event.id,
            name: event.title,
            description: event.description || '',
            cohort_id: selectedCohortId,
            cohort_name: cohorts.find(c => c.id === selectedCohortId)?.name,
            start_date: startDate,
            end_date: endDate,
            start_datetime: formatForDatetimeInput(event.start_ts),
            end_datetime: formatForDatetimeInput(event.end_ts),
            timezone: event.timezone || 'UTC',
            type: typeMap[event.type] || 'mission',
            status: statusMap[event.status] || 'scheduled',
            milestone_id: event.milestone_id || undefined,
            requirements: {
              mandatory: event.completion_tracked || false,
            },
            created_at: event.created_at,
          } as AssessmentWindow
        })

      setAssessmentWindows(assessments)
    } catch (err) {
      console.error('Failed to load assessment windows:', err)
      setAssessmentWindows([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAssessment = () => {
    setEditingAssessment(null)
    // Pre-fill with cohort dates if available
    const cohort = selectedCohortData
    const defaultStart = cohort?.start_date ? new Date(cohort.start_date).toISOString().slice(0, 16) : ''
    const defaultEnd = cohort?.end_date ? new Date(cohort.end_date).toISOString().slice(0, 16) : ''
    
    setFormData({
      name: '',
      description: '',
      cohort_id: selectedCohortId,
      start_date: cohort?.start_date ? cohort.start_date.split('T')[0] : '',
      end_date: cohort?.end_date ? cohort.end_date.split('T')[0] : '',
      start_datetime: defaultStart,
      end_datetime: defaultEnd,
      timezone: userTimezone,
      type: 'mission',
      status: 'scheduled',
      milestone_id: '',
      recurrence_rule: '',
      reminder_hours_before: 48,
      requirements: {
        min_submissions: 1,
        passing_score: 70,
        mandatory: true,
      },
    })
    setShowCreateForm(true)
  }

  const handleEditAssessment = (assessment: AssessmentWindow) => {
    setEditingAssessment(assessment)
    // Ensure dates are properly formatted
    const formatForDateInput = (dateStr: string) => {
      if (!dateStr) return ''
      return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
    }
    
    const formatForDatetimeInput = (dateStr: string) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    setFormData({
      ...assessment,
      start_date: formatForDateInput(assessment.start_date),
      end_date: formatForDateInput(assessment.end_date),
      start_datetime: assessment.start_datetime || formatForDatetimeInput(assessment.start_date),
      end_datetime: assessment.end_datetime || formatForDatetimeInput(assessment.end_date),
      timezone: assessment.timezone || userTimezone,
    })
    setShowCreateForm(true)
  }

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.cohort_id || !formData.start_datetime || !formData.end_datetime) {
      alert('Please fill in all required fields including date and time')
      return
    }

    setIsSaving(true)
    try {
      // Map assessment type to calendar event type
      const eventTypeMap: Record<string, string> = {
        'profiler': 'orientation', // Profiler window uses orientation event type
        'mission': 'submission',
        'capstone': 'project_review',
        'portfolio': 'submission',
        'milestone': 'submission',
        'final': 'closure',
      }

      // Map assessment status to calendar event status
      const statusMap: Record<string, string> = {
        'scheduled': 'scheduled',
        'active': 'scheduled', // Calendar events use 'scheduled' for active
        'completed': 'done',
        'cancelled': 'cancelled',
      }

      // Convert datetime-local input to ISO string
      const startDateTime = formData.start_datetime ? new Date(formData.start_datetime).toISOString() : new Date(formData.start_date!).toISOString()
      const endDateTime = formData.end_datetime ? new Date(formData.end_datetime).toISOString() : new Date(formData.end_date!).toISOString()

      const calendarEventData: any = {
        cohort: formData.cohort_id,
        title: formData.name,
        description: formData.description || '',
        type: eventTypeMap[formData.type || 'mission'],
        start_ts: startDateTime,
        end_ts: endDateTime,
        timezone: formData.timezone || userTimezone,
        status: statusMap[formData.status || 'scheduled'] || 'scheduled',
        completion_tracked: formData.requirements?.mandatory || false,
      }

      // Include milestone_id if provided
      if (formData.milestone_id) {
        calendarEventData.milestone_id = formData.milestone_id
      }

      // Include recurrence rule if provided (for future implementation)
      if (formData.recurrence_rule) {
        calendarEventData.recurrence_rule = formData.recurrence_rule
      }

      if (editingAssessment?.id) {
        // Update existing calendar event
        await programsClient.updateCalendarEvent?.(editingAssessment.id, calendarEventData)
      } else {
        // Create new calendar event
        await programsClient.createCalendarEvent(formData.cohort_id!, calendarEventData)
      }

      setShowCreateForm(false)
      setEditingAssessment(null)
      loadAssessmentWindows() // Reload the list
    } catch (err: any) {
      console.error('Failed to save assessment window:', err)
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to save assessment window'
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment window?')) return

    try {
      await programsClient.deleteCalendarEvent?.(id)
      loadAssessmentWindows() // Reload the list
    } catch (err: any) {
      console.error('Failed to delete assessment window:', err)
      alert(err?.response?.data?.detail || err?.message || 'Failed to delete assessment window')
    }
  }


  const getTypeColor = (type: string) => {
    switch (type) {
      case 'profiler': return 'defender'
      case 'mission': return 'mint'
      case 'capstone': return 'defender'
      case 'portfolio': return 'gold'
      case 'milestone': return 'orange'
      case 'final': return 'orange'
      default: return 'steel'
    }
  }

  // Get available milestones for the selected track
  const availableMilestones = useMemo(() => {
    if (!selectedTrackData?.milestones) return []
    return selectedTrackData.milestones.sort((a: Milestone, b: Milestone) => (a.order || 0) - (b.order || 0))
  }, [selectedTrackData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'mint'
      case 'completed': return 'defender'
      case 'scheduled': return 'gold'
      case 'cancelled': return 'steel'
      default: return 'steel'
    }
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon />
                <div>
                  <h1 className="text-4xl font-bold text-och-gold">Assessment Windows</h1>
                  <p className="text-och-steel">
                    Configure assessment windows and evaluation schedules
                  </p>
                </div>
              </div>
              {selectedCohortId && (
                <Button variant="defender" onClick={handleCreateAssessment}>
                  <PlusIcon />
                  <span className="ml-2">Create Assessment Window</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Program</label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => {
                      const programId = e.target.value
                      setSelectedProgramId(programId)
                      setSelectedCohortId('')
                      setAssessmentWindows([])
                      // Tracks will be automatically fetched via useTracks hook
                    }}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  >
                    <option value="">Select a program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={String(program.id)}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                  {selectedProgramId && tracksLoading && (
                    <p className="text-xs text-och-steel mt-1">Loading tracks...</p>
                  )}
                  {selectedProgramId && !tracksLoading && tracks.length === 0 && (
                    <p className="text-xs text-och-steel mt-1">No tracks found for this program</p>
                  )}
                  {selectedProgramId && !tracksLoading && tracks.length > 0 && (
                    <p className="text-xs text-och-steel mt-1">{tracks.length} track(s) available</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Cohort</label>
                  <select
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    disabled={!selectedProgramId || tracksLoading}
                  >
                    <option value="">
                      {!selectedProgramId 
                        ? 'Select a program first' 
                        : tracksLoading 
                        ? 'Loading tracks...' 
                        : filteredCohorts.length === 0
                        ? 'No cohorts available'
                        : 'Select a cohort'}
                    </option>
                    {filteredCohorts.map((cohort) => {
                      const track = tracks.find(t => t.id === cohort.track)
                      return (
                      <option key={cohort.id} value={cohort.id}>
                          {cohort.name} {track ? `(${track.name})` : ''}
                      </option>
                      )
                    })}
                  </select>
                  {selectedProgramId && !tracksLoading && filteredCohorts.length > 0 && (
                    <p className="text-xs text-och-steel mt-1">
                      {filteredCohorts.length} cohort(s) available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Cohort Timeline Context */}
          {selectedCohortId && selectedCohortData && (
            <Card className="mb-6 border-och-defender/30">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-och-defender mb-3">Cohort Timeline</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-och-steel">Start Date:</span>
                    <span className="text-white font-medium ml-2">
                      {selectedCohortData.start_date ? new Date(selectedCohortData.start_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-och-steel">End Date:</span>
                    <span className="text-white font-medium ml-2">
                      {selectedCohortData.end_date ? new Date(selectedCohortData.end_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-och-steel">Status:</span>
                    <Badge variant="defender" className="ml-2">{selectedCohortData.status}</Badge>
                  </div>
                  <div>
                    <span className="text-och-steel">Mode:</span>
                    <span className="text-white font-medium ml-2 capitalize">{selectedCohortData.mode}</span>
                  </div>
                </div>
                <p className="text-xs text-och-steel mt-3">
                  All assessment windows must fall within the cohort timeline ({selectedCohortData.start_date ? new Date(selectedCohortData.start_date).toLocaleDateString() : 'N/A'} - {selectedCohortData.end_date ? new Date(selectedCohortData.end_date).toLocaleDateString() : 'N/A'})
                </p>
              </div>
            </Card>
          )}

          {/* Assessment Windows List */}
          {selectedCohortId && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Assessment Windows</h2>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : assessmentWindows.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon />
                    <p className="text-och-steel mt-4 mb-2">No assessment windows configured</p>
                    <p className="text-och-steel text-sm mb-4">
                      Create assessment windows to schedule evaluations for this cohort
                    </p>
                    <Button variant="defender" onClick={handleCreateAssessment}>
                      <PlusIcon />
                      <span className="ml-2">Create Assessment Window</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assessmentWindows.map((assessment) => (
                      <div
                        key={assessment.id}
                        className="p-5 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{assessment.name}</h3>
                              <Badge variant={getTypeColor(assessment.type)}>
                                {assessment.type}
                              </Badge>
                              <Badge variant={getStatusColor(assessment.status)}>
                                {assessment.status}
                              </Badge>
                            </div>
                            {assessment.description && (
                              <p className="text-sm text-och-steel mb-3">{assessment.description}</p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-och-steel">Start:</span>
                                <span className="text-white font-medium ml-2">
                                  {assessment.start_datetime 
                                    ? new Date(assessment.start_datetime).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZoneName: 'short'
                                      })
                                    : new Date(assessment.start_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-och-steel">End:</span>
                                <span className="text-white font-medium ml-2">
                                  {assessment.end_datetime 
                                    ? new Date(assessment.end_datetime).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZoneName: 'short'
                                      })
                                    : new Date(assessment.end_date).toLocaleDateString()}
                                </span>
                              </div>
                              {assessment.timezone && (
                                <div>
                                  <span className="text-och-steel">Timezone:</span>
                                  <span className="text-white font-medium ml-2 text-xs">
                                    {assessment.timezone}
                                  </span>
                                </div>
                              )}
                              {assessment.milestone_id && (
                                <div>
                                  <span className="text-och-steel">Milestone:</span>
                                  <span className="text-white font-medium ml-2 text-xs">
                                    {assessment.milestone_name || 'Linked'}
                                  </span>
                                </div>
                              )}
                              {assessment.requirements?.passing_score && (
                                <div>
                                  <span className="text-och-steel">Passing Score:</span>
                                  <span className="text-white font-medium ml-2">
                                    {assessment.requirements.passing_score}%
                                  </span>
                                </div>
                              )}
                              {assessment.requirements?.min_submissions && (
                                <div>
                                  <span className="text-och-steel">Min Submissions:</span>
                                  <span className="text-white font-medium ml-2">
                                    {assessment.requirements.min_submissions}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAssessment(assessment)}
                            >
                              <EditIcon />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAssessment(assessment.id!)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {!selectedCohortId && (
            <Card>
              <div className="p-6 text-center">
                <p className="text-och-steel">Please select a program and cohort to manage assessment windows</p>
              </div>
            </Card>
          )}

          {/* Create/Edit Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {editingAssessment ? 'Edit Assessment Window' : 'Create Assessment Window'}
                  </h2>

                  <form onSubmit={handleSaveAssessment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Description</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        rows={3}
                      />
                    </div>

                    {/* Timezone Selection */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Timezone * <span className="text-och-steel text-xs">(All events use this timezone)</span>
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        required
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
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
                      <p className="text-xs text-och-steel mt-1">Selected: {formData.timezone}</p>
                    </div>

                    {/* DateTime Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Start Date & Time * <span className="text-och-steel text-xs">(Window opens)</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.start_datetime}
                          onChange={(e) => {
                            const datetime = e.target.value
                            setFormData({ 
                              ...formData, 
                              start_datetime: datetime,
                              start_date: datetime ? datetime.split('T')[0] : formData.start_date
                            })
                          }}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          End Date & Time * <span className="text-och-steel text-xs">(Window closes)</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.end_datetime}
                          onChange={(e) => {
                            const datetime = e.target.value
                            setFormData({ 
                              ...formData, 
                              end_datetime: datetime,
                              end_date: datetime ? datetime.split('T')[0] : formData.end_date
                            })
                          }}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Assessment Type *</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        >
                          <option value="profiler">Profiler (Tier 0) Window</option>
                          <option value="mission">Mission Deadline</option>
                          <option value="capstone">Capstone Submission</option>
                          <option value="portfolio">Portfolio Review</option>
                          <option value="milestone">Milestone Assessment</option>
                          <option value="final">Final Assessment</option>
                        </select>
                        <p className="text-xs text-och-steel mt-1">
                          {formData.type === 'profiler' && 'Mandatory initial assessment window for Current Self-Assessment and Future-You Projection'}
                          {formData.type === 'mission' && 'Time-bound mission submission deadline (24 hours to 7 days)'}
                          {formData.type === 'capstone' && 'Critical closure milestone for capstone project submission'}
                          {formData.type === 'milestone' && 'Assessment linked to track milestone'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Status *</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Milestone Link */}
                    {availableMilestones.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Link to Track Milestone <span className="text-och-steel text-xs">(Optional)</span>
                        </label>
                        <select
                          value={formData.milestone_id || ''}
                          onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value || undefined })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        >
                          <option value="">No milestone link</option>
                          {availableMilestones.map((milestone: Milestone) => (
                            <option key={milestone.id} value={milestone.id}>
                              {milestone.name} (Order: {milestone.order})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-och-steel mt-1">
                          Link this assessment window to a specific track milestone for better tracking
                        </p>
                      </div>
                    )}

                    {/* Recurrence Rule (for future implementation) */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Recurrence Rule <span className="text-och-steel text-xs">(RRULE - Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.recurrence_rule || ''}
                        onChange={(e) => setFormData({ ...formData, recurrence_rule: e.target.value })}
                        placeholder="e.g., FREQ=WEEKLY;INTERVAL=2;BYDAY=MO"
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      />
                      <p className="text-xs text-och-steel mt-1">
                        Use RRULE format for recurring assessments (e.g., weekly mentorship reviews)
                      </p>
                    </div>

                    <div className="p-4 bg-och-midnight/30 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-3">Requirements & Configuration</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-och-steel mb-1">Minimum Submissions</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.requirements?.min_submissions || 1}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                requirements: {
                                  ...formData.requirements,
                                  min_submissions: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-och-steel mb-1">Passing Score (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.requirements?.passing_score || 70}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                requirements: {
                                  ...formData.requirements,
                                  passing_score: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.requirements?.mandatory || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                requirements: {
                                  ...formData.requirements,
                                  mandatory: e.target.checked,
                                },
                              })
                            }
                            className="rounded border-och-steel/20 bg-och-midnight/50 text-och-mint focus:ring-och-mint"
                          />
                          <span className="text-sm text-white">Mandatory (Track completion)</span>
                        </label>
                        <div>
                          <label className="block text-xs text-och-steel mb-1">Reminder Hours Before Deadline</label>
                          <input
                            type="number"
                            min="0"
                            max="168"
                            value={formData.reminder_hours_before || 48}
                            onChange={(e) => setFormData({ ...formData, reminder_hours_before: parseInt(e.target.value) || 48 })}
                            className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint"
                            placeholder="48"
                          />
                          <p className="text-xs text-och-steel mt-1">
                            System will send reminders (Email/SMS/In-App) this many hours before the deadline
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-och-steel/20">
                      <Button
                        variant="defender"
                        type="submit"
                        disabled={isSaving || !formData.name || !formData.start_datetime || !formData.end_datetime || !formData.timezone}
                      >
                        {isSaving ? 'Saving...' : editingAssessment ? 'Update' : 'Create'}
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false)
                          setEditingAssessment(null)
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
