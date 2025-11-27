/**
 * Mentorship OS Component
 * Program directors, mentors, cohorts
 * Human guidance alongside AI coaching
 */

'use client';

import { useState } from 'react';
import type { User, Organization } from '@/services/types';

interface MentorshipCardProps {
  organizations: Organization[];
  user: User;
  expanded?: boolean;
}

interface Mentor {
  id: string;
  name: string;
  role: string;
  organization: string;
  next_session?: string;
  availability: 'available' | 'busy';
}

interface Cohort {
  id: string;
  name: string;
  program_director: string;
  member_count: number;
  start_date: string;
}

export default function MentorshipCard({ organizations, user, expanded = false }: MentorshipCardProps) {
  const [activeView, setActiveView] = useState<'mentors' | 'cohorts' | 'sessions'>('mentors');

  // Mock data - replace with API calls
  const mentors: Mentor[] = [
    { id: '1', name: 'Dr. Jane Smith', role: 'Senior Mentor', organization: 'OCH', availability: 'available' },
  ];

  const cohorts: Cohort[] = organizations.map(org => ({
    id: org.id?.toString() || '',
    name: org.name,
    program_director: 'Program Director',
    member_count: 0,
    start_date: '2024-01-01',
  }));

  return (
    <div className="card border-sahara-gold">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-h2 text-white flex items-center gap-2">
            <span>🤝</span>
            Mentorship OS
          </h2>
          <p className="text-body-s text-steel-grey mt-1">
            Mentors • Cohorts • Sessions
          </p>
        </div>
        <span className="badge-mastery">{mentors.length} Mentor{mentors.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-steel-grey mb-4 pb-2">
        {[
          { id: 'mentors', label: 'Mentors', icon: '👨‍🏫' },
          { id: 'cohorts', label: 'Cohorts', icon: '👥' },
          { id: 'sessions', label: 'Sessions', icon: '📅' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-card text-body-s font-semibold
              transition-all duration-200
              ${
                activeView === tab.id
                  ? 'bg-sahara-gold bg-opacity-20 text-sahara-gold border border-sahara-gold'
                  : 'text-steel-grey hover:text-sahara-gold'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Mentors View */}
      {activeView === 'mentors' && (
        <div className="space-y-3">
          {mentors.length > 0 ? (
            mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-och-midnight border border-steel-grey rounded-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-body-m font-semibold text-white">{mentor.name}</h4>
                    <p className="text-body-s text-steel-grey">
                      {mentor.role} • {mentor.organization}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-body-xs font-semibold ${
                    mentor.availability === 'available' ? 'badge-beginner' : 'badge-intermediate'
                  }`}>
                    {mentor.availability}
                  </span>
                </div>
                {mentor.next_session && (
                  <p className="text-body-s text-steel-grey mb-3">
                    Next session: {new Date(mentor.next_session).toLocaleDateString()}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = `/dashboard/mentee/mentorship/mentors/${mentor.id}`}
                    className="btn-primary text-body-s px-4 py-2"
                  >
                    View Profile
                  </button>
                  {mentor.availability === 'available' && (
                    <button
                      onClick={() => window.location.href = `/dashboard/mentee/mentorship/sessions/book`}
                      className="btn-secondary text-body-s px-4 py-2"
                    >
                      Book Session
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-steel-grey">
              <p className="text-body-m mb-2">No mentors assigned yet</p>
              <p className="text-body-s">Mentors will be assigned based on your track and progress</p>
            </div>
          )}
        </div>
      )}

      {/* Cohorts View */}
      {activeView === 'cohorts' && (
        <div className="space-y-3">
          {cohorts.length > 0 ? (
            cohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="bg-och-midnight border border-steel-grey rounded-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-body-m font-semibold text-white">{cohort.name}</h4>
                    <p className="text-body-s text-steel-grey">
                      {cohort.member_count} members • Started {new Date(cohort.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = `/dashboard/mentee/mentorship/cohorts/${cohort.id}`}
                  className="btn-primary text-body-s px-4 py-2 mt-2"
                >
                  View Cohort
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-steel-grey">
              <p className="text-body-m mb-2">No cohorts yet</p>
              <p className="text-body-s">You'll be assigned to a cohort based on your track</p>
            </div>
          )}
        </div>
      )}

      {/* Sessions View */}
      {activeView === 'sessions' && (
        <div className="space-y-3">
          <div className="text-center py-8 text-steel-grey">
            <p className="text-body-m mb-2">No upcoming sessions</p>
            <p className="text-body-s mb-4">Book a session with your mentor to get started</p>
            <button
              onClick={() => window.location.href = '/dashboard/mentee/mentorship/sessions/book'}
              className="btn-primary"
            >
              Book Session
            </button>
          </div>
        </div>
      )}

      {!expanded && (
        <div className="mt-4 pt-4 border-t border-steel-grey">
          <button
            onClick={() => window.location.href = '/dashboard/mentee/mentorship'}
            className="text-body-s text-sahara-gold hover:underline w-full text-center"
          >
            Open Mentorship OS →
          </button>
        </div>
      )}
    </div>
  );
}



