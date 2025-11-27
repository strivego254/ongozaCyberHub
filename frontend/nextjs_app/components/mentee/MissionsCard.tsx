/**
 * Missions/MXP Component
 * Missions Execution Platform
 * "Mentees do the work" - they submit missions, build evidence
 */

'use client';

import { useState } from 'react';
import type { Progress } from '@/services/types';

interface MissionsCardProps {
  progress: Progress[];
  progressCount: number;
  showAll?: boolean;
}

export default function MissionsCard({ progress, progressCount, showAll = false }: MissionsCardProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  const safeProgress = progress || [];
  
  const filteredProgress = safeProgress.filter((p: Progress) => {
    if (filter === 'all') return true;
    if (filter === 'active') return p.status === 'in_progress';
    if (filter === 'completed') return p.status === 'completed';
    if (filter === 'pending') return p.status === 'pending';
    return true;
  });

  const activeMissions = safeProgress.filter((p: Progress) => p.status === 'in_progress');
  const completedMissions = safeProgress.filter((p: Progress) => p.status === 'completed');

  return (
    <div className="card border-defender-blue">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>🎯</span>
            Missions / MXP
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Missions Execution Platform • Build Evidence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-body-s text-steel-grey">Active</p>
            <p className="text-h3 text-defender-blue font-bold">{activeMissions.length}</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {safeProgress.length === 0 && (
        <div className="bg-steel-grey bg-opacity-10 border border-steel-grey rounded-card p-6 text-center">
          <p className="text-body-m text-steel-grey mb-2">
            No missions yet
          </p>
          <p className="text-body-s text-steel-grey">
            Start your journey by exploring available missions
          </p>
        </div>
      )}

      {safeProgress.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex gap-2 mb-4 pb-2 border-b border-steel-grey">
            {[
              { id: 'all', label: 'All', count: safeProgress.length },
              { id: 'active', label: 'Active', count: activeMissions.length },
              { id: 'completed', label: 'Completed', count: completedMissions.length },
              { id: 'pending', label: 'Pending', count: 0 },
            ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`
              px-3 py-1.5 rounded-card text-body-s font-semibold
              transition-all duration-200
              ${
                filter === f.id
                  ? 'bg-defender-blue text-white'
                  : 'text-steel-grey hover:text-defender-blue hover:bg-defender-blue hover:bg-opacity-10'
              }
            `}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Missions List */}
      <div className="space-y-3">
        {filteredProgress.length > 0 ? (
          filteredProgress.map((mission: Progress) => (
            <div
              key={mission.id}
              className="bg-och-midnight border border-defender-blue border-opacity-30 rounded-card p-4 hover:border-defender-blue transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-body-m font-semibold text-white mb-1">
                    {mission.content_type || 'Mission'}
                  </h4>
                  <p className="text-body-s text-steel-grey">
                    {mission.content_id || 'Mission ID'}
                  </p>
                  {mission.metadata && (
                    <p className="text-body-s text-steel-grey mt-1">
                      {JSON.stringify(mission.metadata)}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-body-s font-semibold ml-3 ${
                  mission.status === 'completed' ? 'badge-mastery' :
                  mission.status === 'in_progress' ? 'badge-intermediate' :
                  'badge-beginner'
                }`}>
                  {mission.status}
                </span>
              </div>

              {mission.completion_percentage !== null && mission.completion_percentage !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-body-s text-steel-grey">Progress</span>
                    <span className="text-body-s text-cyber-mint font-semibold">
                      {mission.completion_percentage}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill-mint"
                      style={{ width: `${mission.completion_percentage}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                {mission.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => window.location.href = `/dashboard/mentee/missions/${mission.id}`}
                      className="btn-primary text-body-s px-4 py-2"
                    >
                      Continue Mission
                    </button>
                    <button
                      onClick={() => window.location.href = `/dashboard/mentee/missions/${mission.id}/submit`}
                      className="btn-secondary text-body-s px-4 py-2"
                    >
                      Submit
                    </button>
                  </>
                )}
                {mission.status === 'pending' && (
                  <button
                    onClick={() => window.location.href = `/dashboard/mentee/missions/${mission.id}`}
                    className="btn-primary text-body-s px-4 py-2"
                  >
                    Start Mission
                  </button>
                )}
                {mission.status === 'completed' && (
                  <button
                    onClick={() => window.location.href = `/dashboard/mentee/missions/${mission.id}`}
                    className="btn-secondary text-body-s px-4 py-2"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-steel-grey">
            <p className="text-body-m mb-2">No missions {filter !== 'all' ? `(${filter})` : ''}</p>
            <p className="text-body-s mb-4">
              {filter === 'all' 
                ? 'Start your first mission to begin building evidence'
                : `No ${filter} missions at the moment`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => window.location.href = '/dashboard/mentee/missions/browse'}
                className="btn-primary"
              >
                Browse Missions
              </button>
            )}
          </div>
        )}
      </div>

          {!showAll && (
            <div className="mt-4 pt-4 border-t border-steel-grey">
              <button
                onClick={() => window.location.href = '/dashboard/mentee/missions'}
                className="text-body-s text-defender-blue hover:underline w-full text-center"
              >
                View All Missions →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


