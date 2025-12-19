'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useTrack, useUpdateTrack, useDeleteTrack } from '@/hooks/usePrograms'
import { programsClient, type Track, type Specialization, type Milestone, type Module } from '@/services/programsClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUsers } from '@/hooks/useUsers'

export default function TrackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const trackId = params?.id as string | undefined
  const { track, isLoading, error, reload } = useTrack(trackId || '')
  const { updateTrack, isLoading: isUpdating } = useUpdateTrack()
  const { deleteTrack, isLoading: isDeleting } = useDeleteTrack()
  const { users } = useUsers({ page: 1, page_size: 200 })
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Track>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [cohorts, setCohorts] = useState<any[]>([])
  const [loadingCohorts, setLoadingCohorts] = useState(false)

  // Load cohorts for this track
  useEffect(() => {
    const loadCohorts = async () => {
      if (!trackId) return
      setLoadingCohorts(true)
      try {
        const res = await programsClient.getCohorts({ trackId, page: 1, pageSize: 200 })
        setCohorts(Array.isArray(res?.results) ? res.results : [])
      } catch (err) {
        console.error('Failed to load cohorts:', err)
      } finally {
        setLoadingCohorts(false)
      }
    }
    if (trackId) {
      loadCohorts()
    }
  }, [trackId])

  // Initialize form data when track loads
  useEffect(() => {
    if (track && !isEditing) {
      setFormData({
        name: track.name,
        key: track.key,
        track_type: track.track_type,
        description: track.description,
        missions: track.missions || [],
        director: track.director,
      })
    }
  }, [track, isEditing])

  // Get directors and mentors
  const directorsAndMentors = users.filter((u) => 
    u.roles?.some((r: any) => r.role === 'program_director' || r.role === 'mentor')
  ).map((u) => ({
    id: u.id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
  }))

  const handleSave = async () => {
    if (!trackId) return
    setSaveError(null)
    try {
      await updateTrack(trackId, formData)
      setIsEditing(false)
      reload()
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update track')
    }
  }

  const handleDelete = async () => {
    if (!trackId || !confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return
    }
    try {
      await deleteTrack(trackId)
      router.push('/dashboard/director/tracks')
    } catch (err: any) {
      alert(err.message || 'Failed to delete track')
    }
  }

  const handleCancel = () => {
    setFormData({
      name: track?.name,
      key: track?.key,
      track_type: track?.track_type,
      description: track?.description,
      missions: track?.missions || [],
      director: track?.director,
    })
    setIsEditing(false)
    setSaveError(null)
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading track...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error || !track) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-2">Error loading track</p>
              {error && <p className="text-sm text-och-steel mb-4">{error}</p>}
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/director/tracks">
                  <Button variant="outline">Back to Tracks</Button>
                </Link>
              </div>
            </div>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-4xl font-bold bg-och-midnight/50 border border-och-steel/20 rounded-lg px-4 py-2 text-och-defender focus:outline-none focus:border-och-defender"
                  />
                ) : (
                  <h1 className="text-4xl font-bold mb-2 text-och-defender">{track.name}</h1>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                    {track.track_type === 'primary' ? 'Primary Track' : 'Cross-Track Program'}
                  </Badge>
                  {track.program_name && (
                    <Link href={`/dashboard/director/programs/${track.program}`} className="text-och-steel hover:text-och-defender">
                      Program: {track.program_name}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="defender"
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="defender"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Track
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Link href="/dashboard/director/tracks">
                      <Button variant="outline" size="sm">
                        ← Back
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            {saveError && (
              <Card className="border-och-orange/50 bg-och-orange/10 mb-4">
                <div className="p-4 text-och-orange">
                  <p className="font-semibold mb-1">Error saving track</p>
                  <p className="text-sm">{saveError}</p>
                </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Track Details */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Track Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Track Key</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.key || ''}
                          onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        />
                      ) : (
                        <p className="text-white font-mono">{track.key}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Track Type</label>
                      {isEditing ? (
                        <select
                          value={formData.track_type || 'primary'}
                          onChange={(e) => setFormData({ ...formData, track_type: e.target.value as 'primary' | 'cross_track' })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        >
                          <option value="primary">Primary Track</option>
                          <option value="cross_track">Cross-Track Program</option>
                        </select>
                      ) : (
                        <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                          {track.track_type === 'primary' ? 'Primary Track' : 'Cross-Track Program'}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Description</label>
                      {isEditing ? (
                        <textarea
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        />
                      ) : (
                        <p className="text-och-steel">{track.description || 'No description'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Track Director</label>
                      {isEditing ? (
                        <select
                          value={formData.director || ''}
                          onChange={(e) => setFormData({ ...formData, director: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        >
                          <option value="">None (assign later)</option>
                          {directorsAndMentors.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.first_name || ''} {user.last_name || ''} ({user.email})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-white">
                          {track.director ? directorsAndMentors.find(u => u.id === track.director)?.email || 'Unknown' : 'Not assigned'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Mission IDs (from Registry)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={Array.isArray(formData.missions) ? formData.missions.join(', ') : ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            missions: e.target.value.split(',').map(m => m.trim()).filter(Boolean) 
                          })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          placeholder="mission-id-1, mission-id-2, ..."
                        />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {track.missions && track.missions.length > 0 ? (
                            track.missions.map((missionId: string, idx: number) => (
                              <Badge key={idx} variant="steel">{missionId}</Badge>
                            ))
                          ) : (
                            <p className="text-och-steel">No missions linked</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Specializations */}
              {track.specializations && track.specializations.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Specializations ({track.specializations.length})</h2>
                    <div className="space-y-3">
                      {track.specializations.map((spec: Specialization) => (
                        <div key={spec.id} className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                          <h3 className="text-white font-semibold mb-2">{spec.name}</h3>
                          <p className="text-sm text-och-steel mb-2">{spec.description}</p>
                          <div className="flex items-center gap-4 text-xs text-och-steel">
                            <span>Duration: {spec.duration_weeks} weeks</span>
                            {spec.missions && spec.missions.length > 0 && (
                              <span>{spec.missions.length} missions</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Milestones */}
              {track.milestones && track.milestones.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Milestones ({track.milestones.length})</h2>
                    <div className="space-y-4">
                      {track.milestones.map((milestone: Milestone) => (
                        <div key={milestone.id} className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-white font-semibold">{milestone.name}</h3>
                              <p className="text-sm text-och-steel mt-1">{milestone.description}</p>
                            </div>
                            <Badge variant="steel">Order: {milestone.order}</Badge>
                          </div>
                          {milestone.duration_weeks && (
                            <p className="text-xs text-och-steel mb-2">Duration: {milestone.duration_weeks} weeks</p>
                          )}
                          {milestone.modules && milestone.modules.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-och-steel/20">
                              <p className="text-xs text-och-steel mb-2">Modules ({milestone.modules.length}):</p>
                              <div className="space-y-1">
                                {milestone.modules.map((module: Module) => (
                                  <div key={module.id} className="text-xs text-och-steel pl-4">
                                    • {module.name} ({module.content_type})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Cohorts & Stats */}
            <div className="space-y-6">
              {/* Cohorts */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Cohorts ({cohorts.length})</h2>
                    <Link href={`/dashboard/director/cohorts/new?track_id=${trackId}`}>
                      <Button variant="outline" size="sm">+ Create Cohort</Button>
                    </Link>
                  </div>
                  {loadingCohorts ? (
                    <p className="text-och-steel text-sm">Loading cohorts...</p>
                  ) : cohorts.length > 0 ? (
                    <div className="space-y-2">
                      {cohorts.map((cohort) => (
                        <Link key={cohort.id} href={`/dashboard/director/cohorts/${cohort.id}`}>
                          <div className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/50 transition-colors cursor-pointer">
                            <p className="text-white font-medium text-sm">{cohort.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={cohort.status === 'active' ? 'mint' : 'orange'} className="text-xs">
                                {cohort.status}
                              </Badge>
                              <span className="text-xs text-och-steel">
                                {cohort.enrolled_count || 0} / {cohort.seat_cap} seats
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-och-steel text-sm">No cohorts yet</p>
                  )}
                </div>
              </Card>

              {/* Quick Stats */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-och-steel text-sm">Milestones</p>
                      <p className="text-2xl font-bold text-white">{track.milestones?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-och-steel text-sm">Modules</p>
                      <p className="text-2xl font-bold text-white">
                        {track.milestones?.reduce((sum: number, m: Milestone) => sum + (m.modules?.length || 0), 0) || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-och-steel text-sm">Specializations</p>
                      <p className="text-2xl font-bold text-white">{track.specializations?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-och-steel text-sm">Linked Missions</p>
                      <p className="text-2xl font-bold text-white">{track.missions?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <Link href={`/dashboard/director/programs/${track.program}`}>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        📋 View Program
                      </Button>
                    </Link>
                    <Link href={`/dashboard/director/cohorts/new?track_id=${trackId}`}>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        👥 Create Cohort
                      </Button>
                    </Link>
                    {track.milestones && track.milestones.length > 0 && (
                      <Button variant="outline" className="w-full justify-start" size="sm" disabled>
                        📚 Manage Milestones
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}


