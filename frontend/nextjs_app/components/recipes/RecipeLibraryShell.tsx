/**
 * RecipeLibraryShell Component
 * 
 * Main shell component for the recipe library page.
 */
'use client';

import { useState } from 'react';
import { RecipeGrid } from './RecipeGrid';
import { RecipeFilters } from './RecipeFilters';
import { SearchBar } from './SearchBar';
import { useRecipes } from '@/hooks/useRecipes';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BookOpen } from 'lucide-react';
import type { RecipeFilters as RecipeFiltersType } from '@/services/types/recipes';

export function RecipeLibraryShell() {
  const [filters, setFilters] = useState<RecipeFiltersType>({
    track: '',
    difficulty: '',
    max_time: undefined,
    context: undefined,
    sort: 'relevance',
  });
  const [search, setSearch] = useState('');

  const { recipes, stats, loading, bookmarks } = useRecipes(search, filters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-indigo-900/50">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <BookOpen className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-2 rounded-2xl shadow-lg shadow-emerald-500/30" />
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-400 via-white to-emerald-400 bg-clip-text text-transparent">
                    Recipe Library
                  </h1>
                  <p className="text-xl text-slate-300 mt-2">
                    {stats.total} recipes {stats.bookmarked > 0 && `• ${stats.bookmarked} saved`}
                  </p>
                </div>
              </div>
            </div>

            <SearchBar value={search} onChange={setSearch} />
          </div>

          <div className="mt-6">
            <RecipeFilters filters={filters} onFiltersChange={setFilters} stats={stats} />
          </div>
        </div>
      </div>

      {/* RECIPE GRID */}
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <RecipeGrid recipes={recipes} bookmarks={bookmarks} loading={loading} />
      </div>
    </div>
  );
}


