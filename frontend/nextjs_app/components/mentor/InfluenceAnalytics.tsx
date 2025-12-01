'use client'

import { Card } from '@/components/ui/Card'
import { useMentorInfluence } from '@/hooks/useMentorInfluence'
import { useAuth } from '@/hooks/useAuth'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function InfluenceAnalytics() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { influence, isLoading, error } = useMentorInfluence(mentorId)

  return (
    <Card className="mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Influence & Engagement</h2>

      {isLoading && (
        <div className="text-och-steel text-sm">Loading analytics...</div>
      )}

      {error && !isLoading && (
        <div className="text-och-orange text-sm">Error loading analytics: {error}</div>
      )}

      {!isLoading && !error && influence && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-och-steel mb-1">Impact Score</p>
              <p className="text-2xl font-bold text-white">{influence.impact_score}</p>
            </div>
            <div>
              <p className="text-xs text-och-steel mb-1">Sessions Held</p>
              <p className="text-2xl font-bold text-white">{influence.sessions_held}</p>
            </div>
            <div>
              <p className="text-xs text-och-steel mb-1">Mentees Engaged</p>
              <p className="text-2xl font-bold text-white">{influence.mentees_engaged}</p>
            </div>
            <div>
              <p className="text-xs text-och-steel mb-1">Feedback Count</p>
              <p className="text-2xl font-bold text-white">{influence.feedback_count}</p>
            </div>
          </div>

          {influence.history.length > 0 && (
            <div>
              <p className="text-xs text-och-steel mb-2">Recent Trend (Impact Score)</p>
              <div className="space-y-2">
                {influence.history.slice(-5).map((h) => (
                  <div key={h.date}>
                    <div className="flex justify-between text-[11px] text-och-steel mb-1">
                      <span>{new Date(h.date).toLocaleDateString()}</span>
                      <span>{h.impact_score}</span>
                    </div>
                    <ProgressBar
                      value={h.impact_score}
                      variant={h.impact_score >= 70 ? 'mint' : h.impact_score >= 40 ? 'gold' : 'orange'}
                      showLabel={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}


