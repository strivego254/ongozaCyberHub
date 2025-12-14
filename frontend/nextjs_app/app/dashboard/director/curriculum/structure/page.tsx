'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient, type Program, type Track, type Milestone, type Module } from '@/services/programsClient'
import { usePrograms, useTracks, useProgram } from '@/hooks/usePrograms'

interface Lesson {
  id?: string
  module?: string
  title: string
  description?: string
  content_url?: string
  order_index: number
}

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

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export default function CurriculumStructurePage() {
  const { programs, isLoading: programsLoading } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  
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
        tracks: selectedProgramDetail.tracks.map((t: any) => ({ id: t.id, name: t.name, program: t.program }))
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
  
  const tracksLoading = loadingProgramDetail || loadingTracksFromEndpoint
  
  const [selectedTrackId, setSelectedTrackId] = useState<string>('')
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  
  // Form states
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  
  const [milestoneForm, setMilestoneForm] = useState<Partial<Milestone>>({
    name: '',
    description: '',
    order: 0,
    duration_weeks: 4,
  })
  
  const [moduleForm, setModuleForm] = useState<Partial<Module>>({
    name: '',
    description: '',
    content_type: 'video',
    content_url: '',
    order: 0,
    estimated_hours: 1,
    skills: [],
  })

  // Tracks are already filtered from program detail or endpoint, just use them directly
  const availableTracks = useMemo(() => {
    if (!selectedProgramId) return []
    // Tracks from program detail are already filtered, so use them directly
    return tracks
  }, [tracks, selectedProgramId])

  // Load milestones when track is selected
  useEffect(() => {
    if (selectedTrackId) {
      loadMilestones()
    } else {
      setMilestones([])
      setModules([])
    }
  }, [selectedTrackId])

  const loadMilestones = async () => {
    setIsLoading(true)
    try {
      const data = await programsClient.getMilestones(selectedTrackId)
      setMilestones(data.sort((a, b) => (a.order || 0) - (b.order || 0)))
      
      // Load modules for all milestones
      const allModules: Module[] = []
      for (const milestone of data) {
        if (milestone.id) {
          const milestoneModules = await programsClient.getModules(milestone.id)
          allModules.push(...milestoneModules)
        }
      }
      setModules(allModules.sort((a, b) => (a.order || 0) - (b.order || 0)))
    } catch (error) {
      console.error('Failed to load milestones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMilestoneToggle = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones)
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId)
    } else {
      newExpanded.add(milestoneId)
    }
    setExpandedMilestones(newExpanded)
  }

  const handleCreateMilestone = () => {
    setEditingMilestone(null)
    setMilestoneForm({
      name: '',
      description: '',
      order: milestones.length,
      duration_weeks: 4,
    })
    setShowMilestoneForm(true)
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setMilestoneForm({
      name: milestone.name,
      description: milestone.description,
      order: milestone.order,
      duration_weeks: milestone.duration_weeks,
    })
    setShowMilestoneForm(true)
  }

  const handleSaveMilestone = async () => {
    if (!selectedTrackId || !milestoneForm.name) return

    try {
      if (editingMilestone?.id) {
        await programsClient.updateMilestone(editingMilestone.id, {
          ...milestoneForm,
          track: selectedTrackId,
        })
      } else {
        await programsClient.createMilestone({
          ...milestoneForm,
          track: selectedTrackId,
        })
      }
      setShowMilestoneForm(false)
      loadMilestones()
    } catch (error) {
      console.error('Failed to save milestone:', error)
      alert('Failed to save milestone')
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone? This will also delete all modules within it.')) {
      return
    }

    try {
      await programsClient.deleteMilestone(milestoneId)
      loadMilestones()
    } catch (error) {
      console.error('Failed to delete milestone:', error)
      alert('Failed to delete milestone')
    }
  }

  const handleCreateModule = (milestoneId: string) => {
    const milestoneModules = modules.filter(m => m.milestone === milestoneId)
    setEditingModule(null)
    setModuleForm({
      name: '',
      description: '',
      content_type: 'video',
      content_url: '',
      order: milestoneModules.length,
      estimated_hours: 1,
      skills: [],
      milestone: milestoneId,
    })
    setShowModuleForm(true)
  }

  const handleEditModule = (module: Module) => {
    setEditingModule(module)
    setModuleForm({
      name: module.name,
      description: module.description,
      content_type: module.content_type,
      content_url: module.content_url,
      order: module.order,
      estimated_hours: module.estimated_hours,
      skills: module.skills || [],
      milestone: module.milestone,
    })
    setShowModuleForm(true)
  }

  const handleSaveModule = async () => {
    if (!moduleForm.milestone || !moduleForm.name) return

    try {
      if (editingModule?.id) {
        await programsClient.updateModule(editingModule.id, moduleForm)
      } else {
        await programsClient.createModule(moduleForm)
      }
      setShowModuleForm(false)
      loadMilestones()
    } catch (error) {
      console.error('Failed to save module:', error)
      alert('Failed to save module')
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) {
      return
    }

    try {
      await programsClient.deleteModule(moduleId)
      loadMilestones()
    } catch (error) {
      console.error('Failed to delete module:', error)
      alert('Failed to delete module')
    }
  }

  const getModulesForMilestone = (milestoneId: string) => {
    return modules
      .filter(m => String(m.milestone) === String(milestoneId))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  const selectedProgram = selectedProgramDetail || programs.find(p => String(p.id) === selectedProgramId)
  const selectedTrack = availableTracks.find(t => String(t.id) === selectedTrackId)

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-gold">Curriculum Structure</h1>
            <p className="text-och-steel">
              Define and manage the curriculum hierarchy: Track → Milestones → Modules
            </p>
          </div>

          {/* Program and Track Selection */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Program</label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => {
                      const newProgramId = e.target.value
                      setSelectedProgramId(newProgramId)
                      setSelectedTrackId('')
                      setMilestones([])
                      setModules([])
                      setExpandedMilestones(new Set())
                      console.log('📌 Program changed:', { newProgramId })
                    }}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    disabled={programsLoading}
                  >
                    <option value="">Select a program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={String(program.id)}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Track</label>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    disabled={!selectedProgramId || tracksLoading}
                  >
                    <option value="">
                      {tracksLoading ? 'Loading tracks...' : availableTracks.length === 0 && selectedProgramId ? 'No tracks available' : 'Select a track'}
                    </option>
                    {availableTracks.map((track) => (
                      <option key={track.id} value={String(track.id)}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTrack && (
                <div className="mt-4 p-4 bg-och-midnight/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedTrack.name}</h3>
                      <p className="text-sm text-och-steel">{selectedTrack.description}</p>
                    </div>
                    <Badge variant={selectedTrack.track_type === 'primary' ? 'defender' : 'gold'}>
                      {selectedTrack.track_type === 'primary' ? 'Primary Track' : 'Cross-Track'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Milestones and Modules */}
          {selectedTrackId && (
            <div className="space-y-4">
              {/* Milestones Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Milestones</h2>
                <Button variant="defender" onClick={handleCreateMilestone}>
                  <PlusIcon />
                  <span className="ml-2">Add Milestone</span>
                </Button>
              </div>

              {isLoading ? (
                <Card>
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading curriculum structure...</p>
                  </div>
                </Card>
              ) : milestones.length === 0 ? (
                <Card>
                  <div className="p-6 text-center">
                    <p className="text-och-steel mb-4">No milestones defined yet</p>
                    <Button variant="defender" onClick={handleCreateMilestone}>
                      <PlusIcon />
                      <span className="ml-2">Create First Milestone</span>
                    </Button>
                  </div>
                </Card>
              ) : (
                milestones.map((milestone) => {
                  const milestoneModules = getModulesForMilestone(String(milestone.id))
                  const isExpanded = expandedMilestones.has(String(milestone.id))

                  return (
                    <Card key={milestone.id}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <button
                                onClick={() => handleMilestoneToggle(String(milestone.id))}
                                className="text-och-steel hover:text-och-mint transition-colors"
                              >
                                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                              </button>
                              <div>
                                <h3 className="text-xl font-semibold text-white">
                                  {milestone.order !== undefined && `${milestone.order + 1}. `}
                                  {milestone.name}
                                </h3>
                                {milestone.description && (
                                  <p className="text-sm text-och-steel mt-1">{milestone.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 ml-8 text-sm text-och-steel">
                              {milestone.duration_weeks && (
                                <span>Duration: {milestone.duration_weeks} weeks</span>
                              )}
                              <span>{milestoneModules.length} module{milestoneModules.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMilestone(milestone)}
                            >
                              <EditIcon />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMilestone(String(milestone.id))}
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        </div>

                        {/* Modules */}
                        {isExpanded && (
                          <div className="ml-8 mt-4 space-y-3">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-semibold text-white">Modules</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCreateModule(String(milestone.id))}
                              >
                                <PlusIcon />
                                <span className="ml-1">Add Module</span>
                              </Button>
                            </div>

                            {milestoneModules.length === 0 ? (
                              <div className="p-4 bg-och-midnight/30 rounded-lg text-center">
                                <p className="text-och-steel text-sm mb-2">No modules in this milestone</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateModule(String(milestone.id))}
                                >
                                  <PlusIcon />
                                  <span className="ml-1">Add Module</span>
                                </Button>
                              </div>
                            ) : (
                              milestoneModules.map((module) => (
                                <div
                                  key={module.id}
                                  className="p-4 bg-och-midnight/30 rounded-lg border border-och-steel/20"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-och-steel text-sm">
                                          {module.order !== undefined && `${module.order + 1}. `}
                                        </span>
                                        <h5 className="text-white font-medium">{module.name}</h5>
                                        <Badge variant="steel">{module.content_type}</Badge>
                                      </div>
                                      {module.description && (
                                        <p className="text-sm text-och-steel mb-2">{module.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-och-steel">
                                        {module.estimated_hours && (
                                          <span>~{module.estimated_hours} hour{module.estimated_hours !== 1 ? 's' : ''}</span>
                                        )}
                                        {module.skills && module.skills.length > 0 && (
                                          <span>{module.skills.length} skill{module.skills.length !== 1 ? 's' : ''}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditModule(module)}
                                      >
                                        <EditIcon />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteModule(String(module.id))}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <TrashIcon />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          )}

          {/* Milestone Form Modal */}
          {showMilestoneForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {editingMilestone ? 'Edit Milestone' : 'Create Milestone'}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Name *</label>
                      <input
                        type="text"
                        value={milestoneForm.name}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Description</label>
                      <textarea
                        value={milestoneForm.description || ''}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Order *</label>
                        <input
                          type="number"
                          min="0"
                          value={milestoneForm.order}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, order: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Duration (weeks)</label>
                        <input
                          type="number"
                          min="1"
                          value={milestoneForm.duration_weeks}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, duration_weeks: parseInt(e.target.value) || 4 })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-och-steel/20">
                      <Button
                        variant="defender"
                        onClick={handleSaveMilestone}
                        disabled={!milestoneForm.name}
                      >
                        Save Milestone
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowMilestoneForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Module Form Modal */}
          {showModuleForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {editingModule ? 'Edit Module' : 'Create Module'}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Name *</label>
                      <input
                        type="text"
                        value={moduleForm.name}
                        onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Description</label>
                      <textarea
                        value={moduleForm.description || ''}
                        onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Content Type *</label>
                        <select
                          value={moduleForm.content_type}
                          onChange={(e) => setModuleForm({ ...moduleForm, content_type: e.target.value as any })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        >
                          <option value="video">Video</option>
                          <option value="article">Article</option>
                          <option value="quiz">Quiz</option>
                          <option value="assignment">Assignment</option>
                          <option value="lab">Lab</option>
                          <option value="workshop">Workshop</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Order *</label>
                        <input
                          type="number"
                          min="0"
                          value={moduleForm.order}
                          onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Content URL</label>
                      <input
                        type="url"
                        value={moduleForm.content_url || ''}
                        onChange={(e) => setModuleForm({ ...moduleForm, content_url: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Estimated Hours</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={moduleForm.estimated_hours}
                        onChange={(e) => setModuleForm({ ...moduleForm, estimated_hours: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-och-steel/20">
                      <Button
                        variant="defender"
                        onClick={handleSaveModule}
                        disabled={!moduleForm.name}
                      >
                        Save Module
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowModuleForm(false)}
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
