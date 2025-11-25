/**
 * Program Director Dashboard - OCH Brand Styled
 * Shows program management and analytics
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import DirectorDashboardClient from './director-client';

async function getDirectorData() {
  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, organizations, auditStats] = await Promise.all([
      djangoClient.auth.getCurrentUser(),
      djangoClient.organizations.listOrganizations().catch(() => ({ results: [], count: 0 })),
      djangoClient.audit.getAuditStats().catch(() => ({
        total: 0,
        success: 0,
        failure: 0,
        action_counts: {},
      })),
    ]);

    return {
      user,
      organizationCount: organizations.count || 0,
      auditStats,
    };
  } catch (error) {
    redirect('/login');
  }
}

export default async function DirectorDashboardPage() {
  const data = await getDirectorData();

  return (
    <div className="min-h-screen bg-och-midnight">
      <header className="border-b border-steel-grey bg-och-midnight sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-h2 text-white">Program Director Dashboard</h1>
              <p className="text-body-s text-steel-grey mt-1">Manage programs, cohorts, and operations</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="badge-mastery">👔 Director</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <DirectorDashboardClient initialData={data} />
      </main>
    </div>
  );
}

