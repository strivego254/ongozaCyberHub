'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useDirectorDashboard } from '@/hooks/usePrograms'
import { auditClient, type AuditLog } from '@/services/auditClient'

export default function AnalyticsPage() {
  const { dashboard, isLoading: dashboardLoading } = useDirectorDashboard()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [resourceFilter, setResourceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  useEffect(() => {
    loadDirectorActions()
    setCurrentPage(1) // Reset to first page when filters change
  }, [dateRange, actionFilter, resourceFilter])

  const loadDirectorActions = async () => {
    setIsLoading(true)
    try {
      const filters: any = {
        range: dateRange,
      }
      
      if (actionFilter !== 'all') {
        filters.action = actionFilter
      }
      
      if (resourceFilter !== 'all') {
        filters.resource_type = resourceFilter
      }
      
      const logs = await auditClient.getDirectorActions(filters)
      setAuditLogs(logs)
    } catch (err) {
      console.error('Failed to load director actions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
        return 'mint'
      case 'update':
        return 'defender'
      case 'delete':
        return 'orange'
      default:
        return 'outline'
    }
  }

  const getResourceTypeLabel = (resourceType: string) => {
    const labels: Record<string, string> = {
      program: 'Program',
      cohort: 'Cohort',
      track: 'Track',
      milestone: 'Milestone',
      module: 'Module',
      enrollment: 'Enrollment',
      mentor_assignment: 'Mentor Assignment',
    }
    return labels[resourceType] || resourceType
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      read: 'Viewed',
    }
    return labels[action] || action
  }

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false
      }
      if (resourceFilter !== 'all' && log.resource_type !== resourceFilter) {
        return false
      }
      return true
    })
  }, [auditLogs, actionFilter, resourceFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      create: 0,
      update: 0,
      delete: 0,
      read: 0,
    }
    filteredLogs.forEach(log => {
      if (counts[log.action] !== undefined) {
        counts[log.action]++
      }
    })
    return counts
  }, [filteredLogs])

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'Actor', 'Result', 'IP Address']
    const rows = filteredLogs.map(log => [
      formatTimestamp(log.timestamp),
      getActionLabel(log.action),
      getResourceTypeLabel(log.resource_type),
      log.resource_id || 'N/A',
      log.actor_identifier,
      log.result,
      log.ip_address || 'N/A',
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `director-actions-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredLogs, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `director-actions-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-defender">Analytics & Reports</h1>
              <p className="text-och-steel">Track director actions, view reports, and export data</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredLogs.length === 0}>
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToJSON} disabled={filteredLogs.length === 0}>
                Export JSON
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Total Actions</p>
                <p className="text-2xl font-bold text-white">{filteredLogs.length}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Created</p>
                <p className="text-2xl font-bold text-och-mint">{actionCounts.create}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Updated</p>
                <p className="text-2xl font-bold text-och-defender">{actionCounts.update}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Deleted</p>
                <p className="text-2xl font-bold text-och-orange">{actionCounts.delete}</p>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Date Range
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Action Type
                  </label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="all">All Actions</option>
                    <option value="create">Created</option>
                    <option value="update">Updated</option>
                    <option value="delete">Deleted</option>
                    <option value="read">Viewed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Resource Type
                  </label>
                  <select
                    value={resourceFilter}
                    onChange={(e) => setResourceFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="all">All Resources</option>
                    <option value="program">Programs</option>
                    <option value="cohort">Cohorts</option>
                    <option value="track">Tracks</option>
                    <option value="milestone">Milestones</option>
                    <option value="module">Modules</option>
                    <option value="enrollment">Enrollments</option>
                    <option value="mentor_assignment">Mentor Assignments</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Director Actions Table */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Director Actions Log</h2>
                  <p className="text-sm text-och-steel mt-1">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} actions
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-och-steel">Per page:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-3 py-1 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <Badge variant="defender">{filteredLogs.length} total</Badge>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
                  <p className="text-och-steel">Loading actions...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-och-steel">
                  <p>No actions found for the selected filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Timestamp</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Action</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Resource Type</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Resource ID</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Actor</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Result</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">IP Address</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-och-steel/10 hover:bg-och-midnight/50 transition-colors"
                        >
                          <td className="p-3 text-och-steel text-sm whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="p-3">
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {getActionLabel(log.action)}
                            </Badge>
                          </td>
                          <td className="p-3 text-white text-sm">
                            {getResourceTypeLabel(log.resource_type)}
                          </td>
                          <td className="p-3 text-och-steel text-sm font-mono text-xs">
                            {log.resource_id ? log.resource_id.substring(0, 8) + '...' : 'N/A'}
                          </td>
                          <td className="p-3 text-och-steel text-sm">
                            {log.actor_identifier}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={log.result === 'success' ? 'mint' : log.result === 'failure' ? 'orange' : 'defender'}
                            >
                              {log.result}
                            </Badge>
                          </td>
                          <td className="p-3 text-och-steel text-sm font-mono text-xs">
                            {log.ip_address || 'N/A'}
                          </td>
                          <td className="p-3">
                            {log.metadata && Object.keys(log.metadata).length > 0 ? (
                              <details className="cursor-pointer">
                                <summary className="text-och-defender text-sm hover:text-och-mint">
                                  View Details
                                </summary>
                                <div className="mt-2 p-2 bg-och-midnight/50 rounded text-xs text-och-steel">
                                  <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              </details>
                            ) : (
                              <span className="text-och-steel text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {filteredLogs.length > 0 && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-och-steel/20 pt-4">
                  <div className="text-sm text-och-steel">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'defender' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="min-w-[2.5rem]"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Dashboard Metrics (if available) */}
          {dashboard && (
            <Card className="mt-6">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Cohort Analytics</h2>
                {dashboard.cohort_table && dashboard.cohort_table.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-och-steel/20">
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Cohort</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Program</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Seats</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Readiness</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.cohort_table.map((cohort: any) => (
                          <tr key={cohort.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                            <td className="p-3 text-white font-semibold">{cohort.name}</td>
                            <td className="p-3 text-och-steel text-sm">{cohort.program_name}</td>
                            <td className="p-3 text-och-steel text-sm">
                              {cohort.seats_used}/{cohort.seats_total}
                            </td>
                            <td className="p-3">
                              <Badge variant="defender">{cohort.readiness || 'N/A'}%</Badge>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  cohort.status === 'running'
                                    ? 'mint'
                                    : cohort.status === 'active'
                                    ? 'defender'
                                    : 'orange'
                                }
                              >
                                {cohort.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-och-steel">
                    <p>No cohort data available</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
