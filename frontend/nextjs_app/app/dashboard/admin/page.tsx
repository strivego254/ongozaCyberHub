/**
 * Admin Dashboard - OCH Brand Styled
 * Shows platform-wide analytics and management tools
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './admin-client';

async function getAdminData() {
  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, auditStats, organizations, roles] = await Promise.all([
      djangoClient.auth.getCurrentUser(),
      djangoClient.audit.getAuditStats().catch(() => ({
        total: 0,
        success: 0,
        failure: 0,
        action_counts: {},
      })),
      djangoClient.organizations.listOrganizations().catch(() => ({ results: [], count: 0 })),
      djangoClient.roles.listRoles().catch(() => ({ results: [] })),
    ]);

    return {
      user,
      auditStats,
      organizationCount: organizations.count || 0,
      roleCount: roles.results?.length || 0,
      actionCounts: auditStats.action_counts || {},
    };
  } catch (error) {
    redirect('/login');
  }
}

export default async function AdminDashboardPage() {
  const data = await getAdminData();

  return (
    <div className="min-h-screen bg-och-midnight">
      <header className="border-b border-steel-grey bg-och-midnight sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-h2 text-white">Admin Dashboard</h1>
              <p className="text-body-s text-steel-grey mt-1">Platform Management & Analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="badge-vip">⚡ Admin</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <AdminDashboardClient initialData={data} />
      </main>
    </div>
  );
}

