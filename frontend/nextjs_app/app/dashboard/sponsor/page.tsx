/**
 * Sponsor/Employer Dashboard - OCH Brand Styled
 * Shows sponsored students and organization management
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import SponsorDashboardClient from './sponsor-client';

async function getSponsorData() {
  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, organizations] = await Promise.all([
      djangoClient.auth.getCurrentUser(),
      djangoClient.organizations.listOrganizations().catch(() => ({ results: [], count: 0 })),
    ]);

    // TODO: Fetch sponsored students when endpoint is available
    const sponsoredStudents: any[] = [];

    return {
      user,
      organizations: organizations.results || [],
      organizationCount: organizations.count || 0,
      sponsoredStudentCount: sponsoredStudents.length,
    };
  } catch (error) {
    redirect('/login');
  }
}

export default async function SponsorDashboardPage() {
  const data = await getSponsorData();

  return (
    <div className="min-h-screen bg-och-midnight">
      <header className="border-b border-steel-grey bg-och-midnight sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-h2 text-white">Sponsor Dashboard</h1>
              <p className="text-body-s text-steel-grey mt-1">Manage sponsored talent and organization</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="badge-mastery">💼 Sponsor</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <SponsorDashboardClient initialData={data} />
      </main>
    </div>
  );
}

