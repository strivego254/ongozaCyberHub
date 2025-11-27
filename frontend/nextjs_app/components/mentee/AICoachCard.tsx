/**
 * AI Coach Component
 * Guidance, nudges, learning plans
 * "We guide the transformation" - AI-powered coaching
 */

'use client';

import { useState } from 'react';
import type { RecommendationItem } from '@/services/types';

interface AICoachCardProps {
  recommendations: RecommendationItem[];
  expanded?: boolean;
}

interface Nudge {
  id: string;
  type: 'reminder' | 'encouragement' | 'tip' | 'challenge';
  message: string;
  action?: string;
  timestamp: string;
}

export default function AICoachCard({ recommendations, expanded = false }: AICoachCardProps) {
  const [activeView, setActiveView] = useState<'nudges' | 'recommendations' | 'plans'>('nudges');

  // Mock nudges - replace with API calls
  const nudges: Nudge[] = [
    {
      id: '1',
      type: 'reminder',
      message: "You haven't practiced today. Ready to continue your streak?",
      action: 'Start Practice',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      type: 'encouragement',
      message: 'Great progress on your last mission! Keep it up! 🎉',
      timestamp: '1 day ago',
    },
    {
      id: '3',
      type: 'tip',
      message: 'Try breaking down complex missions into smaller tasks for better focus.',
      timestamp: '2 days ago',
    },
  ];

  return (
    <div className="card border-cyber-mint">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>🤖</span>
            AI Coach
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Guidance • Nudges • Learning Plans
          </p>
        </div>
        <span className="badge-beginner">Active</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-steel-grey mb-4 pb-2">
        {[
          { id: 'nudges', label: 'Nudges', icon: '💬', count: nudges.length },
          { id: 'recommendations', label: 'Recommendations', icon: '💡', count: recommendations.length },
          { id: 'plans', label: 'Learning Plans', icon: '📚', count: 1 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-card text-body-s font-semibold
              transition-all duration-200
              ${
                activeView === tab.id
                  ? 'bg-cyber-mint bg-opacity-20 text-cyber-mint border border-cyber-mint'
                  : 'text-steel-grey hover:text-cyber-mint'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-och-midnight px-2 py-0.5 rounded-full text-body-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Nudges View */}
      {activeView === 'nudges' && (
        <div className="space-y-3">
          {nudges.length > 0 ? (
            nudges.map((nudge) => (
              <div
                key={nudge.id}
                className="bg-och-midnight border border-cyber-mint border-opacity-30 rounded-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {nudge.type === 'reminder' && '⏰'}
                    {nudge.type === 'encouragement' && '🎉'}
                    {nudge.type === 'tip' && '💡'}
                    {nudge.type === 'challenge' && '⚡'}
                  </span>
                  <div className="flex-1">
                    <p className="text-body-m text-white mb-1">{nudge.message}</p>
                    <p className="text-body-xs text-steel-grey">{nudge.timestamp}</p>
                    {nudge.action && (
                      <button className="btn-primary text-body-s px-4 py-2 mt-2">
                        {nudge.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-steel-grey">
              <p className="text-body-m">No nudges at the moment</p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations View */}
      {activeView === 'recommendations' && (
        <div className="space-y-3">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-och-midnight border border-cyber-mint border-opacity-30 rounded-card p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-body-m font-semibold text-white">{rec.title}</h4>
                    {rec.description && (
                      <p className="text-body-s text-steel-grey mt-1">{rec.description}</p>
                    )}
                  </div>
                  <span className="text-body-s text-cyber-mint font-semibold ml-3">
                    {(rec.score * 100).toFixed(0)}%
                  </span>
                </div>
                {rec.reason && (
                  <p className="text-body-s text-cyber-mint mt-2">💡 {rec.reason}</p>
                )}
                <button className="btn-primary text-body-s px-4 py-2 mt-3">
                  Explore
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-steel-grey">
              <p className="text-body-m">No recommendations yet</p>
              <p className="text-body-s mt-2">Complete your profiler to get personalized recommendations</p>
            </div>
          )}
        </div>
      )}

      {/* Learning Plans View */}
      {activeView === 'plans' && (
        <div className="space-y-3">
          <div className="bg-defender-gradient border border-cyber-mint rounded-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-body-m font-semibold text-white mb-1">
                  Your Learning Plan
                </h4>
                <p className="text-body-s text-steel-grey">
                  Personalized based on your profile and goals
                </p>
              </div>
              <span className="badge-beginner">Active</span>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-cyber-mint">✓</span>
                <span className="text-body-s text-white">Complete profiler assessment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyber-mint">✓</span>
                <span className="text-body-s text-white">Start first mission</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-steel-grey">○</span>
                <span className="text-body-s text-steel-grey">Complete 5 missions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-steel-grey">○</span>
                <span className="text-body-s text-steel-grey">Build portfolio with 3 items</span>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/dashboard/mentee/learning-plan'}
              className="btn-secondary w-full mt-4"
            >
              View Full Plan
            </button>
          </div>
        </div>
      )}

      {!expanded && (
        <div className="mt-4 pt-4 border-t border-steel-grey">
          <button
            onClick={() => window.location.href = '/dashboard/mentee/ai-coach'}
            className="text-body-s text-cyber-mint hover:underline w-full text-center"
          >
            Open AI Coach →
          </button>
        </div>
      )}
    </div>
  );
}



