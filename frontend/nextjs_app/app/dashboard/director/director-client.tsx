'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'

const mockKPIs = [
  { label: 'Program Participants', value: '342', change: '+28' },
  { label: 'Completion Rate', value: '87%', change: '+5%' },
  { label: 'Avg. Satisfaction', value: '4.7', change: '+0.3' },
  { label: 'Budget Utilization', value: '68%', change: '+12%' },
]

const mockActions = [
  { label: 'Program Overview', href: '#', icon: '📈' },
  { label: 'Strategic Planning', href: '#', icon: '🎯' },
  { label: 'Stakeholder Reports', href: '#', icon: '📋' },
  { label: 'Resource Allocation', href: '#', icon: '💰' },
]

const mockPrograms = [
  { name: 'Leadership Program', progress: 85, status: 'on-track' },
  { name: 'Tech Skills Initiative', progress: 72, status: 'on-track' },
  { name: 'Mentorship Network', progress: 95, status: 'exceeding' },
]

export default function DirectorClient() {
  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-orange">Program Director Dashboard</h1>
          <p className="text-och-steel">Strategic oversight and program management.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockKPIs.map((kpi) => (
            <Card key={kpi.label} gradient="leadership">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-och-steel text-sm mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                </div>
                <Badge variant="orange">{kpi.change}</Badge>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {mockActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-20"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Program Status</h2>
            <div className="space-y-4">
              {mockPrograms.map((program) => (
                <div key={program.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-och-steel">{program.name}</span>
                    <Badge variant={program.status === 'exceeding' ? 'mint' : 'defender'}>
                      {program.status}
                    </Badge>
                  </div>
                  <ProgressBar value={program.progress} variant="orange" showLabel={false} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Key Initiatives</h2>
            <div className="space-y-3">
              {['Expand mentorship network', 'Launch new curriculum', 'Increase engagement'].map((initiative) => (
                <div key={initiative} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                  <div className="w-2 h-2 bg-och-orange rounded-full"></div>
                  <span className="text-och-steel">{initiative}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Stakeholder Updates</h2>
            <div className="space-y-3">
              {['Q4 Report due', 'Board meeting scheduled', 'Grant application pending'].map((update) => (
                <div key={update} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                  <div className="w-2 h-2 bg-och-gold rounded-full"></div>
                  <span className="text-och-steel">{update}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8 flex justify-end">
          <Link href="/dashboard/analytics">
            <Button variant="orange">View Analytics</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

