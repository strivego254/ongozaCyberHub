/**
 * Hook for fetching and managing users (admin only)
 */

'use client';

import { useState, useEffect } from 'react';
import { djangoClient } from '@/services/djangoClient';
import type { User } from '@/services/types';

export function useUsers(params?: { page?: number; page_size?: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const response = await djangoClient.users.listUsers(params);
        setUsers(response.results);
        setTotalCount(response.count);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load users');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [params?.page, params?.page_size]);

  const updateUser = async (id: number, data: Partial<User>) => {
    try {
      const updated = await djangoClient.users.updateUser(id, data);
      setUsers(users.map(u => u.id === id ? updated : u));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      throw err;
    }
  };

  return {
    users,
    totalCount,
    isLoading,
    error,
    updateUser,
    refetch: () => {
      setIsLoading(true);
      return djangoClient.users.listUsers(params).then(response => {
        setUsers(response.results);
        setTotalCount(response.count);
        setIsLoading(false);
      });
    },
  };
}

