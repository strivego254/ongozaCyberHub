/**
 * Portfolio Timeline Component
 * Activity timeline visualization for portfolio events
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Clock, CheckCircle, Eye, MessageSquare, Star, Plus } from 'lucide-react';
import type { TimelineEvent } from '@/lib/portfolio/types';

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

interface PortfolioTimelineProps {
  data: TimelineEvent[];
  maxItems?: number;
}

const eventIcons = {
  item_created: Plus,
  item_approved: CheckCircle,
  review_received: Star,
  marketplace_view: Eye,
  contact_received: MessageSquare,
};

const eventColors = {
  item_created: 'text-blue-400 bg-blue-500/20',
  item_approved: 'text-emerald-400 bg-emerald-500/20',
  review_received: 'text-amber-400 bg-amber-500/20',
  marketplace_view: 'text-indigo-400 bg-indigo-500/20',
  contact_received: 'text-purple-400 bg-purple-500/20',
};

export function PortfolioTimeline({ data, maxItems = 10 }: PortfolioTimelineProps) {
  const displayData = data.slice(0, maxItems);

  if (displayData.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border-slate-800/60">
        <div className="p-8 text-center">
          <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-slate-300 mb-2">Activity Timeline</h3>
          <p className="text-sm text-slate-500">Your portfolio activity will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border-slate-800/60 backdrop-blur-xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-slate-400" />
          <h3 className="font-bold text-xl text-slate-100">Activity Timeline</h3>
        </div>

        <div className="space-y-4">
          {displayData.map((event, index) => {
            const Icon = eventIcons[event.type] || Clock;
            const colorClass = eventColors[event.type] || 'text-slate-400 bg-slate-500/20';

            return (
              <div key={event.id} className="flex gap-4 relative">
                {/* Timeline Line */}
                {index < displayData.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-slate-800/50" />
                )}

                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass} relative z-10`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content - EXACT SPEC: ✅ DFIR Mission (2h ago) */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                      {event.type === 'item_approved' && '✅ '}
                      {event.type === 'item_created' && '✨ '}
                      {event.type === 'review_received' && '⏳ '}
                      {event.type === 'marketplace_view' && '👀 '}
                      {event.title}
                    </h4>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      ({formatDistanceToNow(new Date(event.createdAt))})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {data.length > maxItems && (
          <div className="mt-6 pt-4 border-t border-slate-800/50 text-center">
            <p className="text-xs text-slate-500">
              Showing {maxItems} of {data.length} events
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

