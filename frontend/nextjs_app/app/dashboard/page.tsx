/**
 * Main Dashboard Page - Role-Based Redirect
 * Redirects to role-specific dashboard based on user roles
 */

import { redirect } from 'next/navigation';
import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';

async function getUserRole() {
  try {
    const headers = await getServerAuthHeaders();
    if (!headers.Authorization) {
      redirect('/login');
    }

    const user = await djangoClient.auth.getCurrentUser();
    const roles = user.roles || [];
    
    // Determine primary role (mentee is default for new users)
    if (roles.some((r: any) => r.role === 'admin')) {
      return 'admin';
    } else if (roles.some((r: any) => r.role === 'program_director')) {
      return 'director';
    } else if (roles.some((r: any) => r.role === 'mentor')) {
      return 'mentor';
    } else if (roles.some((r: any) => r.role === 'analyst')) {
      return 'analyst';
    } else if (roles.some((r: any) => r.role === 'sponsor_admin' || r.role === 'sponsor')) {
      return 'sponsor';
    } else if (roles.some((r: any) => r.role === 'mentee')) {
      return 'mentee';
    } else {
      // Default to mentee for new users
      return 'mentee';
    }
  } catch (error) {
    redirect('/login');
  }
}

export default async function DashboardPage() {
  const role = await getUserRole();
  
  // Redirect to role-specific dashboard
  redirect(`/dashboard/${role}`);
}
