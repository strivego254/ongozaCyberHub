/**
 * User types matching Django DRF UserSerializer
 * These types should stay in sync with backend/django_app/users/serializers.py
 */

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  phone_number?: string;
  country?: string;
  timezone: string;
  language: string;
  cohort_id?: string;
  track_key?: string;
  org_id?: number;
  account_status: 'pending_verification' | 'active' | 'suspended' | 'deactivated' | 'erased';
  email_verified: boolean;
  mfa_enabled: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles?: UserRole[];
  consent_scopes?: string[];
  entitlements?: string[];
  // Mentee onboarding fields (for TalentScope baseline)
  preferred_learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
  career_goals?: string;
  cyber_exposure_level?: 'none' | 'beginner' | 'intermediate' | 'advanced';
}

export interface UserRole {
  role: string;
  scope: 'global' | 'org' | 'cohort' | 'track';
  scope_ref?: string;
}

export interface SignupRequest {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  country?: string;
  timezone?: string;
  language?: string;
  passwordless?: boolean;
  invite_token?: string;
  cohort_id?: string;
  track_key?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
  code?: string;
  device_fingerprint?: string;
  device_name?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
  device_fingerprint?: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface ConsentUpdate {
  scope_type: string;
  granted: boolean;
  expires_at?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

