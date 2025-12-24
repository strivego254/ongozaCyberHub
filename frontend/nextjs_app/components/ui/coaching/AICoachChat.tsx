'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, X, MessageSquare, Zap, Target, Brain } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCoachingStore } from '@/lib/coaching/store'
import type { AICoachMessage } from '@/lib/coaching/types'
import clsx from 'clsx'

interface AICoachChatProps {
  className?: string
  isInline?: boolean
}

export function AICoachChat({ className, isInline = false }: AICoachChatProps) {
  const { aiMessages, addAIMessage } = useCoachingStore()
  const [isOpen, setIsOpen] = useState(isInline)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [aiMessages, isOpen])
  
  // Initialize with welcome message if empty
  useEffect(() => {
    if (aiMessages && aiMessages.length === 0) {
      const welcomeMessage: AICoachMessage = {
        id: 'welcome',
        role: 'assistant',
        content: '🔥 14-day streak! Your Practice habit is crushing it. Next: Try the DFIR mission - it\'s perfect for your Defender track.',
        timestamp: new Date().toISOString(),
        context: 'habit',
      }
      addAIMessage(welcomeMessage)
    }
  }, [aiMessages?.length, addAIMessage])
  
  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return
    
    const userMessage: AICoachMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    }
    
    addAIMessage(userMessage)
    setInput('')
    setIsLoading(true)
    
    // Mock AI Responses based on keywords
    setTimeout(() => {
      let response = 'Great question! Based on your progress, I recommend focusing on your daily learning habit. Keep up the momentum!'
      
      if (messageText.toLowerCase().includes('mission')) {
        response = "I've analyzed the current mission catalog. Since you're on the Defender track, 'SIEM Log Analysis' is your high-priority target. It aligns 92% with your Future-You persona."
      } else if (messageText.toLowerCase().includes('habit')) {
        response = "Your consistency is your superpower. You've hit 14 days straight. Missing today would drop your alignment score by 4%. Let's keep the flame alive!"
      }
      
      const aiResponse: AICoachMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        context: 'general',
      }
      addAIMessage(aiResponse)
      setIsLoading(false)
    }, 1200)
  }
  
  const quickActions = [
    { label: 'Next Mission?', icon: Target },
    { label: 'Check Habits', icon: Zap },
    { label: 'Identity Strategy', icon: Brain },
  ]

  const chatContent = (
    <div className="h-full flex flex-col">
      {/* Header - Only if floating */}
      {!isInline && (
        <div className="p-4 border-b border-och-steel/10 flex items-center justify-between bg-och-midnight/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-och-defender animate-glow-pulse" />
            <h3 className="font-black text-white text-xs uppercase tracking-widest">AI Coach</h3>
            <Badge variant="defender" className="text-[8px] px-1 font-black">Online</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
            className="h-7 w-7 p-0 border-och-steel/20 text-och-steel hover:bg-och-steel/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
      )}
          
          {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
              {(aiMessages || []).map((message) => (
                <motion.div
                  key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={clsx(
                "flex items-start gap-3",
                    message.role === 'user' ? 'flex-row-reverse' : ''
              )}
                >
                  {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-och-defender/20 flex items-center justify-center flex-shrink-0 border border-och-defender/30">
                  <Sparkles className="w-4 h-4 text-och-defender" />
                    </div>
                  )}
                  <div
                className={clsx(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      message.role === 'assistant'
                    ? "bg-och-steel/10 text-slate-200 rounded-tl-none border border-och-steel/5"
                    : "bg-och-defender text-white rounded-tr-none shadow-lg shadow-och-defender/20"
                )}
              >
                <p>{message.content}</p>
                <p className="text-[10px] opacity-40 mt-1.5 font-mono">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-och-steel/5 rounded-2xl w-fit">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-och-defender rounded-full" />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-och-defender rounded-full" />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-och-defender rounded-full" />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

      {/* Quick Actions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleSend(action.label)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-och-steel/5 border border-och-steel/10 text-[10px] font-bold text-och-steel hover:text-white hover:border-och-defender/50 transition-all whitespace-nowrap"
          >
            <action.icon className="w-3 h-3" />
            {action.label}
          </button>
        ))}
      </div>
          
          {/* Input */}
      <div className="p-4 bg-och-midnight/60 border-t border-och-steel/10">
        <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your coach..."
            className="w-full bg-och-midnight border border-och-steel/20 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-och-steel focus:outline-none focus:border-och-defender transition-all shadow-inner"
              />
          <button
            onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-och-defender hover:text-och-mint disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
          </button>
        </div>
            </div>
          </div>
  )

  if (isInline) {
    return (
      <div className={clsx("overflow-hidden rounded-2xl", className)}>
        {chatContent}
      </div>
    )
  }
  
  // Chat button (minimized state)
  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-2xl bg-och-defender text-white shadow-2xl shadow-och-defender/40 flex items-center justify-center hover:scale-110 transition-transform group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquare className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-och-orange border-2 border-och-midnight rounded-full animate-pulse" />
        </button>
      </motion.div>
    )
  }
  
  // Chat interface (open state)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ scale: 0.9, opacity: 0, y: 20, filter: 'blur(10px)' }}
        className={clsx("fixed bottom-6 right-6 w-96 h-[600px] z-50", className)}
      >
        <Card className="h-full border-och-defender/30 bg-och-midnight/90 backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
          {chatContent}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
