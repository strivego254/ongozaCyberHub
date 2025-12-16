'use client'

import { useMemo, memo } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { useDashboardStore } from '../lib/store/dashboardStore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/hooks/useAuth'
import '../styles/dashboard.css'

export const HeroSection = memo(function HeroSection() {
  const { readiness, cohortProgress, subscription, subscriptionDaysLeft } = useDashboardStore()
  const { user } = useAuth()

  const gaugeData = useMemo(() => {
    const percentage = readiness.score
    return [
      {
        name: 'Readiness',
        value: percentage,
        fill: percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444',
      },
    ]
  }, [readiness.score])

  const countdownClass = useMemo(() => {
    if (readiness.countdownDays < 1) return 'countdown-urgent'
    if (readiness.countdownDays < 7) return 'countdown-warning'
    return 'countdown-normal'
  }, [readiness.countdownDays])

  const subscriptionBadgeVariant = useMemo(() => {
    if (subscription === 'free') return 'steel'
    if (subscription === '$7-premium') return 'gold'
    return 'mint'
  }, [subscription])

  const trackName = cohortProgress.currentModule || 'Cyber Builders Track'
  const userName = user?.first_name || user?.email?.split('@')[0] || 'Student'

  return (
    <Card 
      className="glass-card glass-hover p-3 md:p-4 h-auto min-h-[120px] max-h-[140px] flex items-center gap-3 md:gap-4" 
      glow
    >
      <div className="flex-shrink-0" aria-label="User avatar">
        <div className="w-20 h-20 rounded-full bg-dashboard-accent/20 flex items-center justify-center border-2 border-dashboard-accent">
          <span className="text-2xl font-bold text-dashboard-accent" aria-hidden="true">{userName[0].toUpperCase()}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-bold text-white truncate">
            <span aria-label={`${userName} on ${trackName} track`}>{userName} ({trackName})</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2" aria-label={`Readiness score: ${readiness.score} out of ${readiness.maxScore}`}>
            <span className="text-sm text-dashboard-accent">Readiness:</span>
            <span className="text-lg font-bold text-white">{readiness.score}/{readiness.maxScore}</span>
            {readiness.trend !== 0 && (
              <span 
                className={`text-xs ${readiness.trendDirection === 'up' ? 'text-dashboard-success' : 'text-dashboard-error'}`}
                aria-label={`${readiness.trendDirection === 'up' ? 'Increased' : 'Decreased'} by ${Math.abs(readiness.trend)}%`}
              >
                {readiness.trendDirection === 'up' ? '↑' : '↓'} {Math.abs(readiness.trend)}%
              </span>
            )}
          </div>
          
          <div className={`text-sm font-semibold ${countdownClass}`} aria-label={readiness.countdownLabel}>
            {readiness.countdownLabel}
          </div>
        </div>

        <div className="mb-2" role="progressbar" aria-valuenow={cohortProgress.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`Cohort progress: ${cohortProgress.percentage}%`}>
          <ProgressBar 
            value={cohortProgress.percentage} 
            max={100} 
            variant="mint"
            showLabel={false}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-och-steel mt-1">
            <span>Cohort {cohortProgress.completedModules}/{cohortProgress.totalModules} modules</span>
            <span>{cohortProgress.percentage}% → Grad</span>
          </div>
        </div>

        {subscription !== 'free' && subscriptionDaysLeft && (
          <Badge variant={subscriptionBadgeVariant} className="mt-2">
            {subscription} - {subscriptionDaysLeft} days left
          </Badge>
        )}
      </div>

      <div className="flex-shrink-0 w-24 h-24 relative" aria-label={`Readiness gauge showing ${readiness.score} percent`}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            data={gaugeData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={gaugeData[0].fill}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <span className="text-lg font-bold text-white">{readiness.score}</span>
        </div>
      </div>
    </Card>
  )
})

