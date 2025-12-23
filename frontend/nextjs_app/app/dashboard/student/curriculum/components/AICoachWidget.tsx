/**
 * AI Coach Widget Component - Refactored
 * Interactive AI presence providing contextual guidance and alignment nudges
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Send, 
  Sparkles, 
  Zap, 
  MessageSquare, 
  Target, 
  TrendingUp,
  X
} from 'lucide-react';
import clsx from 'clsx';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  type?: 'alignment' | 'suggestion' | 'celebration';
}

interface AICoachWidgetProps {
  currentActivity?: string;
  alignmentScore: number;
}

export function AICoachWidget({ currentActivity, alignmentScore }: AICoachWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "🔥 14-day streak! Your Practice habit is crushing it. Based on your Defender persona, I recommend the DFIR mission next.",
      type: 'alignment'
    }
  ]);
  const [inputValue, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      const responses = [
        "To stay aligned with your Defender track, you should focus on the SIEM Masterclass module.",
        "Your readiness score is improving! Completing the current mission will boost your 'Analytical Thinking' signal by 15%.",
        "If this feels difficult, I've loaded a few 'Recipes' in the Recipe Engine to bridge your technical gap.",
        "Great question. Your Future-You archetype 'Cyber Guardian' would typically prioritize network security over GRC at this stage."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        type: 'suggestion'
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const habits = [
    { name: 'Learn', completed: true },
    { name: 'Practice', completed: false },
    { name: 'Reflect', completed: false },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Alignment Nudge Card */}
      <Card className="border-och-defender/30 bg-och-defender/5 p-4 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
          <TrendingUp className="w-12 h-12 text-och-defender rotate-12" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-och-defender/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-och-defender" />
          </div>
          <div>
            <p className="text-[10px] text-och-steel uppercase tracking-widest font-bold">Identity Alignment</p>
            <p className="text-sm font-bold text-white tracking-wide">{alignmentScore}% Aligned</p>
          </div>
        </div>
        <div className="w-full bg-och-steel/10 h-1.5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${alignmentScore}%` }}
            className="h-full bg-gradient-to-r from-och-defender to-och-mint rounded-full"
          />
        </div>
      </Card>

      {/* AI Coach Chat Card */}
      <Card className="flex flex-col h-[500px] border-och-steel/20 bg-och-midnight/40 backdrop-blur-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-och-steel/10 bg-och-midnight/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-5 h-5 text-och-defender" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-och-mint rounded-full animate-pulse" />
            </div>
            <h3 className="font-bold text-white text-sm uppercase tracking-widest">AI Coach</h3>
          </div>
          <Badge variant="defender" className="text-[9px] uppercase font-black">Online</Badge>
        </div>

        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
        >
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === 'assistant' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={clsx(
                "flex",
                msg.role === 'assistant' ? "justify-start" : "justify-end"
              )}
            >
              <div className={clsx(
                "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'assistant' 
                  ? "bg-och-steel/10 text-slate-200 rounded-tl-none border border-och-steel/5" 
                  : "bg-och-defender text-white rounded-tr-none"
              )}>
                {msg.type === 'alignment' && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-och-gold font-bold text-[10px] uppercase">
                    <Sparkles className="w-3 h-3" /> Identity Insight
                  </div>
                )}
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-och-steel/10 p-3 rounded-2xl rounded-tl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-och-steel/40 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-och-steel/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-och-steel/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Daily Habits Tracker (Integrated) */}
        <div className="px-4 py-3 border-t border-och-steel/10 bg-och-midnight/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-och-steel uppercase tracking-widest">Daily Habits</span>
            <span className="text-[9px] font-bold text-och-mint uppercase">12 Day Streak</span>
          </div>
          <div className="flex gap-2">
            {habits.map((habit, i) => {
              return (
                <div key={i} className="flex-1 flex items-center gap-2 p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <div className={clsx(
                    "w-3 h-3 rounded-full border flex items-center justify-center",
                    habit.completed ? "bg-och-mint border-och-mint" : "border-och-steel/30"
                  )}>
                    {habit.completed && <div className="w-1 h-1 bg-black rounded-full" />}
                  </div>
                  <span className="text-[8px] font-black text-white uppercase tracking-tighter">{habit.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-och-midnight/60">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your coach..."
              className="w-full bg-och-midnight border border-och-steel/20 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white placeholder-och-steel focus:outline-none focus:border-och-defender transition-all"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-och-defender hover:text-och-mint transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
