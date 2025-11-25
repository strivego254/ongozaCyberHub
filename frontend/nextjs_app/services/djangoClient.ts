/**
 * Django API Client
 * Type-safe functions for Django backend endpoints
 */

import { apiGateway } from './apiGateway';
import type {
  User,
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
     */
    async getCurrentUser(): Promise<User> {
      return apiGateway.get('/auth/me');
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
     */
    async listUsers(params?: { page?: number; page_size?: number }): Promise<{ results: User[]; count: number }> {
      return apiGateway.get('/users', { params });
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

