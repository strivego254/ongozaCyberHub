/**
 * Single Portfolio Item Page
 * Detailed view of a portfolio item
 */

import { notFound } from 'next/navigation';
import { getPortfolioItem } from '@/lib/portfolio/api';
import { PortfolioItemCard } from '@/components/ui/portfolio/PortfolioItemCard';
import { EvidenceGallery } from '@/components/ui/portfolio/EvidenceGallery';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Star } from 'lucide-react';

interface PageProps {
  params: {
    itemId: string;
  };
}

export default async function PortfolioItemPage({ params }: PageProps) {
  const item = await getPortfolioItem(params.itemId);

  if (!item) {
    notFound();
  }

  const averageScore = Object.keys(item.competencyScores).length > 0
    ? Object.values(item.competencyScores).reduce((a, b) => a + b, 0) /
      Object.keys(item.competencyScores).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <Card className="border-indigo-500/50 mb-6">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-100 mb-2">{item.title}</h1>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{item.type}</Badge>
                  <Badge variant="outline">{item.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            </div>

            {item.summary && (
              <p className="text-lg text-slate-300 mb-6">{item.summary}</p>
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

