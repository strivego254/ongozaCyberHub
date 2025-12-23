/**
 * Redesigned Student Mentorship Page
 * Orchestrates matching, sessions, goals, and feedback.
 */

'use client';

import { MentorshipHub } from '@/components/ui/mentorship/MentorshipHub';

export default function MentorshipPage() {
  return (
    <div className="min-h-screen bg-och-midnight text-slate-200">
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        
        {/* PAGE HEADER */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Professional Mentorship</h1>
            <div className="px-2 py-0.5 rounded bg-och-gold/10 border border-och-gold/20">
               <span className="text-[10px] font-black text-och-gold uppercase tracking-widest">MMM v4.2</span>
            </div>
          </div>
          <p className="text-och-steel text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-och-mint" />
            From Competence to Professional Mastery
          </p>
        </div>

        {/* MMM CONSOLE */}
        <MentorshipHub />

      </div>
    </div>
  );
}
