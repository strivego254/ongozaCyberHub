'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'

export default function CurriculumPage() {
  const tracks = [
    {
      id: '1',
      name: 'Cybersecurity Fundamentals',
      description: 'Foundational knowledge in cybersecurity',
      modules: 8,
      completed: 5,
      progress: 62,
      status: 'in_progress',
    },
    {
      id: '2',
      name: 'Network Security',
      description: 'Deep dive into network security protocols',
      modules: 12,
      completed: 0,
      progress: 0,
      status: 'available',
    },
    {
      id: '3',
      name: 'Ethical Hacking',
      description: 'Learn ethical hacking techniques',
      modules: 10,
      completed: 10,
      progress: 100,
      status: 'completed',
    },
  ]

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Curriculum</h1>
          <p className="text-och-steel">
            Tracks, modules, lessons aligned to Future-You
          </p>
        </div>

        <div className="space-y-4">
          {tracks.map((track) => (
            <Card key={track.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-semibold text-white">{track.name}</h3>
                    {track.status === 'completed' && <Badge variant="mint">Completed</Badge>}
                    {track.status === 'in_progress' && <Badge variant="defender">In Progress</Badge>}
                    {track.status === 'available' && <Badge variant="steel">Available</Badge>}
                  </div>
                  <p className="text-och-steel mb-3">{track.description}</p>
                  <div className="flex items-center gap-4 text-sm text-och-steel mb-2">
                    <span>{track.modules} modules</span>
                    <span>{track.completed} completed</span>
                  </div>
                  <ProgressBar value={track.progress} variant="defender" />
                </div>
                <div className="ml-4">
                  <Button variant="defender">View Track</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Recommended Next Steps</h2>
            <div className="space-y-3">
              <div className="p-4 bg-och-defender/20 rounded-lg">
                <div className="font-medium text-white mb-1">Complete Module 6: Encryption</div>
                <div className="text-sm text-och-steel">Continue your progress in Cybersecurity Fundamentals</div>
              </div>
              <div className="p-4 bg-och-defender/20 rounded-lg">
                <div className="font-medium text-white mb-1">Start Network Security Track</div>
                <div className="text-sm text-och-steel">Build on your fundamentals with advanced topics</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

