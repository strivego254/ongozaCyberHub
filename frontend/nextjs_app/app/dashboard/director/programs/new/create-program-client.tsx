'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCreateProgram } from '@/hooks/usePrograms'

export default function CreateProgramClient() {
  const router = useRouter()
  const { createProgram, isLoading, error } = useCreateProgram()
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'technical' as 'technical' | 'leadership' | 'mentorship',
    description: '',
    duration_months: 6,
    default_price: 0,
    currency: 'USD',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProgram(formData)
      router.push('/dashboard/director')
    } catch (err) {
      console.error('Failed to create program:', err)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-orange">Create New Program</h1>
          <p className="text-och-steel">Define a new program for the platform.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Program Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
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
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
              >
                <option value="technical">Technical</option>
                <option value="leadership">Leadership</option>
                <option value="mentorship">Mentorship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
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
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
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
                  value={formData.default_price}
                  onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Currency
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
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
                variant="orange"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Program'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}


