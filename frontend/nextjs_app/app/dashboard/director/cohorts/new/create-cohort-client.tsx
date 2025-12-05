'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCreateCohort, useTracks } from '@/hooks/usePrograms'

export default function CreateCohortClient() {
  const router = useRouter()
  const { createCohort, isLoading, error } = useCreateCohort()
  const { tracks, isLoading: tracksLoading } = useTracks()
  
  const [formData, setFormData] = useState({
    track: '',
    name: '',
    start_date: '',
    end_date: '',
    mode: 'virtual' as 'onsite' | 'virtual' | 'hybrid',
    seat_cap: 20,
    mentor_ratio: 0.1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCohort(formData)
      router.push('/dashboard/director')
    } catch (err) {
      console.error('Failed to create cohort:', err)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-orange">Create New Cohort</h1>
          <p className="text-och-steel">Create a new cohort for a track.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Track *
              </label>
              <select
                required
                value={formData.track}
                onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
                disabled={tracksLoading}
              >
                <option value="">Select a track</option>
                {Array.isArray(tracks) && tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name} {track.program_name && `(${track.program_name})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Cohort Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Mode *
              </label>
              <select
                required
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
              >
                <option value="virtual">Virtual</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Seat Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.seat_cap}
                  onChange={(e) => setFormData({ ...formData, seat_cap: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Mentor Ratio
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.mentor_ratio}
                  onChange={(e) => setFormData({ ...formData, mentor_ratio: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white focus:outline-none focus:border-och-mint"
                />
              </div>
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
                {isLoading ? 'Creating...' : 'Create Cohort'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}


