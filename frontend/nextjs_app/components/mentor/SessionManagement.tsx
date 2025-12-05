'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMentorSessions } from '@/hooks/useMentorSessions'
import { useAuth } from '@/hooks/useAuth'
import type { GroupMentorshipSession } from '@/services/types/mentor'

export function SessionManagement() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { sessions, isLoading, error, createSession, updateSession } = useMentorSessions(mentorId, { status: 'all' })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    meeting_type: 'zoom' as 'zoom' | 'google_meet' | 'in_person',
    meeting_link: '',
    track_assignment: '',
  })

  const handleCreate = async () => {
    if (!mentorId) {
      console.error('Mentor ID is missing')
      return
    }
    
    if (!formData.title || !formData.scheduled_at) {
      console.error('Required fields missing:', { title: formData.title, scheduled_at: formData.scheduled_at })
      return
    }

    try {
      // Convert datetime-local format to ISO string
      const sessionData = {
        ...formData,
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : new Date().toISOString()
      }
      console.log('Creating session with data:', sessionData, 'mentorId:', mentorId)
      await createSession(sessionData)
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
    } catch (err: any) {
      console.error('Error creating session:', err)
      // Error handled by hook, but also log it here
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
        <Button variant="defender" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New Session'}
        </Button>
      </div>

      {showCreateForm && (
        <form 
          className="mb-6 p-4 bg-och-midnight/50 rounded-lg space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            handleCreate()
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
          <div className="grid grid-cols-2 gap-3">
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              className="px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              required
            />
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
              className="px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              min="15"
              max="240"
            />
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
            >
              Create Session
            </Button>
            <Button 
              variant="outline" 
              type="button"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </div>
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
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="p-4 bg-och-midnight/50 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{session.title}</h3>
                  <p className="text-sm text-och-steel">{session.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="defender" className="text-xs capitalize">{session.status}</Badge>
                    <Badge variant="mint" className="text-xs">{session.meeting_type}</Badge>
                    {session.track_assignment && (
                      <Badge variant="gold" className="text-xs">{session.track_assignment}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-och-steel">
                  <div>{new Date(session.scheduled_at).toLocaleString()}</div>
                  <div>{session.duration_minutes} minutes</div>
                </div>
              </div>

              {session.meeting_link && (
                <div className="mb-3">
                  <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline text-sm">
                    Join Meeting
                  </a>
                </div>
              )}

              {session.status === 'completed' && (
                <div className="mb-3 space-y-2">
                  {!session.recording_url && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Recording URL"
                        className="flex-1 px-2 py-1 rounded bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-defender"
                        onBlur={(e) => {
                          if (e.target.value) {
                            handleUpdateRecording(session.id, e.target.value)
                          }
                        }}
                      />
                    </div>
                  )}
                  {session.recording_url && (
                    <div>
                      <a href={session.recording_url} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline text-sm">
                        Recording: {session.recording_url}
                      </a>
                    </div>
                  )}
                  {session.transcript_url && (
                    <div>
                      <a href={session.transcript_url} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline text-sm">
                        Transcript: {session.transcript_url}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-white">Attendance ({session.attendance.length})</span>
                  {session.status === 'completed' && (
                    <Button variant="outline" size="sm" onClick={() => setEditingSession(editingSession === session.id ? null : session.id)}>
                      {editingSession === session.id ? 'Done' : 'Edit'}
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {session.attendance.map((att) => (
                    <div key={att.mentee_id} className="flex justify-between items-center text-xs">
                      <span className={att.attended ? 'text-white' : 'text-och-steel'}>
                        {att.mentee_name} {att.attended ? '✓' : '✗'}
                      </span>
                      {editingSession === session.id && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={att.attended}
                            onChange={(e) => {
                              const updated = session.attendance.map(a =>
                                a.mentee_id === att.mentee_id ? { ...a, attended: e.target.checked } : a
                              )
                              handleUpdateAttendance(session.id, updated)
                            }}
                            className="text-och-mint"
                          />
                          <span className="text-och-steel">Attended</span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}


