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
import { RequestSessionModal } from './RequestSessionModal';
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
        {/* CALENDAR VIEW - Will be implemented with real calendar integration */}
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

           {/* Calendar will be integrated with real calendar API */}
           <div className="flex items-center justify-center min-h-[300px] text-och-steel">
             <div className="text-center">
               <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p className="text-sm font-black uppercase tracking-widest">Calendar Integration</p>
               <p className="text-xs mt-2 italic">Real-time calendar sync coming soon</p>
             </div>
           </div>

           <div className="mt-8 p-4 rounded-2xl bg-och-steel/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-och-mint" />
                <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Normalized to Africa/Nairobi (UTC+3)</span>
              </div>
              <Badge variant="steel" className="text-[8px] font-black uppercase tracking-tighter">Sync: Pending</Badge>
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

      {/* Request Session Modal */}
      <RequestSessionModal
        open={isRequestModalOpen}
        onOpenChange={setIsRequestModalOpen}
        onSuccess={() => {
          // Session request submitted successfully
          setIsRequestModalOpen(false);
        }}
      />
    </div>
  );
}


