/**
 * Django API Client
 * Type-safe functions for Django backend endpoints
 */

import { apiGateway } from './apiGateway';
import type {
  User,
  UserRole,
  SignupRequest,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ConsentUpdate,
  PasswordResetRequest,
  PasswordResetConfirm,
  Organization,
  CreateOrganizationRequest,
  AddMemberRequest,
  Progress,
  CreateProgressRequest,
  UpdateProgressRequest,
} from './types';

/**
 * Django API Client
 */
export const djangoClient = {
  /**
   * Authentication endpoints
   */
  auth: {
    /**
     * Sign up a new user
     */
    async signup(data: SignupRequest): Promise<{ detail: string; user_id: number }> {
      return apiGateway.post('/auth/signup', data, { skipAuth: true });
    },

    /**
     * Login and get tokens
     */
    async login(data: LoginRequest): Promise<LoginResponse> {
      return apiGateway.post('/auth/login', data, { skipAuth: true });
    },

    /**
     * Request magic link
     */
    async requestMagicLink(email: string): Promise<{ detail: string }> {
      return apiGateway.post('/auth/login/magic-link', { email }, { skipAuth: true });
    },

    /**
     * Get current user profile
     * Returns user with roles, consents, and entitlements
     * Backend returns: { user: {...}, roles: [...], consent_scopes: [...], entitlements: [...] }
     */
    async getCurrentUser(): Promise<User & { roles?: UserRole[]; consent_scopes?: string[]; entitlements?: string[] }> {
      const response = await apiGateway.get<{ user: any; roles?: UserRole[]; consent_scopes?: string[]; entitlements?: string[] }>('/auth/me');
      console.log('getCurrentUser response:', response);
      
      // Backend returns: { user: {...}, roles: [...], consent_scopes: [...], entitlements: [...] }
      // We need to merge roles into the user object
      const userData = response.user || response;
      const mergedUser = {
        ...userData,
        roles: response.roles || userData.roles || [],
        consent_scopes: response.consent_scopes || userData.consent_scopes || [],
        entitlements: response.entitlements || userData.entitlements || [],
      };
      
      console.log('Merged user with roles:', mergedUser);
      return mergedUser as User & { roles?: UserRole[]; consent_scopes?: string[]; entitlements?: string[] };
    },

    /**
     * Refresh access token
     */
    async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
      return apiGateway.post('/auth/token/refresh', data, { skipAuth: true });
    },

    /**
     * Logout
     */
    async logout(refreshToken: string): Promise<{ detail: string }> {
      return apiGateway.post('/auth/logout', { refresh_token: refreshToken });
    },

    /**
     * Update consent scopes
     */
    async updateConsent(data: ConsentUpdate): Promise<{ detail: string }> {
      return apiGateway.post('/auth/consents', data);
    },

    /**
     * Request password reset
     */
    async requestPasswordReset(data: PasswordResetRequest): Promise<{ detail: string }> {
      return apiGateway.post('/auth/password/reset/request', data, { skipAuth: true });
    },

    /**
     * Confirm password reset
     */
    async confirmPasswordReset(data: PasswordResetConfirm): Promise<{ detail: string }> {
      return apiGateway.post('/auth/password/reset/confirm', data, { skipAuth: true });
    },

    /**
     * Enroll in MFA
     */
    async enrollMFA(data: { method: 'totp' | 'sms'; phone_number?: string }): Promise<{
      mfa_method_id: string;
      secret: string;
      qr_code_uri: string;
    }> {
      return apiGateway.post('/auth/mfa/enroll', data);
    },

    /**
     * Verify MFA code
     */
    async verifyMFA(data: { code: string; method: 'totp' | 'sms' }): Promise<{
      detail: string;
      backup_codes?: string[];
    }> {
      return apiGateway.post('/auth/mfa/verify', data);
    },

    /**
     * Disable MFA
     */
    async disableMFA(): Promise<{ detail: string }> {
      return apiGateway.post('/auth/mfa/disable', {});
    },

    /**
     * SSO login (redirect to provider)
     */
    async ssoLogin(provider: 'google' | 'microsoft' | 'apple' | 'okta'): Promise<void> {
      // SSO redirects to external provider, so we return the redirect URL
      window.location.href = `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}/api/v1/auth/sso/${provider}`;
    },
  },

  /**
   * User endpoints
   */
  users: {
    /**
     * Get user by ID
     */
    async getUser(id: number): Promise<User> {
      return apiGateway.get(`/users/${id}`);
    },

    /**
     * List users (admin only)
     * @param params - Optional query parameters including page, page_size, and role
     */
    async listUsers(params?: { 
      page?: number
      page_size?: number
      role?: string
      search?: string
    }): Promise<{ results: User[]; count: number; next?: string | null; previous?: string | null }> {
      return apiGateway.get('/users', { params });
    },

    /**
     * Update user profile
     */
    async updateUser(id: number, data: Partial<User>): Promise<User> {
      return apiGateway.patch(`/users/${id}/`, data);
    },

    /**
     * Delete user
     */
    async deleteUser(id: number): Promise<void> {
      return apiGateway.delete(`/users/${id}/`);
    },

  },

  /**
   * Role endpoints
   */
  roles: {
    /**
     * List all roles
     */
    async listRoles(): Promise<{ results: Array<{ id: number; name: string; display_name: string; description: string }> }> {
      return apiGateway.get('/roles');
    },

    /**
     * Assign role to user
     */
    async assignRole(userId: number, data: { role_id: number; scope?: string; scope_ref?: string }): Promise<{ detail: string; user_role: any }> {
      return apiGateway.post(`/users/${userId}/roles`, data);
    },

    /**
     * Revoke role from user
     */
    async revokeRole(userId: number, roleId: number): Promise<{ detail: string }> {
      return apiGateway.delete(`/users/${userId}/roles/${roleId}`);
    },
  },

  /**
   * Organization endpoints
   */
  organizations: {
    /**
     * List organizations
     */
    async listOrganizations(): Promise<{ results: Organization[]; count: number }> {
      return apiGateway.get('/orgs');
    },

    /**
     * Get organization by slug
     */
    async getOrganization(slug: string): Promise<Organization> {
      return apiGateway.get(`/orgs/${slug}`);
    },

    /**
     * Create organization
     */
    async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
      return apiGateway.post('/orgs', data);
    },

    /**
     * Add member to organization
     */
    async addMember(slug: string, data: AddMemberRequest): Promise<{ detail: string }> {
      return apiGateway.post(`/orgs/${slug}/members`, data);
    },
  },

  /**
   * Progress endpoints
   */
  progress: {
    /**
     * List progress records
     */
    async listProgress(params?: { user?: number; content_type?: string }): Promise<{ results: Progress[]; count: number }> {
      return apiGateway.get('/progress', { params });
    },

    /**
     * Get progress by ID
     */
    async getProgress(id: number): Promise<Progress> {
      return apiGateway.get(`/progress/${id}`);
    },

    /**
     * Create progress record
     */
    async createProgress(data: CreateProgressRequest): Promise<Progress> {
      return apiGateway.post('/progress', data);
    },

    /**
     * Update progress record
     */
    async updateProgress(id: number, data: UpdateProgressRequest): Promise<Progress> {
      return apiGateway.patch(`/progress/${id}`, data);
    },

    /**
     * Delete progress record
     */
    async deleteProgress(id: number): Promise<void> {
      return apiGateway.delete(`/progress/${id}`);
    },
  },

  /**
   * API Key endpoints
   */
  apiKeys: {
    /**
     * List API keys
     */
    async listApiKeys(): Promise<Array<{ id: number; name: string; key_prefix: string; created_at: string }>> {
      return apiGateway.get('/api-keys');
    },

    /**
     * Create API key
     */
    async createApiKey(data: { name: string; key_type: string; scopes?: string[] }): Promise<{
      id: number;
      name: string;
      key_prefix: string;
      key: string;
      detail: string;
    }> {
      return apiGateway.post('/api-keys', data);
    },

    /**
     * Revoke API key
     */
    async revokeApiKey(id: number): Promise<{ detail: string }> {
      return apiGateway.delete(`/api-keys/${id}`);
    },
  },

  /**
   * Audit log endpoints
   */
  audit: {
    /**
     * List audit logs
     */
    async listAuditLogs(params?: {
      start_date?: string;
      end_date?: string;
      action?: string;
      resource_type?: string;
      result?: string;
    }): Promise<Array<any>> {
      return apiGateway.get('/audit-logs', { params });
    },

    /**
     * Get audit log statistics
     */
    async getAuditStats(): Promise<{ total: number; success: number; failure: number; action_counts: Record<string, number> }> {
      return apiGateway.get('/audit-logs/stats');
    },
  },
};

export default djangoClient;

