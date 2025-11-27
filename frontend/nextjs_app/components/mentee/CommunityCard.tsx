/**
 * Community Engine Component
 * Groups, chats, leaderboards, engagement
 */

'use client';

import { useState } from 'react';
import type { User } from '@/services/types';

interface CommunityCardProps {
  user: User;
  expanded?: boolean;
}

interface CommunityGroup {
  id: string;
  name: string;
  type: 'cohort' | 'track' | 'interest';
  member_count: number;
  recent_activity: string;
}

interface LeaderboardEntry {
  rank: number;
  user_name: string;
  score: number;
  is_current_user: boolean;
}

export default function CommunityCard({ user, expanded = false }: CommunityCardProps) {
  const [activeView, setActiveView] = useState<'groups' | 'leaderboard' | 'activity'>('groups');

  // Mock data - replace with API calls
  const groups: CommunityGroup[] = [
    { id: '1', name: 'Cohort Jan 2024', type: 'cohort', member_count: 45, recent_activity: '2 hours ago' },
    { id: '2', name: 'Network Security Track', type: 'track', member_count: 120, recent_activity: '5 hours ago' },
  ];

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, user_name: 'Alex M.', score: 1250, is_current_user: false },
    { rank: 2, user_name: 'Sarah K.', score: 1180, is_current_user: false },
    { rank: 3, user_name: user.first_name || 'You', score: 950, is_current_user: true },
  ];

  return (
    <div className="card border-cyber-mint">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>👥</span>
            Community Engine
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Groups • Chats • Leaderboards
          </p>
        </div>
        <span className="badge-beginner">{groups.length} Groups</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-steel-grey mb-4 pb-2">
        {[
          { id: 'groups', label: 'Groups', icon: '👥' },
          { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
          { id: 'activity', label: 'Activity', icon: '📢' },
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
          </button>
        ))}
      </div>

      {/* Groups View */}
      {activeView === 'groups' && (
        <div className="space-y-3">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div
                key={group.id}
                className="bg-och-midnight border border-steel-grey rounded-card p-4 hover:border-cyber-mint transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-body-m font-semibold text-white">{group.name}</h4>
                    <p className="text-body-s text-steel-grey">
                      {group.type} • {group.member_count} members
                    </p>
                  </div>
                  <span className="text-body-xs text-steel-grey">{group.recent_activity}</span>
                </div>
                <button
                  onClick={() => window.location.href = `/dashboard/mentee/community/groups/${group.id}`}
                  className="btn-primary text-body-s px-4 py-2 mt-2"
                >
                  Open Group
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-steel-grey">
              <p className="text-body-m mb-2">No groups yet</p>
              <p className="text-body-s">Join a cohort or track to connect with others</p>
            </div>
          )}
          <button
            onClick={() => window.location.href = '/dashboard/mentee/community/groups'}
            className="btn-secondary w-full mt-3"
          >
            Browse All Groups
          </button>
        </div>
      )}

      {/* Leaderboard View */}
      {activeView === 'leaderboard' && (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`bg-och-midnight border rounded-card p-3 ${
                entry.is_current_user
                  ? 'border-cyber-mint border-2'
                  : 'border-steel-grey'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-h3 text-sahara-gold font-bold w-8">#{entry.rank}</span>
                  <div>
                    <p className={`text-body-m font-semibold ${
                      entry.is_current_user ? 'text-cyber-mint' : 'text-white'
                    }`}>
                      {entry.user_name} {entry.is_current_user && '(You)'}
                    </p>
                  </div>
                </div>
                <span className="text-body-m text-sahara-gold font-bold">{entry.score}</span>
              </div>
            </div>
          ))}
          <button
            onClick={() => window.location.href = '/dashboard/mentee/community/leaderboard'}
            className="btn-secondary w-full mt-3"
          >
            View Full Leaderboard
          </button>
        </div>
      )}

      {/* Activity View */}
      {activeView === 'activity' && (
        <div className="space-y-3">
          <div className="text-center py-8 text-steel-grey">
            <p className="text-body-m mb-2">Recent Activity</p>
            <p className="text-body-s">Community activity will appear here</p>
          </div>
        </div>
      )}

      {!expanded && (
        <div className="mt-4 pt-4 border-t border-steel-grey">
          <button
            onClick={() => window.location.href = '/dashboard/mentee/community'}
            className="text-body-s text-cyber-mint hover:underline w-full text-center"
          >
            Open Community →
          </button>
        </div>
      )}
    </div>
  );
}



