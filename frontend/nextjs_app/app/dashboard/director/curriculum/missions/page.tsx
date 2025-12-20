'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'
import { usePrograms, useTracks, useProgram } from '@/hooks/usePrograms'
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
  const router = useRouter()
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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  
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
    // OCH Admin fields
    status: 'draft',
    assessment_mode: 'hybrid',
    requires_mentor_review: false,
    story_narrative: '',
    subtasks: [],
    evidence_upload_schema: {
      file_types: [],
      max_file_size_mb: 10,
      required_artifacts: [],
    },
    time_constraint_hours: undefined,
    competency_coverage: [],
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
  }, [currentPage, debouncedSearch, selectedProgramId, selectedTrackFilter, selectedDifficultyFilter, selectedTypeFilter, selectedStatusFilter])

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

      if (selectedProgramId && selectedProgramId !== '') {
        params.program_id = selectedProgramId
      }

      if (selectedTrackFilter !== 'all') {
        // Track filter select stores track.id
        params.track_id = selectedTrackFilter
      }

      if (selectedDifficultyFilter !== 'all') {
        params.difficulty = selectedDifficultyFilter
      }

      if (selectedTypeFilter !== 'all') {
        params.type = selectedTypeFilter
      }

      if (selectedStatusFilter !== 'all') {
        params.status = selectedStatusFilter
      }

      const response = await missionsClient.getAllMissions(params)
      console.log('✅ Missions loaded:', {
        count: response.results?.length || 0,
        total: response.count || 0,
        page: currentPage,
        hasNext: !!response.next,
        hasPrevious: !!response.previous,
      })
      
      setMissions(response.results || [])
      setTotalCount(response.count || 0)
    } catch (error: any) {
      console.error('❌ Failed to load missions:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load missions'
      console.error('Error details:', errorMessage)
      setMissions([])
      setTotalCount(0)
      // Optionally show error to user
      // alert(`Failed to load missions: ${errorMessage}`)
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
      // OCH Admin fields
      status: 'draft',
      assessment_mode: 'hybrid',
      requires_mentor_review: false,
      story_narrative: '',
      subtasks: [],
      evidence_upload_schema: {
        file_types: [],
        max_file_size_mb: 10,
        required_artifacts: [],
      },
      time_constraint_hours: undefined,
      competency_coverage: [],
    })
    setShowMissionForm(true)
  }

  const handleOpenMission = (missionId?: string) => {
    if (!missionId) return
    router.push(`/dashboard/director/curriculum/missions/${missionId}`)
  }

  const handleSaveMission = async () => {
    if (!missionForm.code || !missionForm.title) {
      alert('Mission code and title are required')
      return
    }

    // Validate competency coverage weights sum to 100
    if (missionForm.competency_coverage && missionForm.competency_coverage.length > 0) {
      const totalWeight = missionForm.competency_coverage.reduce((sum, cov) => sum + (cov.weight_percentage || 0), 0)
      if (Math.abs(totalWeight - 100) > 0.01) {
        alert(`Competency coverage weights must sum to 100%. Current total: ${totalWeight.toFixed(2)}%`)
        return
      }
    }

    setIsSaving(true)
    try {
      // Prepare mission data - store OCH Admin fields in requirements JSON
      const missionData: any = {
        code: missionForm.code.trim(),
        title: missionForm.title.trim(),
        description: missionForm.description || '',
        difficulty: missionForm.difficulty,
        type: missionForm.type,
        track_id: missionForm.track_id || null,
        track_key: missionForm.track_key || '',
        est_hours: missionForm.est_hours,
        estimated_time_minutes: missionForm.estimated_time_minutes,
        competencies: missionForm.competencies || [],
        // Store OCH Admin fields in requirements JSON
        requirements: {
          ...(missionForm.requirements || {}),
          status: missionForm.status || 'draft',
          assessment_mode: missionForm.assessment_mode || 'hybrid',
          requires_mentor_review: missionForm.requires_mentor_review ?? false,
          story_narrative: missionForm.story_narrative || '',
          subtasks: missionForm.subtasks || [],
          evidence_upload_schema: missionForm.evidence_upload_schema || {
            file_types: [],
            max_file_size_mb: 10,
            required_artifacts: [],
          },
          time_constraint_hours: missionForm.time_constraint_hours,
          competency_coverage: missionForm.competency_coverage || [],
          rubric_id: missionForm.rubric_id,
          module_id: missionForm.module_id,
        },
      }

      if (editingMission?.id) {
        await missionsClient.updateMission(editingMission.id, missionData)
      } else {
        await missionsClient.createMission(missionData)
      }
      setShowMissionForm(false)
      setEditingMission(null)
      // Clear filters that might exclude the newly created mission
      // Reset to first page and reload missions
      setCurrentPage(1)
      // Don't clear all filters, but ensure we can see the new mission
      // If we have track filter set, keep it; otherwise clear type/difficulty filters
      if (selectedTrackFilter === 'all') {
        setSelectedTypeFilter('all')
        setSelectedDifficultyFilter('all')
        setSelectedStatusFilter('all')
      }
      await loadMissions()
    } catch (error: any) {
      console.error('Failed to save mission:', error)
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Failed to save mission'
      alert(errorMessage)
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
      // Reload missions - adjust page if needed
      const newTotalCount = totalCount - 1
      const newTotalPages = Math.ceil(newTotalCount / ITEMS_PER_PAGE)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
      await loadMissions()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'steel'
      case 'approved': return 'gold'
      case 'published': return 'mint'
      case 'retired': return 'orange'
      default: return 'steel'
    }
  }

  const getMissionStatus = (mission: MissionTemplate): string => {
    return mission.status || mission.requirements?.status || 'draft'
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
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
                    setCurrentPage(1)
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
                  onChange={(e) => {
                    setSelectedTrackFilter(e.target.value)
                    setCurrentPage(1)
                  }}
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
                  onChange={(e) => {
                    setSelectedDifficultyFilter(e.target.value)
                    setCurrentPage(1)
                  }}
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
                  onChange={(e) => {
                    setSelectedTypeFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Types</option>
                  <option value="lab">Lab</option>
                  <option value="scenario">Scenario</option>
                  <option value="project">Project</option>
                  <option value="capstone">Capstone</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => {
                    setSelectedStatusFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="retired">Retired</option>
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
                    {totalPages > 1 && (
                      <span className="text-och-steel"> (Page {currentPage} of {totalPages})</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadMissions()}
                  disabled={isLoading}
                  title="Refresh missions list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="ml-2">Refresh</span>
                </Button>
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
                    {debouncedSearch || selectedTrackFilter !== 'all' || selectedDifficultyFilter !== 'all' || selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all' 
                      ? 'No missions match your current filters. Try adjusting your filters or create a new mission.' 
                      : 'Create your first mission to get started'}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {(debouncedSearch || selectedTrackFilter !== 'all' || selectedDifficultyFilter !== 'all' || selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all') && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedTrackFilter('all')
                          setSelectedDifficultyFilter('all')
                          setSelectedTypeFilter('all')
                          setSelectedStatusFilter('all')
                          setCurrentPage(1)
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                    <Button variant="defender" onClick={handleCreateMission}>
                      <PlusIcon />
                      <span className="ml-2">Create Mission</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="hidden md:grid grid-cols-12 gap-3 text-xs uppercase tracking-wide text-och-steel pb-3 border-b border-och-steel/20">
                      <div className="col-span-5">Mission</div>
                      <div className="col-span-3">Track / Tags</div>
                      <div className="col-span-2">Est.</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>

                    <div className="divide-y divide-och-steel/10">
                      {missions.map((mission) => {
                        const track = availableTracks.find(
                          (t) => String(t.id) === String(mission.track_id) || t.key === mission.track_key
                        )
                        const trackLabel =
                          mission.track_name ||
                          track?.name ||
                          mission.track_key ||
                          (mission.track_id ? String(mission.track_id) : '')
                        const programLabel = mission.program_name || (track as any)?.program_name || ''
                        const missionStatus = getMissionStatus(mission)

                        return (
                          <div
                            key={mission.id}
                            onClick={() => handleOpenMission(mission.id)}
                            className="py-4 cursor-pointer hover:bg-och-midnight/30 transition-colors"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                              <div className="md:col-span-5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-white font-semibold">{mission.code}</div>
                                  <Badge variant={getStatusColor(missionStatus)}>{missionStatus}</Badge>
                                  <Badge variant={getDifficultyColor(mission.difficulty)}>{mission.difficulty}</Badge>
                                  <Badge variant={getTypeColor(mission.type)}>{mission.type}</Badge>
                                  {mission.requirements?.requires_mentor_review && (
                                    <Badge variant="gold">Mentor Review</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-white mt-1 font-medium">{mission.title}</div>
                                <div className="text-xs text-och-steel mt-1 line-clamp-2">
                                  {mission.description || 'No description'}
                                </div>
                              </div>

                              <div className="md:col-span-3">
                                <div className="text-sm text-white">{trackLabel ? trackLabel : 'Unassigned'}</div>
                                {programLabel && (
                                  <div className="text-xs text-och-steel mt-0.5">{programLabel}</div>
                                )}
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {(mission.competencies || []).slice(0, 3).map((c, idx) => (
                                    <Badge key={idx} variant="steel" className="text-xs">
                                      {c}
                                    </Badge>
                                  ))}
                                  {(mission.competencies || []).length > 3 && (
                                    <Badge variant="steel" className="text-xs">
                                      +{(mission.competencies || []).length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="md:col-span-2 text-sm text-white">
                                <div>
                                  {mission.est_hours ? `${mission.est_hours}h` : '—'} /{' '}
                                  {mission.estimated_time_minutes ? `${mission.estimated_time_minutes}m` : '—'}
                                </div>
                                <div className="text-xs text-och-steel mt-1">
                                  Created {mission.created_at ? new Date(mission.created_at).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>

                              <div className="md:col-span-2 flex gap-2 md:justify-end" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="defender"
                                  size="sm"
                                  onClick={() => handleOpenMission(mission.id)}
                                >
                                  Manage & Analytics
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
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

                    {/* Mission Status and Lifecycle */}
                    <div className="border-t border-och-steel/20 pt-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Mission Lifecycle & Publishing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                          <label className="block text-sm font-medium text-white mb-2">Status *</label>
                          <select
                            value={missionForm.status || 'draft'}
                            onChange={(e) => setMissionForm({ ...missionForm, status: e.target.value as any })}
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                            required
                          >
                            <option value="draft">Draft</option>
                            <option value="approved">Approved</option>
                            <option value="published">Published</option>
                            <option value="retired">Retired</option>
                          </select>
                          <p className="text-xs text-och-steel mt-1">Lifecycle: draft → approved → published → retired</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Time Constraint (Hours)</label>
                          <input
                            type="number"
                            min="1"
                            max="168"
                            value={missionForm.time_constraint_hours || ''}
                            onChange={(e) => setMissionForm({ ...missionForm, time_constraint_hours: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="24-168 hours (1-7 days)"
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                          />
                          <p className="text-xs text-och-steel mt-1">For time-bound missions (24h to 7 days)</p>
                        </div>
                      </div>
                    </div>

                    {/* Assessment Configuration */}
                    <div className="border-t border-och-steel/20 pt-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Assessment Mechanics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Assessment Mode *</label>
                          <select
                            value={missionForm.assessment_mode || 'hybrid'}
                            onChange={(e) => setMissionForm({ ...missionForm, assessment_mode: e.target.value as any })}
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                            required
                          >
                            <option value="auto">Auto (AI Only)</option>
                            <option value="manual">Manual (Mentor Only)</option>
                            <option value="hybrid">Hybrid (AI + Mentor)</option>
                          </select>
                        </div>
                        <div className="flex items-center pt-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={missionForm.requires_mentor_review ?? false}
                              onChange={(e) => setMissionForm({ ...missionForm, requires_mentor_review: e.target.checked })}
                              className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel rounded focus:ring-och-defender"
                            />
                            <span className="text-sm text-white">Requires Mentor Review ($7 Premium)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Story Narrative */}
                    <div className="border-t border-och-steel/20 pt-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Mission Narrative</h3>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Story Narrative</label>
                        <textarea
                          value={missionForm.story_narrative || ''}
                          onChange={(e) => setMissionForm({ ...missionForm, story_narrative: e.target.value })}
                          placeholder="Enter the mission story, context, and objectives..."
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                          rows={5}
                        />
                        <p className="text-xs text-och-steel mt-1">Provide the narrative context and objectives for this mission</p>
                      </div>
                    </div>

                    {/* Competencies */}
                    <div className="border-t border-och-steel/20 pt-4">
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

                    {/* Evidence Upload Schema */}
                    <div className="border-t border-och-steel/20 pt-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Evidence Upload Requirements</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Max File Size (MB)</label>
                          <input
                            type="number"
                            min="1"
                            value={missionForm.evidence_upload_schema?.max_file_size_mb || 10}
                            onChange={(e) => setMissionForm({
                              ...missionForm,
                              evidence_upload_schema: {
                                ...missionForm.evidence_upload_schema,
                                max_file_size_mb: parseInt(e.target.value) || 10,
                              }
                            })}
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Allowed File Types</label>
                          <input
                            type="text"
                            value={missionForm.evidence_upload_schema?.file_types?.join(', ') || ''}
                            onChange={(e) => setMissionForm({
                              ...missionForm,
                              evidence_upload_schema: {
                                ...missionForm.evidence_upload_schema,
                                file_types: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                              }
                            })}
                            placeholder="e.g., pdf, zip, png, jpg"
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                          />
                          <p className="text-xs text-och-steel mt-1">Comma-separated list (e.g., pdf, zip, png, jpg)</p>
                        </div>
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
