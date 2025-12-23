/**
 * Mentorship Messaging Module
 * Secure, auditable communication between mentee and mentor.
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Shield, Info } from 'lucide-react';
import { MentorshipChat } from '@/components/mentorship/MentorshipChat';
import { useAuth } from '@/hooks/useAuth';
import { useMentorship } from '@/hooks/useMentorship';

export function MentorshipMessaging() {
  const { user } = useAuth();
  const userId = user?.id;
  const { mentor } = useMentorship(userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Mentor Messaging</h2>
          <p className="text-och-steel text-xs font-black uppercase tracking-widest mt-1">Direct channel for mission support</p>
        </div>
        <div className="flex items-center gap-2 p-2 px-4 rounded-xl bg-och-defender/10 border border-och-defender/20">
           <Shield className="w-4 h-4 text-och-defender" />
           <span className="text-[9px] font-black text-och-defender uppercase tracking-widest">Auditable & Professional</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8">
            <MentorshipChat 
              mentorId={mentor?.id} 
              mentorName={mentor?.name} 
            />
         </div>

         <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 bg-white/5 border-white/10 rounded-[2rem]">
               <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Info className="w-3.5 h-3.5 text-och-gold" />
                 Communication Protocol
               </h4>
               <ul className="space-y-4">
                  {[
                    'Shared files are automatically scanned for malware.',
                    'Direct messaging is for mission blockers and quick syncs.',
                    'Use Scheduling Hub for deep-dive technical reviews.',
                    'All interactions contribute to your Engagement Score.'
                  ].map((tip, i) => (
                    <li key={i} className="flex gap-3">
                       <div className="w-1 h-1 rounded-full bg-och-gold mt-1.5 shrink-0" />
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">"{tip}"</p>
                    </li>
                  ))}
               </ul>
            </Card>

            <div className="p-6 rounded-[2rem] bg-och-midnight border border-och-steel/10 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-och-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <h4 className="text-xs font-black text-white uppercase tracking-tight mb-2">Mentor Influence</h4>
               <p className="text-[10px] text-och-steel leading-relaxed mb-4 italic">"Communication frequency and quality directly impacts your Mentor Influence Index."</p>
               <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full w-3/4 bg-och-gold" />
                  </div>
                  <span className="text-[10px] font-black text-och-gold">High</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}


