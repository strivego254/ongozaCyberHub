/**
 * RecipeDetailShell Component
 * 
 * Main shell for recipe detail page.
 */
'use client';

import { motion } from 'framer-motion';
import { RecipeContentRenderer } from './RecipeContentRenderer';
import { RecipeActions } from './RecipeActions';
import { RelatedRecipes } from './RelatedRecipes';
import { Badge } from '@/components/ui/Badge';
import { Clock, Star, Target, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { RecipeDetailResponse } from '@/services/recipesClient';

interface RecipeDetailShellProps {
  recipe: RecipeDetailResponse;
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return 'text-emerald-400';
    case 'intermediate':
      return 'text-amber-400';
    case 'advanced':
      return 'text-orange-400';
    default:
      return 'text-slate-400';
  }
}

export function RecipeDetailShell({ recipe }: RecipeDetailShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-indigo-900/50">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <Link href="/recipes">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-4 h-4 rounded-full ${getDifficultyColor(recipe.difficulty)} bg-current`} />
                <div className="flex items-center gap-2">
                  {recipe.track_codes.map((track: string) => (
                    <Badge key={track} variant="outline" className="bg-indigo-500/20 border-indigo-500/30">
                      {track}
                    </Badge>
                  ))}
                </div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-slate-100 leading-tight mb-6">
                {recipe.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-lg text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span>{recipe.estimated_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <span>{recipe.avg_rating?.toFixed(1) || 'New'}</span>
                </div>
                <div>{recipe.tools_used?.join(', ') || 'CLI'}</div>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <RecipeActions recipe={recipe} compact />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-24 max-w-4xl">
        {/* CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12"
        >
          <div className="lg:col-span-2">
            <RecipeContentRenderer content={recipe.content} />
          </div>

          <div className="space-y-8">
            <div className="sticky top-32">
              <RecipeActions recipe={recipe} />
              <div className="mt-8">
                <RelatedRecipes recipeId={recipe.id} recipeSlug={recipe.slug} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


