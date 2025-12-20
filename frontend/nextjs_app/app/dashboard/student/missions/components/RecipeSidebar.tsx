/**
 * Recipe Sidebar Component
 * Micro-skills recommendations (draggable)
 */
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface RecipeSidebarProps {
  recipeIds: string[]
}

export function RecipeSidebar({ recipeIds }: RecipeSidebarProps) {
  const [completedRecipes, setCompletedRecipes] = useState<Set<string>>(new Set())

  // TODO: Fetch recipe details from API
  const recipes = recipeIds.map((id) => ({
    id,
    title: `Recipe ${id}`, // Placeholder
    description: 'Micro-skill recommendation',
  }))

  const handleMarkComplete = (recipeId: string) => {
    setCompletedRecipes(new Set([...Array.from(completedRecipes), recipeId]))
  }

  if (recipeIds.length === 0) {
    return null
  }

  return (
    <div className="w-80 space-y-4">
      <Card className="glass-card p-4 sticky top-4">
        <h3 className="text-lg font-bold text-white mb-4">Recommended Recipes</h3>
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`p-3 rounded-lg border ${
                completedRecipes.has(recipe.id)
                  ? 'bg-och-mint/10 border-och-mint/30'
                  : 'bg-och-midnight/50 border-och-steel/30'
              }`}
            >
              <h4 className="text-sm font-semibold text-white mb-1">{recipe.title}</h4>
              <p className="text-xs text-och-steel mb-3">{recipe.description}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="defender"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    // TODO: Navigate to recipe
                    console.log('Open recipe:', recipe.id)
                  }}
                >
                  Read
                </Button>
                <Button
                  variant="mint"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleMarkComplete(recipe.id)}
                  disabled={completedRecipes.has(recipe.id)}
                >
                  {completedRecipes.has(recipe.id) ? '✓ Complete' : 'Mark Complete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

