'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Wand2, AlertCircle, CheckCircle } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  track_code: string;
  instructions?: string;
}

interface RecipeGeneratorProps {
  missions: Mission[];
}

export function RecipeGenerator({ missions }: RecipeGeneratorProps) {
  const [selectedMission, setSelectedMission] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateRecipes = async () => {
    if (!selectedMission) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedRecipes([]);

    try {
      const mission = missions.find(m => m.id === selectedMission);
      if (!mission) throw new Error('Mission not found');

      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context_type: 'mission',
          context_id: selectedMission,
          track_code: mission.track_code,
          user_id: 'admin' // TODO: Get actual user ID
        })
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const { recipes } = await response.json();
      setGeneratedRecipes(recipes || []);
    } catch (err) {
      console.error('Recipe generation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6 border-b border-slate-800/50">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-200 mb-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            AI Recipe Generator
          </h2>
          <p className="text-sm text-slate-400">
            Generate contextual recipes using Grok 3 AI based on mission requirements
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Mission</label>
              <select
                value={selectedMission}
                onChange={(e) => setSelectedMission(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Choose a mission to generate recipes for...</option>
                {missions.map(mission => (
                  <option key={mission.id} value={mission.id}>
                    {mission.title} ({mission.track_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={generateRecipes}
                disabled={!selectedMission || isGenerating}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Recipes
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Generated Recipes Preview */}
      {generatedRecipes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Generated Recipes ({generatedRecipes.length})
            </CardTitle>
            <p className="text-sm text-slate-400">
              These recipes have been saved to the database and are ready to use
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedRecipes.map((recipe, index) => (
                <div key={recipe.id || index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-200">{recipe.title}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {recipe.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {recipe.estimated_minutes}m
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{recipe.summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {recipe.track_codes?.map((track: string) => (
                      <Badge key={track} variant="secondary" className="text-xs">
                        {track}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
