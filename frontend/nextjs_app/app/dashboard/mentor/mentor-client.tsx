/**
 * Mentor Dashboard Client Component
 * Displays mentor analytics and mentee management
 */

'use client';

import type { User, Organization } from '@/services/types';

interface MentorDashboardClientProps {
  initialData: {
    user: User;
    organizations: Organization[];
    menteeCount: number;
    pendingReviews: number;
  };
}

export default function MentorDashboardClient({ initialData }: MentorDashboardClientProps) {
  const { user, organizations, menteeCount, pendingReviews } = initialData;

  return (
    <div className="space-y-8">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-sahara-gold">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Mentees</h3>
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-4xl font-bold text-sahara-gold">{menteeCount}</p>
          <p className="text-body-s text-steel-grey mt-2">Active mentees</p>
        </div>

        <div className="card border-defender-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Pending Reviews</h3>
            <span className="text-3xl">📝</span>
          </div>
          <p className="text-4xl font-bold text-defender-blue">{pendingReviews}</p>
          <p className="text-body-s text-steel-grey mt-2">Awaiting feedback</p>
        </div>

        <div className="card border-cyber-mint">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 text-white">Organizations</h3>
            <span className="text-3xl">🏢</span>
          </div>
          <p className="text-4xl font-bold text-cyber-mint">{organizations.length}</p>
          <p className="text-body-s text-steel-grey mt-2">Associated orgs</p>
        </div>
      </div>

      {/* Mentee Management */}
      <div className="card">
        <h2 className="text-h2 text-white mb-6">Mentee Management</h2>
        <div className="text-center py-12 text-steel-grey">
          <p className="text-body-m">Mentee management interface coming soon</p>
          <p className="text-body-s mt-2">View assigned mentees, review submissions, and provide feedback</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-h2 text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/dashboard/mentor/mentees" className="btn-mission text-center block">
            View All Mentees
          </a>
          <a href="/dashboard/mentor/reviews" className="btn-secondary text-center block">
            Pending Reviews
          </a>
        </div>
      </div>
    </div>
  );
}

