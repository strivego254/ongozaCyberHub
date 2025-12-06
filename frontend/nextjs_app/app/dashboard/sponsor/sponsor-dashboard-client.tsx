'use client'

import { useState, useEffect } from 'react'
import { sponsorClient, SponsorDashboardSummary, SponsorCohort } from '@/services/sponsorClient'
import { ROIMetricCard } from '@/components/sponsor/ROIMetricCard'
import { SponsorCohortRow } from '@/components/sponsor/SponsorCohortRow'
import { QuickSeatActions } from '@/components/sponsor/QuickSeatActions'
import { GraduateFunnel } from '@/components/sponsor/GraduateFunnel'
import { ConnectionsRow } from '@/components/sponsor/ConnectionsRow'
import { EnhancedSidebar } from '@/components/sponsor/EnhancedSidebar'

export default function SponsorDashboardClient() {
  const [summary, setSummary] = useState<SponsorDashboardSummary | null>(null)
  const [cohorts, setCohorts] = useState<SponsorCohort[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([])
  const [filters, setFilters] = useState({
    search: '',
    risk: 'all',
    track: 'all',
    status: 'all',
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [dashboardSummary, cohortsData] = await Promise.all([
        sponsorClient.getSummary(),
        sponsorClient.getCohorts(),
      ])
      
      setSummary(dashboardSummary as SponsorDashboardSummary)
      setCohorts((cohortsData as any).results || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCohort = (cohortId: string, checked: boolean) => {
    if (checked) {
      setSelectedCohorts([...selectedCohorts, cohortId])
    } else {
      setSelectedCohorts(selectedCohorts.filter(id => id !== cohortId))
    }
  }

  const handleBulkExport = () => {
    const csv = [
      ['Cohort', 'Seats', 'ROI Score', 'Readiness', 'Graduates', 'Budget Used', 'Risk'],
      ...filteredCohorts.map(c => [
        c.cohort_name,
        `${c.seats_used}/${c.seats_total}`,
        calculateROIScore(c).toFixed(1),
        (c.avg_readiness || 0).toFixed(1),
        `${c.graduates_count || 0}/${c.seats_used}`,
        `BWP ${c.budget_remaining ? (c.seats_total * 300 - c.budget_remaining) : 0}`,
        getRiskLevel(c),
      ]),
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sponsor-roi-report.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const calculateROIScore = (cohort: SponsorCohort): number => {
    // ROI calculation: readiness (40%) + completion (30%) + graduate rate (30%)
    const readiness = (cohort.avg_readiness || 0) / 100
    const completion = (cohort.completion_pct || 0) / 100
    const graduateRate = cohort.seats_used > 0 ? (cohort.graduates_count || 0) / cohort.seats_used : 0
    
    return (readiness * 0.4 + completion * 0.3 + graduateRate * 0.3) * 10
  }

  const getRiskLevel = (cohort: SponsorCohort): 'low' | 'medium' | 'high' => {
    const riskFlags = cohort.flags?.length || 0
    const atRiskCount = cohort.at_risk_count || 0
    const riskRatio = cohort.seats_used > 0 ? atRiskCount / cohort.seats_used : 0
    
    if (riskFlags >= 3 || riskRatio > 0.2) return 'high'
    if (riskFlags >= 1 || riskRatio > 0.1) return 'medium'
    return 'low'
  }

  // Filter cohorts
  const filteredCohorts = cohorts.filter((cohort) => {
    const matchesSearch = filters.search === '' || 
      cohort.cohort_name.toLowerCase().includes(filters.search.toLowerCase())
    const matchesRisk = filters.risk === 'all' || getRiskLevel(cohort) === filters.risk
    const matchesTrack = filters.track === 'all' || cohort.track_name === filters.track
    return matchesSearch && matchesRisk && matchesTrack
  })

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-och-steel">Loading dashboard...</div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-och-orange mb-2">Error Loading Dashboard</h2>
          <p className="text-och-steel mb-4">{error || 'No data available'}</p>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const seatsUtilization = summary.seats_total > 0 
    ? Math.round((summary.seats_used / summary.seats_total) * 100) 
    : 0

  const budgetTotal = summary.budget_total || 0
  const budgetUsed = summary.budget_used || 0
  const budgetUtilization = budgetTotal > 0
    ? Math.round((budgetUsed / budgetTotal) * 100)
    : summary.budget_used_pct || 0

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Sponsor Dashboard</h1>
          <p className="text-och-steel">
            Monitor sponsored cohorts, track ROI, and manage employee enrollment.
          </p>
        </div>
        
        {/* Hero ROI Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <ROIMetricCard
            title="SEATS UTILIZED"
            value={summary.seats_used}
            subtitle={`${seatsUtilization}% of ${summary.seats_total}`}
            trend={{ value: 12, direction: 'up', label: 'MoM' }}
            icon="👥"
            roiColor={{ bg: 'bg-och-mint/20' }}
          />
          <ROIMetricCard
            title="AVG READINESS"
            value={summary.avg_readiness.toFixed(1)}
            subtitle="Graduate readiness score"
            trend={{ value: 0, direction: 'neutral' }}
            icon="📊"
            roiColor={{ bg: 'bg-och-defender/20' }}
          />
          <ROIMetricCard
            title="GRADUATES READY"
            value={summary.graduates_count}
            subtitle="Q4 2025"
            trend={{ value: 5, direction: 'up' }}
            icon="🎓"
            roiColor={{ bg: 'bg-och-gold/20' }}
          />
          <ROIMetricCard
            title="FORECAST GRADUATES"
            value={42}
            subtitle="84% Confidence"
            trend={{ value: 0, direction: 'neutral' }}
            icon="🔮"
            roiColor={{ bg: 'bg-och-mint/20' }}
          />
          <ROIMetricCard
            title="BUDGET UTILIZED"
            value={`BWP ${(budgetUsed / 1000).toFixed(0)}K`}
            subtitle={`${budgetUtilization}% of BWP ${(budgetTotal / 1000).toFixed(0)}K`}
            trend={{ value: budgetUtilization, direction: budgetUtilization >= 75 ? 'up' : 'neutral' }}
            icon="💰"
            roiColor={{ bg: budgetUtilization >= 75 ? 'bg-och-orange/20' : 'bg-och-gold/20' }}
          />
        </div>

        {/* Connections Row */}
        <ConnectionsRow
          employeesCount={summary.seats_used}
          employeesShared={23} // TODO: Get from API
          directorName="Jane Smith" // TODO: Get from API
          directorTrack="Cyber Leadership" // TODO: Get from API
          financeTotal={summary.budget_total}
          financePending={3} // TODO: Get from API
          teamMembers={3} // TODO: Get from API
          teamAdmins={2} // TODO: Get from API
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cohorts Table - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-och-midnight border border-och-steel/20 rounded-xl overflow-hidden">
              {/* Table Header with Filters */}
              <div className="p-6 border-b border-och-steel/20">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <h2 className="text-xl font-bold text-white">📊 Sponsored Cohorts</h2>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search: Cohort..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-sm text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-mint"
                    />
                    
                    <select
                      value={filters.risk}
                      onChange={(e) => setFilters({ ...filters, risk: e.target.value })}
                      className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-mint"
                    >
                      <option value="all">Risk: All</option>
                      <option value="high">Risk: High</option>
                      <option value="medium">Risk: Medium</option>
                      <option value="low">Risk: Low</option>
                    </select>
                    
                    <select
                      value={filters.track}
                      onChange={(e) => setFilters({ ...filters, track: e.target.value })}
                      className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-mint"
                    >
                      <option value="all">Track: All</option>
                      {Array.from(new Set(cohorts.map(c => c.track_name))).map(track => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>
                    
                    <button
                      onClick={handleBulkExport}
                      className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors text-sm font-semibold flex items-center gap-2"
                    >
                      💰 Export ROI Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedCohorts.length > 0 && (
                <div className="px-6 py-3 bg-och-mint/10 border-b border-och-mint/20 flex items-center justify-between">
                  <span className="text-sm font-medium text-och-mint">
                    {selectedCohorts.length} cohort{selectedCohorts.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCohorts([])}
                      className="px-3 py-1 text-sm text-och-steel hover:text-white"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        console.log('Bulk action on:', selectedCohorts)
                        setSelectedCohorts([])
                      }}
                      className="px-4 py-1 bg-och-defender text-white rounded text-sm hover:bg-och-defender/80 transition-colors"
                    >
                      Bulk Assign
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-och-midnight border-b border-och-steel/20">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedCohorts.length === filteredCohorts.length && filteredCohorts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCohorts(filteredCohorts.map(c => c.cohort_id))
                            } else {
                              setSelectedCohorts([])
                            }
                          }}
                          className="w-5 h-5 text-och-mint border-och-steel/20 rounded focus:ring-och-mint"
                        />
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Cohort
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        ROI Score
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Seats
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Readiness
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Graduates
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Budget Used
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                    {filteredCohorts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-8 py-8 text-center text-och-steel">
                          No cohorts found
                        </td>
                      </tr>
                    ) : (
                      filteredCohorts.map((cohort) => (
                        <SponsorCohortRow
                          key={cohort.cohort_id}
                          cohort={{
                            cohort_id: cohort.cohort_id,
                            cohort_name: cohort.cohort_name,
                            track: cohort.track_name,
                            seats_used: cohort.seats_used,
                            seats_total: cohort.seats_total,
                            roi_score: calculateROIScore(cohort),
                            readiness_avg: cohort.avg_readiness || 0,
                            readiness_trend: 0, // TODO: Get from API
                            graduates_ready: cohort.graduates_count,
                            graduates_total: cohort.seats_used,
                            budget_used: cohort.budget_remaining 
                              ? (cohort.seats_total * 300 - cohort.budget_remaining)
                              : cohort.seats_used * 300,
                            budget_total: cohort.seats_total * 300,
                            risk_level: getRiskLevel(cohort),
                          }}
                          selected={selectedCohorts.includes(cohort.cohort_id)}
                          onSelect={handleSelectCohort}
                          currency="BWP"
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <EnhancedSidebar />
            </div>
          </div>
        </div>
    </div>
  )
}

