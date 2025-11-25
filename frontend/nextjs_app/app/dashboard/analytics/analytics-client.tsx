/**
 * Analytics Client Component - OCH Brand Styled
 * Displays analytics data with OCH design system
 */

'use client';

interface AnalyticsClientProps {
  initialData: {
    auditStats: {
      total: number;
      success: number;
      failure: number;
      action_counts: Record<string, number>;
    };
    organizationCount: number;
  };
}

export default function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const { auditStats, organizationCount } = initialData;
  const successRate = auditStats.total > 0
    ? ((auditStats.success / auditStats.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Hero Metrics */}
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

        <div className="card border-sahara-gold">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Organizations</h3>
            <span className="text-3xl">🏢</span>
          </div>
          <p className="text-4xl font-bold text-sahara-gold">{organizationCount}</p>
          <p className="text-body-s text-steel-grey mt-2">Active organizations</p>
        </div>
      </div>

      {/* Action Breakdown */}
      <div className="card">
        <h2 className="text-h2 text-white mb-6">Action Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(auditStats.action_counts).map(([action, count]) => (
            <div key={action} className="border border-steel-grey rounded-card p-4 hover:border-cyber-mint transition-all">
              <div className="flex justify-between items-center">
                <span className="text-body-m text-steel-grey capitalize">
                  {action.replace(/_/g, ' ')}
                </span>
                <span className="text-body-l font-bold text-white">{count}</span>
              </div>
            </div>
          ))}
          {Object.keys(auditStats.action_counts).length === 0 && (
            <div className="col-span-full text-center py-12 text-steel-grey">
              <p className="text-body-m">No action data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Success/Failure Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card border-cyber-mint">
          <h3 className="text-h3 text-white mb-4">Success Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body-m text-steel-grey">Successful Operations</span>
              <span className="text-body-l font-bold text-cyber-mint">{auditStats.success}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill-mint"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card border-signal-orange">
          <h3 className="text-h3 text-white mb-4">Failure Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body-m text-steel-grey">Failed Operations</span>
              <span className="text-body-l font-bold text-signal-orange">{auditStats.failure}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ 
                  width: auditStats.total > 0 ? `${(auditStats.failure / auditStats.total) * 100}%` : '0%',
                  backgroundColor: '#F55F28'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

