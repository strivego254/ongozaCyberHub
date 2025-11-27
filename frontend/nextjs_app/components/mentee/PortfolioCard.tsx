/**
 * Portfolio Engine Component
 * User's completed missions and projects
 * Evidence collection for marketplace visibility
 */

'use client';

import { useState } from 'react';
import type { User } from '@/services/types';

interface PortfolioCardProps {
  user: User;
  showAll?: boolean;
}

interface PortfolioItem {
  id: string;
  title: string;
  type: 'mission' | 'project' | 'certification';
  status: 'published' | 'draft' | 'private';
  created_at: string;
  skills: string[];
  thumbnail?: string;
}

export default function PortfolioCard({ user, showAll = false }: PortfolioCardProps) {
  // Mock portfolio items - replace with API calls
  const portfolioItems: PortfolioItem[] = [
    // Add items from API
  ];

  const publishedCount = portfolioItems.filter(item => item.status === 'published').length;
  const draftCount = portfolioItems.filter(item => item.status === 'draft').length;
  
  // Empty state handling
  const hasItems = portfolioItems.length > 0;

  return (
    <div className="card border-cyber-mint">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>💼</span>
            Portfolio Engine
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Evidence Collection • Marketplace Visibility
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-body-s text-steel-grey">Published</p>
            <p className="text-h3 text-cyber-mint font-bold">{publishedCount}</p>
          </div>
        </div>
      </div>

      {!hasItems ? (
        <div className="bg-steel-grey bg-opacity-10 border border-steel-grey rounded-card p-6 text-center">
          <p className="text-body-m text-steel-grey mb-2">
            No portfolio items yet
          </p>
          <p className="text-body-s text-steel-grey mb-4">
            Complete missions to build your portfolio and showcase your skills
          </p>
          <button
            onClick={() => window.location.href = '/dashboard/mentee/missions'}
            className="btn-primary"
          >
            Browse Missions
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolioItems.slice(0, showAll ? portfolioItems.length : 3).map((item) => (
            <div
              key={item.id}
              className="bg-och-midnight border border-steel-grey rounded-card p-4 hover:border-cyber-mint transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-body-m font-semibold text-white mb-1">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-body-xs text-steel-grey">
                      {item.type} • {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-cyber-mint bg-opacity-10 text-cyber-mint text-body-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-body-xs font-semibold ml-3 ${
                  item.status === 'published' ? 'badge-beginner' :
                  item.status === 'draft' ? 'badge-intermediate' :
                  'text-steel-grey'
                }`}>
                  {item.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => window.location.href = `/dashboard/mentee/portfolio/${item.id}`}
                  className="btn-primary text-body-s px-4 py-2"
                >
                  View
                </button>
                {item.status === 'draft' && (
                  <button
                    onClick={() => window.location.href = `/dashboard/mentee/portfolio/${item.id}/edit`}
                    className="btn-secondary text-body-s px-4 py-2"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-steel-grey">
          <p className="text-body-m mb-2">No portfolio items yet</p>
          <p className="text-body-s mb-4">
            Complete missions to build your portfolio and showcase your skills
          </p>
          <button
            onClick={() => window.location.href = '/dashboard/mentee/missions'}
            className="btn-primary"
          >
            Start First Mission
          </button>
        </div>
      )}

      {!showAll && portfolioItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-steel-grey">
          <button
            onClick={() => window.location.href = '/dashboard/mentee/portfolio'}
            className="text-body-s text-cyber-mint hover:underline w-full text-center"
          >
            View Full Portfolio →
          </button>
        </div>
      )}
    </div>
  );
}


