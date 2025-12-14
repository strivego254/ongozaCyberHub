'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'
import { programsClient } from '@/services/programsClient'
import { djangoClient } from '@/services/djangoClient'
import Link from 'next/link'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

interface MissionAnalytics {
  mission: MissionTemplate
  total_submissions: number
  submissions_by_status: Record<string, number>
  average_ai_score: number
  average_mentor_score: number
  approval_rate: number
  submissions: Array<{
    id: string
    user_id: number
    user_email: string
    user_name: string
    status: string
    ai_score?: number
    mentor_score?: number
    mentor_feedback?: string
    submitted_at?: string
    mentor_reviewed_at?: string
    cohort_id?: string
    cohort_name?: string
    mentor_id?: string
    mentor_name?: string
  }>
  cohorts: Array<{
    id: string
    name: string
    submissions_count: number
    average_score: number
  }>
  mentors: Array<{
    id: string
    name: string
    email: string
    reviews_count: number
    average_score: number
  }>
  performance_over_time: Array<{
    date: string
    submissions: number
    approvals: number
    average_score: number
  }>
}

const COLORS = ['#33FFC1', '#FFB020', '#FF6B35', '#00D4FF', '#8B5CF6']

export default function MissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const missionId = params.id as string

  const [analytics, setAnalytics] = useState<MissionAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMissionAnalytics()
  }, [missionId])

  const loadMissionAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch mission details
      const mission = await missionsClient.getMission(missionId)
      
      // Fetch submissions
      const submissionsResponse = await missionsClient.getMissionSubmissions?.(missionId) || 
        await fetch(`/api/v1/missions/${missionId}/submissions/`).then(r => r.json()).catch(() => ({ submissions: [] }))
      
      const submissions = submissionsResponse.submissions || []

      // Enrich submissions with user data
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (sub: any) => {
          try {
            // Get user details
            const user = await djangoClient.users.getUser(sub.user_id).catch(() => null)
            
            return {
              ...sub,
              user_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : sub.user_email,
              cohort_id: sub.cohort_id || null,
              cohort_name: sub.cohort_name || null,
              mentor_id: sub.mentor_id || null,
              mentor_name: sub.mentor_name || null,
            }
          } catch (err) {
            return {
              ...sub,
              user_name: sub.user_email,
            }
          }
        })
      )

      // Calculate statistics
      const totalSubmissions = enrichedSubmissions.length
      const submissionsByStatus: Record<string, number> = {}
      let totalAiScore = 0
      let aiScoreCount = 0
      let totalMentorScore = 0
      let mentorScoreCount = 0
      let approvedCount = 0

      enrichedSubmissions.forEach((sub: any) => {
        submissionsByStatus[sub.status] = (submissionsByStatus[sub.status] || 0) + 1
        if (sub.ai_score !== null && sub.ai_score !== undefined) {
          totalAiScore += sub.ai_score
          aiScoreCount++
        }
        if (sub.mentor_score !== null && sub.mentor_score !== undefined) {
          totalMentorScore += sub.mentor_score
          mentorScoreCount++
        }
        if (sub.status === 'approved') {
          approvedCount++
        }
      })

      const averageAiScore = aiScoreCount > 0 ? totalAiScore / aiScoreCount : 0
      const averageMentorScore = mentorScoreCount > 0 ? totalMentorScore / mentorScoreCount : 0
      const approvalRate = totalSubmissions > 0 ? (approvedCount / totalSubmissions) * 100 : 0

      // Group by cohorts
      const cohortMap = new Map<string, { id: string; name: string; submissions: any[] }>()
      enrichedSubmissions.forEach((sub: any) => {
        if (sub.cohort_id) {
          if (!cohortMap.has(sub.cohort_id)) {
            cohortMap.set(sub.cohort_id, {
              id: sub.cohort_id,
              name: sub.cohort_name || 'Unknown Cohort',
              submissions: [],
            })
          }
          cohortMap.get(sub.cohort_id)!.submissions.push(sub)
        }
      })

      const cohorts = Array.from(cohortMap.values()).map(cohort => {
        const scores = cohort.submissions
          .filter(s => s.ai_score !== null && s.ai_score !== undefined)
          .map(s => s.ai_score)
        const averageScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0
        return {
          id: cohort.id,
          name: cohort.name,
          submissions_count: cohort.submissions.length,
          average_score: averageScore,
        }
      })

      // Group by mentors
      const mentorMap = new Map<string, { id: string; name: string; email: string; reviews: any[] }>()
      enrichedSubmissions
        .filter(sub => sub.mentor_id && sub.mentor_score !== null && sub.mentor_score !== undefined)
        .forEach((sub: any) => {
          if (!mentorMap.has(sub.mentor_id)) {
            mentorMap.set(sub.mentor_id, {
              id: sub.mentor_id,
              name: sub.mentor_name || 'Unknown Mentor',
              email: '',
              reviews: [],
            })
          }
          mentorMap.get(sub.mentor_id)!.reviews.push(sub)
        })

      const mentors = Array.from(mentorMap.values()).map(mentor => {
        const scores = mentor.reviews.map(r => r.mentor_score)
        const averageScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0
        return {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          reviews_count: mentor.reviews.length,
          average_score: averageScore,
        }
      })

      // Performance over time (group by date)
      const dateMap = new Map<string, { submissions: number; approvals: number; scores: number[] }>()
      enrichedSubmissions.forEach((sub: any) => {
        if (sub.submitted_at) {
          const date = new Date(sub.submitted_at).toISOString().split('T')[0]
          if (!dateMap.has(date)) {
            dateMap.set(date, { submissions: 0, approvals: 0, scores: [] })
          }
          const dayData = dateMap.get(date)!
          dayData.submissions++
          if (sub.status === 'approved') {
            dayData.approvals++
          }
          if (sub.ai_score !== null && sub.ai_score !== undefined) {
            dayData.scores.push(sub.ai_score)
          }
        }
      })

      const performanceOverTime = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          submissions: data.submissions,
          approvals: data.approvals,
          average_score: data.scores.length > 0
            ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
            : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setAnalytics({
        mission,
        total_submissions: totalSubmissions,
        submissions_by_status: submissionsByStatus,
        average_ai_score: averageAiScore,
        average_mentor_score: averageMentorScore,
        approval_rate: approvalRate,
        submissions: enrichedSubmissions,
        cohorts,
        mentors,
        performance_over_time: performanceOverTime,
      })
    } catch (err: any) {
      console.error('Failed to load mission analytics:', err)
      setError(err?.response?.data?.detail || err?.message || 'Failed to load mission analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'mint'
      case 'intermediate': return 'gold'
      case 'advanced': return 'orange'
      case 'capstone': return 'defender'
      default: return 'steel'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lab': return 'mint'
      case 'scenario': return 'defender'
      case 'project': return 'gold'
      case 'capstone': return 'orange'
      default: return 'steel'
    }
  }

  const statusChartData = analytics
    ? Object.entries(analytics.submissions_by_status).map(([name, value]) => ({ name, value }))
    : []

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                <p className="text-och-steel">Loading mission analytics...</p>
              </div>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error || !analytics) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error || 'Mission not found'}</p>
              <Link href="/dashboard/director/curriculum/missions">
                <Button variant="outline">Back to Missions</Button>
              </Link>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard/director/curriculum/missions">
              <Button variant="outline" className="mb-4">
                <ArrowLeftIcon />
                <span className="ml-2">Back to Missions</span>
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-och-gold">{analytics.mission.code}</h1>
              <Badge variant={getDifficultyColor(analytics.mission.difficulty)}>
                {analytics.mission.difficulty}
              </Badge>
              <Badge variant={getTypeColor(analytics.mission.type)}>
                {analytics.mission.type}
              </Badge>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">{analytics.mission.title}</h2>
            {analytics.mission.description && (
              <p className="text-och-steel">{analytics.mission.description}</p>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-6">
                <p className="text-och-steel text-sm mb-1">Total Submissions</p>
                <p className="text-3xl font-bold text-white">{analytics.total_submissions}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-och-steel text-sm mb-1">Avg. AI Score</p>
                <p className="text-3xl font-bold text-white">
                  {analytics.average_ai_score.toFixed(1)}%
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-och-steel text-sm mb-1">Avg. Mentor Score</p>
                <p className="text-3xl font-bold text-white">
                  {analytics.average_mentor_score.toFixed(1)}%
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-och-steel text-sm mb-1">Approval Rate</p>
                <p className="text-3xl font-bold text-white">
                  {analytics.approval_rate.toFixed(1)}%
                </p>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status Distribution */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Submission Status</h3>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-och-steel text-center py-12">No submission data available</p>
                )}
              </div>
            </Card>

            {/* Performance Over Time */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Performance Over Time</h3>
                {analytics.performance_over_time.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.performance_over_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748B"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Area
                        type="monotone"
                        dataKey="average_score"
                        stroke="#33FFC1"
                        fill="#33FFC1"
                        fillOpacity={0.3}
                        name="Avg Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-och-steel text-center py-12">No performance data available</p>
                )}
              </div>
            </Card>
          </div>

          {/* Cohorts and Mentors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Cohorts */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <UsersIcon />
                  Cohorts ({analytics.cohorts.length})
                </h3>
                {analytics.cohorts.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.cohorts.map((cohort) => (
                      <div
                        key={cohort.id}
                        className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{cohort.name}</h4>
                          <Badge variant="mint">{cohort.submissions_count} submissions</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-och-steel">Avg Score:</span>
                          <span className="text-white font-medium">
                            {cohort.average_score.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-och-steel">No cohort data available</p>
                )}
              </div>
            </Card>

            {/* Mentors */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Mentor Reviews ({analytics.mentors.length})</h3>
                {analytics.mentors.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.mentors.map((mentor) => (
                      <div
                        key={mentor.id}
                        className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{mentor.name}</h4>
                          <Badge variant="defender">{mentor.reviews_count} reviews</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-och-steel">Avg Score:</span>
                          <span className="text-white font-medium">
                            {mentor.average_score.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-och-steel">No mentor review data available</p>
                )}
              </div>
            </Card>
          </div>

          {/* Submissions List */}
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Submissions ({analytics.submissions.length})
              </h3>
              {analytics.submissions.length > 0 ? (
                <div className="space-y-3">
                  {analytics.submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{submission.user_name}</h4>
                          <p className="text-sm text-och-steel">{submission.user_email}</p>
                          {submission.cohort_name && (
                            <p className="text-xs text-och-steel mt-1">Cohort: {submission.cohort_name}</p>
                          )}
                        </div>
                        <Badge
                          variant={
                            submission.status === 'approved' ? 'mint' :
                            submission.status === 'failed' ? 'orange' :
                            'steel'
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        {submission.ai_score !== null && submission.ai_score !== undefined && (
                          <div>
                            <span className="text-och-steel">AI Score:</span>
                            <span className="text-white font-medium ml-2">
                              {submission.ai_score.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {submission.mentor_score !== null && submission.mentor_score !== undefined && (
                          <div>
                            <span className="text-och-steel">Mentor Score:</span>
                            <span className="text-white font-medium ml-2">
                              {submission.mentor_score.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {submission.submitted_at && (
                          <div>
                            <span className="text-och-steel">Submitted:</span>
                            <span className="text-white font-medium ml-2">
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {submission.mentor_name && (
                          <div>
                            <span className="text-och-steel">Mentor:</span>
                            <span className="text-white font-medium ml-2">
                              {submission.mentor_name}
                            </span>
                          </div>
                        )}
                      </div>
                      {submission.mentor_feedback && (
                        <div className="mt-3 pt-3 border-t border-och-steel/20">
                          <p className="text-xs text-och-steel mb-1">Mentor Feedback:</p>
                          <p className="text-sm text-white">{submission.mentor_feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-och-steel">No submissions yet</p>
              )}
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
