'use client'

import { useState, useMemo, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useTracks, useDeleteTrack, usePrograms, useProgram } from '@/hooks/usePrograms'
import { programsClient, type Track, type Program } from '@/services/programsClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TracksPage() {
  const router = useRouter()
  const { programs, isLoading: loadingPrograms, reload: reloadPrograms } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all')
  
  // Fetch selected program details dynamically to get latest updates
  const { program: selectedProgramFromApi, isLoading: loadingSelectedProgram, reload: reloadSelectedProgram } = useProgram(
    selectedProgramId !== 'all' ? selectedProgramId : ''
  )
  
  const { tracks: tracksFromApi, isLoading, error, reload } = useTracks(selectedProgramId === 'all' ? undefined : selectedProgramId)
  const { deleteTrack, isLoading: isDeleting } = useDeleteTrack()
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cohortsMap, setCohortsMap] = useState<Record<string, number>>({})

  // Use fetched program details if available, otherwise fall back to cached list
  const selectedProgram = useMemo(() => {
    if (selectedProgramId === 'all') return null
    // Prefer the fresh API data if available (this ensures we get latest updates)
    if (selectedProgramFromApi) return selectedProgramFromApi
    // Fall back to cached list as backup
    return programs.find(p => p.id === selectedProgramId)
  }, [selectedProgramId, selectedProgramFromApi, programs])

  // Use tracks from program detail if available (more accurate), otherwise use tracks from API
  // Program detail tracks include all tracks without permission filtering issues
  // This ensures we always show the tracks that actually belong to the program
  const tracks = useMemo(() => {
    if (selectedProgramId === 'all') {
      return tracksFromApi
    }
    // Prefer tracks from program detail API as it's the source of truth
    // The program detail endpoint returns all tracks for the program without permission filtering
    if (selectedProgramFromApi?.tracks && Array.isArray(selectedProgramFromApi.tracks) && selectedProgramFromApi.tracks.length > 0) {
      const programTracks = selectedProgramFromApi.tracks
      const apiTracks = tracksFromApi
      
      console.log('📊 Using tracks from program detail API (source of truth):', {
        programId: selectedProgramId,
        programName: selectedProgramFromApi.name,
        tracksFromProgramDetail: programTracks.length,
        tracksFromTracksEndpoint: apiTracks.length,
        programTracks: programTracks.map(t => ({ id: t.id, name: t.name, program: t.program })),
        apiTracks: apiTracks.map(t => ({ id: t.id, name: t.name, program: t.program }))
      })
      
      // If there's a mismatch, log it for debugging
      if (programTracks.length !== apiTracks.length) {
        console.warn('⚠️ Track count mismatch detected!', {
          programDetailTracks: programTracks.length,
          apiTracksEndpoint: apiTracks.length,
          programId: selectedProgramId,
          programName: selectedProgramFromApi.name,
          message: 'Using program detail tracks as source of truth'
        })
        
        // Check if any tracks from program detail are missing from API tracks
        const programTrackIds = new Set(programTracks.map(t => t.id))
        const apiTrackIds = new Set(apiTracks.map(t => t.id))
        const missingFromApi = programTracks.filter(t => !apiTrackIds.has(t.id))
        const extraInApi = apiTracks.filter(t => !programTrackIds.has(t.id))
        
        if (missingFromApi.length > 0) {
          console.warn('📋 Tracks in program but missing from API endpoint:', missingFromApi.map(t => ({ id: t.id, name: t.name })))
        }
        if (extraInApi.length > 0) {
          console.warn('📋 Tracks in API endpoint but not in program:', extraInApi.map(t => ({ id: t.id, name: t.name, program: t.program })))
        }
      }
      
      return programTracks
    }
    // Fall back to tracks from API endpoint if program detail hasn't loaded yet or doesn't have tracks
    console.log('📊 Using tracks from tracks API endpoint:', {
      programId: selectedProgramId,
      tracksCount: tracksFromApi.length
    })
    return tracksFromApi
  }, [selectedProgramId, selectedProgramFromApi, tracksFromApi])

  // Load cohort counts for each track
  useEffect(() => {
    if (tracks.length === 0) return
    const loadCohortCounts = async () => {
      const counts: Record<string, number> = {}
      for (const track of tracks) {
        if (track.id) {
          try {
            const cohorts = await programsClient.getCohorts({ trackId: String(track.id) })
            counts[track.id] = Array.isArray(cohorts) ? cohorts.length : 0
          } catch (err) {
            console.error(`Failed to load cohorts for track ${track.id}:`, err)
            counts[track.id] = 0
          }
        }
      }
      setCohortsMap(counts)
    }
    loadCohortCounts()
  }, [tracks])

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      // Filter by track type
      if (filterType !== 'all' && track.track_type !== filterType) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = track.name?.toLowerCase().includes(query)
        const matchesDescription = track.description?.toLowerCase().includes(query)
        const matchesKey = track.key?.toLowerCase().includes(query)
        if (!matchesName && !matchesDescription && !matchesKey) return false
      }
      
      return true
    })
  }, [tracks, filterType, searchQuery])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete track "${name}"? This action cannot be undone and will affect all associated cohorts and enrollments.`)) {
      return
    }
    try {
      await deleteTrack(id)
      await reload()
    } catch (err: any) {
      alert(err.message || 'Failed to delete track')
      console.error('Failed to delete track:', err)
    }
  }

  const handleViewProgram = (programId: string | undefined) => {
    if (programId) {
      router.push(`/dashboard/director/programs/${programId}`)
    }
  }

  if (isLoading || loadingPrograms || (selectedProgramId !== 'all' && loadingSelectedProgram)) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="max-w-7xl mx-auto">
            <Card className="border-och-orange/50">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-och-orange text-xl">⚠️</div>
                  <h2 className="text-xl font-bold text-white">Error Loading Tracks</h2>
                </div>
                <p className="text-och-steel mb-4">{error}</p>
                <Button onClick={reload} variant="defender" size="sm">
                  Retry
                </Button>
              </div>
            </Card>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Tracks Management</h1>
                <p className="text-och-steel">
                  {selectedProgram 
                    ? `Viewing tracks for: ${selectedProgram.name}`
                    : 'View and manage learning tracks across all programs'}
                </p>
              </div>
              <div className="flex gap-3">
                {selectedProgramId !== 'all' && (
                  <Link href={`/dashboard/director/programs/${selectedProgramId}`}>
                    <Button variant="defender" size="sm">
                      Manage Program
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/director/programs/new">
                  <Button variant="outline" size="sm">
                    + Create Program
                  </Button>
                </Link>
              </div>
            </div>

            {/* Program Selector - Prominent */}
            <Card className="mb-6 border-och-defender/50">
              <div className="p-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Select Program to Manage Tracks
                </label>
                <div className="flex gap-4 items-center">
                  <select
                    value={selectedProgramId}
                    onChange={(e) => {
                      setSelectedProgramId(e.target.value)
                      setSearchQuery('') // Reset search when changing program
                      setFilterType('all') // Reset filters
                      // Reload programs list to ensure we have latest data
                      if (e.target.value !== 'all') {
                        reloadPrograms()
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender text-lg font-medium"
                  >
                    <option value="all">📚 All Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} {program.status === 'active' ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedProgramId !== 'all' && selectedProgram && (
                    <Link href={`/dashboard/director/programs/${selectedProgramId}`}>
                      <Button variant="outline" size="sm">
                        View Program Details
                      </Button>
                    </Link>
                  )}
                </div>
                {selectedProgram && (
                  <div className="mt-4 pt-4 border-t border-och-steel/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-och-steel">Status:</span>
                        <Badge 
                          variant={selectedProgram.status === 'active' ? 'defender' : selectedProgram.status === 'archived' ? 'steel' : 'steel'}
                          className="ml-2"
                        >
                          {selectedProgram.status || 'N/A'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-och-steel">Duration:</span>
                        <span className="ml-2 text-white font-medium">
                          {selectedProgram.duration_months ? `${selectedProgram.duration_months} months` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-och-steel">Category:</span>
                        <span className="ml-2 text-white font-medium">
                          {selectedProgram.category || selectedProgram.categories?.[0] || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-och-steel">Tracks:</span>
                        <span className="ml-2 text-white font-medium">
                          {selectedProgramFromApi?.tracks_count ?? selectedProgramFromApi?.tracks?.length ?? tracks.length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Filters */}
            <Card>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Search Tracks</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, key, or description..."
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Track Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="all">All Types</option>
                      <option value="primary">Primary Track</option>
                      <option value="cross_track">Cross-Track Program</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="text-och-steel">
              {selectedProgram ? (
                <>
                  Showing <span className="text-white font-semibold">{filteredTracks.length}</span> of{' '}
                  <span className="text-white font-semibold">{tracks.length}</span> tracks in{' '}
                  <span className="text-och-defender font-semibold">{selectedProgram.name}</span>
                </>
              ) : (
                <>
                  Showing <span className="text-white font-semibold">{filteredTracks.length}</span> of{' '}
                  <span className="text-white font-semibold">{tracks.length}</span> tracks across all programs
                </>
              )}
            </div>
            {tracks.length > 0 && (
              <div className="flex gap-2">
                {selectedProgramId !== 'all' && (
                  <Button 
                    onClick={() => {
                      reloadPrograms() // Refresh programs list (for dropdown)
                      reloadSelectedProgram() // Refresh selected program details
                      reload() // Refresh tracks
                    }} 
                    variant="outline" 
                    size="sm"
                    title="Refresh program details and tracks"
                  >
                    🔄 Refresh Program & Tracks
                  </Button>
                )}
                <Button onClick={reload} variant="outline" size="sm" title="Refresh tracks only">
                  🔄 Refresh Tracks
                </Button>
              </div>
            )}
          </div>

          {filteredTracks.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <p className="text-och-steel mb-4">No tracks found</p>
                {tracks.length === 0 ? (
                  <div>
                    {selectedProgramId === 'all' ? (
                      <>
                        <p className="text-och-steel mb-4">No tracks found. Select a program above or create a new program.</p>
                        <Link href="/dashboard/director/programs/new">
                          <Button variant="defender">Create New Program</Button>
                        </Link>
                      </>
                    ) : selectedProgram ? (
                      <>
                        <p className="text-och-steel mb-4">No tracks found in "{selectedProgram.name}". Add tracks to this program.</p>
                        <Link href={`/dashboard/director/programs/${selectedProgramId}`}>
                          <Button variant="defender">View Program Details</Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-och-steel mb-4">No programs found. Create a program first, then add tracks to it.</p>
                        <Link href="/dashboard/director/programs/new">
                          <Button variant="defender">Create Your First Program</Button>
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-och-steel">Try adjusting your filters</p>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTracks.map((track) => (
                <Card key={track.id} className="border-och-defender/30 hover:border-och-defender/50 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                            {track.track_type === 'primary' ? 'Primary Track' : 'Cross-Track'}
                          </Badge>
                          <h3 className="text-xl font-bold text-white">{track.name}</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-och-steel">Key:</span>
                            <code className="px-2 py-1 bg-och-midnight/50 rounded text-och-defender font-mono text-xs">
                              {track.key}
                            </code>
                          </div>
                          {track.program_name && (
                            <div className="flex items-center gap-2">
                              <span className="text-och-steel">Program:</span>
                              {track.program ? (
                                <button
                                  onClick={() => handleViewProgram(track.program)}
                                  className="text-och-defender hover:text-och-defender/80 hover:underline cursor-pointer"
                                  title={`View ${track.program_name} program`}
                                >
                                  {track.program_name}
                                </button>
                              ) : (
                                <span className="text-och-steel">{track.program_name}</span>
                              )}
                            </div>
                          )}
                          {!track.program_name && track.program && (
                            <div className="flex items-center gap-2">
                              <span className="text-och-steel">Program ID:</span>
                              <code className="px-2 py-1 bg-och-midnight/50 rounded text-och-steel font-mono text-xs">
                                {track.program}
                              </code>
                            </div>
                          )}
                          {track.description && (
                            <p className="text-och-steel mt-2 line-clamp-2">{track.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-och-steel/20">
                      <div>
                        <p className="text-xs text-och-steel mb-1">Milestones</p>
                        <p className="text-lg font-bold text-white">{track.milestones?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-och-steel mb-1">Modules</p>
                        <p className="text-lg font-bold text-white">
                          {track.milestones?.reduce((sum: number, m: any) => sum + (m.modules?.length || 0), 0) || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-och-steel mb-1">Specializations</p>
                        <p className="text-lg font-bold text-white">{track.specializations?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-och-steel mb-1">Cohorts</p>
                        <p className="text-lg font-bold text-white">{cohortsMap[track.id || ''] || 0}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-och-steel/20">
                      {track.id && (
                        <>
                          <Link href={`/dashboard/director/tracks/${track.id}`} className="flex-1 min-w-[140px]">
                            <Button variant="defender" size="sm" className="w-full">
                              ✏️ Edit Track
                            </Button>
                          </Link>
                          {track.program && (
                            <Link href={`/dashboard/director/programs/${track.program}`}>
                              <Button variant="outline" size="sm">
                                📋 View Program
                              </Button>
                            </Link>
                          )}
                          {track.program && (
                            <Link href={`/dashboard/director/programs/${track.program}/edit`}>
                              <Button variant="outline" size="sm">
                                ⚙️ Edit Program
                              </Button>
                            </Link>
                          )}
                          {track.id && (
                            <Link href={`/dashboard/director/cohorts/new?track_id=${track.id}`}>
                              <Button variant="outline" size="sm">
                                + Create Cohort
                              </Button>
                            </Link>
                          )}
                          {track.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(track.id!, track.name)}
                              disabled={isDeleting}
                              className="text-och-orange hover:text-och-orange/80 hover:border-och-orange"
                            >
                              {isDeleting ? 'Deleting...' : '🗑️ Delete'}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

