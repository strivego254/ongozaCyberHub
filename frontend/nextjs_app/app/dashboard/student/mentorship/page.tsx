'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MentorshipChat } from '@/components/mentorship/MentorshipChat'

export default function MentorshipPage() {
  const sessions = [
    {
      id: '1',
      mentor: 'Dr. Sarah Johnson',
      topic: 'Career Guidance',
      date: '2024-12-05',
      time: '14:00',
      status: 'upcoming',
      type: 'scheduled',
    },
    {
      id: '2',
      mentor: 'Dr. Sarah Johnson',
      topic: 'Technical Review',
      date: '2024-11-28',
      time: '10:00',
      status: 'completed',
      type: 'completed',
    },
    {
      id: '3',
      mentor: 'Prof. Michael Chen',
      topic: 'Project Feedback',
      date: '2024-12-10',
      time: '16:00',
      status: 'upcoming',
      type: 'scheduled',
    },
  ]

  const feedback = [
    {
      id: '1',
      from: 'Dr. Sarah Johnson',
      message: 'Great progress on the network security project. Your analysis was thorough.',
      date: '2024-11-28',
      project: 'Network Security Assessment',
    },
    {
      id: '2',
      from: 'Prof. Michael Chen',
      message: 'Consider exploring more advanced encryption techniques for your next project.',
      date: '2024-11-25',
      project: 'Encryption Implementation',
    },
  ]

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
              {sessions
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
                ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Recent Feedback</h2>
            <div className="space-y-4">
              {feedback.map((item) => (
                <div key={item.id} className="p-4 bg-och-midnight/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-white">{item.from}</div>
                    <div className="text-xs text-och-steel">{item.date}</div>
                  </div>
                  <div className="text-sm text-och-steel mb-2">{item.message}</div>
                  <Badge variant="steel" className="text-xs">{item.project}</Badge>
                </div>
              ))}
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
            {sessions.map((session) => (
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
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

