/**
 * Mentee Dashboard - OCH Brand Styled
 * Comprehensive dashboard for mentees with all subsystems
 * Philosophy: "Mentees do the work. We guide the transformation."
 */

import { getServerAuthHeaders, getServerAccessToken } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import MenteeDashboardClient from './mentee-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  getPlaceholderUser,
  getPlaceholderProgress,
  getPlaceholderRecommendations,
  getPlaceholderOrganizations,
  shouldUsePlaceholderData,
} from '@/services/placeholderData';

async function getMenteeData() {
  const usePlaceholder = process.env.NEXT_PUBLIC_USE_PLACEHOLDER_DATA === 'true';
  
  if (usePlaceholder) {
    return {
      user: getPlaceholderUser('mentee'),
      progress: getPlaceholderProgress(),
      progressCount: getPlaceholderProgress().length,
      recommendations: getPlaceholderRecommendations(),
      organizations: getPlaceholderOrganizations(),
    };
  }

  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
    const token = await getServerAccessToken();
    
    if (!token) {
      redirect('/login');
    }

    // Fetch user profile
    const userResponse = await fetch(`${DJANGO_API_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      // Fallback to placeholder data if backend is unavailable
      return {
        user: getPlaceholderUser('mentee'),
        progress: getPlaceholderProgress(),
        progressCount: getPlaceholderProgress().length,
        recommendations: getPlaceholderRecommendations(),
        organizations: getPlaceholderOrganizations(),
      };
    }

    const userData = await userResponse.json();
    const user = userData.user || userData; // Handle both response formats
    
    // Fetch all mentee data in parallel with error handling
    const [
      progress,
      recommendations,
      organizations,
    ] = await Promise.all([
      fetch(`${DJANGO_API_URL}/api/v1/progress/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then(res => res.ok ? res.json() : { results: [], count: 0 })
        .catch(() => ({ results: [], count: 0 })),
      (async () => {
        try {
          const FASTAPI_API_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8001';
          const recResponse = await fetch(`${FASTAPI_API_URL}/api/v1/recommendations?user_id=${user.id}&limit=5`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (recResponse.ok) {
            return await recResponse.json();
          }
          return null;
        } catch {
          return null;
        }
      })(),
      fetch(`${DJANGO_API_URL}/api/v1/orgs/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then(res => res.ok ? res.json() : { results: [], count: 0 })
        .catch(() => ({ results: [], count: 0 })),
    ]);

    return {
      user: {
        ...user,
        id: user.id || parseInt(user.id) || 0,
        first_name: user.first_name || user.name?.split(' ')[0] || '',
        last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
      },
      progress: progress.results || [],
      progressCount: progress.count || 0,
      recommendations: recommendations?.recommendations || [],
      organizations: organizations.results || [],
    };
  } catch (error) {
    console.error('Error fetching mentee data:', error);
    // Fallback to placeholder data on error
    return {
      user: getPlaceholderUser('mentee'),
      progress: getPlaceholderProgress(),
      progressCount: getPlaceholderProgress().length,
      recommendations: getPlaceholderRecommendations(),
      organizations: getPlaceholderOrganizations(),
    };
  }
}

export default async function MenteeDashboardPage() {
  const data = await getMenteeData();

  return (
    <DashboardLayout
      user={data.user}
      role="mentee"
      roleLabel="Mentee"
      roleIcon="🎯"
    >
      <MenteeDashboardClient initialData={data} />
    </DashboardLayout>
  );
}


