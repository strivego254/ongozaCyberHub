/**
 * AI Coach Chat Component
 * Contextual AI nudges and chat interface
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Minimize2, Maximize2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCoachingStore } from '@/lib/coaching/store'
import type { AICoachMessage } from '@/lib/coaching/types'

interface AICoachChatProps {
  className?: string
}

export function AICoachChat({ className }: AICoachChatProps) {
  const { aiMessages, addAIMessage } = useCoachingStore()
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [aiMessages])
  
  // Initialize with welcome message if empty
  useEffect(() => {
    if (aiMessages.length === 0) {
      const welcomeMessage: AICoachMessage = {
        id: 'welcome',
        role: 'assistant',
        content: '🔥 14-day streak! Your Practice habit is crushing it. Next: Try the DFIR mission - it\'s perfect for your Defender track.',
        timestamp: new Date().toISOString(),
        context: 'habit',
      }
      addAIMessage(welcomeMessage)
    }
  }, [aiMessages.length, addAIMessage])
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: AICoachMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }
    
    addAIMessage(userMessage)
    setInput('')
    setIsLoading(true)
    
    // TODO: Call AI Coach API
    // const response = await aiCoachAPI.sendMessage(input.trim())
    // addAIMessage(response)
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: AICoachMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: 'Great question! Based on your progress, I recommend focusing on your daily learning habit. Keep up the momentum!',
        timestamp: new Date().toISOString(),
        context: 'general',
      }
      addAIMessage(aiResponse)
      setIsLoading(false)
    }, 1000)
  }
  
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          variant="defender"
          size="lg"
          className="rounded-full w-16 h-16 shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          onClick={() => setIsMinimized(false)}
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </Button>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className={`fixed bottom-6 right-6 w-96 h-[500px] z-50 ${className}`}
    >
      <Card className="h-full flex flex-col shadow-2xl border-indigo-500/50 bg-slate-900/95 backdrop-blur-xl glass-card">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-slate-100">AI Coach</h3>
            <Badge variant="steel" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              Premium
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-400 hover:bg-slate-800"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {aiMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'assistant'
                      ? 'bg-indigo-500/20 backdrop-blur-sm text-indigo-100'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
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
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about missions, habits, or goals..."
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <Button
              variant="defender"
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}


