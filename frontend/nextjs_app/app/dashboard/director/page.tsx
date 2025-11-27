/**
 * Program Director Dashboard - OCH Brand Styled
 * Shows program management and analytics
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import DirectorDashboardClient from './director-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  getPlaceholderUser,
  getPlaceholderOrganizations,
  getPlaceholderAuditStats,
} from '@/services/placeholderData';

async function getDirectorData() {
  const usePlaceholder = process.env.NEXT_PUBLIC_USE_PLACEHOLDER_DATA === 'true';
  
  if (usePlaceholder) {
    return {
      user: getPlaceholderUser('program_director'),
      organizationCount: getPlaceholderOrganizations().length,
      auditStats: getPlaceholderAuditStats(),
    };
  }

  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, organizations, auditStats] = await Promise.all([
      djangoClient.auth.getCurrentUser().catch(() => getPlaceholderUser('program_director')),
      djangoClient.organizations.listOrganizations().catch(() => ({ results: getPlaceholderOrganizations(), count: getPlaceholderOrganizations().length })),
      djangoClient.audit.getAuditStats().catch(() => getPlaceholderAuditStats()),
    ]);

    return {
      user,
      organizationCount: organizations.count || getPlaceholderOrganizations().length,
      auditStats,
    };
  } catch (error) {
    // Fallback to placeholder data
    return {
      user: getPlaceholderUser('program_director'),
      organizationCount: getPlaceholderOrganizations().length,
      auditStats: getPlaceholderAuditStats(),
    };
  }
}

export default async function DirectorDashboardPage() {
  const data = await getDirectorData();

  return (
    <DashboardLayout
      user={data.user}
      role="director"
      roleLabel="Program Director"
      roleIcon="👔"
    >
      <DirectorDashboardClient initialData={data} />
    </DashboardLayout>
  );
}

