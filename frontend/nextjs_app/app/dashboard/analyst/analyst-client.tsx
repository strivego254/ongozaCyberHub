/**
 * Analyst Dashboard Client Component
 */

'use client';

import type { User } from '@/services/types';

interface AnalystDashboardClientProps {
  initialData: {
    user: User;
    auditStats: {
      total: number;
      success: number;
      failure: number;
      action_counts: Record<string, number>;
    };
  };
}

export default function AnalystDashboardClient({ initialData }: AnalystDashboardClientProps) {
  const { auditStats } = initialData;
  const successRate = auditStats.total > 0 
    ? ((auditStats.success / auditStats.total) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-defender-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Total Events</h3>
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-4xl font-bold text-defender-blue">{auditStats.total}</p>
          <p className="text-body-s text-steel-grey mt-2">System events tracked</p>
        </div>

        <div className="card border-cyber-mint">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Success Rate</h3>
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-4xl font-bold text-cyber-mint">{successRate}%</p>
          <p className="text-body-s text-steel-grey mt-2">Operation success</p>
        </div>

        <div className="card border-signal-orange">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Failures</h3>
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-4xl font-bold text-signal-orange">{auditStats.failure}</p>
          <p className="text-body-s text-steel-grey mt-2">Failed operations</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-h2 text-white mb-6">Action Breakdown</h2>
        <div className="space-y-3">
          {Object.entries(auditStats.action_counts).map(([action, count]) => (
            <div key={action} className="flex justify-between items-center border-b border-steel-grey pb-3">
              <span className="text-body-m text-steel-grey capitalize">
                {action.replace(/_/g, ' ')}
              </span>
              <span className="text-body-l font-bold text-white">{count}</span>
            </div>
          ))}
          {Object.keys(auditStats.action_counts).length === 0 && (
            <div className="text-center py-12 text-steel-grey">
              <p className="text-body-m">No action data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-h2 text-white mb-6">Reporting Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/dashboard/analyst/reports" className="btn-primary text-center block">
            Generate Report
          </a>
          <a href="/dashboard/analyst/export" className="btn-secondary text-center block">
            Export Data
          </a>
        </div>
      </div>
    </div>
  );
}

