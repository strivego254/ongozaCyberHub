/**
 * RecipeCard Component
 * 
 * Card component for displaying a recipe in the grid.
 */
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Star, Clock, Target, Bookmark, Play } from 'lucide-react';
import type { RecipeListResponse } from '@/services/types/recipes';
import clsx from 'clsx';

interface RecipeCardProps {
  recipe: RecipeListResponse;
  isBookmarked?: boolean;
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'intermediate':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'advanced':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}

export function RecipeCard({ recipe, isBookmarked }: RecipeCardProps) {
  const colors = getDifficultyColor(recipe.difficulty);

  return (
    <motion.div whileHover={{ scale: 1.02 }} className="group h-full">
      <Card className="group relative h-full bg-gradient-to-br from-slate-900/70 via-indigo-900/20 to-purple-900/20 border border-slate-800/50 hover:border-indigo-500/70 hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-500 overflow-hidden hover:bg-indigo-500/5 flex flex-col">
        <Link href={`/recipes/${recipe.slug}`} className="block flex-1">
          {/* THUMBNAIL */}
          {recipe.thumbnail_url && (
            <div className="h-32 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 relative overflow-hidden">
              <img
                src={recipe.thumbnail_url}
                alt={recipe.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400">
                  {recipe.tools_used?.[0] || 'CLI'}
                </Badge>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* TITLE & METADATA */}
            <div className="space-y-3">
              <h3 className="font-bold text-xl leading-tight line-clamp-2 group-hover:text-indigo-300 transition-colors text-slate-200">
                {recipe.title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className={clsx('flex items-center gap-1', colors.text)}>
                  <Target className="w-3 h-3" />
                  <span className="capitalize">{recipe.difficulty}</span>
                </div>
                <div className="w-1 h-1 bg-slate-500 rounded-full" />
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{recipe.estimated_minutes}min</span>
                </div>
              </div>

              {/* TRACK BADGES */}
              {recipe.track_codes && recipe.track_codes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.track_codes.slice(0, 2).map((track: string) => (
                    <Badge
                      key={track}
                      variant="outline"
                      className="text-xs bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                    >
                      {track}
                    </Badge>
                  ))}
                </div>
              )}

              {/* STATS */}
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-800/50">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-amber-400" />
                  <span>{recipe.avg_rating?.toFixed(1) || 'New'}</span>
                  <span className="text-slate-600">({recipe.usage_count})</span>
                </div>
                {isBookmarked && (
                  <div className="flex items-center gap-1 text-indigo-400">
                    <Bookmark className="w-3 h-3 fill-current" />
                    <span>Saved</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* FOOTER */}
        <div className="px-6 pb-6 pt-0 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800/50 mt-auto">
          <Link href={`/recipes/${recipe.slug}`} className="block">
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 h-10 font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Recipe
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}


