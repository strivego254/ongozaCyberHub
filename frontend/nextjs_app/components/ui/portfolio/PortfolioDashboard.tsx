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
import { PortfolioDashboardSkeleton } from './PortfolioSkeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { createClient } from '@/lib/supabase/client';
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
    items,
    healthMetrics,
    topSkills,
    pendingReviews,
    approvedItems,
    isLoading,
    error,
    refetch,
  } = usePortfolio(userId);

  const { settings, entitlements } = useSettingsMaster(userId);

  const [statusFilter, setStatusFilter] = useState<PortfolioItemStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PortfolioItemType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
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

  const healthScore = healthMetrics?.overallHealth || 0;

  if (isLoading && items.length === 0) {
    return <PortfolioDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 lg:px-10 lg:py-10">
      {error && (
        <div className="mb-6 animate-fade-in">
          <ErrorDisplay error={error} onRetry={refetch} />
        </div>
      )}

      {/* HERO: Health + Marketplace */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10"
      >
        {/* Portfolio Overview */}
        <Card className="lg:col-span-2 glass-card glass-card-hover">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-50 mb-2">
                  Portfolio
                </h1>
                <p className="text-slate-400">
                  Your verified proof of missions, projects, and mentor-scored work.
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">
                    {healthScore}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Health / 100
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-400">
                    {marketplaceStats.views}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Marketplace views
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Status Pill */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border border-emerald-500/40 glass-card-hover">
          <div className="p-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-400 mb-1">
                Marketplace status
              </p>
              <p className="text-xl font-semibold text-slate-50 capitalize">
                {marketplaceStats.profileStatus.replace('_', ' ')}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {marketplaceStats.contactEnabled
                  ? 'Employers can contact you directly.'
                  : 'Enable contact in Settings to receive employer messages.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => router.push('/settings')}
              >
                <Settings className="w-3 h-3 mr-1" />
                Adjust
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ACTIVITY + SKILLS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
      >
        {/* Recent Activity */}
        <Card className="glass-card glass-card-hover">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {items.slice(0, 6).map((item) => (
                <div key={item.id} className="text-sm flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-300 font-medium line-clamp-1">{item.title}</div>
                    <div className="text-slate-500 text-xs mt-1">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] ml-2">
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-slate-500 italic text-center py-4">
                  No items yet
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Skills Heatmap */}
        <PortfolioSkillsHeatmap topSkills={topSkills} />
      </motion.div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5 glass-card-hover mb-10">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Pending Reviews</h3>
            <div className="space-y-3">
              {pendingReviews.slice(0, 3).map((item) => (
                <div key={item.id} className="text-sm flex items-center justify-between p-2 rounded-lg hover:bg-yellow-500/10 transition-colors">
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
    </div>
  );
}
