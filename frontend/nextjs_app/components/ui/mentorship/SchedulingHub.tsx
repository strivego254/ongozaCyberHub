/**
 * Scheduling & Calendar Hub (SCH)
 * Time-management backbone for OCH mentorship.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Video,
  MapPin,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { MentorshipSession } from '@/hooks/useMentorship';
import clsx from 'clsx';

export function SchedulingHub({ sessions }: { sessions: MentorshipSession[] }) {
  const upcoming = sessions.filter(s => s.status === 'confirmed' || s.status === 'pending');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Scheduling Hub</h2>
          <p className="text-och-steel text-xs font-black uppercase tracking-widest mt-1">Real-time sync with Google & Outlook</p>
        </div>
        <Button 
          variant="defender"
          onClick={() => setIsRequestModalOpen(true)}
          className="h-12 px-8 rounded-2xl bg-och-gold text-black hover:bg-white transition-all font-black uppercase tracking-widest text-[10px] shadow-lg shadow-och-gold/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request New Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CALENDAR VIEW PREVIEW (Mock) */}
        <Card className="lg:col-span-7 bg-white/5 border-white/10 p-6 rounded-[2.5rem]">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-och-gold" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Availability Matrix</span>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-och-gold" />
                  <span className="text-[8px] font-black text-och-steel uppercase tracking-widest">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-och-defender" />
                  <span className="text-[8px] font-black text-och-steel uppercase tracking-widest">Session</span>
                </div>
             </div>
           </div>

           {/* MOCK CALENDAR GRID */}
           <div className="grid grid-cols-7 gap-2">
             {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
               <div key={day} className="text-center text-[9px] font-black text-och-steel uppercase tracking-widest py-2">{day}</div>
             ))}
             {Array.from({ length: 31 }).map((_, i) => {
               const day = i + 1;
               const isToday = day === 23; // Assume Dec 23
               const isSession = [24, 27].includes(day);
               const isAvailable = [25, 26, 28, 29].includes(day);

               return (
                 <div 
                  key={i} 
                  className={clsx(
                    "aspect-square rounded-xl border flex flex-col items-center justify-center relative group transition-all cursor-pointer",
                    isToday ? "bg-white/10 border-white/20" : "bg-transparent border-white/5",
                    isSession && "border-och-defender/40",
                    isAvailable && "hover:bg-och-gold/5 hover:border-och-gold/20"
                  )}
                 >
                   <span className={clsx(
                     "text-xs font-black",
                     isToday ? "text-och-gold" : "text-och-steel group-hover:text-white"
                   )}>{day}</span>
                   {isSession && <div className="absolute bottom-2 w-1 h-1 rounded-full bg-och-defender" />}
                   {isAvailable && <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-och-gold opacity-0 group-hover:opacity-100" />}
                 </div>
               );
             })}
           </div>

           <div className="mt-8 p-4 rounded-2xl bg-och-steel/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-och-mint" />
                <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Normalized to Africa/Nairobi (UTC+3)</span>
              </div>
              <Badge variant="steel" className="text-[8px] font-black uppercase tracking-tighter">Live Sync: Active</Badge>
           </div>
        </Card>

        {/* UPCOMING SESSIONS LIST */}
        <div className="lg:col-span-5 space-y-4">
           <div className="flex items-center gap-2 px-2">
             <Clock className="w-4 h-4 text-och-mint" />
             <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Upcoming Engagements</span>
           </div>

           {upcoming.length > 0 ? (
             upcoming.map((session) => (
               <div key={session.id} className="p-6 rounded-3xl bg-och-midnight border border-och-steel/10 hover:border-white/10 transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-och-gold/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
                 
                 <div className="flex justify-between items-start mb-4 relative z-10">
                   <div>
                     <Badge variant={session.status === 'confirmed' ? 'mint' : 'gold'} className="text-[8px] font-black uppercase px-2 mb-2">
                       {session.status}
                     </Badge>
                     <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">{session.topic}</h4>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-och-gold font-black uppercase tracking-widest">{new Date(session.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                     <p className="text-[10px] text-och-steel font-bold uppercase">{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-4 mt-6 relative z-10">
                   {session.meeting_link && (
                     <Button 
                       variant="defender" 
                       size="sm" 
                       className="flex-1 h-9 rounded-xl bg-och-defender/10 text-och-defender border border-och-defender/20 hover:bg-och-defender hover:text-black font-black uppercase tracking-widest text-[8px]"
                       onClick={() => window.open(session.meeting_link, '_blank')}
                     >
                       <Video className="w-3 h-3 mr-2" />
                       Join Session
                     </Button>
                   )}
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="flex-1 h-9 rounded-xl border-och-steel/20 text-och-steel hover:text-white font-black uppercase tracking-widest text-[8px]"
                   >
                     Reschedule
                   </Button>
                 </div>
               </div>
             ))
           ) : (
             <div className="p-12 text-center rounded-[2.5rem] border-2 border-dashed border-och-steel/10 flex flex-col items-center justify-center">
                <Calendar className="w-12 h-12 text-och-steel/20 mb-4" />
                <p className="text-och-steel text-xs font-black uppercase tracking-widest">No active session blocks</p>
                <p className="text-[10px] text-slate-500 mt-2 italic max-w-[200px]">"Consistent mentorship is the engine of professional mastery. Request a slot to begin."</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}


