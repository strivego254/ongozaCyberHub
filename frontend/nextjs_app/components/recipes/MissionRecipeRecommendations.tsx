/**
 * MissionRecipeRecommendations Component
 * 
 * Shows recommended recipes before starting a mission.
 * Used in Mission detail views.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, Target, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import { recipesClient } from '@/services/recipesClient';
import type { RecipeContextLink } from '@/services/types/recipes';
import clsx from 'clsx';

interface MissionRecipeRecommendationsProps {
  missionId: string;
  title?: string;
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'intermediate':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'advanced':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export function MissionRecipeRecommendations({
  missionId,
  title = 'Before you start, review these recipes',
}: MissionRecipeRecommendationsProps) {
  const [recipes, setRecipes] = useState<RecipeContextLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const links = await recipesClient.getContextLinks('mission', missionId);
        setRecipes(links);
      } catch (error) {
        console.error('Error fetching mission recipe recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    if (missionId) {
      fetchRecipes();
    }
  }, [missionId]);

  if (loading) {
    return (
      <div className="py-6">
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 bg-slate-800/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return null;
  }

  const requiredRecipes = recipes.filter((r) => r.is_required);
  const recommendedRecipes = recipes.filter((r) => !r.is_required);

  return (
    <div className="py-6 space-y-6">
      {requiredRecipes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-slate-200">Required Recipes</h3>
          </div>
          <div className="space-y-3">
            {requiredRecipes.map((link) => (
              <RecipePill key={link.id} link={link} />
            ))}
          </div>
        </div>
      )}

      {recommendedRecipes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
          </div>
          <div className="space-y-3">
            {recommendedRecipes.map((link) => (
              <RecipePill key={link.id} link={link} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipePill({ link }: { link: RecipeContextLink }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <Link href={`/recipes/${link.recipe_slug}`}>
        <div className="bg-gradient-to-r from-slate-900/70 via-indigo-900/20 to-purple-900/20 border border-slate-800/50 rounded-xl p-4 hover:border-indigo-500/70 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 cursor-pointer">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-200">
                  {link.recipe_title}
                </h4>
                {link.is_required && (
                  <Badge variant="outline" className="text-xs bg-orange-500/20 border-orange-500/30 text-orange-400">
                    Required
                  </Badge>
                )}
              </div>

              <p className="text-sm text-slate-400 line-clamp-2">
                {link.recipe_summary}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className={clsx('flex items-center gap-1 px-2 py-1 rounded', getDifficultyColor(link.recipe_difficulty))}>
                  <Target className="w-3 h-3" />
                  <span className="capitalize">{link.recipe_difficulty}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{link.recipe_estimated_minutes}min</span>
                </div>
                <span className="text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                  Start recipe
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

