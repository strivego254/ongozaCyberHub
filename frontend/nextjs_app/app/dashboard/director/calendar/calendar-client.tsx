'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCohorts } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'

export default function CalendarClient() {
  const { cohorts } = useCohorts()
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const [events, setEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  const loadEvents = async (cohortId: string) => {
    setLoadingEvents(true)
    try {
      const data = await programsClient.getCohortCalendar(cohortId)
      setEvents(data)
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleCohortChange = (cohortId: string) => {
    setSelectedCohortId(cohortId)
    if (cohortId) {
      loadEvents(cohortId)
    } else {
      setEvents([])
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-orange">Cohort Calendar</h1>
            <p className="text-och-steel">Manage calendar events for cohorts.</p>
          </div>
          <Link href="/dashboard/director">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">Select Cohort</label>
          <select
            value={selectedCohortId}
            onChange={(e) => handleCohortChange(e.target.value)}
            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white"
          >
            <option value="">Select a cohort</option>
            {cohorts?.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} {cohort.track_name && `(${cohort.track_name})`}
              </option>
            ))}
          </select>
        </Card>

        {selectedCohortId && (
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Calendar Events</h2>
            {loadingEvents ? (
              <p className="text-och-steel">Loading events...</p>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-och-midnight/50 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-semibold">{event.title}</h3>
                        <p className="text-sm text-och-steel">{event.description}</p>
                        <p className="text-xs text-och-steel mt-2">
                          {new Date(event.start_ts).toLocaleString()} - {new Date(event.end_ts).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs text-och-steel capitalize">{event.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-och-steel">No events scheduled for this cohort.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}




