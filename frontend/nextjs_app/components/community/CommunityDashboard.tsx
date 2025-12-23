/**
 * Community Dashboard Component
 * Role-based community interface with University Communities and Global Feed
 * Implements RBAC for different role entitlements
 */

'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserRoles, getPrimaryRole, type Role } from '@/utils/rbac';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UniversityCommunityView } from './UniversityCommunityView';
import { GlobalFeedView } from './GlobalFeedView';
import { CommunityLeaderboard } from './CommunityLeaderboard';
import { CreatePostModal } from './CreatePostModal';
import { Users, Globe, Trophy, Plus, Settings, Shield } from 'lucide-react';

type TabType = 'university' | 'global' | 'leaderboard';

interface CommunityPermissions {
  canPost: boolean;
  canComment: boolean;
  canReact: boolean;
  canModerate: boolean;
  canPinEvents: boolean;
  canApproveTracks: boolean;
  canManageMentors: boolean;
  canViewAnalytics: boolean;
  canModerateAll: boolean;
  canManageUniversities: boolean;
  readOnlyAccess: boolean; // For students viewing other universities
}

/**
 * Get community permissions based on user role
 */
function getCommunityPermissions(roles: Role[], primaryRole: Role | null): CommunityPermissions {
  const hasRole = (role: Role) => roles.includes(role);
  const isStudent = hasRole('student') || hasRole('mentee');
  const isMentor = hasRole('mentor');
  const isFaculty = hasRole('mentor'); // Faculty uses mentor role
  const isDirector = hasRole('program_director');
  const isAdmin = hasRole('admin');
  const isEmployer = hasRole('employer');
  const isFinance = hasRole('finance');

  // Employers and Finance have no community access
  if (isEmployer || isFinance) {
    return {
      canPost: false,
      canComment: false,
      canReact: false,
      canModerate: false,
      canPinEvents: false,
      canApproveTracks: false,
      canManageMentors: false,
      canViewAnalytics: false,
      canModerateAll: false,
      canManageUniversities: false,
      readOnlyAccess: false,
    };
  }

  // Students: Full access to their university, read-only for others
  if (isStudent) {
    return {
      canPost: true,
      canComment: true,
      canReact: true,
      canModerate: false,
      canPinEvents: false,
      canApproveTracks: false,
      canManageMentors: false,
      canViewAnalytics: false,
      canModerateAll: false,
      canManageUniversities: false,
      readOnlyAccess: true, // Read-only for other universities
    };
  }

  // Faculty/Mentors: Moderate their university
  if (isFaculty || isMentor) {
    return {
      canPost: true,
      canComment: true,
      canReact: true,
      canModerate: true, // Their university only
      canPinEvents: true,
      canApproveTracks: false,
      canManageMentors: false,
      canViewAnalytics: true, // Their university analytics
      canModerateAll: false,
      canManageUniversities: false,
      readOnlyAccess: false,
    };
  }

  // Program Directors: Beyond faculty permissions
  if (isDirector) {
    return {
      canPost: true,
      canComment: true,
      canReact: true,
      canModerate: true,
      canPinEvents: true,
      canApproveTracks: true,
      canManageMentors: true,
      canViewAnalytics: true, // Track-level analytics
      canModerateAll: false,
      canManageUniversities: false,
      readOnlyAccess: false,
    };
  }

  // Admins: Full platform oversight
  if (isAdmin) {
    return {
      canPost: true,
      canComment: true,
      canReact: true,
      canModerate: true,
      canPinEvents: true,
      canApproveTracks: true,
      canManageMentors: true,
      canViewAnalytics: true,
      canModerateAll: true, // All content
      canManageUniversities: true,
      readOnlyAccess: false,
    };
  }

  // Default: minimal access
  return {
    canPost: false,
    canComment: false,
    canReact: false,
    canModerate: false,
    canPinEvents: false,
    canApproveTracks: false,
    canManageMentors: false,
    canViewAnalytics: false,
    canModerateAll: false,
    canManageUniversities: false,
    readOnlyAccess: true,
  };
}

export function CommunityDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('university');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const roles = useMemo(() => getUserRoles(user), [user]);
  const primaryRole = useMemo(() => getPrimaryRole(user), [user]);
  const permissions = useMemo(() => getCommunityPermissions(roles, primaryRole), [roles, primaryRole]);

  // Don't show community for employers or finance
  if (roles.includes('employer') || roles.includes('finance')) {
    return (
      <Card className="border-och-orange/50">
        <div className="p-6 text-center">
          <Shield className="w-12 h-12 text-och-orange mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Community Access Restricted</h3>
          <p className="text-och-steel">
            {roles.includes('employer')
              ? 'Employers access student profiles through the Marketplace integration.'
              : 'Finance role does not have access to community features.'}
          </p>
        </div>
      </Card>
    );
  }

  const roleDisplayName = primaryRole
    ? primaryRole.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'User';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Community</h1>
            <p className="text-och-steel">
              Connect, learn, and grow with your university and the OCH ecosystem
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="defender">{roleDisplayName}</Badge>
              {permissions.canModerate && (
                <Badge variant="mint" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Moderator
                </Badge>
              )}
              {permissions.canModerateAll && (
                <Badge variant="gold" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Platform Admin
                </Badge>
              )}
            </div>
          </div>
          {permissions.canPost && (
            <Button
              variant="defender"
              onClick={() => setShowCreatePost(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-och-steel/20">
          <button
            onClick={() => setActiveTab('university')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'university'
                ? 'text-och-defender border-och-defender'
                : 'text-och-steel border-transparent hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              My University
            </div>
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'global'
                ? 'text-och-defender border-och-defender'
                : 'text-och-steel border-transparent hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Global Feed
              {permissions.readOnlyAccess && (
                <Badge variant="steel" className="text-xs ml-1">Read Only</Badge>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'leaderboard'
                ? 'text-och-defender border-och-defender'
                : 'text-och-steel border-transparent hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'university' && (
          <UniversityCommunityView
            userId={user?.id}
            permissions={permissions}
            roles={roles}
          />
        )}
        {activeTab === 'global' && (
          <GlobalFeedView
            userId={user?.id}
            permissions={permissions}
            roles={roles}
          />
        )}
        {activeTab === 'leaderboard' && (
          <CommunityLeaderboard
            userId={user?.id}
            permissions={permissions}
            roles={roles}
          />
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && permissions.canPost && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          userId={user?.id}
          permissions={permissions}
        />
      )}
    </div>
  );
}




