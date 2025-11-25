/**
 * Student Dashboard - OCH Brand Styled
 * Shows student-specific analytics and progress
 */

import { djangoClient } from '@/services/djangoClient';
import { fastapiClient } from '@/services/fastapiClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import StudentDashboardClient from './student-client';

async function getStudentData() {
  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const [user, progress, recommendations] = await Promise.all([
      djangoClient.auth.getCurrentUser(),
      djangoClient.progress.listProgress().catch(() => ({ results: [], count: 0 })),
      (async () => {
        try {
          const user = await djangoClient.auth.getCurrentUser();
          return await fastapiClient.recommendations.getRecommendations({
            user_id: user.id,
            limit: 5,
          });
        } catch {
          return null;
        }
      })(),
    ]);

    return {
      user,
      progress: progress.results || [],
      progressCount: progress.count || 0,
      recommendations: recommendations?.recommendations || [],
    };
  } catch (error) {
    redirect('/login');
  }
}

export default async function StudentDashboardPage() {
  const data = await getStudentData();

  return (
    <div className="min-h-screen bg-och-midnight">
      {/* Header */}
      <header className="border-b border-steel-grey bg-och-midnight sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-h2 text-white">Student Dashboard</h1>
              <p className="text-body-s text-steel-grey mt-1">Welcome back, {data.user.first_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="badge-beginner">🎓 Student</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <StudentDashboardClient initialData={data} />
      </main>
    </div>
  );
}

