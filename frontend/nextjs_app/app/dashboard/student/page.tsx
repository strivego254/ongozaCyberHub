/**
 * Student Dashboard - OCH Brand Styled
 * Shows student-specific analytics and progress
 */

import { djangoClient } from '@/services/djangoClient';
import { fastapiClient } from '@/services/fastapiClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import StudentDashboardClient from './student-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  getPlaceholderUser,
  getPlaceholderProgress,
  getPlaceholderRecommendations,
} from '@/services/placeholderData';

async function getStudentData() {
  const usePlaceholder = process.env.NEXT_PUBLIC_USE_PLACEHOLDER_DATA === 'true';
  
  if (usePlaceholder) {
    return {
      user: getPlaceholderUser('student'),
      progress: getPlaceholderProgress(),
      progressCount: getPlaceholderProgress().length,
      recommendations: getPlaceholderRecommendations(),
    };
  }

  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, progress, recommendations] = await Promise.all([
      djangoClient.auth.getCurrentUser().catch(() => getPlaceholderUser('student')),
      djangoClient.progress.listProgress().catch(() => ({ results: getPlaceholderProgress(), count: getPlaceholderProgress().length })),
      (async () => {
        try {
          const user = await djangoClient.auth.getCurrentUser();
          return await fastapiClient.recommendations.getRecommendations({
            user_id: user.id,
            limit: 5,
          });
        } catch {
          return { recommendations: getPlaceholderRecommendations() };
        }
      })(),
    ]);

    return {
      user,
      progress: progress.results || getPlaceholderProgress(),
      progressCount: progress.count || getPlaceholderProgress().length,
      recommendations: recommendations?.recommendations || getPlaceholderRecommendations(),
    };
  } catch (error) {
    // Fallback to placeholder data
    return {
      user: getPlaceholderUser('student'),
      progress: getPlaceholderProgress(),
      progressCount: getPlaceholderProgress().length,
      recommendations: getPlaceholderRecommendations(),
    };
  }
}

export default async function StudentDashboardPage() {
  const data = await getStudentData();

  return (
    <DashboardLayout
      user={data.user}
      role="student"
      roleLabel="Student"
      roleIcon="🎓"
    >
      <StudentDashboardClient initialData={data} />
    </DashboardLayout>
  );
}

