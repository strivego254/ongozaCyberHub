'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useMentorMentees } from '@/hooks/useMentorMentees'
import { useAuth } from '@/hooks/useAuth'

export function MenteesOverview() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { mentees, isLoading, error } = useMentorMentees(mentorId)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return mentees.filter((m) =>
      !term ||
      m.name.toLowerCase().includes(term) ||
      (m.email && m.email.toLowerCase().includes(term))
    )
  }, [mentees, search])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const riskVariant = (risk?: string) => {
    if (risk === 'high') return 'orange'
    if (risk === 'medium') return 'gold'
    return 'mint'
  }

  const handleBulkMessage = () => {
    if (selectedIds.size === 0) return
    alert(`Bulk message to ${selectedIds.size} mentees (hook into mentorship chat/API here).`)
  }

  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Mentees Overview</h2>
          <p className="text-sm text-och-steel">
            Monitor mentee readiness, risk, and recent activity.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mentees..."
            className="px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkMessage}
            disabled={selectedIds.size === 0}
          >
            Message Selected
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-och-steel text-sm">Loading mentees...</div>
      )}

      {error && !isLoading && (
        <div className="text-och-orange text-sm">Error loading mentees: {error}</div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-och-steel text-sm">No mentees found.</div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-och-steel">
            <thead>
              <tr className="border-b border-och-steel/20 text-xs uppercase">
                <th className="px-2 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all mentees"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filtered.map(m => m.id)))
                      } else {
                        setSelectedIds(new Set())
                      }
                    }}
                    checked={
                      filtered.length > 0 &&
                      selectedIds.size === filtered.length
                    }
                  />
                </th>
                <th className="px-2 py-2">Mentee</th>
                <th className="px-2 py-2">Readiness</th>
                <th className="px-2 py-2">Last Activity</th>
                <th className="px-2 py-2">Risk</th>
                <th className="px-2 py-2">Missions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-och-steel/10 hover:bg-och-midnight/40">
                  <td className="px-2 py-2 align-top">
                    <input
                      type="checkbox"
                      aria-label={`Select ${m.name}`}
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{m.name}</span>
                      {m.email && (
                        <span className="text-xs text-och-steel">{m.email}</span>
                      )}
                      {(m.track || m.cohort) && (
                        <span className="text-xs text-och-steel">
                          {m.track && `${m.track}`} {m.cohort && `• ${m.cohort}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 align-top w-48">
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={m.readiness_score}
                        variant={m.readiness_score >= 70 ? 'mint' : m.readiness_score >= 40 ? 'gold' : 'orange'}
                        showLabel={false}
                        className="flex-1"
                      />
                      <span className="text-xs text-och-steel w-10 text-right">
                        {m.readiness_score}%
                      </span>
                    </div>
                    {m.readiness_label && (
                      <div className="text-[11px] text-och-steel mt-1">
                        {m.readiness_label}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 align-top text-xs">
                    {m.last_activity_at
                      ? new Date(m.last_activity_at).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <Badge variant={riskVariant(m.risk_level) as any} className="text-xs capitalize">
                      {m.risk_level || 'low'}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 align-top text-xs">
                    {m.missions_completed ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}


