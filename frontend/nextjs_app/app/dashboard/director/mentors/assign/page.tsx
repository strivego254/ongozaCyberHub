'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePrograms, useTracks, useCohorts, useProgram } from '@/hooks/usePrograms'
import { programsClient, type MentorAssignment } from '@/services/programsClient'
import { useUsers } from '@/hooks/useUsers'

export default function AssignMentorsPage() {
  const router = useRouter()
  
  // Selection state
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [selectedTrackId, setSelectedTrackId] = useState<string>('')
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  
  // Data fetching
  const { programs, isLoading: loadingPrograms } = usePrograms()
  
  // Fetch program detail when program is selected (includes tracks nested in program object)
  const { program: selectedProgramDetail, isLoading: loadingProgramDetail } = useProgram(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : ''
  )
  
  // Also try tracks endpoint as fallback
  const { tracks: tracksFromEndpoint, isLoading: loadingTracksFromEndpoint } = useTracks(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : undefined
  )
  
  // Use tracks from program detail if available (more reliable), otherwise use tracks endpoint
  const tracks = useMemo(() => {
    if (!selectedProgramId) return []
    
    // Prefer tracks from program detail as it's the source of truth
    if (selectedProgramDetail?.tracks && Array.isArray(selectedProgramDetail.tracks)) {
      console.log('✅ Using tracks from program detail:', {
        programId: selectedProgramId,
        tracksCount: selectedProgramDetail.tracks.length,
        tracks: selectedProgramDetail.tracks.map((t: any) => ({ id: t.id, name: t.name }))
      })
      return selectedProgramDetail.tracks
    }
    
    // Fallback to tracks from endpoint
    console.log('📡 Using tracks from tracks endpoint:', {
      programId: selectedProgramId,
      tracksCount: tracksFromEndpoint.length,
      tracks: tracksFromEndpoint.map(t => ({ id: t.id, name: t.name, program: t.program }))
    })
    return tracksFromEndpoint
  }, [selectedProgramId, selectedProgramDetail, tracksFromEndpoint])
  
  const loadingTracks = loadingProgramDetail || loadingTracksFromEndpoint
  const { cohorts, isLoading: loadingCohorts } = useCohorts({ 
    page: 1, 
    pageSize: 100,
    trackId: selectedTrackId || undefined 
  })
  const { users: mentorsFromApi, isLoading: loadingUsers } = useUsers({ 
    page: 1, 
    page_size: 200, 
    role: 'mentor' 
  })
  
  // Assignments state
  const [mentorAssignments, setMentorAssignments] = useState<MentorAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state for new assignment
  const [selectedMentorId, setSelectedMentorId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'primary' | 'support' | 'guest'>('support')
  
  // Tracks are already filtered from program detail or endpoint, just use them directly
  const availableTracks = useMemo(() => {
    if (!selectedProgramId || selectedProgramId === '') return []
    return tracks
  }, [tracks, selectedProgramId])
  
  const availableCohorts = useMemo(() => {
    if (!selectedTrackId) return []
    return cohorts.filter(cohort => cohort.track === selectedTrackId)
  }, [cohorts, selectedTrackId])
  
  const mentors = useMemo(() => {
    return mentorsFromApi || []
  }, [mentorsFromApi])
  
  const availableMentors = useMemo(() => {
    const assignedIds = mentorAssignments
      .filter(a => a.active)
      .map(a => a.mentor?.toString() || a.mentor)
    return mentors.filter(m => !assignedIds.includes(m.id?.toString() || ''))
  }, [mentors, mentorAssignments])
  
  // Load assignments when cohort is selected
  useEffect(() => {
    const loadAssignments = async () => {
      if (!selectedCohortId) {
        setMentorAssignments([])
        return
      }
      setIsLoadingAssignments(true)
      try {
        const assignments = await programsClient.getCohortMentors(selectedCohortId)
        setMentorAssignments(Array.isArray(assignments) ? assignments : [])
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load mentor assignments')
        console.error('Failed to load mentor assignments:', err)
      } finally {
        setIsLoadingAssignments(false)
      }
    }
    loadAssignments()
  }, [selectedCohortId])
  
  // Reset selections when program changes
  useEffect(() => {
    setSelectedTrackId('')
    setSelectedCohortId('')
    setMentorAssignments([])
  }, [selectedProgramId])
  
  // Reset cohort when track changes
  useEffect(() => {
    setSelectedCohortId('')
    setMentorAssignments([])
  }, [selectedTrackId])
  
  const handleAssignMentor = async () => {
    if (!selectedCohortId) {
      alert('Please select a cohort first')
      return
    }
    
    if (!selectedMentorId) {
      alert('Please select a mentor')
      return
    }

    // Check if mentor is already assigned
    const existing = mentorAssignments.find(
      (assignment) => assignment.mentor === selectedMentorId && assignment.active
    )
    if (existing) {
      alert('This mentor is already assigned to this cohort')
      return
    }

    setIsAssigning(true)
    setError(null)
    try {
      const newAssignment = await programsClient.assignMentor(selectedCohortId, {
        mentor: selectedMentorId,
        role: selectedRole,
      })
      setMentorAssignments([...mentorAssignments, newAssignment])
      setSelectedMentorId('')
      setSelectedRole('support')
    } catch (err: any) {
      setError(err.message || 'Failed to assign mentor')
      alert(err.message || 'Failed to assign mentor')
      console.error('Failed to assign mentor:', err)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string, mentorName: string) => {
    if (!confirm(`Are you sure you want to remove ${mentorName} from this cohort?`)) {
      return
    }

    try {
      await programsClient.removeMentorAssignment(assignmentId)
      setMentorAssignments(mentorAssignments.filter(a => a.id !== assignmentId))
    } catch (err: any) {
      setError(err.message || 'Failed to remove mentor assignment')
      alert(err.message || 'Failed to remove mentor assignment')
      console.error('Failed to remove mentor assignment:', err)
    }
  }

  const handleUpdateRole = async (assignmentId: string, newRole: 'primary' | 'support' | 'guest') => {
    try {
      const updated = await programsClient.updateMentorAssignment(assignmentId, { role: newRole })
      setMentorAssignments(mentorAssignments.map(a => a.id === assignmentId ? updated : a))
    } catch (err: any) {
      setError(err.message || 'Failed to update mentor role')
      alert(err.message || 'Failed to update mentor role')
      console.error('Failed to update mentor role:', err)
    }
  }

  // Get mentor details for display
  const getMentorDetails = useCallback((mentorId: string) => {
    return mentors.find(m => m.id?.toString() === mentorId.toString())
  }, [mentors])
  
  const selectedProgram = selectedProgramDetail || programs.find(p => p.id === selectedProgramId)
  const selectedTrack = tracks.find(t => t.id === selectedTrackId)
  const selectedCohort = cohorts.find(c => c.id === selectedCohortId)

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Assign Mentors</h1>
                <p className="text-och-steel">
                  Assign mentors to cohorts and tracks across your programs
                </p>
              </div>
              <Link href="/dashboard/director/mentors">
                <Button variant="outline" size="sm">
                  ← Back to Mentors
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-och-orange/50">
              <div className="p-4">
                <p className="text-och-orange">{error}</p>
              </div>
            </Card>
          )}

          {/* Selection Section */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Select Program, Track & Cohort</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Program Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Program *
                  </label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    disabled={loadingPrograms}
                  >
                    <option value="">Choose a program...</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                  {selectedProgram && (
                    <p className="text-xs text-och-steel mt-1">
                      {selectedProgram.status} • {selectedProgram.duration_months} months
                    </p>
                  )}
                </div>

                {/* Track Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Track *
                  </label>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    disabled={!selectedProgramId || loadingTracks}
                  >
                    <option value="">Choose a track...</option>
                    {loadingTracks ? (
                      <option value="" disabled>Loading tracks...</option>
                    ) : availableTracks.length === 0 && selectedProgramId ? (
                      <option value="" disabled>No tracks available for this program</option>
                    ) : (
                      availableTracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.name} ({track.track_type || 'primary'})
                        </option>
                      ))
                    )}
                  </select>
                  {selectedTrack && (
                    <p className="text-xs text-och-steel mt-1">
                      {selectedTrack.track_type || 'primary'} • {selectedTrack.key}
                    </p>
                  )}
                  {selectedProgramId && !loadingTracks && availableTracks.length === 0 && (
                    <p className="text-xs text-och-orange mt-1">
                      ⚠️ No tracks found for this program. Create tracks in the program management page.
                    </p>
                  )}
                </div>

                {/* Cohort Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Cohort *
                  </label>
                  <select
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    disabled={!selectedTrackId || loadingCohorts}
                  >
                    <option value="">Choose a cohort...</option>
                    {availableCohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name} ({cohort.status})
                      </option>
                    ))}
                  </select>
                  {selectedCohort && (
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs text-och-steel">
                        {selectedCohort.status} • {new Date(selectedCohort.start_date).toLocaleDateString()} - {new Date(selectedCohort.end_date).toLocaleDateString()}
                      </p>
                      <Link 
                        href={`/dashboard/director/cohorts/${selectedCohort.id}`}
                        className="text-xs text-och-mint hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {selectedCohortId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assign New Mentor */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Assign New Mentor</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Select Mentor *
                      </label>
                      <select
                        value={selectedMentorId}
                        onChange={(e) => setSelectedMentorId(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="">Choose a mentor...</option>
                        {availableMentors.map((mentor) => (
                          <option key={mentor.id} value={mentor.id}>
                            {mentor.email} {mentor.first_name || mentor.last_name 
                              ? `(${mentor.first_name || ''} ${mentor.last_name || ''})`.trim()
                              : ''}
                          </option>
                        ))}
                      </select>
                      {availableMentors.length === 0 && (
                        <div className="mt-2 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg">
                          <p className="text-xs text-och-orange mb-1">
                            {mentors.length === 0 
                              ? '⚠️ No mentors found' 
                              : 'All available mentors are already assigned'}
                          </p>
                          {mentors.length === 0 && (
                            <ul className="text-xs text-och-steel list-disc list-inside space-y-1">
                              <li>Check if users have the "mentor" role assigned</li>
                              <li>Users must have an active mentor role in their profile</li>
                              <li>Contact an admin to assign mentor roles to users</li>
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Mentor Role
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as 'primary' | 'support' | 'guest')}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="primary">Primary Mentor</option>
                        <option value="support">Support Mentor</option>
                        <option value="guest">Guest Mentor</option>
                      </select>
                      <p className="text-xs text-och-steel mt-1">
                        Primary: Main mentor responsible. Support: Secondary support. Guest: Occasional sessions.
                      </p>
                    </div>

                    <Button
                      variant="defender"
                      size="sm"
                      onClick={handleAssignMentor}
                      disabled={!selectedMentorId || isAssigning}
                      className="w-full"
                    >
                      {isAssigning ? 'Assigning...' : 'Assign Mentor'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Current Assignments */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Assigned Mentors ({mentorAssignments.filter(a => a.active).length})
                  </h2>
                  
                  {isLoadingAssignments ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender mx-auto mb-2"></div>
                      <p className="text-och-steel text-sm">Loading assignments...</p>
                    </div>
                  ) : mentorAssignments.filter(a => a.active).length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No mentors assigned yet</p>
                      <p className="text-sm mt-2">Assign a mentor using the form on the left</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mentorAssignments
                        .filter(a => a.active)
                        .map((assignment) => {
                          const mentor = getMentorDetails(assignment.mentor?.toString() || assignment.mentor as string)
                          const mentorName = mentor 
                            ? `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || mentor.email
                            : assignment.mentor_name || assignment.mentor_email || 'Unknown'
                          
                          return (
                            <div
                              key={assignment.id}
                              className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="text-white font-medium">{mentorName}</p>
                                  {mentor?.email && (
                                    <p className="text-xs text-och-steel">{mentor.email}</p>
                                  )}
                                  <div className="mt-2">
                                    <select
                                      value={assignment.role || 'support'}
                                      onChange={(e) => handleUpdateRole(assignment.id!, e.target.value as 'primary' | 'support' | 'guest')}
                                      className="px-3 py-1 text-xs bg-och-midnight border border-och-steel/20 rounded text-white focus:outline-none focus:border-och-defender"
                                    >
                                      <option value="primary">Primary</option>
                                      <option value="support">Support</option>
                                      <option value="guest">Guest</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      assignment.role === 'primary' ? 'defender' :
                                      assignment.role === 'support' ? 'mint' :
                                      'steel'
                                    }
                                  >
                                    {assignment.role || 'support'}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveAssignment(assignment.id!, mentorName)}
                                    className="text-och-orange hover:text-och-orange/80 hover:border-och-orange text-xs"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                              {assignment.assigned_at && (
                                <p className="text-xs text-och-steel">
                                  Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Statistics */}
          {selectedCohortId && (
            <Card className="mt-6">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Mentor Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-och-steel mb-1">Total Assigned</p>
                    <p className="text-2xl font-bold text-white">
                      {mentorAssignments.filter(a => a.active).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-och-steel mb-1">Primary Mentors</p>
                    <p className="text-2xl font-bold text-och-defender">
                      {mentorAssignments.filter(a => a.active && a.role === 'primary').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-och-steel mb-1">Support Mentors</p>
                    <p className="text-2xl font-bold text-och-mint">
                      {mentorAssignments.filter(a => a.active && a.role === 'support').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-och-steel mb-1">Available Mentors</p>
                    <p className="text-2xl font-bold text-och-gold">
                      {availableMentors.length}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!selectedCohortId && (
            <Card>
              <div className="p-8 text-center">
                <p className="text-och-steel mb-2">Select a program, track, and cohort to assign mentors</p>
                <p className="text-sm text-och-steel/70">
                  Start by choosing a program above, then select a track and cohort
                </p>
              </div>
            </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

