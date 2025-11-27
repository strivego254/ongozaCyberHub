/**
 * Mentee Dashboard Client Component
 * Comprehensive dashboard implementing all OCH subsystems
 * Philosophy: "Mentees do the work. We guide the transformation."
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Progress, RecommendationItem, Organization } from '@/services/types';
import ProfilerCard from '@/components/mentee/ProfilerCard';
import CoachingOSCard from '@/components/mentee/CoachingOSCard';
import AICoachCard from '@/components/mentee/AICoachCard';
import MissionsCard from '@/components/mentee/MissionsCard';
import PortfolioCard from '@/components/mentee/PortfolioCard';
import TalentScopeCard from '@/components/mentee/TalentScopeCard';
import CommunityCard from '@/components/mentee/CommunityCard';
import MentorshipCard from '@/components/mentee/MentorshipCard';
import CurriculumCard from '@/components/mentee/CurriculumCard';
import CalendarCard from '@/components/mentee/CalendarCard';

interface MenteeDashboardClientProps {
  initialData: {
    user: User;
    progress: Progress[];
    progressCount: number;
    recommendations: RecommendationItem[];
    organizations: Organization[];
  };
}

export default function MenteeDashboardClient({ initialData }: MenteeDashboardClientProps) {
  const router = useRouter();
  const { user, progress, progressCount, recommendations, organizations } = initialData;
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'portfolio' | 'coaching' | 'community'>('overview');

  // Calculate progress stats (handle empty states)
  const completedCount = progress?.filter((p: Progress) => p.status === 'completed').length || 0;
  const inProgressCount = progress?.filter((p: Progress) => p.status === 'in_progress').length || 0;
  const totalProgress = progress?.length || 0;
  const completionRate = totalProgress > 0 ? (completedCount / totalProgress) * 100 : 0;

  // Navigation tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'missions', label: 'Missions', icon: '🎯' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼' },
    { id: 'coaching', label: 'Coaching', icon: '🤝' },
    { id: 'community', label: 'Community', icon: '👥' },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-steel-grey pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-card font-semibold text-body-m
              transition-all duration-200 whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'bg-defender-blue text-white border-2 border-defender-blue'
                  : 'text-steel-grey hover:text-cyber-mint hover:border-cyber-mint border-2 border-transparent'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Hero Metrics - "Mentees do the work" */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card border-defender-blue">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-h3 text-white">Active Missions</h3>
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-3xl font-bold text-cyber-mint">{inProgressCount}</p>
              <p className="text-body-s text-steel-grey mt-1">In progress</p>
            </div>

            <div className="card border-cyber-mint">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-h3 text-white">Completed</h3>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-cyber-mint">{completedCount}</p>
              <p className="text-body-s text-steel-grey mt-1">Missions done</p>
            </div>

            <div className="card border-sahara-gold">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-h3 text-white">Progress</h3>
                <span className="text-2xl">📈</span>
              </div>
              <p className="text-3xl font-bold text-sahara-gold">{completionRate.toFixed(0)}%</p>
              <p className="text-body-s text-steel-grey mt-1">Completion rate</p>
            </div>

            <div className="card border-cyber-mint">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-h3 text-white">Portfolio Items</h3>
                <span className="text-2xl">💼</span>
              </div>
              <p className="text-3xl font-bold text-cyber-mint">0</p>
              <p className="text-body-s text-steel-grey mt-1">Evidence collected</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* OCH Profiler - Identity + Future-You */}
              <ProfilerCard user={user} />

              {/* AI Coach - Guidance & Nudges */}
              <AICoachCard recommendations={recommendations} />

              {/* Coaching OS - Habits + Goals */}
              <CoachingOSCard user={user} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* TalentScope Analytics */}
              <TalentScopeCard 
                progress={progress}
                completionRate={completionRate}
                user={user}
              />

              {/* Mentorship OS */}
              <MentorshipCard organizations={organizations} user={user} />

              {/* Calendar & Events */}
              <CalendarCard />
            </div>
          </div>

          {/* Full Width Components */}
          <div className="space-y-6">
            {/* Missions/MXP - Active Missions */}
            <MissionsCard 
              progress={progress}
              progressCount={progressCount}
            />

            {/* Portfolio Engine */}
            <PortfolioCard user={user} />

            {/* Community Engine */}
            <CommunityCard user={user} />

            {/* Curriculum Engine */}
            <CurriculumCard user={user} />
          </div>
        </div>
      )}

      {/* Missions Tab */}
      {activeTab === 'missions' && (
        <MissionsCard 
          progress={progress}
          progressCount={progressCount}
          showAll={true}
        />
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <PortfolioCard user={user} showAll={true} />
      )}

      {/* Coaching Tab */}
      {activeTab === 'coaching' && (
        <div className="space-y-6">
          <CoachingOSCard user={user} expanded={true} />
          <AICoachCard recommendations={recommendations} expanded={true} />
        </div>
      )}

      {/* Community Tab */}
      {activeTab === 'community' && (
        <div className="space-y-6">
          <CommunityCard user={user} expanded={true} />
          <MentorshipCard organizations={organizations} user={user} expanded={true} />
        </div>
      )}
    </div>
  );
}


