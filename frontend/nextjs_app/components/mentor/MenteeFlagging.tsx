'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMenteeFlags } from '@/hooks/useMenteeFlags'
import { useMentorMentees } from '@/hooks/useMentorMentees'
import { useAuth } from '@/hooks/useAuth'

export function MenteeFlagging() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { mentees } = useMentorMentees(mentorId)
  const { flags, isLoading, error, flagMentee } = useMenteeFlags(mentorId)
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [formData, setFormData] = useState({
    mentee_id: '',
    flag_type: 'struggling' as 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
  })

  const handleSubmit = async () => {
    if (!formData.mentee_id || !formData.description.trim()) return
    try {
      await flagMentee(formData)
      setShowFlagForm(false)
      setFormData({
        mentee_id: '',
        flag_type: 'struggling',
        severity: 'medium',
        description: '',
      })
    } catch (err) {
      // Error handled by hook
    }
  }

  const severityColors = {
    low: 'mint',
    medium: 'gold',
    high: 'orange',
    critical: 'orange',
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Mentee Flags</h2>
          <p className="text-sm text-och-steel">
            Flag mentees who are struggling or need attention.
          </p>
        </div>
        <Button variant="defender" onClick={() => setShowFlagForm(!showFlagForm)}>
          {showFlagForm ? 'Cancel' : '+ Flag Mentee'}
        </Button>
      </div>

      {showFlagForm && (
        <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg space-y-3">
          <select
            value={formData.mentee_id}
            onChange={(e) => setFormData({ ...formData, mentee_id: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="">Select Mentee</option>
            {mentees.map((mentee) => (
              <option key={mentee.id} value={mentee.id}>
                {mentee.name}
              </option>
            ))}
          </select>
          <select
            value={formData.flag_type}
            onChange={(e) => setFormData({ ...formData, flag_type: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="struggling">Struggling</option>
            <option value="at_risk">At Risk</option>
            <option value="needs_attention">Needs Attention</option>
            <option value="technical_issue">Technical Issue</option>
          </select>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Describe the issue..."
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <Button variant="defender" onClick={handleSubmit}>Submit Flag</Button>
        </div>
      )}

      {isLoading && <div className="text-och-steel text-sm">Loading flags...</div>}
      {error && <div className="text-och-orange text-sm">Error: {error}</div>}

      {!isLoading && !error && flags.length === 0 && (
        <div className="text-och-steel text-sm">No flags raised.</div>
      )}

      {!isLoading && !error && flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div key={flag.id} className="p-4 bg-och-midnight/50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">{flag.mentee_name}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={severityColors[flag.severity] as any} className="text-xs capitalize">
                      {flag.severity}
                    </Badge>
                    <Badge variant="defender" className="text-xs capitalize">
                      {flag.flag_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="mint" className="text-xs capitalize">
                      {flag.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-xs text-och-steel">
                  {new Date(flag.raised_at).toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-white mt-2">{flag.description}</p>
              {flag.resolution_notes && (
                <div className="mt-3 p-2 bg-och-midnight rounded">
                  <div className="text-xs text-och-steel mb-1">Resolution Notes:</div>
                  <p className="text-sm text-white">{flag.resolution_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}


