'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'
import { mentorClient } from '@/services/mentorClient'
import { MissionReviewPanel } from '@/components/mentor/missions/MissionReviewPanel'
import { StudentProgressView } from '@/components/mentor/missions/StudentProgressView'
import type { MissionSubmission } from '@/services/types/mentor'

interface Mission {
  id: string
  code: string
  title: string
  description: string
  story?: string
  track: string
  tier: string
  difficulty: string
  type: string
  track_key?: string
  competencies?: string[]
  requires_mentor_review: boolean
  objectives?: string[]
  subtasks?: any[]
  success_criteria?: any
  requirements?: any
  estimated_duration_minutes?: number
  est_hours?: number
  recipe_recommendations?: string[]
  created_at?: string
}

export default function MissionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const missionId = params?.missionId as string

  const [mission, setMission] = useState<Mission | null>(null)
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<MissionSubmission | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'review'>('overview')
  const [loading, setLoading] = useState(true)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)

  useEffect(() => {
    if (missionId && mentorId) {
      loadMissionDetails()
      loadSubmissions()
    }
  }, [missionId, mentorId])

  const loadMissionDetails = async () => {
    if (!missionId) return
    setLoading(true)
    try {
      const response = await apiGateway.get(`/missions/${missionId}`)
      setMission(response)
    } catch (err: any) {
      console.error('Failed to load mission details:', err)
      if (err?.response?.status === 404) {
        // Mission not found, redirect back
        router.push('/dashboard/mentor/missions')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async () => {
    if (!missionId || !mentorId) return
    setSubmissionsLoading(true)
    try {
      // Get all submissions for this mission from mentor's mentees
      const submissions = await mentorClient.getMissionSubmissions(mentorId, {
        mission_id: missionId,
      })
      setSubmissions(submissions || [])
    } catch (err) {
      console.error('Failed to load submissions:', err)
    } finally {
      setSubmissionsLoading(false)
    }
  }

  const handleSubmissionClick = (submission: MissionSubmission) => {
    setSelectedSubmission(submission)
    setActiveTab('review')
  }

  const handleBack = () => {
    router.push('/dashboard/mentor/missions')
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'beginner': return 'mint'
      case 'intermediate': return 'defender'
      case 'advanced': return 'gold'
      case 'mastery': return 'orange'
      case 'capstone': return 'orange'
      default: return 'steel'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'novice': return 'mint'
      case 'beginner': return 'mint'
      case 'intermediate': return 'defender'
      case 'advanced': return 'gold'
      case 'elite': return 'orange'
      default: return 'steel'
    }
  }

  if (loading) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <Card className="glass-card p-8 text-center">
            <p className="text-och-steel">Loading mission details...</p>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  if (!mission) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <Card className="glass-card p-8 text-center">
            <p className="text-och-steel mb-4">Mission not found.</p>
            <Button onClick={handleBack} variant="outline">
              Back to Missions
            </Button>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-och-steel mb-4">
            <span>Dashboard</span>
            <span>/</span>
            <span>Mentor</span>
            <span>/</span>
            <span>Missions</span>
            <span>/</span>
            <span className="text-white">{mission.code}</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-och-mint">{mission.code}</h1>
                {mission.requires_mentor_review && (
                  <Badge variant="orange" className="text-sm">Requires Mentor Review</Badge>
                )}
                {!mission.is_active && (
                  <Badge variant="steel" className="text-sm">Inactive</Badge>
                )}
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">{mission.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={getTierColor(mission.tier)} className="text-xs capitalize">
                  {mission.tier}
                </Badge>
                <Badge variant={getDifficultyColor(mission.difficulty)} className="text-xs capitalize">
                  {mission.difficulty}
                </Badge>
                <Badge variant="steel" className="text-xs capitalize">
                  {mission.track}
                </Badge>
                <Badge variant="steel" className="text-xs capitalize">
                  {mission.type}
                </Badge>
                {mission.estimated_duration_minutes && (
                  <Badge variant="steel" className="text-xs">
                    ~{Math.round(mission.estimated_duration_minutes / 60)}h
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={handleBack} variant="outline" size="sm">
              ← Back
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-och-steel/20 mb-6">
          <button
            onClick={() => {
              setActiveTab('overview')
              setSelectedSubmission(null)
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-och-mint text-och-mint'
                : 'border-transparent text-och-steel hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('submissions')
              setSelectedSubmission(null)
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'submissions'
                ? 'border-och-mint text-och-mint'
                : 'border-transparent text-och-steel hover:text-white'
            }`}
          >
            Submissions ({submissions.length})
          </button>
          {selectedSubmission && (
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'review'
                  ? 'border-och-mint text-och-mint'
                  : 'border-transparent text-och-steel hover:text-white'
              }`}
            >
              Review Submission
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <p className="text-och-steel whitespace-pre-wrap">{mission.description || 'No description available.'}</p>
            </Card>

            {/* Story/Narrative */}
            {mission.story && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Mission Story</h3>
                <p className="text-och-steel whitespace-pre-wrap">{mission.story}</p>
              </Card>
            )}

            {/* Objectives */}
            {mission.objectives && mission.objectives.length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Objectives</h3>
                <ul className="space-y-2">
                  {mission.objectives.map((objective, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-och-steel">
                      <span className="text-och-mint mt-1">•</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Competencies */}
            {mission.competencies && mission.competencies.length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Technical Competencies</h3>
                <div className="flex flex-wrap gap-2">
                  {mission.competencies.map((comp, idx) => (
                    <Badge key={idx} variant="defender" className="text-xs">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Requirements */}
            {mission.requirements && Object.keys(mission.requirements).length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Requirements</h3>
                <div className="space-y-2 text-sm text-och-steel">
                  {mission.requirements.required_artifacts && (
                    <div>
                      <strong className="text-white">Required Artifacts:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {mission.requirements.required_artifacts.map((artifact: string, idx: number) => (
                          <li key={idx}>{artifact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {mission.requirements.file_types && (
                    <div>
                      <strong className="text-white">Accepted File Types:</strong>
                      <span className="ml-2">{mission.requirements.file_types.join(', ')}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Success Criteria */}
            {mission.success_criteria && Object.keys(mission.success_criteria).length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Success Criteria</h3>
                <div className="space-y-2 text-sm text-och-steel">
                  {Object.entries(mission.success_criteria).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <strong className="text-white capitalize">{key.replace('_', ' ')}:</strong>
                      <span className="ml-2">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recipe Recommendations */}
            {mission.recipe_recommendations && mission.recipe_recommendations.length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Recommended Recipes</h3>
                <div className="flex flex-wrap gap-2">
                  {mission.recipe_recommendations.map((recipeId, idx) => (
                    <Badge key={idx} variant="mint" className="text-xs">
                      Recipe: {recipeId}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Quick Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-och-steel mb-1">Total Submissions</p>
                  <p className="text-2xl font-bold text-och-mint">{submissions.length}</p>
                </div>
                <div>
                  <p className="text-xs text-och-steel mb-1">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {submissions.filter(s => s.status === 'submitted' || s.status === 'ai_reviewed').length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-och-steel mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-400">
                    {submissions.filter(s => s.status === 'approved').length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-och-steel mb-1">Requires Review</p>
                  <p className="text-2xl font-bold text-och-mint">
                    {mission.requires_mentor_review ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {submissionsLoading ? (
              <Card className="glass-card p-8 text-center">
                <p className="text-och-steel">Loading submissions...</p>
              </Card>
            ) : submissions.length === 0 ? (
              <Card className="glass-card p-8 text-center">
                <p className="text-och-steel mb-4">No submissions found for this mission.</p>
                <Button onClick={loadSubmissions} variant="outline" size="sm">
                  Refresh
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                        {submissions.map((submission) => (
                  <Card
                    key={submission.id}
                    className="glass-card p-5 hover:border-och-mint/50 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleSubmissionClick(submission)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-white">{submission.mentee_name}</h4>
                          <Badge
                            variant={
                              submission.status === 'approved' ? 'mint' :
                              submission.status === 'submitted' || submission.status === 'ai_reviewed' ? 'orange' :
                              'steel'
                            }
                            className="text-xs capitalize"
                          >
                            {submission.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-och-steel mb-2">
                          <span className="font-medium">Submitted:</span> {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                        {(submission as any).ai_score !== undefined && (submission as any).ai_score !== null && (
                          <p className="text-sm text-och-steel">
                            <span className="font-medium">AI Score:</span> <span className="text-och-mint font-semibold">{(submission as any).ai_score}/100</span>
                          </p>
                        )}
                        {(submission as any).mentor_score !== undefined && (submission as any).mentor_score !== null && (
                          <p className="text-sm text-och-steel">
                            <span className="font-medium">Mentor Score:</span> <span className="text-white font-semibold">{(submission as any).mentor_score}/100</span>
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="group-hover:bg-och-mint/10 group-hover:border-och-mint/50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSubmissionClick(submission)
                        }}
                      >
                        Review →
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && selectedSubmission && (
          <div className="space-y-6">
            <MissionReviewPanel
              mentorId={mentorId || ''}
              submission={selectedSubmission}
              mission={mission}
              onReviewComplete={() => {
                loadSubmissions()
                setActiveTab('submissions')
              }}
            />
            {selectedSubmission.mentee_id && (
              <StudentProgressView
                menteeId={selectedSubmission.mentee_id}
                missionId={missionId}
              />
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  )
}

