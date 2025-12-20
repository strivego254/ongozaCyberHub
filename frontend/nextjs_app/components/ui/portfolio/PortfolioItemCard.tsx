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
}

export function PortfolioItemCard({
  item,
  showMentorControls = false,
  marketplaceView = false,
  onEdit,
  onDelete,
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
        {/* Header: Status + Type + Views */}
        <div className="flex flex-wrap gap-2 mb-2 justify-between items-start">
          <div className="flex gap-1.5">
            <Badge
              variant={item.status === 'approved' ? 'default' : 'secondary'}
              className="uppercase text-xs tracking-wide"
            >
              {item.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="uppercase text-xs tracking-wide bg-slate-800/50">
              {item.type}
            </Badge>
          </div>

          {/* Views & Date */}
          <div className="flex flex-col items-end text-xs text-slate-400 space-y-0.5">
            {item.marketplaceViews > 0 && (
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <Eye className="w-3 h-3" />
                {item.marketplaceViews.toLocaleString()}
              </div>
            )}
            <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Title & Summary */}
        <div>
          <h3 className="text-xl font-bold text-slate-50 group-hover:text-indigo-400 line-clamp-2 mb-3 leading-tight transition-colors">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{item.summary}</p>
          )}
        </div>

        {/* Skill Tags */}
        {item.skillTags.length > 0 && (
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
        )}

        {/* Evidence Gallery */}
        {item.evidenceFiles.length > 0 && (
          <div className="flex-1 min-h-[100px]">
            <EvidenceGallery files={item.evidenceFiles.slice(0, 4)} />
          </div>
        )}

        {/* Mentor Score */}
        {averageScore && averageScore > 0 && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 p-4 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(averageScore / 2)
                          ? 'text-emerald-400 fill-emerald-400'
                          : i === Math.floor(averageScore / 2)
                          ? 'text-emerald-400 fill-transparent'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
              </div>
              <span className="font-bold text-emerald-400 text-lg">{averageScore.toFixed(1)}/10</span>
              <span className="text-xs text-emerald-300">Mentor reviewed</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-800/50 px-4 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {item.missionId && <Target className="w-3 h-3" />}
            {item.type === 'github' && <Github className="w-3 h-3" />}
            {item.externalProviders?.thm && <Award className="w-3 h-3" />}
          </div>
          <Link href={`/portfolio/${item.id}`}>
            <Button variant="ghost" size="sm" className="text-xs px-3 h-8">
              View details →
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
