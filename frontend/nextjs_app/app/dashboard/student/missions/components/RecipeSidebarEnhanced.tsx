/**
 * Enhanced Recipe Sidebar Component
 * Draggable micro-skills recommendations with completion tracking
 */
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Search, CheckCircle2, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useQuery } from '@tanstack/react-query'
import { apiGateway } from '@/services/apiGateway'

interface Recipe {
  id: string
  title: string
  description: string
  duration?: number
  difficulty?: string
  completed?: boolean
}

interface RecipeSidebarEnhancedProps {
  recipeIds: string[]
  className?: string
}

export function RecipeSidebarEnhanced({ recipeIds, className = '' }: RecipeSidebarEnhancedProps) {
  const [completedRecipes, setCompletedRecipes] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(true)

  // TODO: Fetch recipe details from API
  const { data: recipesData } = useQuery<Recipe[]>({
    queryKey: ['recipes', recipeIds],
    queryFn: async () => {
      // Placeholder - replace with actual API call
      return recipeIds.map((id) => ({
        id,
        title: `Recipe ${id}`,
        description: 'Micro-skill recommendation for this mission',
        duration: 15,
        difficulty: 'beginner',
      }))
    },
    enabled: recipeIds.length > 0,
  })

  const recipes = recipesData || []
  const remainingRecipes = recipes.filter((r) => !completedRecipes.has(r.id))

  const handleMarkComplete = (recipeId: string) => {
    setCompletedRecipes((prev) => new Set([...prev, recipeId]))
    // TODO: Save to backend
  }

  if (recipeIds.length === 0) {
    return null
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block bg-gradient-to-b from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 h-full sticky top-6 ${className}`}
        role="complementary"
        aria-label="Recommended recipes"
      >
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-emerald-900 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Recipes ({remainingRecipes.length})
          </h4>
          <Button variant="ghost" size="sm" aria-label="Filter recipes">
            <Search className="w-4 h-4 mr-1" />
            Filter
          </Button>
        </div>

        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          <AnimatePresence>
            {remainingRecipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <RecipeCard
                  recipe={recipe}
                  onComplete={() => handleMarkComplete(recipe.id)}
                  className="group hover:shadow-md transition-all border hover:border-emerald-400 cursor-grab active:cursor-grabbing"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {remainingRecipes.length === 0 && (
            <div className="text-center py-8 text-emerald-700">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All recipes completed!</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: isOpen ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-gradient-to-b from-emerald-50 to-green-50 rounded-t-3xl border-t border-emerald-200 shadow-2xl"
        >
          <div className="p-4 border-b border-emerald-200 flex items-center justify-between">
            <h4 className="text-lg font-bold text-emerald-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Recipes ({remainingRecipes.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close recipes' : 'Open recipes'}
            >
              {isOpen ? '▼' : '▲'}
            </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            {remainingRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onComplete={() => handleMarkComplete(recipe.id)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </>
  )
}

function RecipeCard({
  recipe,
  onComplete,
  className = '',
}: {
  recipe: Recipe
  onComplete: () => void
  className?: string
}) {
  const isCompleted = recipe.completed

  return (
    <Card
      className={`p-4 bg-white border border-emerald-200 hover:border-emerald-400 transition-all ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h5 className="font-semibold text-slate-900 text-sm flex-1">{recipe.title}</h5>
        {recipe.difficulty && (
          <Badge variant="steel" className="ml-2 text-xs">
            {recipe.difficulty}
          </Badge>
        )}
      </div>
      <p className="text-xs text-slate-600 mb-3 line-clamp-2">{recipe.description}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => {
            // TODO: Navigate to recipe
            console.log('Open recipe:', recipe.id)
          }}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Read
        </Button>
        <Button
          variant="mint"
          size="sm"
          className="flex-1 text-xs"
          onClick={onComplete}
          disabled={isCompleted}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Done
            </>
          ) : (
            'Mark Done'
          )}
        </Button>
      </div>
    </Card>
  )
}

