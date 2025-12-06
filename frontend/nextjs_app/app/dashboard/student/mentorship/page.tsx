'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MentorshipChat } from '@/components/mentorship/MentorshipChat'

export default function MentorshipPage() {
  const sessions: any[] = []
  const feedback: any[] = []

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-mint">Mentorship</h1>
            <p className="text-och-steel">
              Mentor sessions, feedback, scheduling
            </p>
          </div>
          <Button variant="mint">Schedule Session</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Upcoming Sessions</h2>
            <div className="space-y-4">
              {sessions.filter(s => s.status === 'upcoming').length === 0 ? (
                <div className="text-center py-8 text-och-steel">
                  <p>No upcoming sessions scheduled.</p>
                </div>
              ) : (
                sessions
                  .filter(s => s.status === 'upcoming')
                  .map((session) => (
                  <div key={session.id} className="p-4 bg-och-defender/20 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-white mb-1">{session.mentor}</div>
                        <div className="text-sm text-och-steel">{session.topic}</div>
                      </div>
                      <Badge variant="mint">Scheduled</Badge>
                    </div>
                    <div className="text-sm text-och-steel">
                      {session.date} at {session.time}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button variant="defender" size="sm">Reschedule</Button>
                    </div>
                  </div>
                  ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Recent Feedback</h2>
            <div className="space-y-4">
              {feedback.length === 0 ? (
                <div className="text-center py-8 text-och-steel">
                  <p>No feedback received yet.</p>
                </div>
              ) : (
                feedback.map((item) => (
                <div key={item.id} className="p-4 bg-och-midnight/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-white">{item.from}</div>
                    <div className="text-xs text-och-steel">{item.date}</div>
                  </div>
                  <div className="text-sm text-och-steel mb-2">{item.message}</div>
                  <Badge variant="steel" className="text-xs">{item.project}</Badge>
                </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Mentorship Chat */}
        <div className="mb-6">
          <MentorshipChat />
        </div>

        <Card>
          <h2 className="text-2xl font-bold mb-4 text-white">Session History</h2>
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-och-steel">
                <p>No session history available.</p>
              </div>
            ) : (
              sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-och-midnight/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-white">{session.mentor}</div>
                  <div className="text-sm text-och-steel">
                    {session.topic} • {session.date} at {session.time}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {session.status === 'completed' && (
                    <Badge variant="mint">Completed</Badge>
                  )}
                  {session.status === 'upcoming' && (
                    <Badge variant="defender">Upcoming</Badge>
                  )}
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

