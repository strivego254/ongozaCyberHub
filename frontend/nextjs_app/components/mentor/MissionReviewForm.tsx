'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { mentorClient } from '@/services/mentorClient'
import type { MissionSubmission } from '@/services/types/mentor'

interface MissionReviewFormProps {
  submission: MissionSubmission
  onReviewComplete: () => void
}

export function MissionReviewForm({ submission, onReviewComplete }: MissionReviewFormProps) {
  const [overallStatus, setOverallStatus] = useState<'pass' | 'fail' | 'needs_revision'>('pass')
  const [writtenFeedback, setWrittenFeedback] = useState('')
  const [comments, setComments] = useState<Array<{ comment: string; section?: string }>>([])
  const [newComment, setNewComment] = useState('')
  const [newCommentSection, setNewCommentSection] = useState('')
  const [technicalCompetencies, setTechnicalCompetencies] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, number>>({})
  const [newScoreKey, setNewScoreKey] = useState('')
  const [newScoreValue, setNewScoreValue] = useState('')
  const [recommendedMissions, setRecommendedMissions] = useState<string[]>([])
  const [newRecommendedMission, setNewRecommendedMission] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addComment = () => {
    if (!newComment.trim()) return
    setComments([...comments, { comment: newComment, section: newCommentSection || undefined }])
    setNewComment('')
    setNewCommentSection('')
  }

  const removeComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (!newTag.trim() || technicalCompetencies.includes(newTag)) return
    setTechnicalCompetencies([...technicalCompetencies, newTag])
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    setTechnicalCompetencies(technicalCompetencies.filter(t => t !== tag))
  }

  const addScore = () => {
    if (!newScoreKey.trim() || !newScoreValue) return
    const value = parseFloat(newScoreValue)
    if (isNaN(value)) return
    setScoreBreakdown({ ...scoreBreakdown, [newScoreKey]: value })
    setNewScoreKey('')
    setNewScoreValue('')
  }

  const removeScore = (key: string) => {
    const updated = { ...scoreBreakdown }
    delete updated[key]
    setScoreBreakdown(updated)
  }

  const addRecommendedMission = () => {
    if (!newRecommendedMission.trim() || recommendedMissions.includes(newRecommendedMission)) return
    setRecommendedMissions([...recommendedMissions, newRecommendedMission])
    setNewRecommendedMission('')
  }

  const removeRecommendedMission = (mission: string) => {
    setRecommendedMissions(recommendedMissions.filter(m => m !== mission))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const USE_MOCK_DATA = true // Set to false when backend is ready
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        // In mock mode, just complete successfully
        onReviewComplete()
      } else {
        await mentorClient.submitMissionReview(submission.id, {
          overall_status: overallStatus,
          feedback: writtenFeedback ? { written: writtenFeedback } : undefined,
          comments: comments.length > 0 ? comments : undefined,
          technical_competencies: technicalCompetencies.length > 0 ? technicalCompetencies : undefined,
          score_breakdown: Object.keys(scoreBreakdown).length > 0 ? scoreBreakdown : undefined,
          recommended_next_missions: recommendedMissions.length > 0 ? recommendedMissions : undefined,
        })
        onReviewComplete()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Mission Review: {submission.mission_title}</h2>
        <p className="text-sm text-och-steel">
          Mentee: {submission.mentee_name} ({submission.mentee_email})
        </p>
        <p className="text-xs text-och-steel">
          Submitted: {new Date(submission.submitted_at).toLocaleString()}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-och-orange/25 border border-och-orange text-white rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Submission Data Preview */}
      <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Submission Content</h3>
        {submission.submission_data.answers && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-och-steel mb-2">Answers:</h4>
            <pre className="text-xs text-och-steel bg-och-midnight p-3 rounded overflow-auto">
              {JSON.stringify(submission.submission_data.answers, null, 2)}
            </pre>
          </div>
        )}
        {submission.submission_data.files && submission.submission_data.files.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-och-steel mb-2">Files:</h4>
            <ul className="text-xs text-och-steel space-y-1">
              {submission.submission_data.files.map((file) => (
                <li key={file.id}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline">
                    {file.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {submission.submission_data.code_repository && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-och-steel mb-2">Repository:</h4>
            <a href={submission.submission_data.code_repository} target="_blank" rel="noopener noreferrer" className="text-xs text-och-mint hover:underline">
              {submission.submission_data.code_repository}
            </a>
          </div>
        )}
        {submission.submission_data.live_demo_url && (
          <div>
            <h4 className="text-sm font-medium text-och-steel mb-2">Live Demo:</h4>
            <a href={submission.submission_data.live_demo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-och-mint hover:underline">
              {submission.submission_data.live_demo_url}
            </a>
          </div>
        )}
      </div>

      {/* Overall Status */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Overall Status</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="pass"
              checked={overallStatus === 'pass'}
              onChange={(e) => setOverallStatus(e.target.value as any)}
              className="text-och-mint"
            />
            <span className="text-och-steel">Pass</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="fail"
              checked={overallStatus === 'fail'}
              onChange={(e) => setOverallStatus(e.target.value as any)}
              className="text-och-mint"
            />
            <span className="text-och-steel">Fail</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="needs_revision"
              checked={overallStatus === 'needs_revision'}
              onChange={(e) => setOverallStatus(e.target.value as any)}
              className="text-och-mint"
            />
            <span className="text-och-steel">Needs Revision</span>
          </label>
        </div>
      </div>

      {/* Written Feedback */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Written Feedback</label>
        <textarea
          value={writtenFeedback}
          onChange={(e) => setWrittenFeedback(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          placeholder="Provide detailed feedback on the submission..."
        />
      </div>

      {/* Comments */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Comments</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newCommentSection}
            onChange={(e) => setNewCommentSection(e.target.value)}
            placeholder="Section (optional)"
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            onKeyPress={(e) => e.key === 'Enter' && addComment()}
          />
          <Button variant="outline" size="sm" onClick={addComment}>Add</Button>
        </div>
        <div className="space-y-2">
          {comments.map((comment, index) => (
            <div key={index} className="p-2 bg-och-midnight/50 rounded flex justify-between items-start">
              <div className="flex-1">
                {comment.section && (
                  <span className="text-xs text-och-steel font-medium">{comment.section}: </span>
                )}
                <span className="text-sm text-white">{comment.comment}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => removeComment(index)}>Remove</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Competencies */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Technical Competencies</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add competency tag..."
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {technicalCompetencies.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-och-defender/30 text-och-mint rounded text-xs flex items-center gap-2">
              {tag}
              <button onClick={() => removeTag(tag)} className="text-och-steel hover:text-white">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Score Breakdown (JSONB)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newScoreKey}
            onChange={(e) => setNewScoreKey(e.target.value)}
            placeholder="Score category"
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <input
            type="number"
            value={newScoreValue}
            onChange={(e) => setNewScoreValue(e.target.value)}
            placeholder="Score value"
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            onKeyPress={(e) => e.key === 'Enter' && addScore()}
          />
          <Button variant="outline" size="sm" onClick={addScore}>Add</Button>
        </div>
        <div className="space-y-1">
          {Object.entries(scoreBreakdown).map(([key, value]) => (
            <div key={key} className="p-2 bg-och-midnight/50 rounded flex justify-between items-center">
              <span className="text-sm text-white">{key}: {value}</span>
              <Button variant="outline" size="sm" onClick={() => removeScore(key)}>Remove</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Next Missions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Recommended Next Missions</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newRecommendedMission}
            onChange={(e) => setNewRecommendedMission(e.target.value)}
            placeholder="Mission ID or title..."
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            onKeyPress={(e) => e.key === 'Enter' && addRecommendedMission()}
          />
          <Button variant="outline" size="sm" onClick={addRecommendedMission}>Add</Button>
        </div>
        <div className="space-y-1">
          {recommendedMissions.map((mission) => (
            <div key={mission} className="p-2 bg-och-midnight/50 rounded flex justify-between items-center">
              <span className="text-sm text-white">{mission}</span>
              <Button variant="outline" size="sm" onClick={() => removeRecommendedMission(mission)}>Remove</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onReviewComplete}>Cancel</Button>
        <Button variant="defender" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </Card>
  )
}


