'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { useTalentScopeView } from '@/hooks/useTalentScopeView'
import { useAuth } from '@/hooks/useAuth'
import { useMentorMentees } from '@/hooks/useMentorMentees'
import { mentorClient } from '@/services/mentorClient'
import type { AssignedMentee } from '@/services/types/mentor'
import { ProgressBar } from '@/components/ui/ProgressBar'

export default function MenteeAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const menteeId = params.menteeId as string
  
  const { mentees } = useMentorMentees(mentorId)
  const { view, isLoading, error } = useTalentScopeView(mentorId, menteeId)
  const [mentee, setMentee] = useState<AssignedMentee | null>(null)

  useEffect(() => {
    if (mentees.length > 0 && menteeId) {
      const found = mentees.find(m => m.id === menteeId)
      setMentee(found || null)
    }
  }, [mentees, menteeId])

  if (!mentorId) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="text-och-steel">Please log in to view analytics.</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-och-mint hover:text-och-defender mb-4 flex items-center gap-2 text-sm"
        >
          <span>←</span> Back to Analytics
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-mint">
              {mentee?.name || 'Mentee Analytics'}
            </h1>
            <p className="text-och-steel text-sm">
              {mentee?.cohort && <span>Cohort: {mentee.cohort} • </span>}
              {mentee?.track && <span>Track: {mentee.track} • </span>}
              Comprehensive TalentScope analytics and performance metrics
            </p>
          </div>
          {mentee?.avatar_url && (
            <img
              src={mentee.avatar_url}
              alt={mentee.name}
              className="w-16 h-16 rounded-full border-2 border-och-mint/20"
            />
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-och-steel text-sm py-8 text-center">Loading analytics...</div>
      )}

      {error && (
        <Card>
          <div className="p-6">
            <div className="text-och-orange text-sm">Error: {error}</div>
            <button
              onClick={() => router.push('/dashboard/mentor/analytics')}
              className="mt-4 text-och-mint hover:text-och-defender text-sm"
            >
              Return to Analytics Dashboard
            </button>
          </div>
        </Card>
      )}

      {!isLoading && !error && view && (
        <div className="space-y-6">
          {/* Core Readiness Score - Prominent Display */}
          {view.core_readiness_score !== undefined && (
            <Card>
              <div className="p-6 bg-gradient-to-r from-och-midnight to-och-midnight/80 rounded-lg border border-och-mint/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-och-steel mb-1">Core Readiness Score</h3>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-white">{view.core_readiness_score.toFixed(1)}%</span>
                      {view.career_readiness_stage && (
                        <span className="text-sm text-och-mint capitalize px-2 py-1 bg-och-mint/10 rounded">
                          {view.career_readiness_stage}
                        </span>
                      )}
                    </div>
                  </div>
                  {view.learning_velocity && (
                    <div className="text-right">
                      <div className="text-xs text-och-steel">Learning Velocity</div>
                      <div className="text-lg font-semibold text-white">{view.learning_velocity.toFixed(1)} pts/mo</div>
                    </div>
                  )}
                </div>
                <ProgressBar
                  value={view.core_readiness_score}
                  variant={view.core_readiness_score >= 80 ? 'mint' : view.core_readiness_score >= 60 ? 'defender' : view.core_readiness_score >= 40 ? 'gold' : 'orange'}
                  className="mt-2"
                />
                {view.estimated_readiness_window && (
                  <div className="mt-3 text-xs text-och-steel">
                    Estimated Readiness Window: <span className="text-white">{view.estimated_readiness_window}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Readiness Breakdown */}
          {view.readiness_breakdown && Object.keys(view.readiness_breakdown).length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Readiness Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(view.readiness_breakdown).map(([category, score]) => (
                    <div key={category} className="p-3 bg-och-midnight rounded border border-och-steel/20">
                      <div className="text-xs text-och-steel mb-1 capitalize">{category}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-och-midnight rounded-full overflow-hidden">
                          <div
                            className="h-full bg-och-mint"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white w-12 text-right">{score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Gap Analysis */}
          {view.gap_analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              {view.gap_analysis.strengths && view.gap_analysis.strengths.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-och-mint mb-2">Strengths</h3>
                    <ul className="space-y-1">
                      {view.gap_analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="text-xs text-white flex items-start gap-2">
                          <span className="text-och-mint mt-0.5">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              {/* Weaknesses */}
              {view.gap_analysis.weaknesses && view.gap_analysis.weaknesses.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-och-orange mb-2">Areas for Improvement</h3>
                    <ul className="space-y-1">
                      {view.gap_analysis.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-xs text-white flex items-start gap-2">
                          <span className="text-och-orange mt-0.5">⚠</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              {/* Missing Skills */}
              {view.gap_analysis.missing_skills && view.gap_analysis.missing_skills.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-och-gold mb-2">Missing Skills</h3>
                    <ul className="space-y-1">
                      {view.gap_analysis.missing_skills.map((skill, idx) => (
                        <li key={idx} className="text-xs text-white flex items-start gap-2">
                          <span className="text-och-gold mt-0.5">○</span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              {/* Improvement Plan */}
              {view.gap_analysis.improvement_plan && view.gap_analysis.improvement_plan.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-och-defender mb-2">Improvement Plan</h3>
                    <ul className="space-y-1">
                      {view.gap_analysis.improvement_plan.map((item, idx) => (
                        <li key={idx} className="text-xs text-white flex items-start gap-2">
                          <span className="text-och-defender mt-0.5">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Professional Tier Data */}
          {view.professional_tier_data && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-white">Professional Tier Analytics</h3>
                  <span className="text-xs px-2 py-0.5 bg-och-gold/20 text-och-gold rounded">Premium</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {view.professional_tier_data.job_fit_score !== undefined && (
                    <div>
                      <div className="text-xs text-och-steel mb-1">Job Fit Score</div>
                      <div className="text-2xl font-bold text-white">{view.professional_tier_data.job_fit_score.toFixed(1)}%</div>
                      <div className="w-full h-2 bg-och-midnight rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-och-gold"
                          style={{ width: `${view.professional_tier_data.job_fit_score}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {view.professional_tier_data.hiring_timeline_prediction && (
                    <div>
                      <div className="text-xs text-och-steel mb-1">Hiring Timeline Prediction</div>
                      <div className="text-lg font-semibold text-white">{view.professional_tier_data.hiring_timeline_prediction}</div>
                    </div>
                  )}
                </div>
                {view.professional_tier_data.track_benchmarks && Object.keys(view.professional_tier_data.track_benchmarks).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-och-steel/20">
                    <div className="text-xs text-och-steel mb-2">Track Benchmarks</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(view.professional_tier_data.track_benchmarks).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-och-steel capitalize">{key.replace('_', ' ')}:</span>
                          <span className="text-white">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Ingested Signals */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Ingested Signals</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-och-midnight rounded border border-och-steel/20">
                  <div className="text-xs text-och-steel mb-1">Mentor Evaluations</div>
                  <div className="text-xl font-bold text-white">{view.ingested_signals.mentor_evaluations}</div>
                </div>
                <div className="p-3 bg-och-midnight rounded border border-och-steel/20">
                  <div className="text-xs text-och-steel mb-1">Habit Logs</div>
                  <div className="text-xl font-bold text-white">{view.ingested_signals.habit_logs}</div>
                </div>
                <div className="p-3 bg-och-midnight rounded border border-och-steel/20">
                  <div className="text-xs text-och-steel mb-1">Mission Scores</div>
                  <div className="text-xl font-bold text-white">{view.ingested_signals.mission_scores}</div>
                </div>
                <div className="p-3 bg-och-midnight rounded border border-och-steel/20">
                  <div className="text-xs text-och-steel mb-1">Community Engagement</div>
                  <div className="text-xl font-bold text-white">{view.ingested_signals.community_engagement}</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-och-midnight rounded border border-och-steel/20">
                <span className="text-xs text-och-steel mb-2 block">Reflection Sentiment</span>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-och-mint rounded"></div>
                    <span className="text-white">Positive: {view.ingested_signals.reflection_sentiment.positive}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-och-steel rounded"></div>
                    <span className="text-white">Neutral: {view.ingested_signals.reflection_sentiment.neutral}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-och-orange rounded"></div>
                    <span className="text-white">Negative: {view.ingested_signals.reflection_sentiment.negative}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Skills Heatmap */}
          {Object.keys(view.skills_heatmap).length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Skills Heatmap</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(view.skills_heatmap)
                    .sort(([, a], [, b]) => b - a)
                    .map(([skill, score]) => (
                      <div key={skill} className="p-2 bg-och-midnight rounded border border-och-steel/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-white capitalize">{skill.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-semibold text-och-mint">{score.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-och-midnight rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              score >= 80 ? 'bg-och-mint' : 
                              score >= 60 ? 'bg-och-defender' : 
                              score >= 40 ? 'bg-och-gold' : 'bg-och-orange'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          )}

          {/* Behavioral Trends */}
          {view.behavioral_trends && view.behavioral_trends.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Behavioral Trends (Last 30 Days)</h3>
                <div className="space-y-2">
                  {view.behavioral_trends.slice(-7).map((trend, index) => (
                    <div key={index} className="p-2 bg-och-midnight rounded border border-och-steel/20">
                      <div className="text-xs text-och-steel mb-2">{new Date(trend.date).toLocaleDateString()}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-och-steel mb-1">Engagement</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-och-midnight rounded-full overflow-hidden">
                              <div className="h-full bg-och-mint" style={{ width: `${trend.engagement}%` }} />
                            </div>
                            <span className="text-white w-8 text-right">{trend.engagement.toFixed(0)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-och-steel mb-1">Performance</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-och-midnight rounded-full overflow-hidden">
                              <div className="h-full bg-och-gold" style={{ width: `${trend.performance}%` }} />
                            </div>
                            <span className="text-white w-8 text-right">{trend.performance.toFixed(0)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-och-steel mb-1">Sentiment</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-och-midnight rounded-full overflow-hidden">
                              <div className="h-full bg-och-defender" style={{ width: `${trend.sentiment * 100}%` }} />
                            </div>
                            <span className="text-white w-8 text-right">{(trend.sentiment * 100).toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Readiness Over Time */}
          {view.readiness_over_time && view.readiness_over_time.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Readiness Over Time</h3>
                <div className="space-y-2">
                  {view.readiness_over_time.slice(-10).map((point, index) => {
                    const score = typeof point.score === 'number' ? point.score : parseFloat(point.score)
                    return (
                      <div key={index} className="p-2 bg-och-midnight rounded border border-och-steel/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-och-steel">{new Date(point.date).toLocaleDateString()}</span>
                          <span className="text-sm font-semibold text-white">{score.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-och-midnight rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              score >= 80 ? 'bg-och-mint' : 
                              score >= 60 ? 'bg-och-defender' : 
                              score >= 40 ? 'bg-och-gold' : 'bg-och-orange'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {!isLoading && !error && !view && (
        <Card>
          <div className="p-6">
            <div className="text-och-steel text-sm">No analytics data available for this mentee.</div>
            <button
              onClick={() => router.push('/dashboard/mentor/analytics')}
              className="mt-4 text-och-mint hover:text-och-defender text-sm"
            >
              Return to Analytics Dashboard
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}


