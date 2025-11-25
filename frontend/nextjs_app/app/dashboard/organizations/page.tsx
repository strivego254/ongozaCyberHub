/**
 * Organizations Page - SSR Example
 * Fetches organizations server-side and hydrates client
 */

import { djangoClient } from '@/services/djangoClient';
import { getServerAuthHeaders } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import OrganizationsClient from './organizations-client';
import type { Organization } from '@/services/types';

async function getOrganizations(): Promise<Organization[]> {
  try {
    // Get auth headers for server-side fetch
    const headers = await getServerAuthHeaders();
    
    if (!headers.Authorization) {
      redirect('/login');
    }

    // Fetch organizations server-side
    const response = await djangoClient.organizations.listOrganizations();
    return response.results || [];
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return [];
  }
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Organizations</h1>
      <OrganizationsClient initialOrganizations={organizations} />
    </div>
  );
}

