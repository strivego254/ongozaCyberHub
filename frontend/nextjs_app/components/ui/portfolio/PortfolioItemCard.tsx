/**
 * Portfolio Item Card Component
 * Modern glassmorphic card with status chips, evidence, mentor scores
 */

'use client';

import Link from 'next/link';
import {
  Eye,
  Star,
  Target,
  Github,
  Award,
  FileText,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

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
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EvidenceGallery } from './EvidenceGallery';
import type { PortfolioItem } from '@/lib/portfolio/types';

interface PortfolioItemCardProps {
  item: PortfolioItem;
  showMentorControls?: boolean;
  marketplaceView?: boolean;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (itemId: string) => void;
  canRequestReview?: boolean;
}

export function PortfolioItemCard({
  item,
  showMentorControls = false,
  marketplaceView = false,
  onEdit,
  onDelete,
  canRequestReview = false,
}: PortfolioItemCardProps) {
  const typeIcons = {
    mission: FileText,
    reflection: FileText,
    certification: Award,
    github: Github,
    thm: ExternalLink,
    external: ExternalLink,
    marketplace: ExternalLink,
  };

  const TypeIcon = typeIcons[item.type] || FileText;

  const averageScore = Object.keys(item.competencyScores).length > 0
    ? Object.values(item.competencyScores).reduce((a, b) => a + b, 0) /
      Object.keys(item.competencyScores).length
    : null;

  return (
    <Card
      className={`
        group bg-gradient-to-br from-slate-900/80 to-slate-900/40 
        backdrop-blur-xl border border-slate-800/60 
        hover:border-indigo-500/70 hover:shadow-2xl hover:shadow-indigo-500/20
        transition-all duration-300 hover:-translate-y-1
        flex flex-col h-full
        ${item.status === 'approved' ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : ''}
      `}
    >
      <div className="p-4 space-y-4 flex-1 flex flex-col">
        {/* Header: Status + Type + Views - EXACT SPEC: DFIR-101 ── APPROVED ── Mission ── 👀23 */}
        <div className="flex flex-wrap gap-2 mb-2 justify-between items-start">
          <div className="flex gap-1.5 items-center">
            <Badge
              variant={item.status === 'approved' ? 'default' : 'secondary'}
              className="uppercase text-xs tracking-wide"
            >
              {item.status.replace('_', ' ')}
            </Badge>
            <span className="text-slate-500 text-xs">──</span>
            <Badge variant="outline" className="uppercase text-xs tracking-wide bg-slate-800/50">
              {item.type}
            </Badge>
            {item.marketplaceViews > 0 && (
              <>
                <span className="text-slate-500 text-xs">──</span>
                <div className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
                  <Eye className="w-3 h-3" />
                  {item.marketplaceViews}
                </div>
              </>
            )}
          </div>

          {/* Date */}
          <div className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(item.createdAt))}
          </div>
        </div>

        {/* Title & Summary - EXACT SPEC */}
        <div>
          <h3 className="text-xl font-bold text-slate-50 group-hover:text-indigo-400 line-clamp-2 mb-2 leading-tight transition-colors">
            {item.title || 'Untitled Portfolio Item'}
          </h3>
          {item.summary ? (
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-2">{item.summary}</p>
          ) : (
            <p className="text-slate-500 text-sm italic mb-2">No description available</p>
          )}
          {/* Mentor info - EXACT SPEC: Mentor: Sarah K., 9.2/10 */}
          {averageScore && averageScore > 0 && (
            <p className="text-xs text-slate-500 mb-2">
              Mentor: {item.mentorFeedback ? item.mentorFeedback.split('\n')[0].substring(0, 20).replace(/[^a-zA-Z\s]/g, '') : 'Mentor'}, {averageScore.toFixed(1)}/10
            </p>
          )}
        </div>

        {/* Skill Tags */}
        {item.skillTags && item.skillTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {item.skillTags.slice(0, 6).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-2.5 py-0.5">
                {tag}
              </Badge>
            ))}
            {item.skillTags.length > 6 && (
              <Badge variant="ghost" className="text-xs text-slate-500">
                +{item.skillTags.length - 6} skills
              </Badge>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">No skills tagged</div>
        )}

        {/* Evidence Gallery */}
        {item.evidenceFiles.length > 0 && (
          <div className="flex-1 min-h-[80px]">
            <EvidenceGallery files={item.evidenceFiles.slice(0, 3)} />
          </div>
        )}

        {/* Mentor Score - EXACT SPEC: ⭐⭐⭐⭐⭐ 9.2/10 Mentor Score */}
        {averageScore && averageScore > 0 && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 p-3 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(averageScore / 2)
                          ? 'text-emerald-400 fill-emerald-400'
                          : i === Math.floor(averageScore / 2) && (averageScore / 2) % 1 > 0.5
                          ? 'text-emerald-400 fill-emerald-400 opacity-50'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
              </div>
              <span className="font-bold text-emerald-400 text-base">{averageScore.toFixed(1)}/10</span>
              <span className="text-xs text-emerald-300 ml-1">Mentor Score</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer - EXACT SPEC */}
      <div className="pt-4 border-t border-slate-800/50 px-4 pb-4 space-y-2">
        <Link href={`/portfolio/${item.id}`}>
          <Button variant="outline" size="sm" className="w-full justify-between text-xs h-10 group-hover:bg-indigo-500/10">
            View Details
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        {canRequestReview && (item.status === 'draft' || item.status === 'submitted') && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs h-8 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Open request review modal
              console.log('Request mentor review for:', item.id);
            }}
          >
            Request Mentor Review
          </Button>
        )}
      </div>
    </Card>
  );
}
