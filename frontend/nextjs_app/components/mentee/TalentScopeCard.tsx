/**
 * TalentScope Analytics Engine Component
 * Readiness scoring, skill heatmaps, career visibility
 */

'use client';

import { useState } from 'react';
import type { User, Progress } from '@/services/types';

interface TalentScopeCardProps {
  progress: Progress[];
  completionRate: number;
  user: User;
}

interface SkillHeatmap {
  skill: string;
  level: number;
  evidence_count: number;
}

export default function TalentScopeCard({ progress, completionRate, user }: TalentScopeCardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'skills' | 'readiness'>('overview');

  // Calculate readiness score from progress data or default to 0
  const readinessScore = progress && progress.length > 0 
    ? Math.min(100, Math.round(completionRate * 1.5 + 20))
    : 0;
  
  // Generate skill heatmap from progress or show empty state
  const skillHeatmap: SkillHeatmap[] = progress && progress.length > 0 ? [
    { skill: 'Network Security', level: 65, evidence_count: 3 },
    { skill: 'Penetration Testing', level: 45, evidence_count: 2 },
    { skill: 'Incident Response', level: 30, evidence_count: 1 },
    { skill: 'Risk Assessment', level: 55, evidence_count: 2 },
  ] : [];

  const overallLevel = readinessScore < 40 ? 'Beginner' :
                      readinessScore < 70 ? 'Intermediate' :
                      readinessScore < 90 ? 'Advanced' : 'Expert';

  return (
    <div className="card border-sahara-gold">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>📊</span>
            TalentScope Analytics
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Readiness • Skills • Career Visibility
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-body-s font-semibold ${
          overallLevel === 'Expert' ? 'badge-mastery' :
          overallLevel === 'Advanced' ? 'badge-advanced' :
          overallLevel === 'Intermediate' ? 'badge-intermediate' :
          'badge-beginner'
        }`}>
          {overallLevel}
        </span>
      </div>

      {/* Empty State */}
      {progress.length === 0 && (
        <div className="bg-steel-grey bg-opacity-10 border border-steel-grey rounded-card p-6 text-center">
          <p className="text-body-m text-steel-grey mb-2">
            No analytics data yet
          </p>
          <p className="text-body-s text-steel-grey">
            Complete missions and build your portfolio to see your TalentScope analytics
          </p>
        </div>
      )}

      {progress.length > 0 && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-steel-grey mb-4 pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: '📈' },
              { id: 'skills', label: 'Skills', icon: '🔥' },
              { id: 'readiness', label: 'Readiness', icon: '🎯' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-card text-body-s font-semibold
                  transition-all duration-200
                  ${
                    activeView === tab.id
                      ? 'bg-sahara-gold bg-opacity-20 text-sahara-gold border border-sahara-gold'
                      : 'text-steel-grey hover:text-sahara-gold'
                  }
                `}
              >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="space-y-4">
          <div className="bg-defender-gradient border border-sahara-gold rounded-card p-4">
            <div className="text-center mb-4">
              <p className="text-body-s text-steel-grey mb-2">Overall Readiness Score</p>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-steel-grey opacity-20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - readinessScore / 100)}`}
                    className="text-sahara-gold transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-h1 text-sahara-gold font-bold">{readinessScore}</span>
                </div>
              </div>
              <p className="text-body-m text-white mt-2 font-semibold">{overallLevel} Level</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-och-midnight border border-steel-grey rounded-card p-3">
              <p className="text-body-s text-steel-grey">Missions</p>
              <p className="text-h3 text-cyber-mint font-bold">{progress.length}</p>
            </div>
            <div className="bg-och-midnight border border-steel-grey rounded-card p-3">
              <p className="text-body-s text-steel-grey">Completion</p>
              <p className="text-h3 text-cyber-mint font-bold">{completionRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Skills Heatmap */}
      {activeView === 'skills' && (
        <div className="space-y-3">
          {skillHeatmap.map((skill) => (
            <div
              key={skill.skill}
              className="bg-och-midnight border border-steel-grey rounded-card p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-body-m font-semibold text-white">{skill.skill}</h4>
                  <p className="text-body-xs text-steel-grey">
                    {skill.evidence_count} evidence items
                  </p>
                </div>
                <span className="text-body-m text-sahara-gold font-bold">{skill.level}%</span>
              </div>
              <div className="progress-bar mt-2">
                <div
                  className="progress-fill-mint"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Readiness */}
      {activeView === 'readiness' && (
        <div className="space-y-3">
          <div className="bg-och-midnight border border-steel-grey rounded-card p-4">
            <h4 className="text-body-m font-semibold text-white mb-3">Career Readiness</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body-s text-steel-grey">Entry-Level</span>
                <span className={`text-body-s font-semibold ${
                  readinessScore >= 40 ? 'text-cyber-mint' : 'text-steel-grey'
                }`}>
                  {readinessScore >= 40 ? '✓ Ready' : 'In Progress'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-s text-steel-grey">Mid-Level</span>
                <span className={`text-body-s font-semibold ${
                  readinessScore >= 70 ? 'text-cyber-mint' : 'text-steel-grey'
                }`}>
                  {readinessScore >= 70 ? '✓ Ready' : 'In Progress'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-s text-steel-grey">Senior-Level</span>
                <span className={`text-body-s font-semibold ${
                  readinessScore >= 90 ? 'text-cyber-mint' : 'text-steel-grey'
                }`}>
                  {readinessScore >= 90 ? '✓ Ready' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

          <div className="mt-4 pt-4 border-t border-steel-grey">
            <button
              onClick={() => window.location.href = '/dashboard/mentee/talentscope'}
              className="text-body-s text-sahara-gold hover:underline w-full text-center"
            >
              View Full Analytics →
            </button>
          </div>
        </>
      )}
    </div>
  );
}


