'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useTalentScopeView } from '@/hooks/useTalentScopeView'
import { useAuth } from '@/hooks/useAuth'
import { useMentorMentees } from '@/hooks/useMentorMentees'

export function TalentScopeView() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { mentees } = useMentorMentees(mentorId)
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | undefined>(mentees[0]?.id)
  const { view, isLoading, error } = useTalentScopeView(mentorId, selectedMenteeId)

  if (!mentorId) return null

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">TalentScope Mentor View</h2>
        <p className="text-sm text-och-steel">
          Visualize mentee performance data and behavioral trends.
        </p>
      </div>

      {mentees.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-2">Select Mentee</label>
          <select
            value={selectedMenteeId || ''}
            onChange={(e) => setSelectedMenteeId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            {mentees.map((mentee) => (
              <option key={mentee.id} value={mentee.id}>
                {mentee.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading && <div className="text-och-steel text-sm">Loading TalentScope data...</div>}
      {error && <div className="text-och-orange text-sm">Error: {error}</div>}

      {!isLoading && !error && view && (
        <div className="space-y-6">
          {/* Ingested Signals */}
          <div className="p-4 bg-och-midnight/50 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Ingested Signals</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-och-steel">Mentor Evaluations:</span>
                <span className="text-white ml-2">{view.ingested_signals.mentor_evaluations}</span>
              </div>
              <div>
                <span className="text-och-steel">Habit Logs:</span>
                <span className="text-white ml-2">{view.ingested_signals.habit_logs}</span>
              </div>
              <div>
                <span className="text-och-steel">Mission Scores:</span>
                <span className="text-white ml-2">{view.ingested_signals.mission_scores}</span>
              </div>
              <div>
                <span className="text-och-steel">Community Engagement:</span>
                <span className="text-white ml-2">{view.ingested_signals.community_engagement}</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-och-steel text-sm">Reflection Sentiment:</span>
              <div className="flex gap-4 mt-1 text-xs">
                <span className="text-och-mint">Positive: {view.ingested_signals.reflection_sentiment.positive}</span>
                <span className="text-och-steel">Neutral: {view.ingested_signals.reflection_sentiment.neutral}</span>
                <span className="text-och-orange">Negative: {view.ingested_signals.reflection_sentiment.negative}</span>
              </div>
            </div>
          </div>

          {/* Skills Heatmap */}
          <div className="p-4 bg-och-midnight/50 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Skills Heatmap</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(view.skills_heatmap).map(([skill, score]) => (
                <div key={skill} className="flex justify-between items-center">
                  <span className="text-och-steel capitalize">{skill.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-och-midnight rounded-full overflow-hidden">
                      <div
                        className="h-full bg-och-mint"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-white w-8 text-right">{score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Trends */}
          <div className="p-4 bg-och-midnight/50 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Behavioral Trends</h3>
            <div className="space-y-2 text-xs">
              {view.behavioral_trends.slice(-5).map((trend, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-och-steel">{new Date(trend.date).toLocaleDateString()}</span>
                  <div className="flex gap-4">
                    <span className="text-och-mint">Eng: {trend.engagement}</span>
                    <span className="text-och-gold">Perf: {trend.performance}</span>
                    <span className="text-och-defender">Sent: {trend.sentiment}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Readiness Over Time */}
          <div className="p-4 bg-och-midnight/50 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Readiness Over Time</h3>
            <div className="space-y-2 text-xs">
              {view.readiness_over_time.slice(-5).map((point, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-och-steel">{new Date(point.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-och-midnight rounded-full overflow-hidden">
                      <div
                        className="h-full bg-och-mint"
                        style={{ width: `${point.score}%` }}
                      />
                    </div>
                    <span className="text-white w-10 text-right">{point.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && !view && (
        <div className="text-och-steel text-sm">Select a mentee to view TalentScope data.</div>
      )}
    </Card>
  )
}


