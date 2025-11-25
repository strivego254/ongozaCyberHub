/**
 * Organizations hook
 * Fetches and manages organization data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { djangoClient } from '../services/djangoClient';
import type { Organization } from '../services/types';

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await djangoClient.organizations.listOrganizations();
      setOrganizations(response.results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch organizations'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    isLoading,
    error,
    refetch: fetchOrganizations,
  };
}

export function useOrganization(slug: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrganization = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const org = await djangoClient.organizations.getOrganization(slug);
      setOrganization(org);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch organization'));
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchOrganization();
    }
  }, [slug, fetchOrganization]);

  return {
    organization,
    isLoading,
    error,
    refetch: fetchOrganization,
  };
}

