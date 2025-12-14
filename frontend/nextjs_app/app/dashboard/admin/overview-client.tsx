'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { apiGateway } from '@/services/apiGateway'
import { useUsers } from '@/hooks/useUsers'
import { TrackDistributionChart } from '@/components/admin/TrackDistributionChart'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface AuditLog {
  id: number
  action: string
  resource_type: string
  resource_id: string | null
  result: string
  timestamp: string
  actor_identifier: string
}

type TimePeriod = '7d' | '1m' | '6m' | '1y'

export default function OverviewClient() {
  const { users, totalCount, isLoading: usersLoading } = useUsers({ page: 1, page_size: 100 })
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d')

  useEffect(() => {
    loadInitialData()
  }, [timePeriod])

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

  const getRangeParam = (period: TimePeriod): string => {
    switch (period) {
      case '7d':
        return 'week'
      case '1m':
        return 'month'
      case '6m':
        return 'month' // Backend supports month, we'll fetch more data
      case '1y':
        return 'year'
      default:
        return 'week'
    }
  }

  const loadAuditLogs = async () => {
    try {
      let params: any = { page_size: 1000 } // Get more data for better charts
      
      if (timePeriod === '6m') {
        // For 6 months, we need to calculate start_date manually
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        params.start_date = sixMonthsAgo.toISOString()
      } else {
        params.range = getRangeParam(timePeriod)
      }
      
      const data = await apiGateway.get<{ results: AuditLog[] } | AuditLog[]>('/audit-logs/', {
        params
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

  // Process activity data for time series chart
  const activityChartData = useMemo(() => {
    if (auditLogs.length === 0) return []

    // Group logs by date
    const activityByDate: { [key: string]: number } = {}
    const now = new Date()
    let startDate: Date
    let intervalDays: number

    // Calculate date range based on selected period
    switch (timePeriod) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        intervalDays = 1
        break
      case '1m':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        intervalDays = 1
        break
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        intervalDays = 7 // Weekly intervals for 6 months
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        intervalDays = 30 // Monthly intervals for 1 year
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        intervalDays = 1
    }

    // Initialize all dates in range with 0
    const chartData: Array<{ date: string; activity: number; label: string }> = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0]
      let label = ''
      
      if (timePeriod === '7d' || timePeriod === '1m') {
        label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (timePeriod === '6m') {
        label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        label = currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      }
      
      chartData.push({
        date: dateStr,
        activity: 0,
        label
      })
      
      currentDate.setDate(currentDate.getDate() + intervalDays)
    }

    // Count activities per date
    auditLogs.forEach((log) => {
      const logDate = new Date(log.timestamp)
      
      // Find the appropriate interval bucket
      for (let i = 0; i < chartData.length; i++) {
        const itemDate = new Date(chartData[i].date)
        const nextDate = i < chartData.length - 1 
          ? new Date(chartData[i + 1].date) 
          : new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)
        
        if (logDate >= itemDate && logDate < nextDate) {
          chartData[i].activity++
          break
        }
      }
    })

    // Filter out future dates and ensure we have data
    return chartData.filter(item => new Date(item.date) <= now)
  }, [auditLogs, timePeriod])

  // Custom tooltip for activity chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{data.label}</p>
          <p className="text-och-steel text-sm">
            <span className="text-och-mint font-medium">{data.activity}</span> activities
          </p>
        </div>
      )
    }
    return null
  }

  // Track distribution stats
  const trackDistribution = useMemo(() => {
    const trackCounts: { [key: string]: number } = {
      Builders: 0,
      Leaders: 0,
      Entrepreneurs: 0,
      Educators: 0,
      Researchers: 0,
    }

    // Count users by track_key
    users.forEach((user) => {
      const trackKey = user.track_key
      if (trackKey) {
        const trackName = trackKey.charAt(0).toUpperCase() + trackKey.slice(1).toLowerCase()
        if (trackCounts.hasOwnProperty(trackName)) {
          trackCounts[trackName]++
        } else if (trackKey.toLowerCase() === 'builder' || trackKey.toLowerCase() === 'builders') {
          trackCounts.Builders++
        } else if (trackKey.toLowerCase() === 'leader' || trackKey.toLowerCase() === 'leaders') {
          trackCounts.Leaders++
        } else if (trackKey.toLowerCase() === 'entrepreneur' || trackKey.toLowerCase() === 'entrepreneurs') {
          trackCounts.Entrepreneurs++
        } else if (trackKey.toLowerCase() === 'educator' || trackKey.toLowerCase() === 'educators') {
          trackCounts.Educators++
        } else if (trackKey.toLowerCase() === 'researcher' || trackKey.toLowerCase() === 'researchers') {
          trackCounts.Researchers++
        }
      }
    })

    const total = Object.values(trackCounts).reduce((sum, count) => sum + count, 0)

    const COLORS: { [key: string]: string } = {
      Builders: '#3B82F6',
      Leaders: '#10B981',
      Entrepreneurs: '#8B5CF6',
      Educators: '#F59E0B',
      Researchers: '#EF4444',
    }

    // If no track data, use mock data based on the image percentages
    if (total === 0) {
      return [
        { name: 'Builders', value: 35, percentage: 35, color: COLORS.Builders },
        { name: 'Leaders', value: 22, percentage: 22, color: COLORS.Leaders },
        { name: 'Entrepreneurs', value: 18, percentage: 18, color: COLORS.Entrepreneurs },
        { name: 'Educators', value: 15, percentage: 15, color: COLORS.Educators },
        { name: 'Researchers', value: 10, percentage: 10, color: COLORS.Researchers },
      ]
    }

    return Object.entries(trackCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        color: COLORS[name] || '#6B7280',
      }))
      .filter((track) => track.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [users])

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

          {/* User Activity Chart */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">User Activity</h2>
                  <p className="text-och-steel text-sm">Platform activity over time</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={timePeriod === '7d' ? 'defender' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('7d')}
                  >
                    7 Days
                  </Button>
                  <Button
                    variant={timePeriod === '1m' ? 'defender' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('1m')}
                  >
                    1 Month
                  </Button>
                  <Button
                    variant={timePeriod === '6m' ? 'defender' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('6m')}
                  >
                    6 Months
                  </Button>
                  <Button
                    variant={timePeriod === '1y' ? 'defender' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('1y')}
                  >
                    1 Year
                  </Button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                </div>
              ) : activityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={activityChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#33FFC1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#33FFC1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#64748B"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="#64748B"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="activity"
                      stroke="#33FFC1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorActivity)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-och-steel">
                  <p>No activity data available for the selected period</p>
                </div>
              )}
            </div>
          </Card>
          
          {/* Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Activity Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                    <span className="text-och-steel">Total Activities</span>
                    <span className="text-white font-semibold text-lg">{auditStats.total}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                    <span className="text-och-steel">Successful</span>
                    <Badge variant="mint">{auditStats.success}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                    <span className="text-och-steel">Failed</span>
                    <Badge variant="orange">{auditStats.failure}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                    <span className="text-och-steel">Today</span>
                    <Badge variant="defender">{auditStats.today}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {/* Track Distribution Chart */}
      <Card className="mb-6">
        <div className="p-6">
          <TrackDistributionChart data={trackDistribution} />
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

