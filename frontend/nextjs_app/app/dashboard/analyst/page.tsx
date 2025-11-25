/**
 * Analyst Dashboard - OCH Brand Styled
 * Shows analytics and reporting tools
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import AnalystDashboardClient from './analyst-client';

async function getAnalystData() {
  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, auditStats] = await Promise.all([
      djangoClient.auth.getCurrentUser(),
      djangoClient.audit.getAuditStats().catch(() => ({
        total: 0,
        success: 0,
        failure: 0,
        action_counts: {},
      })),
    ]);

    return {
      user,
      auditStats,
    };
  } catch (error) {
    redirect('/login');
  }
}

export default async function AnalystDashboardPage() {
  const data = await getAnalystData();

  return (
    <div className="min-h-screen bg-och-midnight">
      <header className="border-b border-steel-grey bg-och-midnight sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-h2 text-white">Analyst Dashboard</h1>
              <p className="text-body-s text-steel-grey mt-1">Data insights and reporting</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="badge-intermediate">📊 Analyst</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <AnalystDashboardClient initialData={data} />
      </main>
    </div>
  );
}

