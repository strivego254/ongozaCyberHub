/**
 * Placeholder Data Service
 * Provides mock data for development when backend is unavailable
 */

import type {
  User,
  Progress,
  RecommendationItem,
  Organization,
} from './types';

const MOCK_USER: User = {
  id: 1,
  email: 'mentee@example.com',
  username: 'mentee_user',
  first_name: 'John',
  last_name: 'Doe',
  bio: 'Aspiring cybersecurity professional',
  avatar_url: undefined,
  phone_number: '+1234567890',
  country: 'Kenya',
  timezone: 'Africa/Nairobi',
  language: 'en',
  cohort_id: 'cohort-2024-01',
  track_key: 'defender',
  org_id: 1,
  account_status: 'active',
  email_verified: true,
  mfa_enabled: false,
  risk_level: 'low',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  roles: [{ role: 'mentee', scope: 'global' }],
  preferred_learning_style: 'visual',
  career_goals: 'Become a cybersecurity analyst and eventually a security architect',
  cyber_exposure_level: 'beginner',
};

const MOCK_PROGRESS: Progress[] = [
  {
    id: 1,
    user: 1,
    content_id: 'mission-001',
    content_type: 'mission',
    status: 'in_progress',
    completion_percentage: 45,
    score: undefined,
    started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: undefined,
    metadata: { difficulty: 'beginner', track: 'defender' },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    user: 1,
    content_id: 'mission-002',
    content_type: 'mission',
    status: 'completed',
    completion_percentage: 100,
    score: 85,
    started_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { difficulty: 'beginner', track: 'defender' },
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    user: 1,
    content_id: 'mission-003',
    content_type: 'mission',
    status: 'not_started',
    completion_percentage: 0,
    score: undefined,
    started_at: undefined,
    completed_at: undefined,
    metadata: { difficulty: 'intermediate', track: 'defender' },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  {
    content_id: 'mission-003',
    content_type: 'mission',
    title: 'Network Security Fundamentals',
    description: 'Learn the basics of network security and protocols',
    score: 0.92,
    reason: 'Matches your learning style and current progress',
    metadata: { difficulty: 'beginner' },
  },
  {
    content_id: 'mission-004',
    content_type: 'mission',
    title: 'Introduction to Cryptography',
    description: 'Understand encryption and cryptographic principles',
    score: 0.88,
    reason: 'Builds on your completed missions',
    metadata: { difficulty: 'beginner' },
  },
  {
    content_id: 'mission-005',
    content_type: 'mission',
    title: 'Security Operations Basics',
    description: 'Get started with security operations and monitoring',
    score: 0.85,
    reason: 'Aligned with your career goals',
    metadata: { difficulty: 'intermediate' },
  },
];

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 1,
    name: 'Cyber Defense Academy',
    slug: 'cyber-defense-academy',
    description: 'Leading cybersecurity training organization',
    org_type: 'sponsor',
    website_url: 'https://example.com',
    logo_url: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Get placeholder user data
 */
export function getPlaceholderUser(role: string = 'mentee'): User {
  return {
    ...MOCK_USER,
    roles: [{ role, scope: 'global' }],
    email: `${role}@example.com`,
    username: `${role}_user`,
    first_name: role.charAt(0).toUpperCase() + role.slice(1),
  };
}

/**
 * Get placeholder progress data
 */
export function getPlaceholderProgress(): Progress[] {
  return MOCK_PROGRESS;
}

/**
 * Get placeholder recommendations
 */
export function getPlaceholderRecommendations(): RecommendationItem[] {
  return MOCK_RECOMMENDATIONS;
}

/**
 * Get placeholder organizations
 */
export function getPlaceholderOrganizations(): Organization[] {
  return MOCK_ORGANIZATIONS;
}

/**
 * Get placeholder audit stats
 */
export function getPlaceholderAuditStats() {
  return {
    total: 1250,
    success: 1180,
    failure: 70,
    action_counts: {
      user_login: 450,
      user_logout: 450,
      role_assigned: 120,
      role_revoked: 30,
      org_created: 15,
      org_updated: 85,
      progress_created: 100,
    },
  };
}

/**
 * Get placeholder mentee count
 */
export function getPlaceholderMenteeCount(): number {
  return 12;
}

/**
 * Get placeholder pending reviews
 */
export function getPlaceholderPendingReviews(): number {
  return 5;
}

/**
 * Get placeholder sponsored student count
 */
export function getPlaceholderSponsoredStudentCount(): number {
  return 25;
}

/**
 * Check if we should use placeholder data
 */
export function shouldUsePlaceholderData(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check environment variable
    return process.env.NEXT_PUBLIC_USE_PLACEHOLDER_DATA === 'true';
  }
  // Client-side: check localStorage or default to false
  return localStorage.getItem('usePlaceholderData') === 'true';
}

