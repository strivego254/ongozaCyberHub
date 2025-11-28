'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'

const mockKPIs = [
  { label: 'Active Mentees', value: '8', change: '+2' },
  { label: 'Sessions This Month', value: '24', change: '+5' },
  { label: 'Avg. Rating', value: '4.9', change: '+0.2' },
  { label: 'Impact Score', value: '92', change: '+8' },
]

const mockActions = [
  { label: 'Schedule Session', href: '#', icon: '📅' },
  { label: 'View Mentees', href: '#', icon: '👥' },
  { label: 'Resources', href: '#', icon: '📖' },
  { label: 'Community', href: '#', icon: '💬' },
]

const mockMentees = [
  { name: 'Alex Johnson', progress: 85, status: 'active' },
  { name: 'Sam Williams', progress: 60, status: 'active' },
  { name: 'Jordan Lee', progress: 95, status: 'active' },
]

export default function MentorClient() {
  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Mentor Dashboard</h1>
          <p className="text-och-steel">Guide and inspire your mentees.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockKPIs.map((kpi) => (
            <Card key={kpi.label} gradient="leadership">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-och-steel text-sm mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                </div>
                <Badge variant="gold">{kpi.change}</Badge>
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
            <h2 className="text-2xl font-bold mb-4 text-white">Mentee Progress</h2>
            <div className="space-y-4">
              {mockMentees.map((mentee) => (
                <div key={mentee.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-och-steel">{mentee.name}</span>
                    <Badge variant="mint">{mentee.status}</Badge>
                  </div>
                  <ProgressBar value={mentee.progress} variant="mint" showLabel={false} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Upcoming Sessions</h2>
            <div className="space-y-3">
              {['Alex - Tomorrow 2PM', 'Sam - Friday 10AM', 'Jordan - Next Monday 3PM'].map((session) => (
                <div key={session} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                  <div className="w-2 h-2 bg-och-mint rounded-full"></div>
                  <span className="text-och-steel">{session}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Recent Feedback</h2>
            <div className="space-y-3">
              {['"Great session!" - Alex', '"Very helpful" - Sam', '"Thank you!" - Jordan'].map((feedback) => (
                <div key={feedback} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                  <div className="w-2 h-2 bg-och-gold rounded-full"></div>
                  <span className="text-och-steel">{feedback}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8 flex justify-end">
          <Link href="/dashboard/analytics">
            <Button variant="mint">View Analytics</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

