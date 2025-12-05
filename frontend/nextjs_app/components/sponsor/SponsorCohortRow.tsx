'use client'

import Link from 'next/link'
import { ROIBadge } from './ROIBadge'
import { BudgetThermometer } from './BudgetThermometer'

interface SponsorCohortRowProps {
  cohort: {
    cohort_id: string
    cohort_name: string
    track?: string
    seats_used: number
    seats_total: number
    roi_score: number
    readiness_avg: number
    readiness_trend?: number
    graduates_ready?: number
    graduates_total?: number
    budget_used: number
    budget_total: number
    risk_level: 'low' | 'medium' | 'high'
  }
  selected: boolean
  onSelect: (cohortId: string, checked: boolean) => void
  currency?: string
}

function SeatProgress({ used, total }: { used: number; total: number }) {
  const percentage = total > 0 ? (used / total) * 100 : 0
  const colorClass = percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-gray-900">{used}/{total}</span>
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${colorClass} h-full transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

function MetricChip({ value, trend }: { value: number; trend?: number }) {
  const trendDisplay = trend !== undefined ? (
    <span className={`text-xs ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
      {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
    </span>
  ) : null
  
  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-gray-900">{value.toFixed(1)} avg</span>
      {trendDisplay}
    </div>
  )
}

function RiskChip({ level }: { level: 'low' | 'medium' | 'high' }) {
  const colors = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  }
  const icons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[level]} flex items-center gap-1`}>
      <span>{icons[level]}</span>
      <span className="capitalize">{level}</span>
    </span>
  )
}

export function SponsorCohortRow({ cohort, selected, onSelect, currency = 'BWP' }: SponsorCohortRowProps) {
  return (
    <tr className={`hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-blue-50/30 group border-b border-gray-100/50 h-20 transition-all duration-200 ${
      selected ? 'ring-2 ring-emerald-200/50 bg-emerald-50/30' : ''
    }`}>
      <td className="px-8 py-5">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(cohort.cohort_id, e.target.checked)}
          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
        />
      </td>
      
      {/* Cohort Name + Track */}
      <td className="px-8 py-5 font-semibold text-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
            {cohort.cohort_name?.[0] || 'C'}
          </div>
          <div>
            <div className="font-semibold">{cohort.cohort_name}</div>
            {cohort.track && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {cohort.track}
              </span>
            )}
          </div>
        </div>
      </td>
      
      {/* ROI Score (Key Metric) */}
      <td className="px-8 py-5">
        <ROIBadge score={cohort.roi_score} size="lg" showTooltip={true} />
      </td>
      
      {/* Seats */}
      <td className="px-8 py-5">
        <SeatProgress used={cohort.seats_used} total={cohort.seats_total} />
      </td>
      
      {/* Readiness */}
      <td className="px-8 py-5">
        <MetricChip value={cohort.readiness_avg} trend={cohort.readiness_trend} />
      </td>
      
      {/* Graduates */}
      <td className="px-8 py-5">
        <div className="text-sm font-semibold text-gray-900">
          {cohort.graduates_ready || 0} / {cohort.graduates_total || cohort.seats_used}
        </div>
      </td>
      
      {/* Budget */}
      <td className="px-8 py-5">
        <BudgetThermometer 
          used={cohort.budget_used} 
          total={cohort.budget_total}
          currency={currency}
          className="w-32"
        />
      </td>
      
      {/* Risk */}
      <td className="px-8 py-5">
        <RiskChip level={cohort.risk_level} />
      </td>
      
      {/* Actions */}
      <td className="px-8 py-5">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/dashboard/sponsor/cohorts/${cohort.cohort_id}`}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            View
          </Link>
        </div>
      </td>
    </tr>
  )
}

