/**
 * Analytics Page - ISR Example
 * Uses Incremental Static Regeneration for caching
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import AnalyticsClient from './analytics-client';

// Revalidate every 60 seconds
export const revalidate = 60;

async function getAnalyticsData() {
  try {
    const headers = await getServerAuthHeaders();
    
    if (!headers.Authorization) {
      redirect('/login');
    }

    // Fetch analytics data
    const [auditStats, organizations] = await Promise.all([
      djangoClient.audit.getAuditStats(),
      djangoClient.organizations.listOrganizations(),
    ]);

    return {
      auditStats,
      organizationCount: organizations.count || 0,
    };
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return {
      auditStats: { total: 0, success: 0, failure: 0, action_counts: {} },
      organizationCount: 0,
    };
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="min-h-screen bg-och-midnight">
      <header className="border-b border-steel-grey bg-och-midnight sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-h2 text-white">Analytics Dashboard</h1>
              <p className="text-body-s text-steel-grey mt-1">Platform insights and metrics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <AnalyticsClient initialData={data} />
      </main>
    </div>
  );
}

