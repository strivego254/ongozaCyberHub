/**
 * Employer Preview Modal Component
 * Preview portfolio as an employer would see it
 */

'use client';

import { useState } from 'react';
import { X, Eye, Mail, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PortfolioItemCard } from './PortfolioItemCard';
import type { MarketplaceProfile, PortfolioItem } from '@/lib/portfolio/types';

interface EmployerPreviewModalProps {
  profile: MarketplaceProfile;
  items: PortfolioItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function EmployerPreviewModal({ profile, items, isOpen, onClose }: EmployerPreviewModalProps) {
  if (!isOpen) return null;

  const featuredItems = items.filter((item) =>
    profile.featuredItems.some((fi) => fi.id === item.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800/70 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/70 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100">Employer Preview</h2>
            <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/50">
              Preview Mode
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Profile Hero */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-900 shadow-2xl">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-xl flex items-center justify-center shadow-xl border-4 border-slate-900 font-bold text-lg ${
                profile.readinessScore >= 90 ? 'bg-emerald-500 text-white' :
                profile.readinessScore >= 75 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-200'
              }`}>
                {profile.readinessScore}%
              </div>
            </div>

            <h1 className="text-4xl font-black bg-gradient-to-r from-slate-100 via-indigo-100 to-slate-100 bg-clip-text text-transparent mb-4">
              {profile.headline}
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-6">{profile.bio}</p>

            <div className="flex flex-wrap gap-4 items-center justify-center mb-6">
              <Badge className="text-lg px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600">
                {profile.profileStatus.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-6 text-slate-400">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-200">{featuredItems.length}</div>
                  <div className="text-xs uppercase tracking-wider">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">{profile.totalViews.toLocaleString()}</div>
                  <div className="text-xs uppercase tracking-wider">Views</div>
                </div>
              </div>
            </div>

            {profile.isContactEnabled ? (
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-lg px-12 py-6 font-bold shadow-2xl"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact for Opportunities
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-slate-500 mb-2">Contact disabled by user</p>
                <Badge variant="secondary">Profile in progress</Badge>
              </div>
            )}
          </div>

          {/* Featured Items */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-slate-100 mb-8 text-center">Featured Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <PortfolioItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {/* Skills Matrix */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">Skills</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(profile.skills)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 12)
                .map(([skill, score]) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="text-sm px-3 py-1 bg-slate-900/50 border-slate-700/50"
                  >
                    {skill} ({Math.round(score)}%)
                  </Badge>
                ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/70 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            This is how employers see your profile
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}

