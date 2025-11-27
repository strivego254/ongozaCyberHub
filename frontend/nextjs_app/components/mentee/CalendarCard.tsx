/**
 * Events & Calendar Engine Component
 * Upcoming events, sessions, deadlines
 */

'use client';

import { useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'session' | 'deadline' | 'event' | 'cohort';
  date: string;
  time?: string;
  location?: string;
}

export default function CalendarCard() {
  // Mock data - replace with API calls
  const upcomingEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Mentor Session with Dr. Jane Smith',
      type: 'session',
      date: '2024-12-01',
      time: '14:00',
      location: 'Zoom',
    },
    {
      id: '2',
      title: 'Mission Submission Deadline',
      type: 'deadline',
      date: '2024-12-05',
    },
    {
      id: '3',
      title: 'Cohort Meetup',
      type: 'cohort',
      date: '2024-12-10',
      time: '18:00',
    },
  ];

  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const eventsThisWeek = upcomingEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= nextWeek;
  });

  return (
    <div className="card border-cyber-mint">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>📅</span>
            Calendar & Events
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Sessions • Deadlines • Events
          </p>
        </div>
        <span className="badge-beginner">{eventsThisWeek.length} This Week</span>
      </div>

      <div className="space-y-3">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="bg-och-midnight border border-steel-grey rounded-card p-3 hover:border-cyber-mint transition-all"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {event.type === 'session' && '🤝'}
                      {event.type === 'deadline' && '⏰'}
                      {event.type === 'event' && '🎉'}
                      {event.type === 'cohort' && '👥'}
                    </span>
                    <h4 className="text-body-m font-semibold text-white">{event.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-body-s text-steel-grey">
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    {event.time && <span>{event.time}</span>}
                    {event.location && <span>• {event.location}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-steel-grey">
            <p className="text-body-m mb-2">No upcoming events</p>
            <p className="text-body-s">Events and sessions will appear here</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-steel-grey">
        <button
          onClick={() => window.location.href = '/dashboard/mentee/calendar'}
          className="text-body-s text-cyber-mint hover:underline w-full text-center"
        >
          View Full Calendar →
        </button>
      </div>
    </div>
  );
}



