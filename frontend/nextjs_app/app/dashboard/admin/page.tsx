/**
 * Admin Dashboard - OCH Brand Styled
 * Shows platform-wide analytics and management tools
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './admin-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  getPlaceholderUser,
  getPlaceholderAuditStats,
  getPlaceholderOrganizations,
} from '@/services/placeholderData';

async function getAdminData() {
  const usePlaceholder = process.env.NEXT_PUBLIC_USE_PLACEHOLDER_DATA === 'true';
  
  if (usePlaceholder) {
    const auditStats = getPlaceholderAuditStats();
    const organizations = getPlaceholderOrganizations();
    return {
      user: getPlaceholderUser('admin'),
      auditStats,
      organizationCount: organizations.length,
      roleCount: 8,
      actionCounts: auditStats.action_counts,
    };
  }

  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, auditStats, organizations, roles] = await Promise.all([
      djangoClient.auth.getCurrentUser().catch(() => getPlaceholderUser('admin')),
      djangoClient.audit.getAuditStats().catch(() => getPlaceholderAuditStats()),
      djangoClient.organizations.listOrganizations().catch(() => ({ results: getPlaceholderOrganizations(), count: getPlaceholderOrganizations().length })),
      djangoClient.roles.listRoles().catch(() => ({ results: [] })),
    ]);

    return {
      user,
      auditStats,
      organizationCount: organizations.count || 0,
      roleCount: roles.results?.length || 8,
      actionCounts: auditStats.action_counts || {},
    };
  } catch (error) {
    // Fallback to placeholder data
    const auditStats = getPlaceholderAuditStats();
    const organizations = getPlaceholderOrganizations();
    return {
      user: getPlaceholderUser('admin'),
      auditStats,
      organizationCount: organizations.length,
      roleCount: 8,
      actionCounts: auditStats.action_counts,
    };
  }
}

export default async function AdminDashboardPage() {
  const data = await getAdminData();

  return (
    <DashboardLayout
      user={data.user}
      role="admin"
      roleLabel="Admin"
      roleIcon="⚡"
    >
      <AdminDashboardClient initialData={data} />
    </DashboardLayout>
  );
}

