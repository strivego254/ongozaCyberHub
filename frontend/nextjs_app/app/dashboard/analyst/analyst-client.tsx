'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const mockKPIs = [
  { label: 'Data Points Analyzed', value: '12.4K', change: '+1.2K' },
  { label: 'Reports Generated', value: '48', change: '+8' },
  { label: 'Insights Discovered', value: '156', change: '+23' },
  { label: 'Accuracy Rate', value: '94.2%', change: '+2.1%' },
]

const mockActions = [
  { label: 'Run Analysis', href: '#', icon: '🔍' },
  { label: 'Generate Report', href: '#', icon: '📊' },
  { label: 'Export Data', href: '#', icon: '📥' },
  { label: 'Create Dashboard', href: '#', icon: '📈' },
]

const mockInsights = [
  { title: 'Peak engagement time', value: '2-4 PM', trend: 'up' },
  { title: 'Most popular course', value: 'Web Dev', trend: 'stable' },
  { title: 'Mentor effectiveness', value: '+15%', trend: 'up' },
]

export default function AnalystClient() {
  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-steel">Analyst Dashboard</h1>
          <p className="text-och-steel">Data-driven insights and analytics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockKPIs.map((kpi) => (
            <Card key={kpi.label} gradient="defender">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-och-steel text-sm mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                </div>
                <Badge variant="steel">{kpi.change}</Badge>
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
            <h2 className="text-2xl font-bold mb-4 text-white">Key Insights</h2>
            <div className="space-y-4">
              {mockInsights.map((insight) => (
                <div key={insight.title} className="p-3 bg-och-midnight/50 rounded-lg">
                  <p className="text-sm text-och-steel mb-1">{insight.title}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-white">{insight.value}</p>
                    <Badge variant={insight.trend === 'up' ? 'mint' : 'steel'}>
                      {insight.trend}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Recent Analyses</h2>
            <div className="space-y-3">
              {['User engagement report', 'Course completion analysis', 'Mentor performance review'].map((analysis) => (
                <div key={analysis} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                  <div className="w-2 h-2 bg-och-steel rounded-full"></div>
                  <span className="text-och-steel">{analysis}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Data Sources</h2>
            <div className="space-y-3">
              {['User activity logs', 'Course metrics', 'Mentor feedback'].map((source) => (
                <div key={source} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                  <div className="w-2 h-2 bg-och-defender rounded-full"></div>
                  <span className="text-och-steel">{source}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8 flex justify-end">
          <Link href="/dashboard/analytics">
            <Button variant="defender">View Analytics</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

