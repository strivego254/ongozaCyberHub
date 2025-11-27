/**
 * Mentor Dashboard - OCH Brand Styled
 * Shows mentor-specific analytics and mentee management
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import MentorDashboardClient from './mentor-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  getPlaceholderUser,
  getPlaceholderOrganizations,
  getPlaceholderMenteeCount,
  getPlaceholderPendingReviews,
} from '@/services/placeholderData';

async function getMentorData() {
  const usePlaceholder = process.env.NEXT_PUBLIC_USE_PLACEHOLDER_DATA === 'true';
  
  if (usePlaceholder) {
    return {
      user: getPlaceholderUser('mentor'),
      organizations: getPlaceholderOrganizations(),
      menteeCount: getPlaceholderMenteeCount(),
      pendingReviews: getPlaceholderPendingReviews(),
    };
  }

  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, organizations] = await Promise.all([
      djangoClient.auth.getCurrentUser().catch(() => getPlaceholderUser('mentor')),
      djangoClient.organizations.listOrganizations().catch(() => ({ results: getPlaceholderOrganizations(), count: getPlaceholderOrganizations().length })),
    ]);

    return {
      user,
      organizations: organizations.results || getPlaceholderOrganizations(),
      menteeCount: getPlaceholderMenteeCount(),
      pendingReviews: getPlaceholderPendingReviews(),
    };
  } catch (error) {
    // Fallback to placeholder data
    return {
      user: getPlaceholderUser('mentor'),
      organizations: getPlaceholderOrganizations(),
      menteeCount: getPlaceholderMenteeCount(),
      pendingReviews: getPlaceholderPendingReviews(),
    };
  }
}

export default async function MentorDashboardPage() {
  const data = await getMentorData();

  return (
    <DashboardLayout
      user={data.user}
      role="mentor"
      roleLabel="Mentor"
      roleIcon="👨‍🏫"
    >
      <MentorDashboardClient initialData={data} />
    </DashboardLayout>
  );
}

