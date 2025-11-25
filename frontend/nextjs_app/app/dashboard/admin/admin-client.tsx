/**
 * Admin Dashboard Client Component
 * Displays platform-wide analytics and management tools
 */

'use client';

import type { User } from '@/services/types';

interface AdminDashboardClientProps {
  initialData: {
    user: User;
    auditStats: {
      total: number;
      success: number;
      failure: number;
      action_counts: Record<string, number>;
    };
    organizationCount: number;
    roleCount: number;
    actionCounts: Record<string, number>;
  };
}

export default function AdminDashboardClient({ initialData }: AdminDashboardClientProps) {
  const { auditStats, organizationCount, roleCount, actionCounts } = initialData;
  const successRate = auditStats.total > 0 
    ? ((auditStats.success / auditStats.total) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-8">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card border-defender-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Total Events</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-4xl font-bold text-defender-blue">{auditStats.total}</p>
          <p className="text-body-s text-steel-grey mt-2">System events</p>
        </div>

        <div className="card border-cyber-mint">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Success Rate</h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-4xl font-bold text-cyber-mint">{successRate}%</p>
          <p className="text-body-s text-steel-grey mt-2">Operation success</p>
        </div>

        <div className="card border-sahara-gold">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Organizations</h3>
            <span className="text-2xl">🏢</span>
          </div>
          <p className="text-4xl font-bold text-sahara-gold">{organizationCount}</p>
          <p className="text-body-s text-steel-grey mt-2">Active orgs</p>
        </div>

        <div className="card border-steel-grey">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Roles</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-4xl font-bold text-steel-grey">{roleCount}</p>
          <p className="text-body-s text-steel-grey mt-2">System roles</p>
        </div>
      </div>

      {/* Action Breakdown */}
      <div className="card">
        <h2 className="text-h2 text-white mb-6">Action Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(actionCounts).map(([action, count]) => (
            <div key={action} className="border border-steel-grey rounded-card p-4">
              <div className="flex justify-between items-center">
                <span className="text-body-m text-steel-grey capitalize">
                  {action.replace(/_/g, ' ')}
                </span>
                <span className="text-body-l font-bold text-white">{count}</span>
              </div>
            </div>
          ))}
          {Object.keys(actionCounts).length === 0 && (
            <div className="col-span-full text-center py-8 text-steel-grey">
              <p className="text-body-m">No action data available</p>
            </div>
          )}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card border-cyber-mint">
          <h3 className="text-h3 text-white mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body-m text-steel-grey">Success Rate</span>
              <span className="text-body-l font-bold text-cyber-mint">{successRate}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill-mint"
                style={{ width: `${successRate}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-body-m text-steel-grey">Success</span>
              <span className="text-body-m font-semibold text-white">{auditStats.success}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-m text-steel-grey">Failures</span>
              <span className="text-body-m font-semibold text-signal-orange">{auditStats.failure}</span>
            </div>
          </div>
        </div>

        <div className="card border-defender-blue">
          <h3 className="text-h3 text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/dashboard/admin/users" className="btn-primary w-full text-center block">
              Manage Users
            </a>
            <a href="/dashboard/admin/roles" className="btn-secondary w-full text-center block">
              Manage Roles
            </a>
            <a href="/dashboard/admin/organizations" className="btn-secondary w-full text-center block">
              Manage Organizations
            </a>
            <a href="/dashboard/admin/audit-logs" className="btn-secondary w-full text-center block">
              View Audit Logs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

