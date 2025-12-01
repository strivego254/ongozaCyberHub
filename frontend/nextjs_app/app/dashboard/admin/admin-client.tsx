'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function AdminClient() {
  const { users, totalCount, isLoading: usersLoading } = useUsers({ page: 1, page_size: 10 })
  const { readinessScores, heatmapData, skillMastery, behavioralTrends, isLoading: analyticsLoading } = useAnalytics(undefined)

  const activeUsers = users.filter(u => u.is_active && u.account_status === 'active').length
  const totalUsers = totalCount || users.length

  const kpis = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), change: `+${users.length}` },
    { label: 'Active Users', value: activeUsers.toString(), change: `${activeUsers}` },
    { label: 'System Health', value: '99.9%', change: 'Stable' },
    { label: 'Response Time', value: '120ms', change: 'Good' },
  ]

  const actions = [
    { label: 'User Management', href: '/dashboard/admin/users', icon: '👥' },
    { label: 'System Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
    { label: 'Subscription Rules', href: '/dashboard/admin/subscriptions', icon: '⭐' },
    { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: '📋' },
    { label: 'Payment Settings', href: '/dashboard/admin/payments', icon: '💳' },
    { label: 'Community Management', href: '/dashboard/admin/community', icon: '💬' },
    { label: 'Curriculum', href: '/dashboard/admin/curriculum', icon: '📚' },
    { label: 'Integrations', href: '/dashboard/admin/integrations', icon: '🔌' },
  ]

  const alerts = [
    { type: 'info', message: `${users.length} users in system` },
    { type: 'success', message: 'System operational' },
  ]
  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-gold">Admin Dashboard</h1>
          <p className="text-och-steel">Manage platform operations and users.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {actions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-24 w-full"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-xs text-center">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">System Alerts</h2>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.type === 'warning' ? 'bg-och-orange' :
                    alert.type === 'info' ? 'bg-och-defender' :
                    'bg-och-mint'
                  }`}></div>
                  <span className="text-och-steel text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Recent Activity</h2>
            <div className="space-y-3">
              {['User registration', 'System update', 'Report generated'].map((activity) => (
                <div key={activity} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                  <div className="w-2 h-2 bg-och-gold rounded-full"></div>
                  <span className="text-och-steel">{activity}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Platform Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-och-steel">Uptime</span>
                <span className="text-white font-semibold">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-och-steel">Response Time</span>
                <span className="text-white font-semibold">120ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-och-steel">Database Size</span>
                <span className="text-white font-semibold">2.4 GB</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex justify-end">
          <Link href="/dashboard/analytics">
            <Button variant="gold">View Analytics</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

