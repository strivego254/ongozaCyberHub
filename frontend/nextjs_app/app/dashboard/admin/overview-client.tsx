'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import { useUsers } from '@/hooks/useUsers'

interface AuditLog {
  id: number
  action: string
  resource_type: string
  resource_id: string | null
  result: string
  timestamp: string
  actor_identifier: string
}

export default function OverviewClient() {
  const { users, totalCount, isLoading: usersLoading } = useUsers({ page: 1, page_size: 100 })
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      await loadAuditLogs()
    } catch (error) {
      console.error('Failed to load overview data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const data = await apiGateway.get<{ results: AuditLog[] } | AuditLog[]>('/audit-logs/', {
        params: { range: 'week', page_size: 50 }
      })
      const logsArray = Array.isArray(data) ? data : (data?.results || [])
      setAuditLogs(logsArray)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      setAuditLogs([])
    }
  }

  // Statistics
  const stats = useMemo(() => {
    const programDirectors = users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'program_director')
    ).length
    const financeUsers = users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'finance')
    ).length
    const mentees = users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'mentee' || r.role === 'student')
    ).length
    const activeUsers = users.filter((u) => u.is_active && u.account_status === 'active').length

    return {
      total: totalCount || users.length,
      active: activeUsers,
      programDirectors,
      financeUsers,
      mentees,
    }
  }, [users, totalCount])

  // Audit log stats
  const auditStats = useMemo(() => {
    const success = auditLogs.filter((log) => log.result === 'success').length
    const failure = auditLogs.filter((log) => log.result === 'failure').length
    const today = auditLogs.filter((log) => {
      const logDate = new Date(log.timestamp)
      const today = new Date()
      return logDate.toDateString() === today.toDateString()
    }).length

    return { total: auditLogs.length, success, failure, today }
  }, [auditLogs])

  // Simple chart component
  const SimpleBarChart = ({ data, labels, color }: { data: number[], labels: string[], color: string }) => {
    const max = Math.max(...data, 1)
    return (
      <div className="flex items-end gap-2 h-32">
        {data.map((value, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t transition-all hover:opacity-80"
              style={{
                height: `${(value / max) * 100}%`,
                backgroundColor: color,
                minHeight: value > 0 ? '4px' : '0',
              }}
            />
            <span className="text-xs text-och-steel mt-1 text-center">{labels[idx]}</span>
            <span className="text-xs font-semibold text-white mt-1">{value}</span>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
          <p className="text-och-steel">Loading overview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-gold">Admin Dashboard</h1>
        <p className="text-och-steel">Comprehensive platform management and oversight</p>
      </div>

      {/* Overview Stats */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">Platform Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
              <p className="text-och-steel text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
              <p className="text-och-steel text-sm mb-1">Active Users</p>
              <p className="text-3xl font-bold text-och-mint">{stats.active}</p>
            </div>
            <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
              <p className="text-och-steel text-sm mb-1">Program Directors</p>
              <p className="text-3xl font-bold text-och-defender">{stats.programDirectors}</p>
            </div>
            <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
              <p className="text-och-steel text-sm mb-1">Finance Users</p>
              <p className="text-3xl font-bold text-och-gold">{stats.financeUsers}</p>
            </div>
            <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
              <p className="text-och-steel text-sm mb-1">Mentees</p>
              <p className="text-3xl font-bold text-och-mint">{stats.mentees}</p>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">User Activity (Last 7 Days)</h3>
              <SimpleBarChart
                data={[
                  auditStats.today,
                  Math.floor(auditStats.total / 7),
                  Math.floor(auditStats.total / 7),
                  Math.floor(auditStats.total / 7),
                  Math.floor(auditStats.total / 7),
                  Math.floor(auditStats.total / 7),
                  Math.floor(auditStats.total / 7),
                ]}
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                color="#33FFC1"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">User Roles Distribution</h3>
              <SimpleBarChart
                data={[
                  stats.programDirectors,
                  stats.financeUsers,
                  stats.mentees,
                  users.filter((u) => u.roles?.some((r: any) => r.role === 'mentor')).length,
                ]}
                labels={['Directors', 'Finance', 'Mentees', 'Mentors']}
                color="#0648A8"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Audit Logs</h3>
              <span className="text-2xl">📋</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-och-steel">Total</span>
                <span className="text-white font-semibold">{auditStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-och-steel">Success</span>
                <Badge variant="mint">{auditStats.success}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-och-steel">Failures</span>
                <Badge variant="orange">{auditStats.failure}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-och-steel">Today</span>
                <Badge variant="defender">{auditStats.today}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">User Status</h3>
              <span className="text-2xl">👥</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-och-steel">Active</span>
                <Badge variant="mint">{stats.active}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-och-steel">Inactive</span>
                <Badge variant="orange">{stats.total - stats.active}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <span className="text-2xl">⚡</span>
            </div>
            <div className="space-y-2">
              <a href="/dashboard/admin/users" className="block text-och-mint hover:text-och-mint/80 text-sm">
                → Manage Users
              </a>
              <a href="/dashboard/admin/roles" className="block text-och-mint hover:text-och-mint/80 text-sm">
                → Manage Roles
              </a>
              <a href="/dashboard/admin/audit" className="block text-och-mint hover:text-och-mint/80 text-sm">
                → View Audit Logs
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

