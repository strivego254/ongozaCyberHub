/**
 * Sponsor Dashboard Client Component
 */

'use client';

import type { User, Organization } from '@/services/types';

interface SponsorDashboardClientProps {
  initialData: {
    user: User;
    organizations: Organization[];
    organizationCount: number;
    sponsoredStudentCount: number;
  };
}

export default function SponsorDashboardClient({ initialData }: SponsorDashboardClientProps) {
  const { organizations, organizationCount, sponsoredStudentCount } = initialData;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-sahara-gold">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Organizations</h3>
            <span className="text-3xl">🏢</span>
          </div>
          <p className="text-4xl font-bold text-sahara-gold">{organizationCount}</p>
          <p className="text-body-s text-steel-grey mt-2">Your organizations</p>
        </div>

        <div className="card border-defender-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Sponsored Students</h3>
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-4xl font-bold text-defender-blue">{sponsoredStudentCount}</p>
          <p className="text-body-s text-steel-grey mt-2">Active sponsorships</p>
        </div>

        <div className="card border-cyber-mint">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Investment</h3>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-4xl font-bold text-cyber-mint">--</p>
          <p className="text-body-s text-steel-grey mt-2">Total investment</p>
        </div>
      </div>

      {/* Organizations */}
      {organizations.length > 0 && (
        <div className="card">
          <h2 className="text-h2 text-white mb-6">Your Organizations</h2>
          <div className="space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="border border-steel-grey rounded-card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-body-m font-semibold text-white">{org.name}</h4>
                    <p className="text-body-s text-steel-grey mt-1">{org.description}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-body-s font-semibold ${
                      org.org_type === 'sponsor' ? 'badge-mastery' :
                      org.org_type === 'employer' ? 'badge-intermediate' :
                      'badge-beginner'
                    }`}>
                      {org.org_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-h2 text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/dashboard/sponsor/students" className="btn-mission text-center block">
            View Sponsored Students
          </a>
          <a href="/dashboard/sponsor/organizations" className="btn-secondary text-center block">
            Manage Organizations
          </a>
        </div>
      </div>
    </div>
  );
}

