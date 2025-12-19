'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCohorts, useDeleteProgram, useProgram, usePrograms, useUpdateCohort } from '@/hooks/usePrograms'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function ProgramsPage() {
  const { programs, isLoading, reload } = usePrograms()
  const { deleteProgram, isLoading: isDeleting } = useDeleteProgram()
  const { updateCohort, isLoading: isAssigning, error: assignApiError } = useUpdateCohort()
  const { cohorts, isLoading: cohortsLoading, reload: reloadCohorts } = useCohorts({ page: 1, pageSize: 500 })
  const [assignProgramId, setAssignProgramId] = useState<string>('')
  const { program: assignProgramDetail, isLoading: assignProgramLoading } = useProgram(assignProgramId)
  const [assignTrackId, setAssignTrackId] = useState<string>('')
  const [assignCohortId, setAssignCohortId] = useState<string>('')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)
  const [cohortSearchQuery, setCohortSearchQuery] = useState('')
  const [showCohortDropdown, setShowCohortDropdown] = useState(false)
  const cohortDropdownRef = useRef<HTMLDivElement | null>(null)
  const cohortInputRef = useRef<HTMLInputElement | null>(null)

  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Listen for program creation events to refresh the list
  useEffect(() => {
    const handleProgramCreated = () => {
      console.log('🔄 Program created event received, reloading programs list...')
      reload()
    }
    
    window.addEventListener('programCreated', handleProgramCreated)
    return () => window.removeEventListener('programCreated', handleProgramCreated)
  }, [reload])

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      if (filterCategory !== 'all' && program.category !== filterCategory) return false
      if (filterStatus !== 'all' && program.status !== filterStatus) return false
      if (searchQuery && !program.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !program.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [programs, filterCategory, filterStatus, searchQuery])

  const assignTracks = useMemo(() => {
    return Array.isArray(assignProgramDetail?.tracks) ? assignProgramDetail!.tracks! : []
  }, [assignProgramDetail])

  // Auto-select track if the program has a single track
  useEffect(() => {
    if (!assignProgramId) {
      setAssignTrackId('')
      return
    }
    if (assignTracks.length === 1 && assignTracks[0]?.id) {
      setAssignTrackId(String(assignTracks[0].id))
    } else if (assignTrackId && !assignTracks.some((t: any) => String(t.id) === String(assignTrackId))) {
      setAssignTrackId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignProgramId, assignTracks])

  const selectedCohort = useMemo(() => {
    return cohorts.find((c) => String(c.id) === String(assignCohortId)) || null
  }, [cohorts, assignCohortId])

  const filteredCohorts = useMemo(() => {
    const q = cohortSearchQuery.trim().toLowerCase()
    if (!q) return cohorts
    return cohorts.filter((c) => {
      const hay = `${c.name} ${c.track_name || ''} ${c.status || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [cohorts, cohortSearchQuery])

  // Close cohort dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!showCohortDropdown) return
      if (cohortDropdownRef.current?.contains(target)) return
      if (cohortInputRef.current?.contains(target)) return
      setShowCohortDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCohortDropdown])

  const handleAssign = async () => {
    setAssignError(null)
    setAssignSuccess(null)

    if (!assignProgramId) {
      setAssignError('Select a program first.')
      return
    }
    if (!assignCohortId) {
      setAssignError('Select a cohort to assign.')
      return
    }
    if (!assignTrackId) {
      setAssignError('Select a track within the program (this is what links the cohort to the program).')
      return
    }

    try {
      await updateCohort(assignCohortId, { track: assignTrackId })
      setAssignSuccess('Cohort updated successfully.')
      // Refresh data shown on the page
      reload()
      reloadCohorts()
    } catch (err: any) {
      setAssignError(err?.message || assignApiError || 'Failed to assign program to cohort')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }
    try {
      await deleteProgram(id)
      await reload()
    } catch (err) {
      console.error('Failed to delete program:', err)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading programs...</p>
            </div>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Programs & Cohorts</h1>
                <p className="text-och-steel">Manage programs, tracks, and cohorts</p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/director/programs/new">
                  <Button variant="defender" size="sm">
                    + Create Program
                  </Button>
                </Link>
                <Link href="/dashboard/director/cohorts/new">
                  <Button variant="outline" size="sm">
                    + Create Cohort
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Search</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search programs..."
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="all">All Categories</option>
                      <option value="technical">Technical</option>
                      <option value="leadership">Leadership</option>
                      <option value="mentorship">Mentorship</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Assign Program to Cohort */}
            <Card className="mt-6 border-och-defender/30">
              <div className="p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Assign Program to Cohort</h2>
                    <p className="text-sm text-och-steel mt-1">
                      Cohorts attach to programs through tracks. This will update the cohort’s <span className="text-white font-semibold">track</span>.
                    </p>
                  </div>
                </div>

                {(assignError || assignApiError) && (
                  <div className="mb-4 p-3 rounded-lg border border-och-orange/50 bg-och-orange/10 text-och-orange text-sm">
                    {assignError || assignApiError}
                  </div>
                )}
                {assignSuccess && (
                  <div className="mb-4 p-3 rounded-lg border border-och-mint/50 bg-och-mint/10 text-och-mint text-sm">
                    {assignSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Program</label>
                    <select
                      value={assignProgramId}
                      onChange={(e) => {
                        setAssignProgramId(e.target.value)
                        setAssignSuccess(null)
                        setAssignError(null)
                      }}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="">Select a program...</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Track (within program)</label>
                    <select
                      value={assignTrackId}
                      onChange={(e) => {
                        setAssignTrackId(e.target.value)
                        setAssignSuccess(null)
                        setAssignError(null)
                      }}
                      disabled={!assignProgramId || assignProgramLoading}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender disabled:opacity-50"
                    >
                      <option value="">
                        {!assignProgramId
                          ? 'Select a program first...'
                          : assignProgramLoading
                            ? 'Loading tracks...'
                            : assignTracks.length === 0
                              ? 'No tracks found for this program'
                              : 'Select a track...'}
                      </option>
                      {assignTracks.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">Cohort</label>
                    <input
                      ref={cohortInputRef}
                      type="text"
                      value={selectedCohort ? selectedCohort.name : cohortSearchQuery}
                      onChange={(e) => {
                        setCohortSearchQuery(e.target.value)
                        setShowCohortDropdown(true)
                        if (assignCohortId) setAssignCohortId('')
                        setAssignSuccess(null)
                        setAssignError(null)
                      }}
                      onFocus={() => setShowCohortDropdown(true)}
                      placeholder={cohortsLoading ? 'Loading cohorts...' : 'Search cohort by name, track, or status...'}
                      disabled={cohortsLoading}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender disabled:opacity-50"
                    />

                    {showCohortDropdown && !cohortsLoading && (
                      <div
                        ref={cohortDropdownRef}
                        className="absolute z-50 w-full mt-1 bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg max-h-60 overflow-auto"
                      >
                        {filteredCohorts.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-och-steel">
                            {cohortSearchQuery ? 'No cohorts found matching your search.' : 'No cohorts available.'}
                          </div>
                        ) : (
                          <div className="py-1">
                            {filteredCohorts.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setAssignCohortId(String(c.id))
                                  setCohortSearchQuery('')
                                  setShowCohortDropdown(false)
                                }}
                                className="px-4 py-2 cursor-pointer hover:bg-och-midnight/80 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-white">{c.name}</div>
                                    <div className="text-xs text-och-steel mt-0.5">
                                      {c.track_name ? `Track: ${c.track_name}` : `Track ID: ${c.track}`} • {c.status}
                                    </div>
                                  </div>
                                  <div className="ml-2">
                                    <Badge variant={c.status === 'active' ? 'mint' : 'steel'} className="text-xs">
                                      {c.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-och-steel">
                    {cohortsLoading ? 'Loading cohorts…' : `${filteredCohorts.length} cohort(s) available`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssignProgramId('')
                        setAssignTrackId('')
                        setAssignCohortId('')
                        setCohortSearchQuery('')
                        setShowCohortDropdown(false)
                        setAssignError(null)
                        setAssignSuccess(null)
                      }}
                      disabled={isAssigning}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="defender"
                      size="sm"
                      onClick={handleAssign}
                      disabled={isAssigning || !assignProgramId || !assignTrackId || !assignCohortId}
                    >
                      {isAssigning ? 'Assigning...' : 'Assign'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-4 text-och-steel">
            Showing {filteredPrograms.length} of {programs.length} programs
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms && filteredPrograms.length > 0 ? (
              filteredPrograms.map((program: any) => (
                <Card key={program.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{program.name}</h3>
                        <div className="text-sm text-och-steel prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-bold text-white mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-bold text-white mb-1">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="text-och-steel">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-och-midnight/50 px-1 py-0.5 rounded text-och-defender text-xs">{children}</code>,
                              a: ({ href, children }) => <a href={href} className="text-och-defender hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                            }}
                          >
                            {program.description || ''}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <Badge variant="defender" className="ml-3">{program.status || 'active'}</Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Duration</span>
                        <span className="text-white">{program.duration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Tracks</span>
                        <span className="text-white">{program.tracks?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Cohorts</span>
                        <span className="text-white">{program.cohorts?.length || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/director/programs/${program.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/director/programs/${program.id}/edit`} className="flex-1">
                        <Button variant="defender" size="sm" className="w-full">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(program.id, program.name)}
                        disabled={isDeleting}
                        className="text-och-orange hover:text-och-orange/80 hover:border-och-orange"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <div className="p-12 text-center">
                  <p className="text-och-steel mb-4">No programs found</p>
                  <Link href="/dashboard/director/programs/new">
                    <Button variant="defender">Create Your First Program</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

