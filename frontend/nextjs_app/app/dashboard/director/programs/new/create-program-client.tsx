'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient, type Program, type Track, type Milestone, type Module } from '@/services/programsClient'
import { apiGateway } from '@/services/apiGateway'

// Primary tracks
const PRIMARY_TRACKS = [
  { key: 'defenders', name: 'Defenders', description: 'Defensive cybersecurity track' },
  { key: 'offensive', name: 'Offensive', description: 'Offensive security and penetration testing' },
  { key: 'grc', name: 'GRC and Governance', description: 'Governance, Risk, and Compliance' },
  { key: 'innovation', name: 'Innovation and Leadership', description: 'Cybersecurity innovation and leadership' },
]

// Cross-track programs
const CROSS_TRACK_PROGRAMS = [
  { key: 'entrepreneurship', name: 'Cyber Entrepreneurship', description: 'Building cybersecurity businesses' },
  { key: 'soft_skills', name: 'Soft Skills for Cyber Careers', description: 'Communication and leadership skills' },
  { key: 'career_acceleration', name: 'Career Acceleration', description: 'Advancing your cybersecurity career' },
  { key: 'ethics', name: 'Cyber Ethics and Integrity', description: 'Ethical practices in cybersecurity' },
  { key: 'mission_leadership', name: 'Mission Leadership', description: 'Leading cybersecurity missions' },
]

interface TrackFormData extends Omit<Track, 'id' | 'created_at' | 'updated_at'> {
  milestones: MilestoneFormData[]
}

interface MilestoneFormData extends Omit<Milestone, 'id' | 'created_at' | 'updated_at'> {
  modules: ModuleFormData[]
}

interface ModuleFormData extends Omit<Module, 'id' | 'created_at' | 'updated_at'> {
  applicable_tracks: string[]
}

