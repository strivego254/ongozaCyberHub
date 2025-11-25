/**
 * Organizations Client Component - CSR Example
 * Handles client-side mutations and real-time updates
 */

'use client';

import { useState } from 'react';
import { djangoClient } from '@/services/djangoClient';
import type { Organization, CreateOrganizationRequest } from '@/services/types';

interface OrganizationsClientProps {
  initialOrganizations: Organization[];
}

export default function OrganizationsClient({ initialOrganizations }: OrganizationsClientProps) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrganization = async (data: CreateOrganizationRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const newOrg = await djangoClient.organizations.createOrganization(data);
      setOrganizations([...organizations, newOrg]);
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold">{org.name}</h3>
            <p className="text-gray-600 text-sm">{org.description}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {org.org_type}
            </span>
          </div>
        ))}
      </div>

      {/* Create organization form would go here */}
    </div>
  );
}

