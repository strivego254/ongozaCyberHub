'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useMentorSessions } from '@/hooks/useMentorSessions'
import { useAuth } from '@/hooks/useAuth'
import type { GroupMentorshipSession } from '@/services/types/mentor'

export function SessionManagement() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12) // 12 sessions per page
  const { sessions, isLoading, error, createSession, updateSession, pagination } = useMentorSessions(mentorId, { 
    status: 'all',
    page: currentPage,
    page_size: pageSize
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [reschedulingSession, setReschedulingSession] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    meeting_type: 'zoom' as 'zoom' | 'google_meet' | 'in_person',
    meeting_link: '',
    track_assignment: '',
  })

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!mentorId) {
      console.error('Mentor ID is missing')
      alert('Mentor ID is missing. Please refresh the page.')
      return
    }
    
    if (!formData.title || !formData.scheduled_at) {
      console.error('Required fields missing:', { title: formData.title, scheduled_at: formData.scheduled_at })
      alert('Please fill in all required fields (Title and Scheduled Date & Time)')
      return
    }

    try {
      // DateTimePicker returns format: YYYY-MM-DDTHH:mm
      // Convert to ISO string for backend
      let scheduledAtISO: string
      if (formData.scheduled_at.includes('T')) {
        // Already in datetime-local format, convert to ISO
        scheduledAtISO = new Date(formData.scheduled_at).toISOString()
      } else {
        // Fallback if format is different
        scheduledAtISO = new Date(formData.scheduled_at).toISOString()
      }
      
      const sessionData = {
        title: formData.title,
        description: formData.description || '',
        scheduled_at: scheduledAtISO,
        duration_minutes: formData.duration_minutes,
        meeting_type: formData.meeting_type,
        meeting_link: formData.meeting_link || undefined,
        track_assignment: formData.track_assignment || undefined,
      }
      
      console.log('Creating session with data:', sessionData, 'mentorId:', mentorId)
      const newSession = await createSession(sessionData)
      console.log('Session created successfully:', newSession)
      
      // Reset form and close
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: 60,
        meeting_type: 'zoom',
        meeting_link: '',
        track_assignment: '',
      })
      
      // Switch to list view to see the new session
      setViewMode('list')
      
      // Scroll to the new session after a brief delay
      setTimeout(() => {
        if (newSession?.id) {
          const element = document.getElementById(`session-${newSession.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('ring-2', 'ring-och-mint')
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-och-mint')
            }, 2000)
          }
        }
      }, 500)
    } catch (err: any) {
      console.error('Error creating session:', err)
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create session'
      alert(`Error creating session: ${errorMessage}`)
      // Error handled by hook, but also show alert
    }
  }

  const handleUpdateAttendance = async (sessionId: string, attendance: GroupMentorshipSession['attendance']) => {
    try {
      await updateSession(sessionId, { attendance })
      setEditingSession(null)
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleUpdateNotes = async (sessionId: string, notes: GroupMentorshipSession['structured_notes']) => {
    try {
      await updateSession(sessionId, { structured_notes: notes })
      setEditingNotes(null)
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleReschedule = async (sessionId: string, scheduledAt: string, durationMinutes: number) => {
    try {
      await updateSession(sessionId, { scheduled_at: scheduledAt, duration_minutes: durationMinutes })
      setReschedulingSession(null)
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleCloseSession = async (sessionId: string) => {
    try {
      await updateSession(sessionId, { is_closed: true })
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleUpdateRecording = async (sessionId: string, recordingUrl: string, transcriptUrl?: string) => {
    try {
      await updateSession(sessionId, { recording_url: recordingUrl, transcript_url: transcriptUrl })
    } catch (err) {
      // Error handled by hook
    }
  }

  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Group Mentorship Sessions</h2>
          <p className="text-sm text-och-steel">
            Schedule, manage, and track group mentorship sessions.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-och-midnight/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'defender' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'defender' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </Button>
        </div>
        <Button variant="defender" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New Session'}
        </Button>
        </div>
      </div>

      {showCreateForm && (
        <form 
          className="mb-6 p-4 bg-och-midnight/50 rounded-lg space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            console.log('Form submitted', formData)
            handleCreate(e)
          }}
        >
          <input
            type="text"
            placeholder="Session Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DateTimePicker
              value={formData.scheduled_at}
              onChange={(value) => {
                console.log('DateTimePicker onChange:', value)
                setFormData({ ...formData, scheduled_at: value })
              }}
              label="Scheduled Date & Time"
              required
              min={new Date().toISOString().slice(0, 16)}
            />
            <div>
              <label className="block text-xs text-och-steel mb-1">Duration (minutes)</label>
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              min="15"
              max="240"
            />
            </div>
          </div>
          <select
            value={formData.meeting_type}
            onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="zoom">Zoom</option>
            <option value="google_meet">Google Meet</option>
            <option value="in_person">In Person</option>
          </select>
          <input
            type="text"
            placeholder="Meeting Link (optional)"
            value={formData.meeting_link}
            onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <input
            type="text"
            placeholder="Track Assignment (optional)"
            value={formData.track_assignment}
            onChange={(e) => setFormData({ ...formData, track_assignment: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <div className="flex gap-2">
            <Button 
              variant="defender" 
              type="submit"
              disabled={!formData.title || !formData.scheduled_at || !mentorId}
              onClick={(e) => {
                console.log('Create Session button clicked', { 
                  title: formData.title, 
                  scheduled_at: formData.scheduled_at, 
                  mentorId 
                })
                // Ensure form submission is handled
                if (!formData.title || !formData.scheduled_at || !mentorId) {
                  e.preventDefault()
                  const missing = []
                  if (!formData.title) missing.push('Title')
                  if (!formData.scheduled_at) missing.push('Scheduled Date & Time')
                  if (!mentorId) missing.push('Mentor ID')
                  alert(`Please fill in: ${missing.join(', ')}`)
                  return
                }
              }}
            >
              Create Session
            </Button>
            <Button 
              variant="outline" 
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setFormData({
                  title: '',
                  description: '',
                  scheduled_at: '',
                  duration_minutes: 60,
                  meeting_type: 'zoom',
                  meeting_link: '',
                  track_assignment: '',
                })
              }}
            >
              Cancel
            </Button>
          </div>
          {error && (
            <div className="text-och-orange text-xs mt-2 px-2 py-1 bg-och-orange/10 border border-och-orange/20 rounded">
              {error}
            </div>
          )}
        </form>
      )}

      {isLoading && <div className="text-och-steel text-sm py-4">Loading sessions...</div>}
      {error && (
        <div className="text-och-orange text-sm py-4 px-4 bg-och-orange/10 border border-och-orange/20 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <div className="text-och-steel text-sm">No sessions found.</div>
      )}

      {!isLoading && !error && sessions.length > 0 && (
        <>
          {viewMode === 'calendar' ? (
            <SessionCalendarView sessions={sessions} onSessionClick={(sessionId) => {
              // Scroll to session or highlight it
              const element = document.getElementById(`session-${sessionId}`)
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                element.classList.add('ring-2', 'ring-och-mint')
                setTimeout(() => {
                  element.classList.remove('ring-2', 'ring-och-mint')
                }, 2000)
              }
            }} />
          ) : (
        <div className="space-y-3">
          {/* Compact Session List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((session) => {
              const isExpanded = expandedSession === session.id
              const sessionDate = new Date(session.scheduled_at)
              const isPast = sessionDate < new Date()
              
              return (
              <div 
                key={session.id} 
                id={`session-${session.id}`} 
                className={`p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-mint/50 transition-all cursor-pointer ${
                  isExpanded ? 'col-span-full md:col-span-2 lg:col-span-3' : ''
                }`}
                onClick={() => !isExpanded && setExpandedSession(session.id)}
              >
                {/* Compact Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{session.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge 
                        variant={
                          session.status === 'completed' ? 'mint' : 
                          session.status === 'scheduled' ? 'defender' : 
                          'gold'
                        } 
                        className="text-[10px] px-1.5 py-0.5 capitalize"
                      >
                        {session.status}
                      </Badge>
                      <Badge variant="steel" className="text-[10px] px-1.5 py-0.5 capitalize">
                        {session.meeting_type}
                      </Badge>
                    {session.track_assignment && (
                        <Badge variant="gold" className="text-[10px] px-1.5 py-0.5">
                          {session.track_assignment}
                        </Badge>
                    )}
                  </div>
                </div>
                  <div className="text-right text-[10px] text-och-steel ml-2 flex-shrink-0">
                    <div className="font-medium text-white">
                      {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div>
                      {sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>{session.duration_minutes}m</div>
                </div>
              </div>

                {/* Description Preview */}
                {session.description && !isExpanded && (
                  <p className="text-xs text-och-steel line-clamp-2 mb-2">{session.description}</p>
                )}

                {/* Meeting Link */}
              {session.meeting_link && (
                  <div className="mb-2">
                    <a 
                      href={session.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-och-mint hover:underline text-[10px] inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>🔗</span> Join Meeting
                  </a>
                </div>
              )}

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-och-steel/20 space-y-3" onClick={(e) => e.stopPropagation()}>
                    {/* Close button */}
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setExpandedSession(null)}
                        className="text-xs"
                      >
                        Close
                      </Button>
                    </div>

                    {/* Full Description */}
                    {session.description && (
                    <div>
                        <p className="text-xs text-och-steel">{session.description}</p>
                </div>
              )}

                    {/* Attendance Summary */}
                    {session.attendance && session.attendance.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-white">
                            Attendance ({session.attendance.filter(a => a.attended).length}/{session.attendance.length})
                          </span>
                  {session.status === 'completed' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingSession(editingSession === session.id ? null : session.id)}
                              className="text-xs"
                            >
                      {editingSession === session.id ? 'Done' : 'Edit'}
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {session.attendance.map((att) => (
                            <div key={att.mentee_id} className="flex justify-between items-center text-[10px]">
                      <span className={att.attended ? 'text-white' : 'text-och-steel'}>
                        {att.mentee_name} {att.attended ? '✓' : '✗'}
                      </span>
                      {editingSession === session.id && (
                          <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={att.attended}
                            onChange={(e) => {
                                const now = new Date().toISOString()
                              const updated = session.attendance.map(a =>
                                  a.mentee_id === att.mentee_id ? { 
                                    ...a, 
                                    attended: e.target.checked,
                                    joined_at: e.target.checked ? (a.joined_at || now) : a.joined_at,
                                  } : a
                              )
                              handleUpdateAttendance(session.id, updated)
                            }}
                            className="text-och-mint"
                                    onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-och-steel">Attended</span>
                        </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recording/Transcript */}
                    {session.status === 'completed' && (
                      <div className="space-y-2">
                        {!session.recording_url && (
                              <input
                            type="text"
                            placeholder="Recording URL"
                            className="w-full px-2 py-1 rounded bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-defender"
                            onBlur={(e) => {
                                  if (e.target.value) {
                                handleUpdateRecording(session.id, e.target.value)
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {session.recording_url && (
                          <a 
                            href={session.recording_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-och-mint hover:underline text-xs block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📹 Recording: {session.recording_url}
                          </a>
                        )}
                        {session.transcript_url && (
                          <a 
                            href={session.transcript_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-och-mint hover:underline text-xs block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📄 Transcript: {session.transcript_url}
                          </a>
                        )}
                            </div>
                          )}

                    {/* Structured Notes Preview */}
                    {session.structured_notes && (session.structured_notes.key_takeaways?.length > 0 || session.structured_notes.action_items?.length > 0) && (
                      <div className="text-xs text-och-steel">
                        {session.structured_notes.key_takeaways?.length > 0 && (
                          <div className="mb-1">
                            <strong className="text-white">Takeaways:</strong> {session.structured_notes.key_takeaways.length}
                        </div>
                      )}
                        {session.structured_notes.action_items?.length > 0 && (
                          <div>
                            <strong className="text-white">Action Items:</strong> {session.structured_notes.action_items.length}
                    </div>
                        )}
                </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {session.status === 'scheduled' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                          onClick={() => {
                            setReschedulingSession(reschedulingSession === session.id ? null : session.id)
                            setExpandedSession(session.id)
                          }}
                          className="text-xs"
                        >
                          {reschedulingSession === session.id ? 'Cancel' : 'Reschedule'}
                        </Button>
                      )}
                      {session.status === 'completed' && !session.is_closed && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setEditingNotes(editingNotes === session.id ? null : session.id)
                              setExpandedSession(session.id)
                            }}
                            className="text-xs"
                      >
                        {editingNotes === session.id ? 'Save' : 'Edit Notes'}
                      </Button>
                          <Button 
                            variant="defender" 
                            size="sm" 
                            onClick={() => handleCloseSession(session.id)}
                            className="text-xs"
                          >
                            Close Session
                          </Button>
                        </>
                    )}
                  </div>
                  
                    {/* Reschedule Form */}
                    {reschedulingSession === session.id && (
                      <div className="p-2 bg-och-midnight rounded border border-och-steel/20 space-y-2">
                        <DateTimePicker
                          value={new Date(session.scheduled_at).toISOString().slice(0, 16)}
                          onChange={(value) => {
                            if (value) {
                              handleReschedule(session.id, value, session.duration_minutes)
                              setReschedulingSession(null)
                            }
                          }}
                          label="New Date & Time"
                        />
                        <input
                          type="number"
                          defaultValue={session.duration_minutes}
                          placeholder="Duration (minutes)"
                          className="w-full px-2 py-1 rounded bg-och-midnight border border-och-steel/20 text-white text-xs"
                          onBlur={(e) => {
                            if (e.target.value) {
                              handleReschedule(session.id, session.scheduled_at, parseInt(e.target.value))
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {/* Full Notes Editor */}
                    {editingNotes === session.id && !session.is_closed && (
                      <div className="p-2 bg-och-midnight rounded border border-och-steel/20 space-y-2 text-xs">
                      <div>
                          <label className="text-och-steel text-[10px] mb-1 block">Key Takeaways</label>
                        <textarea
                          value={(session.structured_notes?.key_takeaways || []).join('\n')}
                          onChange={(e) => {
                            const takeaways = e.target.value.split('\n').filter(t => t.trim())
                            handleUpdateNotes(session.id, {
                              ...session.structured_notes,
                              key_takeaways: takeaways
                            })
                          }}
                          placeholder="One per line"
                            rows={2}
                            className="w-full px-2 py-1 rounded bg-och-midnight border border-och-steel/20 text-white text-[10px]"
                            onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                          <label className="text-och-steel text-[10px] mb-1 block">Action Items</label>
                        <textarea
                          value={(session.structured_notes?.action_items || []).map((ai: any) => typeof ai === 'string' ? ai : ai.item).join('\n')}
                          onChange={(e) => {
                            const items = e.target.value.split('\n').filter(i => i.trim()).map(item => ({ item: item.trim() }))
                            handleUpdateNotes(session.id, {
                              ...session.structured_notes,
                              action_items: items
                            })
                          }}
                          placeholder="One per line"
                          rows={2}
                            className="w-full px-2 py-1 rounded bg-och-midnight border border-och-steel/20 text-white text-[10px]"
                            onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                        </div>
                      )}
                        </div>
                      )}
                        </div>
            )})}
                        </div>

          {/* Pagination Controls */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-och-steel/20">
              <div className="text-xs text-och-steel">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.count)} of {pagination.count} sessions
              </div>
              <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1)
                      setExpandedSession(null)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                  disabled={currentPage === 1}
                  className="text-xs"
                >
                  Previous
                  </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'defender' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setCurrentPage(pageNum)
                          setExpandedSession(null)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="text-xs min-w-[32px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage < pagination.total_pages) {
                      setCurrentPage(currentPage + 1)
                      setExpandedSession(null)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                  disabled={currentPage === pagination.total_pages}
                  className="text-xs"
                >
                  Next
                </Button>
                      </div>
                    </div>
                  )}
        </div>
          )}
        </>
      )}
    </Card>
  )
}

// Calendar View Component
function SessionCalendarView({ 
  sessions, 
  onSessionClick 
}: { 
  sessions: GroupMentorshipSession[]
  onSessionClick: (sessionId: string) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at)
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
          ←
        </Button>
        <h3 className="text-lg font-semibold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
          →
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-och-steel py-2">
            {day}
          </div>
        ))}
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square" />
          }
          
          const daySessions = getSessionsForDate(date)
          const isSelected = selectedDate && 
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear()

          return (
            <div
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={`
                aspect-square p-1 rounded border cursor-pointer transition-colors
                ${isToday(date) ? 'border-och-mint bg-och-mint/10' : 'border-och-steel/20'}
                ${isSelected ? 'bg-och-defender/20 border-och-defender' : 'hover:bg-och-midnight/50'}
                ${daySessions.length > 0 ? 'bg-och-mint/20' : ''}
              `}
            >
              <div className="text-xs text-white mb-1">{date.getDate()}</div>
              {daySessions.length > 0 && (
                <div className="space-y-0.5">
                  {daySessions.slice(0, 2).map(session => (
                    <div
                      key={session.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSessionClick(session.id)
                      }}
                      className="text-[10px] bg-och-defender/30 text-white px-1 py-0.5 rounded truncate"
                      title={session.title}
                    >
                      {new Date(session.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {session.title}
                    </div>
                  ))}
                  {daySessions.length > 2 && (
                    <div className="text-[10px] text-och-steel">
                      +{daySessions.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Date Sessions */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-och-midnight/50 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">
            Sessions on {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          {getSessionsForDate(selectedDate).length === 0 ? (
            <p className="text-xs text-och-steel">No sessions scheduled for this date.</p>
          ) : (
            <div className="space-y-2">
              {getSessionsForDate(selectedDate).map(session => (
                <div
                  key={session.id}
                  id={`session-${session.id}`}
                  className="p-2 bg-och-midnight rounded border border-och-steel/20 cursor-pointer hover:border-och-mint transition-colors"
                  onClick={() => onSessionClick(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-white">{session.title}</div>
                      <div className="text-xs text-och-steel">
                        {new Date(session.scheduled_at).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} • {session.duration_minutes} min
                      </div>
                    </div>
                    <Badge variant="defender" className="text-xs capitalize">{session.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