export default function CreateProgramClient() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'program' | 'tracks' | 'review'>('program')
  
  const [programData, setProgramData] = useState<Partial<Program>>({
    name: '',
    category: 'technical',
    description: '',
    duration_months: 6,
    default_price: 0,
    currency: 'USD',
    outcomes: [],
    missions_registry_link: '',
  })

  const [tracks, setTracks] = useState<TrackFormData[]>([])

  const addTrack = (trackType: 'primary' | 'cross_track') => {
    const trackKey = trackType === 'primary' 
      ? PRIMARY_TRACKS[tracks.filter(t => t.track_type === 'primary').length]?.key || 'track'
      : CROSS_TRACK_PROGRAMS[tracks.filter(t => t.track_type === 'cross_track').length]?.key || 'cross_track'
    
    const newTrack: TrackFormData = {
      name: '',
      key: trackKey,
      track_type: trackType,
      description: '',
      competencies: {},
      missions: [],
      director: null,
      milestones: [],
    }
    setTracks([...tracks, newTrack])
  }

  const updateTrack = (index: number, data: Partial<TrackFormData>) => {
    const updated = [...tracks]
    updated[index] = { ...updated[index], ...data }
    setTracks(updated)
  }

  const removeTrack = (index: number) => {
    setTracks(tracks.filter((_, i) => i !== index))
  }

  const addMilestone = (trackIndex: number) => {
    const updated = [...tracks]
    const milestoneCount = updated[trackIndex].milestones.length
    updated[trackIndex].milestones.push({
      name: '',
      description: '',
      order: milestoneCount,
      duration_weeks: 4,
      modules: [],
    })
    setTracks(updated)
  }

  const updateMilestone = (trackIndex: number, milestoneIndex: number, data: Partial<MilestoneFormData>) => {
    const updated = [...tracks]
    updated[trackIndex].milestones[milestoneIndex] = {
      ...updated[trackIndex].milestones[milestoneIndex],
      ...data,
    }
    setTracks(updated)
  }

  const removeMilestone = (trackIndex: number, milestoneIndex: number) => {
    const updated = [...tracks]
    updated[trackIndex].milestones = updated[trackIndex].milestones.filter((_, i) => i !== milestoneIndex)
    setTracks(updated)
  }

  const addModule = (trackIndex: number, milestoneIndex: number) => {
    const updated = [...tracks]
    const moduleCount = updated[trackIndex].milestones[milestoneIndex].modules.length
    updated[trackIndex].milestones[milestoneIndex].modules.push({
      name: '',
      description: '',
      content_type: 'video',
      content_url: '',
      order: moduleCount,
      estimated_hours: 1,
      skills: [],
      applicable_tracks: [],
    })
    setTracks(updated)
  }

  const updateModule = (
    trackIndex: number,
    milestoneIndex: number,
    moduleIndex: number,
    data: Partial<ModuleFormData>
  ) => {
    const updated = [...tracks]
    updated[trackIndex].milestones[milestoneIndex].modules[moduleIndex] = {
      ...updated[trackIndex].milestones[milestoneIndex].modules[moduleIndex],
      ...data,
    }
    setTracks(updated)
  }

  const removeModule = (trackIndex: number, milestoneIndex: number, moduleIndex: number) => {
    const updated = [...tracks]
    updated[trackIndex].milestones[milestoneIndex].modules = updated[trackIndex].milestones[milestoneIndex].modules.filter(
      (_, i) => i !== moduleIndex
    )
    setTracks(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Prepare program data with tracks
      const submitData = {
        ...programData,
        tracks: tracks.map(track => ({
          ...track,
          milestones: track.milestones.map(milestone => ({
            ...milestone,
            modules: milestone.modules.map(module => ({
              ...module,
              applicable_tracks: module.applicable_tracks.map(trackId => ({ id: trackId })),
            })),
          })),
        })),
      }

      const result = await programsClient.createProgram(submitData)
      router.push(`/dashboard/director/programs/${result.id}`)
    } catch (err: any) {
      console.error('Failed to create program:', err)
      setError(err.message || 'Failed to create program')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DirectorLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-defender">Create New Program</h1>
          <p className="text-och-steel">Define a program with tracks, milestones, and modules</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step === 'program' ? 'text-och-defender' : 'text-och-steel'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'program' ? 'bg-och-defender text-white' : 'bg-och-midnight/50'}`}>
              1
            </div>
            <span className="font-medium">Program Details</span>
          </div>
          <div className="flex-1 h-px bg-och-steel/20"></div>
          <div className={`flex items-center gap-2 ${step === 'tracks' ? 'text-och-defender' : step === 'review' ? 'text-och-mint' : 'text-och-steel'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'tracks' || step === 'review' ? 'bg-och-defender text-white' : 'bg-och-midnight/50'}`}>
              2
            </div>
            <span className="font-medium">Tracks & Structure</span>
          </div>
          <div className="flex-1 h-px bg-och-steel/20"></div>
          <div className={`flex items-center gap-2 ${step === 'review' ? 'text-och-mint' : 'text-och-steel'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-och-mint text-och-midnight' : 'bg-och-midnight/50'}`}>
              3
            </div>
            <span className="font-medium">Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Program Details */}
          {step === 'program' && (
            <Card>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={programData.name}
                    onChange={(e) => setProgramData({ ...programData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="e.g., Cybersecurity Leadership Program"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={programData.category}
                    onChange={(e) => setProgramData({ ...programData, category: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="technical">Technical</option>
                    <option value="leadership">Leadership</option>
                    <option value="mentorship">Mentorship</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={programData.description}
                    onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="Describe the program goals and outcomes..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Duration (months) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={programData.duration_months}
                      onChange={(e) => setProgramData({ ...programData, duration_months: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Default Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={programData.default_price}
                      onChange={(e) => setProgramData({ ...programData, default_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={programData.currency}
                      onChange={(e) => setProgramData({ ...programData, currency: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Missions Registry Link
                    </label>
                    <input
                      type="url"
                      value={programData.missions_registry_link}
                      onChange={(e) => setProgramData({ ...programData, missions_registry_link: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Learning Outcomes (one per line)
                  </label>
                  <textarea
                    value={programData.outcomes?.join('\n') || ''}
                    onChange={(e) => setProgramData({ ...programData, outcomes: e.target.value.split('\n').filter(o => o.trim()) })}
                    rows={4}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="Students will learn...&#10;Students will be able to..."
                  />
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
                    onClick={() => setStep('tracks')}
                  >
                    Next: Define Tracks
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Tracks & Structure */}
          {step === 'tracks' && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Tracks</h2>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTrack('primary')}
                      >
                        + Primary Track
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTrack('cross_track')}
                      >
                        + Cross-Track Program
                      </Button>
                    </div>
                  </div>

                  {tracks.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No tracks added yet. Add primary tracks or cross-track programs.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tracks.map((track, trackIndex) => (
                        <Card key={trackIndex} className="border-och-defender/30">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                                  {track.track_type === 'primary' ? 'Primary' : 'Cross-Track'}
                                </Badge>
                                <h3 className="text-lg font-semibold text-white">Track {trackIndex + 1}</h3>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTrack(trackIndex)}
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  Track Name *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={track.name}
                                  onChange={(e) => updateTrack(trackIndex, { name: e.target.value })}
                                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                  placeholder={track.track_type === 'primary' ? 'e.g., Defenders' : 'e.g., Cyber Entrepreneurship'}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  Track Key *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={track.key}
                                  onChange={(e) => updateTrack(trackIndex, { key: e.target.value })}
                                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                  placeholder="e.g., defenders"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  Description
                                </label>
                                <textarea
                                  value={track.description}
                                  onChange={(e) => updateTrack(trackIndex, { description: e.target.value })}
                                  rows={2}
                                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                />
                              </div>

                              {/* Milestones */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="block text-sm font-medium text-white">
                                    Milestones
                                  </label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addMilestone(trackIndex)}
                                  >
                                    + Add Milestone
                                  </Button>
                                </div>

                                {track.milestones.map((milestone, milestoneIndex) => (
                                  <Card key={milestoneIndex} className="mb-3 border-och-steel/20">
                                    <div className="p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-och-defender">
                                          Milestone {milestoneIndex + 1}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeMilestone(trackIndex, milestoneIndex)}
                                        >
                                          Remove
                                        </Button>
                                      </div>

                                      <div className="space-y-3">
                                        <input
                                          type="text"
                                          placeholder="Milestone name"
                                          value={milestone.name}
                                          onChange={(e) => updateMilestone(trackIndex, milestoneIndex, { name: e.target.value })}
                                          className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                        />
                                        <textarea
                                          placeholder="Description"
                                          value={milestone.description}
                                          onChange={(e) => updateMilestone(trackIndex, milestoneIndex, { description: e.target.value })}
                                          rows={2}
                                          className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                          <input
                                            type="number"
                                            placeholder="Order"
                                            value={milestone.order}
                                            onChange={(e) => updateMilestone(trackIndex, milestoneIndex, { order: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                          />
                                          <input
                                            type="number"
                                            placeholder="Duration (weeks)"
                                            value={milestone.duration_weeks || ''}
                                            onChange={(e) => updateMilestone(trackIndex, milestoneIndex, { duration_weeks: parseInt(e.target.value) || undefined })}
                                            className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                          />
                                        </div>

                                        {/* Modules */}
                                        <div>
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-och-steel">Modules</span>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => addModule(trackIndex, milestoneIndex)}
                                            >
                                              + Module
                                            </Button>
                                          </div>

                                          {milestone.modules.map((module, moduleIndex) => (
                                            <div key={moduleIndex} className="mb-2 p-2 bg-och-midnight/30 rounded border border-och-steel/10">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-och-steel">Module {moduleIndex + 1}</span>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => removeModule(trackIndex, milestoneIndex, moduleIndex)}
                                                >
                                                  ×
                                                </Button>
                                              </div>
                                              <div className="space-y-2">
                                                <input
                                                  type="text"
                                                  placeholder="Module name"
                                                  value={module.name}
                                                  onChange={(e) => updateModule(trackIndex, milestoneIndex, moduleIndex, { name: e.target.value })}
                                                  className="w-full px-2 py-1 bg-och-midnight/50 border border-och-steel/20 rounded text-white text-xs focus:outline-none focus:border-och-defender"
                                                />
                                                <select
                                                  value={module.content_type}
                                                  onChange={(e) => updateModule(trackIndex, milestoneIndex, moduleIndex, { content_type: e.target.value as any })}
                                                  className="w-full px-2 py-1 bg-och-midnight/50 border border-och-steel/20 rounded text-white text-xs focus:outline-none focus:border-och-defender"
                                                >
                                                  <option value="video">Video</option>
                                                  <option value="article">Article</option>
                                                  <option value="quiz">Quiz</option>
                                                  <option value="assignment">Assignment</option>
                                                  <option value="lab">Lab</option>
                                                  <option value="workshop">Workshop</option>
                                                </select>
                                                <input
                                                  type="url"
                                                  placeholder="Content URL"
                                                  value={module.content_url}
                                                  onChange={(e) => updateModule(trackIndex, milestoneIndex, moduleIndex, { content_url: e.target.value })}
                                                  className="w-full px-2 py-1 bg-och-midnight/50 border border-och-steel/20 rounded text-white text-xs focus:outline-none focus:border-och-defender"
                                                />
                                                <input
                                                  type="text"
                                                  placeholder="Skills (comma-separated)"
                                                  value={module.skills?.join(', ') || ''}
                                                  onChange={(e) => updateModule(trackIndex, milestoneIndex, moduleIndex, { skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                  className="w-full px-2 py-1 bg-och-midnight/50 border border-och-steel/20 rounded text-white text-xs focus:outline-none focus:border-och-defender"
                                                />
                                                {track.track_type === 'cross_track' && (
                                                  <div>
                                                    <label className="text-xs text-och-steel mb-1 block">
                                                      Applicable Tracks (for cross-track content)
                                                    </label>
                                                    <select
                                                      multiple
                                                      value={module.applicable_tracks || []}
                                                      onChange={(e) => {
                                                        const selected = Array.from(e.target.selectedOptions, option => option.value)
                                                        updateModule(trackIndex, milestoneIndex, moduleIndex, { applicable_tracks: selected })
                                                      }}
                                                      className="w-full px-2 py-1 bg-och-midnight/50 border border-och-steel/20 rounded text-white text-xs focus:outline-none focus:border-och-defender"
                                                    >
                                                      {tracks.filter(t => t.track_type === 'primary' && t.id).map(t => (
                                                        <option key={t.id} value={t.id!}>{t.name}</option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('program')}
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
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Review Program</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-och-defender mb-2">Program Details</h3>
                      <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                        <p><span className="text-och-steel">Name:</span> <span className="text-white">{programData.name}</span></p>
                        <p><span className="text-och-steel">Category:</span> <span className="text-white">{programData.category}</span></p>
                        <p><span className="text-och-steel">Duration:</span> <span className="text-white">{programData.duration_months} months</span></p>
                        <p><span className="text-och-steel">Price:</span> <span className="text-white">{programData.currency} {programData.default_price}</span></p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-och-defender mb-2">Tracks ({tracks.length})</h3>
                      <div className="space-y-2">
                        {tracks.map((track, idx) => (
                          <div key={idx} className="bg-och-midnight/50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                                {track.track_type}
                              </Badge>
                              <span className="text-white font-medium">{track.name}</span>
                            </div>
                            <p className="text-sm text-och-steel">
                              {track.milestones.length} milestones,{' '}
                              {track.milestones.reduce((sum, m) => sum + m.modules.length, 0)} modules
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {error && (
                <Card className="border-och-orange/50">
                  <div className="p-4 text-och-orange">{error}</div>
                </Card>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('tracks')}
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  variant="defender"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Program'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </DirectorLayout>
  )
}
