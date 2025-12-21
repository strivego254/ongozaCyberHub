/**
 * Portfolio Health Card Component
 * EXACT HERO LAYOUT: PORTFOLIO HEALTH: 87/100 | 12 Items | 8 Approved | 4 Pending | #47 Rank
 * Top Skills: SIEM 92% | Python 78% | DFIR 85%
 */

'use client';

import { Card } from '@/components/ui/Card';
import { BarChart3, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface PortfolioHealthCardProps {
  healthScore: number; // 0-100
  totalItems: number;
  approvedItems: number;
  pendingItems: number;
  marketplaceRank: number;
  totalRank: number;
  topSkills: Array<{ skill: string; score: number; count: number }>;
  marketplaceViews: number;
}

export function PortfolioHealthCard({ 
  healthScore, 
  totalItems, 
  approvedItems,
  pendingItems,
  marketplaceRank,
  totalRank,
  topSkills,
  marketplaceViews,
}: PortfolioHealthCardProps) {
  const approvalRate = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
  
  // Display top 3 skills with progress bars
  const displaySkills = topSkills.slice(0, 3);

  return (
    <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/50 backdrop-blur-xl shadow-2xl mb-8">
      <div className="p-6 lg:p-8">
        {/* HEADER: PORTFOLIO HEALTH: 87/100 - EXACT SPEC */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-black text-slate-100 mb-4">
            PORTFOLIO HEALTH: {healthScore}/100
          </h1>
          <div className="text-sm text-slate-400">
            Portfolio: {totalItems} items | Approved: {approvedItems} | Pending: {pendingItems} | Marketplace Rank: #{marketplaceRank}/{totalRank}
          </div>
        </div>

        {/* TOP SKILLS: SIEM ████████▁ 92% | Python ██████▁▁ 78% | DFIR ███████ 85% - EXACT SPEC */}
        {displaySkills.length > 0 && (
          <div className="border-t border-slate-800/50 pt-4">
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
              <span className="text-slate-400 font-medium">Top Skills:</span>
              {displaySkills.map((skill, index) => {
                const percentage = Math.round(skill.score * 10); // Convert 0-10 to 0-100
                const filledBlocks = Math.floor(percentage / 10);
                const partialBlock = percentage % 10;
                const emptyBlocks = 10 - filledBlocks - (partialBlock > 0 ? 1 : 0);
                
                return (
                  <div key={skill.skill} className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">{skill.skill}</span>
                    <span className="flex items-center gap-0.5 font-mono text-xs">
                      {/* Filled blocks (█) */}
                      {Array(filledBlocks).fill(0).map((_, i) => (
                        <span key={`filled-${i}`} className="text-indigo-400">█</span>
                      ))}
                      {/* Partial block (▁) */}
                      {partialBlock > 0 && (
                        <span className="text-indigo-400 opacity-50">▁</span>
                      )}
                      {/* Empty blocks (▁) */}
                      {Array(emptyBlocks).fill(0).map((_, i) => (
                        <span key={`empty-${i}`} className="text-slate-600">▁</span>
                      ))}
                    </span>
                    <span className="font-bold text-indigo-400">{percentage}%</span>
                    {index < displaySkills.length - 1 && (
                      <span className="text-slate-600">|</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

