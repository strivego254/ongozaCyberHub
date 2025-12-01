'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function MissionsPage() {
  const missions = [
    {
      id: '1',
      title: 'Cybersecurity Fundamentals',
      description: 'Complete the foundational cybersecurity course',
      status: 'in_progress',
      progress: 65,
      deadline: '2024-12-15',
      type: 'course',
    },
    {
      id: '2',
      title: 'Network Security Assessment',
      description: 'Conduct a security assessment of a sample network',
      status: 'available',
      progress: 0,
      deadline: '2024-12-20',
      type: 'project',
    },
    {
      id: '3',
      title: 'Ethical Hacking Challenge',
      description: 'Complete the ethical hacking lab exercises',
      status: 'completed',
      progress: 100,
      deadline: '2024-11-25',
      type: 'lab',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="mint">Completed</Badge>
      case 'in_progress':
        return <Badge variant="defender">In Progress</Badge>
      default:
        return <Badge variant="steel">Available</Badge>
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Missions</h1>
          <p className="text-och-steel">
            Track your learning missions, assignments, and projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-och-mint mb-1">2</div>
              <div className="text-sm text-och-steel">Active Missions</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-och-gold mb-1">1</div>
              <div className="text-sm text-och-steel">Completed</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-och-defender mb-1">5</div>
              <div className="text-sm text-och-steel">Available</div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {missions.map((mission) => (
            <Card key={mission.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{mission.title}</h3>
                    {getStatusBadge(mission.status)}
                  </div>
                  <p className="text-och-steel mb-3">{mission.description}</p>
                  <div className="flex items-center gap-4 text-sm text-och-steel">
                    <span>Type: {mission.type}</span>
                    <span>Deadline: {mission.deadline}</span>
                    {mission.progress > 0 && (
                      <span>Progress: {mission.progress}%</span>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <Button variant="defender">View Details</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

