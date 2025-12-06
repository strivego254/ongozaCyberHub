'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useProgram, useUpdateProgram } from '@/hooks/usePrograms'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { programsClient, type Program } from '@/services/programsClient'

export default function EditProgramPage() {
  const params = useParams()
  const router = useRouter()
  const programId = params.id as string
  const { program, isLoading: loadingProgram } = useProgram(programId)
  const { updateProgram, isLoading: isUpdating } = useUpdateProgram()
  
  const [formData, setFormData] = useState<Partial<Program>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        category: program.category,
        description: program.description,
        duration_months: program.duration_months,
        default_price: program.default_price,
        currency: program.currency,
        outcomes: program.outcomes || [],
        missions_registry_link: program.missions_registry_link,
        status: program.status,
      })
    }
  }, [program])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await updateProgram(programId, formData)
      router.push(`/dashboard/director/programs/${programId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update program')
    }
  }

  if (loadingProgram) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading program...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (!program) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-4">Program not found</p>
              <Button variant="outline" onClick={() => router.back()}>Back</Button>
            </div>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Edit Program</h1>
            <p className="text-och-steel">Update program details and settings</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Program Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
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
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
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
                    value={formData.duration_months || 0}
                    onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
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
                    value={formData.default_price || 0}
                    onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
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
                    value={formData.currency || 'USD'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Learning Outcomes (one per line)
                </label>
                <textarea
                  value={formData.outcomes?.join('\n') || ''}
                  onChange={(e) => setFormData({ ...formData, outcomes: e.target.value.split('\n').filter(o => o.trim()) })}
                  rows={4}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Missions Registry Link
                </label>
                <input
                  type="url"
                  value={formData.missions_registry_link || ''}
                  onChange={(e) => setFormData({ ...formData, missions_registry_link: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>

              {error && (
                <div className="p-4 bg-och-orange/20 border border-och-orange rounded-lg text-och-orange">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="defender"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Program'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

