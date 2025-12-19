'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDashboardStore } from '../lib/store/dashboardStore'
import { useRSVPEvent } from '../lib/hooks/useDashboard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import '../styles/dashboard.css'

export function LeftSidebar() {
  const { quickStats, events, trackOverview, communityFeed } = useDashboardStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()
  const rsvpEvent = useRSVPEvent()

  const getEventUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-dashboard-error'
      case 'medium':
        return 'text-dashboard-warning'
      default:
        return 'text-dashboard-success'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'mission_due':
        return '🔴'
      case 'mentor_session':
        return '🟢'
      case 'review_meeting':
        return '🟡'
      default:
        return '⚪'
    }
  }

  if (isCollapsed) {
    return (
      <div className="w-16 fixed left-0 top-0 h-full bg-dashboard-card/80 backdrop-blur-md border-r border-white/20 p-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full p-2 text-dashboard-accent hover:bg-dashboard-accent/20 rounded"
          aria-label="Expand sidebar"
        >
          →
        </button>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="w-[280px] fixed left-0 top-0 h-full bg-dashboard-card/80 backdrop-blur-md border-r border-white/20 overflow-y-auto p-4 space-y-4 z-40"
      >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Dashboard</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-och-steel hover:text-white"
          aria-label="Collapse sidebar"
        >
          ←
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-och-steel mb-3">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <Card className="glass-card p-3 text-center h-20">
            <div className="text-2xl font-bold text-white">{quickStats?.points || 0}</div>
            <div className="text-xs text-och-steel">Points</div>
          </Card>
          <Card className="glass-card p-3 text-center h-20">
            <div className="text-2xl font-bold text-white">{quickStats?.streak || 0} 🔥</div>
            <div className="text-xs text-och-steel">Streak</div>
          </Card>
          <Card className="glass-card p-3 text-center h-20">
            <div className="text-2xl font-bold text-white">{quickStats?.badges || 0} ⭐</div>
            <div className="text-xs text-och-steel">Badges</div>
          </Card>
          <Card className="glass-card p-3 text-center h-20">
            <div className="text-2xl font-bold text-white">{quickStats?.mentorRating || 0}/5</div>
            <div className="text-xs text-och-steel">Mentor</div>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-och-steel mb-3">Upcoming Events</h3>
        <div className="space-y-2">
          {(!events || events.length === 0) ? (
            <div className="text-center py-4">
              <p className="text-xs text-och-steel mb-2">No upcoming events</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => router.push('/dashboard/student/community')}
              >
                View All Events
              </Button>
            </div>
          ) : (
            (events || []).map((event) => (
              <Card key={event.id} className="glass-card p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white mb-1">{event.title}</div>
                    <div className="text-xs text-och-steel mb-1">
                      {new Date(event.date).toLocaleDateString()} {event.time}
                    </div>
                    {event.rsvpRequired && (
                      <Button
                        variant="mint"
                        size="sm"
                        className="w-full text-xs mt-1"
                        onClick={async () => {
                          if (!event.rsvpStatus || event.rsvpStatus === 'pending') {
                            await rsvpEvent.mutateAsync({ eventId: event.id, status: 'accepted' })
                          } else {
                            router.push(event.actionUrl || '#')
                          }
                        }}
                        disabled={rsvpEvent.isPending}
                      >
                        {rsvpEvent.isPending ? 'Saving...' : event.rsvpStatus === 'accepted' ? 'RSVP\'d' : 'RSVP'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-och-steel mb-3">Track Overview</h3>
        <Card className="glass-card p-3">
          <div className="text-sm font-semibold text-white mb-2">
            {trackOverview?.name || 'Track'} ({trackOverview?.completedMilestones || 0}/{trackOverview?.totalMilestones || 0})
          </div>
          <div className="space-y-2">
            {(trackOverview?.milestones || []).map((milestone: any) => (
              <div key={milestone.id || milestone.code}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-och-steel">{milestone.code || milestone.name}</span>
                  <span className="text-och-steel">{milestone.progress || 0}%</span>
                </div>
                <ProgressBar value={milestone.progress || 0} max={100} variant="mint" showLabel={false} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-och-steel mb-3">Community Feed</h3>
        <div className="space-y-2">
          {(!communityFeed || communityFeed.length === 0) ? (
            <div className="text-center py-4">
              <p className="text-xs text-och-steel mb-2">No recent activity</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => router.push('/dashboard/student/community')}
              >
                Join Community
              </Button>
            </div>
          ) : (
            (communityFeed || []).slice(0, 3).map((activity: any) => (
              <Card key={activity.id || activity.content} className="glass-card p-3">
                <div className="text-xs text-white mb-1">
                  {activity.content || (
                    <>
                      <span className="font-semibold">{activity.author || activity.user || 'User'}</span> {activity.action || activity.type}
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-och-steel">{activity.timestamp || 'Recently'}</span>
                  {activity.likes !== undefined && (
                    <span className="text-xs text-och-steel">👍 {activity.likes}</span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </motion.div>
    
    {/* Desktop: Spacer for fixed sidebar */}
    <div className="hidden lg:block w-[280px] flex-shrink-0" aria-hidden="true" />
    </>
  )
}

