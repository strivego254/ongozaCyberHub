'use client'

<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from 'react'
=======
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
<<<<<<< HEAD
import { useCohorts, useDeleteProgram, useProgram, usePrograms, useUpdateCohort } from '@/hooks/usePrograms'
=======
import { useCohorts, useDeleteProgram, useProgram, usePrograms, useUpdateCohortDirector } from '@/hooks/usePrograms'
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

interface ProgramDetails {
  [key: string]: {
    tracks: any[]
    cohorts: any[]
    isLoading: boolean
    lastUpdated: number
  }
}

export default function ProgramsPage() {
  const { programs, isLoading, reload } = usePrograms()
  const { deleteProgram, isLoading: isDeleting } = useDeleteProgram()
<<<<<<< HEAD
  const { updateCohort, isLoading: isAssigning, error: assignApiError } = useUpdateCohort()
  const { cohorts, isLoading: cohortsLoading, reload: reloadCohorts } = useCohorts({ page: 1, pageSize: 500 })
  const [assignProgramId, setAssignProgramId] = useState<string>('')
  const { program: assignProgramDetail, isLoading: assignProgramLoading } = useProgram(assignProgramId)
=======
  const { updateCohort, isLoading: isAssigning, error: assignApiError } = useUpdateCohortDirector()
  const { cohorts, isLoading: cohortsLoading, reload: reloadCohorts } = useCohorts({ page: 1, pageSize: 500 })
  const [assignProgramId, setAssignProgramId] = useState<string>('')
  const { program: assignProgramDetail, isLoading: assignProgramLoading, reload: reloadProgramDetail } = useProgram(assignProgramId)
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
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
  
  // Store detailed program information
  const [programDetails, setProgramDetails] = useState<ProgramDetails>({})
  const [refreshingPrograms, setRefreshingPrograms] = useState<Set<string>>(new Set())
  
  // Fetch detailed program information
  const fetchProgramDetails = useCallback(async (programId: string, force = false) => {
    if (!programId) return
    
    // Don't refetch if recently updated (within 5 seconds) unless forced
    if (!force) {
      setProgramDetails(prev => {
        const existing = prev[programId]
        if (existing && Date.now() - existing.lastUpdated < 5000) {
          return prev
        }
        return prev
      })
      
      // Check again after state read
      const existing = programDetails[programId]
      if (existing && !force && Date.now() - existing.lastUpdated < 5000) {
        return
      }
    }
    
    setRefreshingPrograms(prev => new Set(prev).add(programId))
    
    try {
      const { programsClient } = await import('@/services/programsClient')
      const [programData, tracksData] = await Promise.all([
        programsClient.getProgram(programId),
        programsClient.getTracks(programId)
      ])
      
      // Get cohorts for all tracks in this program
      const trackIds = Array.isArray(tracksData) ? tracksData.map((t: any) => t.id) : []
      const allCohorts = await Promise.all(
        trackIds.map(async (trackId: string) => {
          try {
            const cohorts = await programsClient.getCohorts({ trackId })
            return Array.isArray(cohorts) ? cohorts : (cohorts?.results || [])
          } catch {
            return []
          }
        })
      )
      const cohorts = allCohorts.flat()
      
      setProgramDetails(prev => ({
        ...prev,
        [programId]: {
          tracks: Array.isArray(tracksData) ? tracksData : [],
          cohorts: cohorts,
          isLoading: false,
          lastUpdated: Date.now()
        }
      }))
    } catch (err) {
      console.error(`Failed to fetch details for program ${programId}:`, err)
      setProgramDetails(prev => ({
        ...prev,
        [programId]: {
          tracks: prev[programId]?.tracks || [],
          cohorts: prev[programId]?.cohorts || [],
          isLoading: false,
          lastUpdated: prev[programId]?.lastUpdated || Date.now()
        }
      }))
    } finally {
      setRefreshingPrograms(prev => {
        const next = new Set(prev)
        next.delete(programId)
        return next
      })
    }
  }, [])

  // Fetch details for all programs on mount and when programs list changes
  useEffect(() => {
    if (!isLoading && programs.length > 0) {
      programs.forEach((program: any) => {
        if (program.id) {
          fetchProgramDetails(program.id)
        }
      })
    }
  }, [programs, isLoading, fetchProgramDetails])

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
<<<<<<< HEAD
      setAssignSuccess('Cohort updated successfully.')
      // Refresh data shown on the page
      reload()
      reloadCohorts()
    } catch (err: any) {
      setAssignError(err?.message || assignApiError || 'Failed to assign program to cohort')
=======
      setAssignSuccess('Cohort updated successfully. The cohort is now assigned to the selected track.')
      // Refresh all data shown on the page
      await Promise.all([
        reload(), // Reload all programs to update cohort counts in cards
        reloadCohorts(), // Reload all cohorts
        assignProgramId ? reloadProgramDetail() : Promise.resolve() // Reload specific program detail if selected
      ])
      
      // Refresh program details for all programs to update cohort counts
      programs.forEach((p: any) => {
        if (p.id) {
          fetchProgramDetails(p.id, true) // Force refresh
        }
      })
      // Clear form after successful assignment
      setTimeout(() => {
        setAssignProgramId('')
        setAssignTrackId('')
        setAssignCohortId('')
        setCohortSearchQuery('')
        setShowCohortDropdown(false)
        setAssignSuccess(null)
      }, 2000)
    } catch (err: any) {
      console.error('Failed to assign program to cohort:', err)
      // Extract detailed error message
      const errorMessage = err?.response?.data?.error || 
                           err?.response?.data?.detail || 
                           err?.response?.data?.track?.[0] ||
                           err?.message || 
                           assignApiError || 
                           'Failed to assign program to cohort. Please check your permissions and try again.'
      setAssignError(errorMessage)
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
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
<<<<<<< HEAD
                                    <Badge variant={c.status === 'active' ? 'mint' : 'steel'} className="text-xs">
=======
                                    <Badge variant={c.status === 'active' ? 'mint' : 'outline'} className="text-xs">
>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
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

          <div className="mb-4 flex items-center justify-between">
            <div className="text-och-steel">
              Showing <span className="text-white font-semibold">{filteredPrograms.length}</span> of <span className="text-white font-semibold">{programs.length}</span> programs
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                reload()
                programs.forEach((p: any) => {
                  if (p.id) {
                    fetchProgramDetails(p.id, true) // Force refresh
                  }
                })
              }}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms && filteredPrograms.length > 0 ? (
              filteredPrograms.map((program: any) => {
                const details = programDetails[program.id]
                const isRefreshing = refreshingPrograms.has(program.id)
                const tracksCount = details?.tracks?.length ?? program.tracks?.length ?? 0
                const cohortsCount = details?.cohorts?.length ?? program.cohorts?.length ?? 0
                const isLoadingDetails = details?.isLoading !== false && !details
                
                return (
                  <Card key={program.id} className="hover:border-och-defender/50 transition-all duration-200 hover:shadow-lg">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white truncate">{program.name}</h3>
                            {isRefreshing && (
                              <svg className="w-4 h-4 text-och-defender animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </div>
                          <div className="text-sm text-och-steel prose prose-invert prose-sm max-w-none line-clamp-2">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                h1: ({ children }) => <h1 className="text-base font-bold text-white mb-1">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-sm font-bold text-white mb-1">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-xs font-bold text-white mb-0.5">{children}</h3>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5 text-xs">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5 text-xs">{children}</ol>,
                                li: ({ children }) => <li className="text-och-steel">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                code: ({ children }) => <code className="bg-och-midnight/50 px-1 py-0.5 rounded text-och-defender text-xs">{children}</code>,
                                a: ({ href, children }) => <a href={href} className="text-och-defender hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                              }}
                            >
                              {program.description || 'No description available'}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <Badge variant="defender" className="ml-3 flex-shrink-0">{program.status || 'active'}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-och-midnight/30 rounded-lg border border-och-steel/10">
                        <div className="text-center">
                          <div className="text-xs text-och-steel mb-1">Duration</div>
                          <div className="text-sm font-semibold text-white">
                            {program.duration_months ? `${program.duration_months}mo` : 'N/A'}
                          </div>
                        </div>
                        <div className="text-center border-l border-r border-och-steel/20">
                          <div className="text-xs text-och-steel mb-1">Tracks</div>
                          <div className="text-sm font-semibold text-white flex items-center justify-center gap-1">
                            {isLoadingDetails ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              tracksCount
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-och-steel mb-1">Cohorts</div>
                          <div className="text-sm font-semibold text-white flex items-center justify-center gap-1">
                            {isLoadingDetails ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              cohortsCount
                            )}
                          </div>
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
                          onClick={() => {
                            if (program.id) {
                              fetchProgramDetails(program.id, true) // Force refresh
                            }
                          }}
                          disabled={isRefreshing}
                          className="px-3"
                          title="Refresh program details"
                        >
                          <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(program.id, program.name)}
                          disabled={isDeleting}
                          className="text-och-orange hover:text-och-orange/80 hover:border-och-orange px-3"
                          title="Delete program"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })
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

