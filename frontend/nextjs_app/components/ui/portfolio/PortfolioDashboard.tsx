/**
 * Portfolio Dashboard Component
 * Modern SaaS control center - "Proof of transformation" hub
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Filter, Eye, Settings, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { PortfolioItemCard } from './PortfolioItemCard';
import { PortfolioHealthCard } from './PortfolioHealthCard';
import { PortfolioSkillsHeatmap } from './PortfolioSkillsHeatmap';
import { PortfolioSkillsRadar } from './PortfolioSkillsRadar';
import { PortfolioTimeline } from './PortfolioTimeline';
import { EmployerPreviewFAB } from './EmployerPreviewFAB';
import { PortfolioDashboardSkeleton } from './PortfolioSkeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { usePortfolioTimeline } from '@/hooks/usePortfolioTimeline';
import { createClient } from '@/lib/supabase/client';
import { getMarketplaceRank } from '@/lib/portfolio/api';
import { useQuery } from '@tanstack/react-query';
import type { PortfolioItem, PortfolioItemStatus, PortfolioItemType } from '@/lib/portfolio/types';

export function PortfolioDashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);
  
  const {
    items = [],
    healthMetrics,
    topSkills = [],
    pendingReviews = [],
    approvedItems = [],
    isLoading,
    error,
    refetch,
  } = usePortfolio(userId);

  const { settings, entitlements } = useSettingsMaster(userId);
  const { timelineData } = usePortfolioTimeline(userId);

  // Fetch marketplace rank
  const { data: marketplaceRank = 999 } = useQuery({
    queryKey: ['marketplace-rank', userId],
    queryFn: async () => {
      if (!userId) return 999;
      return getMarketplaceRank(userId);
    },
    enabled: !!userId,
    staleTime: 300000, // 5 minutes
  });

  const [statusFilter, setStatusFilter] = useState<PortfolioItemStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PortfolioItemType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter items by status, type, and visibility (from Settings)
  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    
    // Settings integration: Filter by visibility preference
    if (settings?.portfolioVisibilityFilter) {
      const visibilityFilter = settings.portfolioVisibilityFilter;
      if (visibilityFilter === 'marketplace_only' && item.visibility !== 'marketplace_preview' && item.visibility !== 'public') {
        return false;
      }
      if (visibilityFilter === 'public_only' && item.visibility !== 'public') {
        return false;
      }
    }
    
    return true;
  });

  // Calculate marketplace stats
  const marketplaceStats = {
    views: items.reduce((sum, item) => sum + item.marketplaceViews, 0),
    profileStatus: settings?.profileCompleteness >= 90 
      ? 'job_ready' 
      : settings?.profileCompleteness >= 70 
      ? 'emerging' 
      : 'foundation',
    contactEnabled: settings?.marketplaceContactEnabled || false,
  };

  // Convert health score from 0-10 to 0-100
  const healthScore = healthMetrics?.healthScore ? Math.round(healthMetrics.healthScore * 10) : 0;

  // Debug logging
  useEffect(() => {
    console.log('Portfolio Dashboard Data:', {
      userId,
      itemsCount: items.length,
      items: items.slice(0, 2), // First 2 items for debugging
      healthMetrics,
      topSkills: topSkills.slice(0, 3),
      isLoading,
      error,
    });
  }, [userId, items, healthMetrics, topSkills, isLoading, error]);

  // Show skeleton only on initial load
  if (isLoading && items.length === 0 && !error) {
    return <PortfolioDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 lg:px-10 lg:py-10">
      {error && (
        <div className="mb-6 animate-fade-in">
          <ErrorDisplay error={error} onRetry={refetch} />
        </div>
      )}

      {/* HERO: PORTFOLIO HEALTH 87/100 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-12"
      >
        <PortfolioHealthCard
          healthScore={healthScore}
          totalItems={items.length}
          approvedItems={approvedItems.length}
          marketplaceRank={marketplaceRank}
        />
      </motion.div>

      {/* 3-COLUMN MIDDLE SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12"
      >
        <div className="xl:col-span-1 space-y-6">
          <PortfolioTimeline data={timelineData} />
          {pendingReviews.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5 glass-card-hover">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-yellow-400" />
                  Pending Reviews ({pendingReviews.length})
                </h3>
                <div className="space-y-3">
                  {pendingReviews.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="text-sm flex items-center justify-between p-3 rounded-lg hover:bg-yellow-500/10 transition-colors border border-yellow-500/20 cursor-pointer"
                      onClick={() => router.push(`/portfolio/${item.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-300 font-medium line-clamp-1">{item.title}</div>
                        <div className="text-yellow-400 text-xs mt-1">Awaiting mentor review</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
        <div className="xl:col-span-1">
          <PortfolioSkillsRadar skills={topSkills} />
        </div>
      </motion.div>


      {/* FILTERS AND ACTIONS */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="glass-card-hover"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          {showFilters && (
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PortfolioItemStatus | 'all')}
                className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/70 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as PortfolioItemType | 'all')}
                className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/70 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
              >
                <option value="all">All Types</option>
                <option value="mission">Mission</option>
                <option value="reflection">Reflection</option>
                <option value="certification">Certification</option>
                <option value="github">GitHub</option>
                <option value="thm">TryHackMe</option>
                <option value="external">External</option>
              </select>
            </div>
          )}
        </div>

        <Button 
          variant="defender" 
          onClick={() => {/* TODO: Open create modal */}}
          className="glass-card-hover"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Item
        </Button>
      </div>

      {/* ITEMS GRID */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-6">All Portfolio Items</h2>
        
        {filteredItems.length === 0 ? (
          <Card className="glass-card">
            <div className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                {statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No items match your filters'
                  : 'No portfolio items yet'}
              </h3>
              <p className="text-slate-500 mb-4 max-w-md mx-auto">
                {statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more items.'
                  : 'Portfolio items showcase your cybersecurity achievements. They\'re automatically created when you complete missions, or you can add them manually.'}
              </p>
              {statusFilter === 'all' && typeFilter === 'all' && (
                <div className="space-y-3">
                  <div className="bg-slate-800/50 rounded-lg p-4 max-w-md mx-auto text-left">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      How to get portfolio items:
                    </h4>
                    <ul className="text-xs text-slate-400 space-y-1.5">
                      <li>• Complete missions - items are auto-created</li>
                      <li>• Import from GitHub repositories</li>
                      <li>• Add certifications and achievements</li>
                      <li>• Connect TryHackMe for automatic imports</li>
                    </ul>
                  </div>
                  <Button variant="defender" onClick={() => {/* TODO: Open create modal */}}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Item
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <PortfolioItemCard
                  item={item}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB: Employer Preview */}
      <EmployerPreviewFAB />
    </div>
  );
}
