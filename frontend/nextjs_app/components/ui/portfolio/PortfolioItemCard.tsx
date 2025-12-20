/**
 * Portfolio Item Card Component
 * Modern glassmorphic card with status chips, evidence, mentor scores
 */

'use client';

import Link from 'next/link';
import {
  Eye,
  Star,
  MoreHorizontal,
  Link as LinkIcon,
  Github,
  Award,
  FileText,
  ExternalLink,
} from 'lucide-react';
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
    <Card className="group glass-card glass-card-hover flex flex-col h-full">
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Header: Status + Type + Views */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className={`text-[10px] uppercase tracking-wide ${
                item.status === 'approved' 
                  ? 'border-emerald-500/60 text-emerald-400' 
                  : item.status === 'in_review'
                  ? 'border-yellow-500/60 text-yellow-400'
                  : 'border-slate-600 text-slate-400'
              }`}
            >
              {item.status.replace('_', ' ')}
            </Badge>
            <Badge 
              variant="secondary" 
              className="text-[10px] uppercase tracking-wide"
            >
              {item.type}
            </Badge>
          </div>
          <div className="text-right text-xs text-slate-500 flex flex-col items-end">
            <p>{new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            {item.marketplaceViews > 0 && (
              <p className="flex items-center justify-end gap-1 text-emerald-400 mt-1">
                <Eye className="w-3 h-3" /> {item.marketplaceViews}
              </p>
            )}
          </div>
        </div>

        {/* Title + Summary */}
        <div>
          <h3 className="text-slate-50 font-semibold line-clamp-2 group-hover:text-indigo-300 transition-colors mb-1">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-xs text-slate-400 line-clamp-2">{item.summary}</p>
          )}
        </div>

        {/* Skill tags */}
        {item.skillTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.skillTags.slice(0, 5).map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-[10px] border-slate-700 text-slate-400"
              >
                {tag}
              </Badge>
            ))}
            {item.skillTags.length > 5 && (
              <Badge variant="ghost" className="text-[10px] text-slate-500">
                +{item.skillTags.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Evidence thumbnails */}
        {item.evidenceFiles.length > 0 && (
          <div className="flex-1">
            <EvidenceGallery files={item.evidenceFiles} />
          </div>
        )}
      </div>

      {/* Footer: Mentor Score + Actions */}
      <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between px-4 pb-4">
        {averageScore ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Star className="w-3 h-3 fill-emerald-400" />
            <span className="font-medium">Mentor: {averageScore.toFixed(1)}/10</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500">No mentor score yet</div>
        )}
        <Link href={`/portfolio/${item.id}`}>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            View details
          </Button>
        </Link>
      </div>
    </Card>
  );
}
