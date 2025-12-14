'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'
import { usePrograms, useTracks, useProgram } from '@/hooks/usePrograms'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const ITEMS_PER_PAGE = 20

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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

const RocketIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

export default function MissionsManagementPage() {
  const { programs, isLoading: programsLoading } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  
  // Fetch program detail when program is selected (includes tracks)
  const { program: selectedProgramDetail } = useProgram(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : ''
  )
  
  // Load tracks for the selected program
  const { tracks, isLoading: tracksLoading } = useTracks(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : undefined
  )
  
  const [missions, setMissions] = useState<MissionTemplate[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('all')
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  
  // Form states
  const [showMissionForm, setShowMissionForm] = useState(false)
  const [editingMission, setEditingMission] = useState<MissionTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [missionForm, setMissionForm] = useState<Partial<MissionTemplate>>({
    code: '',
    title: '',
    description: '',
    difficulty: 'beginner',
    type: 'lab',
    track_id: '',
    track_key: '',
    est_hours: undefined,
    estimated_time_minutes: undefined,
    competencies: [],
    requirements: {},
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load missions when filters change
  useEffect(() => {
    loadMissions()
  }, [currentPage, debouncedSearch, selectedTrackFilter, selectedDifficultyFilter, selectedTypeFilter])

  // Use tracks from program detail if available, otherwise use tracks endpoint
  const availableTracks = useMemo(() => {
    if (!selectedProgramId) return []
    
    // Prefer tracks from program detail
    if (selectedProgramDetail?.tracks && Array.isArray(selectedProgramDetail.tracks) && selectedProgramDetail.tracks.length > 0) {
      return selectedProgramDetail.tracks
    }
    
    return tracks
  }, [selectedProgramId, selectedProgramDetail, tracks])

  const loadMissions = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }

      if (selectedTrackFilter !== 'all') {
        // Try to find if it's a track ID or track key
        const track = availableTracks.find(t => String(t.id) === selectedTrackFilter || t.key === selectedTrackFilter)
        if (track) {
          params.track_id = track.id
          params.track_key = track.key
        }
      }

      if (selectedDifficultyFilter !== 'all') {
        params.difficulty = selectedDifficultyFilter
      }

      if (selectedTypeFilter !== 'all') {
        params.type = selectedTypeFilter
      }

      const response = await missionsClient.getAllMissions(params)
      setMissions(response.results || [])
      setTotalCount(response.count || 0)
    } catch (error) {
      console.error('Failed to load missions:', error)
      setMissions([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMission = () => {
    setEditingMission(null)
    setMissionForm({
      code: '',
      title: '',
      description: '',
      difficulty: 'beginner',
      type: 'lab',
      track_id: selectedTrackFilter !== 'all' ? selectedTrackFilter : '',
      track_key: '',
      est_hours: undefined,
      estimated_time_minutes: undefined,
      competencies: [],
      requirements: {},
    })
    setShowMissionForm(true)
  }

  const handleEditMission = (mission: MissionTemplate) => {
    setEditingMission(mission)
    setMissionForm({
      code: mission.code,
      title: mission.title,
      description: mission.description,
      difficulty: mission.difficulty,
      type: mission.type,
      track_id: mission.track_id,
      track_key: mission.track_key,
      est_hours: mission.est_hours,
      estimated_time_minutes: mission.estimated_time_minutes,
      competencies: mission.competencies || [],
      requirements: mission.requirements || {},
    })
    setShowMissionForm(true)
  }

  const handleSaveMission = async () => {
    if (!missionForm.code || !missionForm.title) {
      alert('Mission code and title are required')
      return
    }

    setIsSaving(true)
    try {
      if (editingMission?.id) {
        await missionsClient.updateMission(editingMission.id, missionForm)
      } else {
        await missionsClient.createMission(missionForm)
      }
      setShowMissionForm(false)
      setEditingMission(null)
      loadMissions()
    } catch (error: any) {
      console.error('Failed to save mission:', error)
      alert(error?.response?.data?.detail || error?.message || 'Failed to save mission')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMission = async (missionId: string) => {
    if (!confirm('Are you sure you want to delete this mission? This action cannot be undone.')) {
      return
    }

    try {
      await missionsClient.deleteMission(missionId)
      loadMissions()
    } catch (error: any) {
      console.error('Failed to delete mission:', error)
      alert(error?.response?.data?.detail || error?.message || 'Failed to delete mission')
    }
  }

  const handleAddCompetency = () => {
    setMissionForm({
      ...missionForm,
      competencies: [...(missionForm.competencies || []), ''],
    })
  }

  const handleRemoveCompetency = (index: number) => {
    const newCompetencies = [...(missionForm.competencies || [])]
    newCompetencies.splice(index, 1)
    setMissionForm({
      ...missionForm,
      competencies: newCompetencies,
    })
  }

  const handleCompetencyChange = (index: number, value: string) => {
    const newCompetencies = [...(missionForm.competencies || [])]
    newCompetencies[index] = value
    setMissionForm({
      ...missionForm,
      competencies: newCompetencies,
    })
  }

  const handleTrackChange = (trackId: string) => {
    const track = availableTracks.find(t => String(t.id) === trackId)
    setMissionForm({
      ...missionForm,
      track_id: trackId,
      track_key: track?.key || '',
    })
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'mint'
      case 'intermediate': return 'gold'
      case 'advanced': return 'orange'
      case 'capstone': return 'defender'
      default: return 'steel'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lab': return 'mint'
      case 'scenario': return 'defender'
      case 'project': return 'gold'
      case 'capstone': return 'orange'
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
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold flex items-center gap-3">
                  <RocketIcon />
                  Missions Management
                </h1>
                <p className="text-och-steel">
                  Publish and manage missions, link to tracks, configure competencies and assessment mechanics
                </p>
              </div>
              <Button variant="defender" onClick={handleCreateMission} disabled={showMissionForm}>
                <PlusIcon />
                <span className="ml-2">Create Mission</span>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <FilterIcon />
                <h2 className="text-lg font-semibold text-white">Filters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-och-steel">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search missions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                  />
                </div>

                {/* Program Filter */}
                <select
                  value={selectedProgramId}
                  onChange={(e) => {
                    setSelectedProgramId(e.target.value)
                    setSelectedTrackFilter('all')
                  }}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="">All Programs</option>
                  {programs.map((program) => (
                    <option key={program.id} value={String(program.id)}>
                      {program.name}
                    </option>
                  ))}
                </select>

                {/* Track Filter */}
                <select
                  value={selectedTrackFilter}
                  onChange={(e) => setSelectedTrackFilter(e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  disabled={!selectedProgramId}
                >
                  <option value="all">All Tracks</option>
                  {availableTracks.map((track) => (
                    <option key={track.id} value={String(track.id)}>
                      {track.name}
                    </option>
                  ))}
                </select>

                {/* Difficulty Filter */}
                <select
                  value={selectedDifficultyFilter}
                  onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="capstone">Capstone</option>
                </select>

                {/* Type Filter */}
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Types</option>
                  <option value="lab">Lab</option>
                  <option value="scenario">Scenario</option>
                  <option value="project">Project</option>
                  <option value="capstone">Capstone</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Missions List */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-och-steel">
                    Showing <span className="text-white font-semibold">{missions.length}</span> of{' '}
                    <span className="text-white font-semibold">{totalCount}</span> missions
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading missions...</p>
                  </div>
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center py-12">
                  <RocketIcon />
                  <p className="text-och-steel text-lg mt-4 mb-2">No missions found</p>
                  <p className="text-och-steel text-sm mb-4">
                    {debouncedSearch || selectedTrackFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first mission to get started'}
                  </p>
                  {!debouncedSearch && selectedTrackFilter === 'all' && (
                    <Button variant="defender" onClick={handleCreateMission}>
                      <PlusIcon />
                      <span className="ml-2">Create Mission</span>
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {missions.map((mission) => {
                      const track = availableTracks.find(t => String(t.id) === mission.track_id || t.key === mission.track_key)
                      
                      return (
                        <Link
                          key={mission.id}
                          href={`/dashboard/director/curriculum/missions/${mission.id}`}
                          className="block"
                        >
                        <div
                          className="p-5 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-mint/30 transition-all cursor-pointer"
                          onClick={(e) => {
                            // Prevent navigation when clicking edit/delete buttons
                            if ((e.target as HTMLElement).closest('button')) {
                              e.preventDefault()
                              e.stopPropagation()
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{mission.code}</h3>
                                <Badge variant={getDifficultyColor(mission.difficulty)}>
                                  {mission.difficulty}
                                </Badge>
                                <Badge variant={getTypeColor(mission.type)}>
                                  {mission.type}
                                </Badge>
                                {track && (
                                  <Badge variant="steel">{track.name}</Badge>
                                )}
                              </div>
                              <h4 className="text-white font-medium mb-1">{mission.title}</h4>
                              {mission.description && (
                                <p className="text-sm text-och-steel mb-3 line-clamp-2">{mission.description}</p>
                              )}
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                {mission.est_hours && (
                                  <div>
                                    <p className="text-xs text-och-steel mb-1">Est. Hours</p>
                                    <p className="text-sm text-white font-medium">{mission.est_hours}h</p>
                                  </div>
                                )}
                                {mission.estimated_time_minutes && (
                                  <div>
                                    <p className="text-xs text-och-steel mb-1">Est. Minutes</p>
                                    <p className="text-sm text-white font-medium">{mission.estimated_time_minutes}min</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-och-steel mb-1">Competencies</p>
                                  <p className="text-sm text-white font-medium">
                                    {mission.competencies?.length || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-och-steel mb-1">Created</p>
                                  <p className="text-sm text-white font-medium">
                                    {mission.created_at ? new Date(mission.created_at).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                              </div>

                              {mission.competencies && mission.competencies.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {mission.competencies.slice(0, 5).map((competency, idx) => (
                                    <Badge key={idx} variant="steel" className="text-xs">
                                      {competency}
                                    </Badge>
                                  ))}
                                  {mission.competencies.length > 5 && (
                                    <Badge variant="steel" className="text-xs">
                                      +{mission.competencies.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleEditMission(mission)
                                }}
                              >
                                <EditIcon />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDeleteMission(mission.id!)
                                }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <TrashIcon />
                              </Button>
                            </div>
                          </div>
                        </div>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-och-steel">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!hasPrevPage || isLoading}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'defender' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                disabled={isLoading}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!hasNextPage || isLoading}
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

          {/* Mission Form Modal */}
          {showMissionForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {editingMission ? 'Edit Mission' : 'Create Mission'}
                  </h2>

                  <div className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Mission Code *</label>
                        <input
                          type="text"
                          value={missionForm.code}
                          onChange={(e) => setMissionForm({ ...missionForm, code: e.target.value })}
                          placeholder="e.g., SIEM-03"
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Title *</label>
                        <input
                          type="text"
                          value={missionForm.title}
                          onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                          placeholder="Mission title"
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Description</label>
                      <textarea
                        value={missionForm.description || ''}
                        onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                        placeholder="Mission description and narrative"
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                        rows={4}
                      />
                    </div>

                    {/* Difficulty and Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Difficulty *</label>
                        <select
                          value={missionForm.difficulty}
                          onChange={(e) => setMissionForm({ ...missionForm, difficulty: e.target.value as any })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="capstone">Capstone</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Type *</label>
                        <select
                          value={missionForm.type}
                          onChange={(e) => setMissionForm({ ...missionForm, type: e.target.value as any })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        >
                          <option value="lab">Lab</option>
                          <option value="scenario">Scenario</option>
                          <option value="project">Project</option>
                          <option value="capstone">Capstone</option>
                        </select>
                      </div>
                    </div>

                    {/* Track Assignment */}
                    {selectedProgramId && (
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Track</label>
                        <select
                          value={missionForm.track_id || ''}
                          onChange={(e) => handleTrackChange(e.target.value)}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        >
                          <option value="">No track assigned</option>
                          {availableTracks.map((track) => (
                            <option key={track.id} value={String(track.id)}>
                              {track.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Time Estimates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Estimated Hours</label>
                        <input
                          type="number"
                          min="1"
                          value={missionForm.est_hours || ''}
                          onChange={(e) => setMissionForm({ ...missionForm, est_hours: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Estimated Minutes</label>
                        <input
                          type="number"
                          min="1"
                          value={missionForm.estimated_time_minutes || ''}
                          onChange={(e) => setMissionForm({ ...missionForm, estimated_time_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        />
                      </div>
                    </div>

                    {/* Competencies */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-white">Competencies (MCRR)</label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddCompetency}
                        >
                          <PlusIcon />
                          <span className="ml-1">Add</span>
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {missionForm.competencies?.map((competency, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={competency}
                              onChange={(e) => handleCompetencyChange(index, e.target.value)}
                              placeholder="e.g., SIEM, Alerting, IR"
                              className="flex-1 px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveCompetency(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        ))}
                        {(!missionForm.competencies || missionForm.competencies.length === 0) && (
                          <p className="text-sm text-och-steel">No competencies added. Click "Add" to link competencies from MCRR.</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-och-steel/20">
                      <Button
                        variant="defender"
                        onClick={handleSaveMission}
                        disabled={isSaving || !missionForm.code || !missionForm.title}
                      >
                        {isSaving ? 'Saving...' : editingMission ? 'Update Mission' : 'Create Mission'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowMissionForm(false)
                          setEditingMission(null)
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
