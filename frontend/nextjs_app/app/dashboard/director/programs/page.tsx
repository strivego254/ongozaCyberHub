'use client'

import { useState, useMemo, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePrograms, useDeleteProgram } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function ProgramsPage() {
  const { programs, isLoading, reload } = usePrograms()
  const { deleteProgram, isLoading: isDeleting } = useDeleteProgram()
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

