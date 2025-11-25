/**
 * Student Dashboard Client Component
 * Displays student analytics, progress, and recommendations
 */

'use client';

import { useState } from 'react';
import type { User, Progress, RecommendationItem } from '@/services/types';

interface StudentDashboardClientProps {
  initialData: {
    user: User;
    progress: Progress[];
    progressCount: number;
    recommendations: RecommendationItem[];
  };
}

export default function StudentDashboardClient({ initialData }: StudentDashboardClientProps) {
  const { user, progress, progressCount, recommendations } = initialData;

  // Calculate progress stats
  const completedCount = progress.filter((p: Progress) => p.status === 'completed').length;
  const inProgressCount = progress.filter((p: Progress) => p.status === 'in_progress').length;
  const completionRate = progressCount > 0 ? (completedCount / progressCount) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-defender-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Total Missions</h3>
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-4xl font-bold text-cyber-mint">{progressCount}</p>
          <p className="text-body-s text-steel-grey mt-2">Active learning paths</p>
        </div>

        <div className="card border-cyber-mint">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Completed</h3>
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-4xl font-bold text-cyber-mint">{completedCount}</p>
          <p className="text-body-s text-steel-grey mt-2">Missions completed</p>
        </div>

        <div className="card border-sahara-gold">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Progress Rate</h3>
            <span className="text-3xl">📈</span>
          </div>
          <p className="text-4xl font-bold text-sahara-gold">{completionRate.toFixed(0)}%</p>
          <p className="text-body-s text-steel-grey mt-2">Overall completion</p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="card">
        <h2 className="text-h2 text-white mb-6">Mission Progress</h2>
        <div className="space-y-4">
          {progress.length > 0 ? (
            progress.slice(0, 5).map((item: Progress) => (
              <div key={item.id} className="border border-steel-grey rounded-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-body-m font-semibold text-white">{item.content_type}</h4>
                    <p className="text-body-s text-steel-grey">{item.content_id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-body-s font-semibold ${
                    item.status === 'completed' ? 'badge-mastery' :
                    item.status === 'in_progress' ? 'badge-intermediate' :
                    'badge-beginner'
                  }`}>
                    {item.status}
                  </span>
                </div>
                {item.completion_percentage && (
                  <div className="progress-bar mt-3">
                    <div
                      className="progress-fill-mint"
                      style={{ width: `${item.completion_percentage}%` }}
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-steel-grey">
              <p className="text-body-m">No missions started yet</p>
              <p className="text-body-s mt-2">Begin your first mission to see progress here</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card border-cyber-mint">
          <h2 className="text-h2 text-white mb-6">AI Recommendations</h2>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-cyber-mint border-opacity-30 rounded-card p-4 bg-cyber-mint bg-opacity-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-body-m font-semibold text-white">{rec.title}</h4>
                    {rec.description && (
                      <p className="text-body-s text-steel-grey mt-1">{rec.description}</p>
                    )}
                  </div>
                  <span className="text-body-s text-cyber-mint font-semibold">
                    {(rec.score * 100).toFixed(0)}% match
                  </span>
                </div>
                {rec.reason && (
                  <p className="text-body-s text-cyber-mint mt-2">💡 {rec.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-h2 text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/dashboard/student/missions" className="btn-primary text-center block">
            View All Missions
          </a>
          <a href="/dashboard/student/portfolio" className="btn-secondary text-center block">
            My Portfolio
          </a>
        </div>
      </div>
    </div>
  );
}

