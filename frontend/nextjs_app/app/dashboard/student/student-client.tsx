'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useProgress } from '@/hooks/useProgress'
import { useAuth } from '@/hooks/useAuth'

export default function StudentClient() {
  const { user, isLoading: authLoading } = useAuth()
  // Only fetch progress if user is loaded and has an ID
  const { progress, isLoading: progressLoading, error: progressError } = useProgress(
    user && !authLoading ? user.id : undefined
  )

  // Calculate KPIs from progress data
  const completedCourses = progress.filter(p => p.status === 'completed').length
  const inProgressCourses = progress.filter(p => p.status === 'in_progress').length
  const totalProgress = progress.reduce((sum, p) => sum + p.completion_percentage, 0)
  const avgProgress = progress.length > 0 ? Math.round(totalProgress / progress.length) : 0
  const learningHours = Math.round(progress.reduce((sum, p) => {
    if (p.metadata?.hours) return sum + p.metadata.hours
    return sum
  }, 0))

  const kpis = [
    { label: 'Active Courses', value: inProgressCourses.toString(), change: `+${inProgressCourses}` },
    { label: 'Completed Courses', value: completedCourses.toString(), change: `+${completedCourses}` },
    { label: 'Learning Hours', value: learningHours.toString(), change: `+${learningHours}` },
    { label: 'Avg Progress', value: `${avgProgress}%`, change: `${avgProgress}%` },
  ]

  const actions = [
    { label: 'Complete Profiler', href: '/dashboard/student/coaching', icon: '📋' },
    { label: 'Future-You Projection', href: '/dashboard/student/coaching', icon: '🔮' },
    { label: 'Coaching OS', href: '/dashboard/student/coaching', icon: '🎯' },
    { label: 'Missions', href: '/dashboard/student/missions', icon: '🚀' },
    { label: 'Portfolio', href: '/dashboard/student/portfolio', icon: '💼' },
    { label: 'Curriculum', href: '/dashboard/student/curriculum', icon: '📚' },
    { label: 'Community', href: '/dashboard/student/community', icon: '💬' },
    { label: 'Mentorship', href: '/dashboard/student/mentorship', icon: '👥' },
  ]

  // Transform progress data for display
  const displayProgress = progress.slice(0, 3).map(p => ({
    title: p.content_type || p.content_id || 'Course',
    progress: p.completion_percentage,
    color: p.status === 'completed' ? 'mint' : p.status === 'in_progress' ? 'defender' : 'steel',
  }))

  // Show loading state
  if (authLoading || progressLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-och-steel">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Dashboard</h1>
          <p className="text-och-steel">
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''}! Here's your learning overview.
          </p>
        </div>

        {progressError && (
          <div className="mb-6 p-4 bg-och-orange/20 border border-och-orange rounded-lg text-och-orange">
            {progressError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
            <Card key={kpi.label} gradient="defender">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-och-steel text-sm mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                </div>
                <Badge variant="mint">{kpi.change}</Badge>
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
            <h2 className="text-2xl font-bold mb-4 text-white">Learning Progress</h2>
            {progressLoading ? (
              <div className="text-och-steel text-sm">Loading progress...</div>
            ) : progress.length === 0 ? (
              <div className="text-och-steel text-sm">
                <p className="mb-2">No progress data available yet.</p>
                <p className="text-xs">Start a course to track your progress here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayProgress.map((item, idx) => (
                  <div key={`${item.title}-${idx}`}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-och-steel">{item.title}</span>
                      <span className="text-sm text-och-steel">{item.progress}%</span>
                    </div>
                    <ProgressBar value={item.progress} variant={item.color as any} showLabel={false} />
                  </div>
                ))}
                {progress.length > 3 && (
                  <Link href="/dashboard/analytics" className="text-sm text-och-mint hover:underline">
                    View all progress →
                  </Link>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Recent Activity</h2>
            {progress.length > 0 ? (
              <div className="space-y-3">
                {progress
                  .filter(p => p.status === 'completed' || p.status === 'in_progress')
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        p.status === 'completed' ? 'bg-och-mint' : 'bg-och-defender'
                      }`}></div>
                      <span className="text-och-steel">
                        {p.status === 'completed' ? 'Completed' : 'In Progress'}: {p.content_type || p.content_id}
                        {p.completion_percentage > 0 && ` (${p.completion_percentage}%)`}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-och-steel text-sm">No recent activity</div>
            )}
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Upcoming Events</h2>
            <div className="space-y-3">
              {['Mentor Session - Tomorrow', 'Course Deadline - 3 days', 'Workshop - Next week'].map((event) => (
                <div key={event} className="flex items-center gap-3 p-3 bg-och-midnight/50 rounded-lg">
                  <div className="w-2 h-2 bg-och-gold rounded-full"></div>
                  <span className="text-och-steel">{event}</span>
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

