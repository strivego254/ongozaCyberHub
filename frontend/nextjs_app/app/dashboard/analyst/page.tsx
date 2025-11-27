/**
 * Analyst Dashboard - OCH Brand Styled
 * Shows analytics and reporting tools
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import AnalystDashboardClient from './analyst-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  getPlaceholderUser,
  getPlaceholderAuditStats,
} from '@/services/placeholderData';

async function getAnalystData() {
  const usePlaceholder = process.env.NEXT_PUBLIC_USE_PLACEHOLDER_DATA === 'true';
  
  if (usePlaceholder) {
    return {
      user: getPlaceholderUser('analyst'),
      auditStats: getPlaceholderAuditStats(),
    };
  }

  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, auditStats] = await Promise.all([
      djangoClient.auth.getCurrentUser().catch(() => getPlaceholderUser('analyst')),
      djangoClient.audit.getAuditStats().catch(() => getPlaceholderAuditStats()),
    ]);

    return {
      user,
      auditStats,
    };
  } catch (error) {
    // Fallback to placeholder data
    return {
      user: getPlaceholderUser('analyst'),
      auditStats: getPlaceholderAuditStats(),
    };
  }
}

export default async function AnalystDashboardPage() {
  const data = await getAnalystData();

  return (
    <DashboardLayout
      user={data.user}
      role="analyst"
      roleLabel="Analyst"
      roleIcon="📊"
    >
      <AnalystDashboardClient initialData={data} />
    </DashboardLayout>
  );
}

