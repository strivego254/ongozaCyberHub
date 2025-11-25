/**
 * Program Director Dashboard Client Component
 */

'use client';

import type { User } from '@/services/types';

interface DirectorDashboardClientProps {
  initialData: {
    user: User;
    organizationCount: number;
    auditStats: {
      total: number;
      success: number;
      failure: number;
      action_counts: Record<string, number>;
    };
  };
}

export default function DirectorDashboardClient({ initialData }: DirectorDashboardClientProps) {
  const { organizationCount, auditStats } = initialData;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-sahara-gold">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Organizations</h3>
            <span className="text-3xl">🏢</span>
          </div>
          <p className="text-4xl font-bold text-sahara-gold">{organizationCount}</p>
          <p className="text-body-s text-steel-grey mt-2">Managed organizations</p>
        </div>

        <div className="card border-defender-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">System Events</h3>
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-4xl font-bold text-defender-blue">{auditStats.total}</p>
          <p className="text-body-s text-steel-grey mt-2">Total events</p>
        </div>

        <div className="card border-cyber-mint">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Success Rate</h3>
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-4xl font-bold text-cyber-mint">
            {auditStats.total > 0 ? ((auditStats.success / auditStats.total) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-body-s text-steel-grey mt-2">Operation success</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-h2 text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/dashboard/director/programs" className="btn-mission text-center block">
            Manage Programs
          </a>
          <a href="/dashboard/director/cohorts" className="btn-secondary text-center block">
            Manage Cohorts
          </a>
          <a href="/dashboard/director/mentors" className="btn-secondary text-center block">
            Assign Mentors
          </a>
          <a href="/dashboard/director/analytics" className="btn-secondary text-center block">
            View Analytics
          </a>
        </div>
      </div>
    </div>
  );
}

