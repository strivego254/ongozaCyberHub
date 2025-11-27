/**
 * OCH Profiler Component
 * Identity + Future-You Projection
 * Shows mentee's current identity and AI-generated future projection
 */

'use client';

import { useState } from 'react';
import type { User } from '@/services/types';

interface ProfilerCardProps {
  user: User;
}

export default function ProfilerCard({ user }: ProfilerCardProps) {
  const [showFutureYou, setShowFutureYou] = useState(false);

  // Check if profiler is complete
  const profilerComplete = !!(
    user.preferred_learning_style &&
    user.career_goals &&
    user.cyber_exposure_level
  );

  return (
    <div className="card border-cyber-mint">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>🔍</span>
            OCH Profiler
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Your Identity + Future-You Projection
          </p>
        </div>
        {profilerComplete ? (
          <span className="badge-beginner">Complete</span>
        ) : (
          <span className="badge-intermediate">Incomplete</span>
        )}
      </div>

      {!profilerComplete ? (
        <div className="space-y-4">
          <div className="bg-cyber-mint bg-opacity-10 border border-cyber-mint rounded-card p-4">
            <p className="text-body-m text-white mb-2">
              Complete your profiler to unlock your Future-You projection
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/mentee/profiler'}
              className="btn-primary w-full mt-3"
            >
              Complete Profiler
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Identity */}
          <div>
            <h3 className="text-h3 text-white mb-3">Current Identity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-och-midnight border border-steel-grey rounded-card p-3">
                <p className="text-body-s text-steel-grey">Learning Style</p>
                <p className="text-body-m text-white font-semibold mt-1">
                  {user.preferred_learning_style || 'Not set'}
                </p>
              </div>
              <div className="bg-och-midnight border border-steel-grey rounded-card p-3">
                <p className="text-body-s text-steel-grey">Exposure Level</p>
                <p className="text-body-m text-white font-semibold mt-1">
                  {user.cyber_exposure_level || 'Not set'}
                </p>
              </div>
            </div>
            {user.career_goals && (
              <div className="bg-och-midnight border border-steel-grey rounded-card p-3 mt-3">
                <p className="text-body-s text-steel-grey">Career Goals</p>
                <p className="text-body-m text-white mt-1">{user.career_goals}</p>
              </div>
            )}
          </div>

          {/* Future-You Projection */}
          <div className="border-t border-steel-grey pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-h3 text-white flex items-center gap-2">
                <span>🚀</span>
                Future-You Projection
              </h3>
              <button
                onClick={() => setShowFutureYou(!showFutureYou)}
                className="text-body-s text-cyber-mint hover:underline"
              >
                {showFutureYou ? 'Hide' : 'Show'} Projection
              </button>
            </div>
            
            {showFutureYou ? (
              <div className="bg-defender-gradient border border-cyber-mint rounded-card p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-body-s text-steel-grey">Recommended Track</p>
                    <p className="text-body-m text-white font-semibold mt-1">
                      {user.track_key || 'Track recommendation pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-body-s text-steel-grey">Projected Role</p>
                    <p className="text-body-m text-white font-semibold mt-1">
                      Cybersecurity Analyst → Senior Analyst
                    </p>
                  </div>
                  <div>
                    <p className="text-body-s text-steel-grey">Readiness Timeline</p>
                    <p className="text-body-m text-white font-semibold mt-1">
                      6-12 months to entry-level readiness
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/dashboard/mentee/profiler'}
                    className="btn-secondary w-full mt-3"
                  >
                    View Full Profile
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-body-s text-steel-grey">
                Click to see your AI-generated future projection based on your profile
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



