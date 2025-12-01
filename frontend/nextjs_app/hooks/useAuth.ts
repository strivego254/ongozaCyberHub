/**
 * Authentication hook
 * Manages login, logout, token refresh, and user session
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { djangoClient } from '../services/djangoClient';
import { setAuthTokens, clearAuthTokens, getAccessToken, isAuthenticated } from '../utils/auth';
import type { LoginRequest, User } from '../services/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  /**
   * Load current user from API
   */
  const loadUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await djangoClient.auth.getCurrentUser();
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      // Token invalid or expired
      clearAuthTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      // Call Next.js API route (sets HttpOnly cookies)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || errorData.error || 'Login failed');
        (error as any).data = errorData;
        throw error;
      }

      const { user, access_token } = await response.json();
      
      // Store access token in localStorage for client-side requests
      // Refresh token is already in HttpOnly cookie
      if (access_token) {
        localStorage.setItem('access_token', access_token);
      }
      
      // Fetch full user profile with roles from /auth/me
      // Wait a bit to ensure token is stored and available
      let fullUser = user;
      if (access_token) {
        try {
          // Wait for localStorage to be updated and ensure token is available
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // Verify token is in localStorage before making request
          const storedToken = localStorage.getItem('access_token');
          if (storedToken && storedToken === access_token) {
            console.log('Fetching full user profile from /auth/me...');
            fullUser = await djangoClient.auth.getCurrentUser();
            console.log('Full user profile received:', fullUser);
          } else {
            console.warn('Token not available in localStorage yet, using login response user');
            console.warn('Expected token:', access_token?.substring(0, 20) + '...');
            console.warn('Stored token:', storedToken?.substring(0, 20) + '...');
          }
        } catch (err: any) {
          // If /auth/me fails, use the user from login response
          console.error('Failed to fetch full user profile:', err?.message || err);
          console.error('Error details:', err);
          // The user from login response should still work, but might not have roles
        }
      }
      
      setState({
        user: fullUser,
        isLoading: false,
        isAuthenticated: true,
      });
      
      console.log('Login successful, returning user:', fullUser);
      return { user: fullUser };
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Call Next.js API route (clears HttpOnly cookies)
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      clearAuthTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
      router.push('/login');
    }
  }, [router]);

  /**
   * Refresh access token
   */
  const refresh = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await djangoClient.auth.refreshToken({ refresh_token: refreshToken });
      setAuthTokens(response.access_token, response.refresh_token);
      return response;
    } catch (error) {
      clearAuthTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
      throw error;
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    ...state,
    login,
    logout,
    refresh,
    reloadUser: loadUser,
  };
}

