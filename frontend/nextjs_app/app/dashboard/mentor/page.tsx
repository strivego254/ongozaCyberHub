/**
 * Mentor Dashboard - OCH Brand Styled
 * Shows mentor-specific analytics and mentee management
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import MentorDashboardClient from './mentor-client';

async function getMentorData() {
  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, organizations] = await Promise.all([
      djangoClient.auth.getCurrentUser(),
      djangoClient.organizations.listOrganizations().catch(() => ({ results: [], count: 0 })),
    ]);

    // TODO: Fetch mentee data when endpoint is available
    const mentees: any[] = [];

    return {
      user,
      organizations: organizations.results || [],
      menteeCount: mentees.length,
      pendingReviews: 0, // TODO: Fetch from API
    };
  } catch (error) {
    redirect('/login');
  }
}

export default async function MentorDashboardPage() {
  const data = await getMentorData();

  return (
    <div className="min-h-screen bg-och-midnight">
      <header className="border-b border-steel-grey bg-och-midnight sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-h2 text-white">Mentor Dashboard</h1>
              <p className="text-body-s text-steel-grey mt-1">Guide the next generation</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="badge-mastery">👨‍🏫 Mentor</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <MentorDashboardClient initialData={data} />
      </main>
    </div>
  );
}

