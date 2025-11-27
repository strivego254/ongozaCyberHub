/**
 * Curriculum Engine Component
 * Modules, tracks, specializations
 * Structured learning progression
 */

'use client';

import { useState } from 'react';
import type { User } from '@/services/types';

interface CurriculumCardProps {
  user: User;
}

interface Track {
  id: string;
  name: string;
  description: string;
  modules_count: number;
  progress: number;
  is_recommended: boolean;
}

interface Module {
  id: string;
  name: string;
  track: string;
  order: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  estimated_hours: number;
}

export default function CurriculumCard({ user }: CurriculumCardProps) {
  const [activeView, setActiveView] = useState<'tracks' | 'modules'>('tracks');

  // Mock data - replace with API calls
  const tracks: Track[] = [
    {
      id: '1',
      name: user.track_key || 'Network Security',
      description: 'Master network defense and security protocols',
      modules_count: 12,
      progress: 25,
      is_recommended: true,
    },
  ];

  const modules: Module[] = [
    { id: '1', name: 'Introduction to Network Security', track: 'Network Security', order: 1, status: 'completed', estimated_hours: 4 },
    { id: '2', name: 'Firewall Configuration', track: 'Network Security', order: 2, status: 'in_progress', estimated_hours: 6 },
    { id: '3', name: 'Intrusion Detection Systems', track: 'Network Security', order: 3, status: 'available', estimated_hours: 8 },
    { id: '4', name: 'Advanced Threat Hunting', track: 'Network Security', order: 4, status: 'locked', estimated_hours: 10 },
  ];

  return (
    <div className="card border-defender-blue">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>📚</span>
            Curriculum Engine
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Modules • Tracks • Specializations
          </p>
        </div>
        {user.track_key && (
          <span className="badge-intermediate">{user.track_key}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-steel-grey mb-4 pb-2">
        {[
          { id: 'tracks', label: 'Tracks', icon: '🎯' },
          { id: 'modules', label: 'Modules', icon: '📖' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-card text-body-s font-semibold
              transition-all duration-200
              ${
                activeView === tab.id
                  ? 'bg-defender-blue text-white'
                  : 'text-steel-grey hover:text-defender-blue'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tracks View */}
      {activeView === 'tracks' && (
        <div className="space-y-3">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`bg-och-midnight border rounded-card p-4 ${
                track.is_recommended ? 'border-cyber-mint border-2' : 'border-steel-grey'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-body-m font-semibold text-white">{track.name}</h4>
                    {track.is_recommended && (
                      <span className="badge-beginner">Recommended</span>
                    )}
                  </div>
                  <p className="text-body-s text-steel-grey mb-2">{track.description}</p>
                  <p className="text-body-s text-steel-grey">
                    {track.modules_count} modules • {track.progress}% complete
                  </p>
                </div>
              </div>
              <div className="progress-bar mt-2">
                <div
                  className="progress-fill-mint"
                  style={{ width: `${track.progress}%` }}
                />
              </div>
              <button
                onClick={() => window.location.href = `/dashboard/mentee/curriculum/tracks/${track.id}`}
                className="btn-primary w-full mt-3"
              >
                View Track
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modules View */}
      {activeView === 'modules' && (
        <div className="space-y-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`bg-och-midnight border rounded-card p-4 ${
                module.status === 'in_progress' ? 'border-cyber-mint' :
                module.status === 'completed' ? 'border-sahara-gold' :
                module.status === 'locked' ? 'border-steel-grey opacity-50' :
                'border-steel-grey'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-body-s text-steel-grey">#{module.order}</span>
                    <h4 className="text-body-m font-semibold text-white">{module.name}</h4>
                  </div>
                  <p className="text-body-s text-steel-grey">
                    {module.track} • {module.estimated_hours} hours
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-body-xs font-semibold ml-3 ${
                  module.status === 'completed' ? 'badge-mastery' :
                  module.status === 'in_progress' ? 'badge-intermediate' :
                  module.status === 'available' ? 'badge-beginner' :
                  'text-steel-grey'
                }`}>
                  {module.status.replace('_', ' ')}
                </span>
              </div>
              {module.status !== 'locked' && (
                <button
                  onClick={() => window.location.href = `/dashboard/mentee/curriculum/modules/${module.id}`}
                  className={`w-full mt-3 text-body-s px-4 py-2 ${
                    module.status === 'completed' ? 'btn-secondary' : 'btn-primary'
                  }`}
                >
                  {module.status === 'completed' ? 'Review' :
                   module.status === 'in_progress' ? 'Continue' :
                   'Start Module'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-steel-grey">
        <button
          onClick={() => window.location.href = '/dashboard/mentee/curriculum'}
          className="text-body-s text-defender-blue hover:underline w-full text-center"
        >
          View Full Curriculum →
        </button>
      </div>
    </div>
  );
}



