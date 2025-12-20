/**
 * Portfolio Health Card Component
 * Displays portfolio health score and metrics
 */

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { PortfolioHealthMetrics } from '@/lib/portfolio/types';

interface PortfolioHealthCardProps {
  healthMetrics: PortfolioHealthMetrics | null;
}

export function PortfolioHealthCard({ healthMetrics }: PortfolioHealthCardProps) {
  if (!healthMetrics) {
    return (
      <Card className="border-indigo-500/50 bg-gradient-to-br from-indigo-500/5">
        <div className="p-6">
          <div className="text-slate-400 text-sm">Loading health metrics...</div>
        </div>
      </Card>
    );
  }

  const healthPercentage = (healthMetrics.healthScore / 10) * 100;
  const healthColor =
    healthPercentage >= 80
      ? 'text-emerald-400'
      : healthPercentage >= 60
      ? 'text-yellow-400'
      : 'text-orange-400';

  const healthBgColor =
    healthPercentage >= 80
      ? 'bg-emerald-500/20 border-emerald-500/50'
      : healthPercentage >= 60
      ? 'bg-yellow-500/20 border-yellow-500/50'
      : 'bg-orange-500/20 border-orange-500/50';

  return (
    <Card className={`border-2 ${healthBgColor}`}>
      <div className="p-6">
        <h3 className="text-sm font-semibold text-slate-400 mb-4">Portfolio Health</h3>
        
        <div className="text-center mb-6">
          <div className={`text-5xl font-bold ${healthColor} mb-2`}>
            {healthMetrics.healthScore.toFixed(1)}
          </div>
          <div className="text-sm text-slate-500">out of 10.0</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Total Items</span>
            <span className="text-slate-100 font-semibold">{healthMetrics.totalItems}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Approved</span>
            <span className="text-emerald-400 font-semibold">
              {healthMetrics.approvedItems}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Pending Reviews</span>
            <span className="text-yellow-400 font-semibold">
              {healthMetrics.pendingReviews}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Avg Score</span>
            <span className="text-indigo-400 font-semibold">
              {healthMetrics.averageScore.toFixed(1)}/10
            </span>
          </div>
        </div>

        {/* Health Progress Bar */}
        <div className="mt-6">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                healthPercentage >= 80
                  ? 'bg-emerald-500'
                  : healthPercentage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

