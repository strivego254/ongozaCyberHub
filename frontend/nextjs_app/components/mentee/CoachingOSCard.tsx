/**
 * Coaching OS Component
 * Habits + Goals + Actions + Reflection
 * "Mentees do the work" - they build habits, set goals, take actions, reflect
 */

'use client';

import { useState } from 'react';
import type { User } from '@/services/types';

interface CoachingOSCardProps {
  user: User;
  expanded?: boolean;
}

interface Habit {
  id: string;
  name: string;
  frequency: string;
  streak: number;
  status: 'active' | 'paused';
}

interface Goal {
  id: string;
  title: string;
  target_date: string;
  progress: number;
  status: 'active' | 'completed';
}

export default function CoachingOSCard({ user, expanded = false }: CoachingOSCardProps) {
  const [activeTab, setActiveTab] = useState<'habits' | 'goals' | 'reflections'>('habits');

  // Mock data - replace with API calls
  const habits: Habit[] = [
    { id: '1', name: 'Daily practice session', frequency: 'Daily', streak: 7, status: 'active' },
    { id: '2', name: 'Weekly mission submission', frequency: 'Weekly', streak: 3, status: 'active' },
    { id: '3', name: 'Community engagement', frequency: 'Daily', streak: 5, status: 'active' },
  ];

  const goals: Goal[] = [
    { id: '1', title: 'Complete 10 missions this month', target_date: '2024-12-31', progress: 60, status: 'active' },
    { id: '2', title: 'Build portfolio with 5 items', target_date: '2024-12-15', progress: 40, status: 'active' },
    { id: '3', title: 'Achieve intermediate level', target_date: '2025-01-31', progress: 25, status: 'active' },
  ];

  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const activeGoals = goals.filter(g => g.status === 'active').length;

  return (
    <div className="card border-sahara-gold">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>🎯</span>
            Coaching OS
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Habits • Goals • Actions • Reflection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-body-s text-steel-grey">Total Streak</p>
            <p className="text-h3 text-sahara-gold font-bold">{totalStreak} days</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-steel-grey mb-4 pb-2">
        {[
          { id: 'habits', label: 'Habits', icon: '🔄', count: habits.length },
          { id: 'goals', label: 'Goals', icon: '🎯', count: activeGoals },
          { id: 'reflections', label: 'Reflections', icon: '💭', count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-card text-body-s font-semibold
              transition-all duration-200
              ${
                activeTab === tab.id
                  ? 'bg-sahara-gold bg-opacity-20 text-sahara-gold border border-sahara-gold'
                  : 'text-steel-grey hover:text-sahara-gold'
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

      {/* Habits Tab */}
      {activeTab === 'habits' && (
        <div className="space-y-3">
          {habits.length > 0 ? (
            habits.map((habit) => (
              <div
                key={habit.id}
                className="bg-och-midnight border border-steel-grey rounded-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-body-m font-semibold text-white">{habit.name}</h4>
                    <p className="text-body-s text-steel-grey">{habit.frequency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-h3 text-sahara-gold font-bold">{habit.streak}</p>
                    <p className="text-body-xs text-steel-grey">day streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button className="btn-primary text-body-s px-4 py-2">
                    Mark Complete
                  </button>
                  <span className={`px-3 py-1 rounded-full text-body-xs font-semibold ${
                    habit.status === 'active' ? 'badge-beginner' : 'badge-intermediate'
                  }`}>
                    {habit.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-steel-grey">
              <p className="text-body-m mb-2">No habits yet</p>
              <p className="text-body-s">Start building your learning habits</p>
            </div>
          )}
          <button
            onClick={() => window.location.href = '/dashboard/mentee/coaching/habits'}
            className="btn-secondary w-full mt-4"
          >
            {expanded ? 'Manage Habits' : 'View All Habits'}
          </button>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-3">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-och-midnight border border-steel-grey rounded-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-body-m font-semibold text-white mb-1">{goal.title}</h4>
                    <p className="text-body-s text-steel-grey">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-h3 text-cyber-mint font-bold">{goal.progress}%</p>
                  </div>
                </div>
                <div className="progress-bar mt-2">
                  <div
                    className="progress-fill-mint"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button className="btn-primary text-body-s px-4 py-2">
                    Update Progress
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-steel-grey">
              <p className="text-body-m mb-2">No goals set yet</p>
              <p className="text-body-s">Set your first goal to start tracking progress</p>
            </div>
          )}
          <button
            onClick={() => window.location.href = '/dashboard/mentee/coaching/goals'}
            className="btn-secondary w-full mt-4"
          >
            {expanded ? 'Manage Goals' : 'View All Goals'}
          </button>
        </div>
      )}

      {/* Reflections Tab */}
      {activeTab === 'reflections' && (
        <div className="space-y-3">
          <div className="text-center py-8 text-steel-grey">
            <p className="text-body-m mb-2">No reflections yet</p>
            <p className="text-body-s mb-4">
              Self-reflection is key to growth. Start reflecting on your learning journey.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/mentee/coaching/reflections/new'}
              className="btn-primary"
            >
              Write Reflection
            </button>
          </div>
        </div>
      )}

      {!expanded && (
        <div className="mt-4 pt-4 border-t border-steel-grey">
          <button
            onClick={() => window.location.href = '/dashboard/mentee/coaching'}
            className="text-body-s text-cyber-mint hover:underline w-full text-center"
          >
            Open Coaching OS →
          </button>
        </div>
      )}
    </div>
  );
}



