/**
 * Single Portfolio Item Page
 * Detailed view with edit capabilities - EXACT SPEC
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePortfolio } from '@/hooks/usePortfolio';
import { createClient } from '@/lib/supabase/client';
import { EvidenceGallery } from '@/components/ui/portfolio/EvidenceGallery';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Star, Edit, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import { PortfolioSkeleton } from '@/components/ui/portfolio/PortfolioSkeleton';

export default function PortfolioItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.itemId as string;
  const [userId, setUserId] = useState<string | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, [supabase]);

  const { items, updateItem, deleteItem, isLoading } = usePortfolio(userId);
  const item = items.find((i) => i.id === itemId);

  useEffect(() => {
    if (item) {
      setEditedTitle(item.title);
      setEditedSummary(item.summary);
    }
  }, [item]);

  if (isLoading || !item) {
    return <PortfolioSkeleton />;
  }

  const averageScore = Object.keys(item.competencyScores).length > 0
    ? Object.values(item.competencyScores).reduce((a, b) => a + b, 0) /
      Object.keys(item.competencyScores).length
    : 0;

  const isOwner = item.userId === userId;

  const handleSave = () => {
    if (!itemId) return;
    updateItem(itemId, {
      title: editedTitle,
      summary: editedSummary,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!itemId || !confirm('Are you sure you want to delete this portfolio item?')) return;
    deleteItem(itemId);
    router.push('/portfolio');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 py-6 lg:p-10 lg:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/portfolio')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portfolio
          </Button>
        </div>

        <Card className="border-indigo-500/50 mb-6">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-4xl font-bold text-slate-100 mb-2 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <h1 className="text-4xl font-bold text-slate-100 mb-2">{item.title}</h1>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary">{item.type}</Badge>
                  <Badge variant="outline">{item.status.replace('_', ' ')}</Badge>
                  {isOwner && (
                    <div className="flex gap-2 ml-auto">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleDelete} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="text-lg text-slate-300 mb-6 w-full bg-slate-800 border border-slate-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                placeholder="Portfolio item summary..."
              />
            ) : (
              item.summary && (
                <p className="text-lg text-slate-300 mb-6">{item.summary}</p>
              )
            )}

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {item.skillTags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Mentor Score */}
            {averageScore > 0 && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 p-6 rounded-xl border border-emerald-500/30 mb-6">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">
                      {averageScore.toFixed(1)}/10
                    </div>
                    <div className="text-sm text-slate-400">Mentor Reviewed Score</div>
                  </div>
                </div>
              </div>
            )}

            {/* Evidence */}
            {item.evidenceFiles.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Evidence</h2>
                <EvidenceGallery files={item.evidenceFiles} />
              </div>
            )}

            {/* Mentor Feedback */}
            {item.mentorFeedback && (
              <div className="mt-6">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Mentor Feedback</h2>
                <Card className="border-indigo-500/30 bg-indigo-500/5">
                  <div className="p-6">
                    <p className="text-slate-300 whitespace-pre-wrap">{item.mentorFeedback}</p>
                  </div>
                </Card>
              </div>
            )}

            {/* Competency Scores */}
            {Object.keys(item.competencyScores).length > 0 && (
              <div className="mt-6">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Competency Scores</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(item.competencyScores).map(([skill, score]) => (
                    <Card key={skill} className="border-slate-800/50">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 font-medium">{skill}</span>
                          <span className="text-indigo-400 font-semibold">
                            {score.toFixed(1)}/10
                          </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                            style={{ width: `${(score / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

