/**
 * Sponsor/Employer Dashboard - OCH Brand Styled
 * Shows sponsored students and organization management
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import SponsorDashboardClient from './sponsor-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  getPlaceholderUser,
  getPlaceholderOrganizations,
  getPlaceholderSponsoredStudentCount,
} from '@/services/placeholderData';

async function getSponsorData() {
  const usePlaceholder = process.env.NEXT_PUBLIC_USE_PLACEHOLDER_DATA === 'true';
  
  if (usePlaceholder) {
    return {
      user: getPlaceholderUser('sponsor'),
      organizations: getPlaceholderOrganizations(),
      organizationCount: getPlaceholderOrganizations().length,
      sponsoredStudentCount: getPlaceholderSponsoredStudentCount(),
    };
  }

  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, organizations] = await Promise.all([
      djangoClient.auth.getCurrentUser().catch(() => getPlaceholderUser('sponsor')),
      djangoClient.organizations.listOrganizations().catch(() => ({ results: getPlaceholderOrganizations(), count: getPlaceholderOrganizations().length })),
    ]);

    return {
      user,
      organizations: organizations.results || getPlaceholderOrganizations(),
      organizationCount: organizations.count || getPlaceholderOrganizations().length,
      sponsoredStudentCount: getPlaceholderSponsoredStudentCount(),
    };
  } catch (error) {
    // Fallback to placeholder data
    return {
      user: getPlaceholderUser('sponsor'),
      organizations: getPlaceholderOrganizations(),
      organizationCount: getPlaceholderOrganizations().length,
      sponsoredStudentCount: getPlaceholderSponsoredStudentCount(),
    };
  }
}

export default async function SponsorDashboardPage() {
  const data = await getSponsorData();

  return (
    <DashboardLayout
      user={data.user}
      role="sponsor"
      roleLabel="Sponsor"
      roleIcon="💼"
    >
      <SponsorDashboardClient initialData={data} />
    </DashboardLayout>
  );
}

