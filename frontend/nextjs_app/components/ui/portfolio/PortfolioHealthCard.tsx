/**
 * Portfolio Health Card Component
 * EXACT HERO LAYOUT: 87/100 | 12 Items | 8 Approved | #47 Rank
 */

'use client';

import { Card } from '@/components/ui/Card';

interface PortfolioHealthCardProps {
  healthScore: number; // 0-100
  totalItems: number;
  approvedItems: number;
  marketplaceRank: number;
}

export function PortfolioHealthCard({ 
  healthScore, 
  totalItems, 
  approvedItems, 
  marketplaceRank 
}: PortfolioHealthCardProps) {
  return (
    <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/50 backdrop-blur-xl shadow-2xl mb-12">
      <div className="p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-slate-100 via-indigo-100 to-slate-100 bg-clip-text text-transparent mb-4">
              Portfolio
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl">
              Your verified proof of missions, mentor scores, and cyber skills transformation
            </p>
          </div>
          
          {/* METRICS - EXACT LAYOUT */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-black text-emerald-400 mb-1">{healthScore}</div>
              <div className="text-sm uppercase tracking-wider text-slate-400">Health /100</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-100">{totalItems}</div>
              <div className="text-sm uppercase tracking-wider text-slate-400">Total Items</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">{approvedItems}</div>
              <div className="text-sm uppercase tracking-wider text-slate-400">Approved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-400">#{marketplaceRank}</div>
              <div className="text-sm uppercase tracking-wider text-slate-400">Marketplace Rank</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

