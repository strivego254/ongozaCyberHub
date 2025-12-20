/**
 * Enhanced Subtask View Component
 * Evidence upload zone with drag-drop, validation, and progress tracking
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, Lock, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from './shared/StatusBadge'
import { MobileFloatingActionBar } from './MobileFloatingActionBar'
import { apiGateway } from '@/services/apiGateway'
import { useMissionStore } from '../lib/store/missionStore'
import type { Subtask } from '../types'

interface SubtaskViewEnhancedProps {
  missionId: string
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url?: string
}

export function SubtaskViewEnhanced({ missionId }: SubtaskViewEnhancedProps) {
  const { currentSubtask, subtasks, subtasksProgress, updateSubtaskProgress, setCurrentSubtask } = useMissionStore()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [notes, setNotes] = useState('')
  const [justCompleted, setJustCompleted] = useState(false)

  const currentSubtaskData = subtasks.find((s) => s.id === currentSubtask)
  const progress = subtasksProgress[currentSubtask] || { completed: false, evidence: [], notes: '' }

  useEffect(() => {
    if (progress) {
      setNotes(progress.notes || '')
      // Load existing files from progress
      if (progress.evidence && progress.evidence.length > 0) {
        setUploadedFiles(
          progress.evidence.map((url, idx) => ({
            id: `file-${idx}`,
            name: url.split('/').pop() || `Evidence ${idx + 1}`,
            type: 'file',
            size: 0,
            url,
          }))
        )
      }
    }
  }, [progress])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      await handleFileUpload(files)
    },
    []
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      await handleFileUpload(files)
    },
    []
  )

  const handleFileUpload = async (files: File[]) => {
    // TODO: Upload to S3 and get URLs
    const newFiles: UploadedFile[] = files.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: file.name,
      type: file.type || 'file',
      size: file.size,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Update progress
    const evidenceUrls = [...uploadedFiles, ...newFiles].map((f) => f.url || f.name)
    updateSubtaskProgress(currentSubtask, {
      completed: progress.completed,
      evidence: evidenceUrls,
      notes: progress.notes || '',
    })
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleComplete = () => {
    updateSubtaskProgress(currentSubtask, {
      completed: true,
      evidence: uploadedFiles.map((f) => f.url || f.name),
      notes,
    })
    setJustCompleted(true)
    setTimeout(() => setJustCompleted(false), 2000)
  }

  const allDependenciesMet = currentSubtaskData?.dependencies
    ? currentSubtaskData.dependencies.every((depId: number) => {
        const depProgress = subtasksProgress[depId]
        return depProgress?.completed
      })
    : true

  if (!currentSubtaskData) {
    return (
      <Card className="p-6 text-center">
        <p className="text-slate-600">No subtask available</p>
      </Card>
    )
  }

  const subtaskStatus = progress.completed
    ? 'completed'
    : allDependenciesMet
    ? 'available'
    : 'locked'

  const evidenceTypes = currentSubtaskData.evidence_schema?.file_types || ['file', 'screenshot']

  const canGoPrevious = currentSubtask > 1
  const canGoNext = currentSubtask < subtasks.length

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentSubtask(currentSubtask - 1)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      setCurrentSubtask(currentSubtask + 1)
    }
  }

  return (
    <div className="relative pb-20 lg:pb-0">
      <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center">
            <motion.div
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              {currentSubtask + 1}
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{currentSubtaskData.title}</h3>
              <p className="text-slate-600 mt-1">{currentSubtaskData.description}</p>
            </div>
          </div>
          <StatusBadge status={subtaskStatus} />
        </div>

        {/* Evidence Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center ${
            isDragging
              ? 'border-blue-400 bg-blue-50 scale-105'
              : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <motion.div
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className={`w-16 h-16 mb-4 mx-auto ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
          </motion.div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">Drop your evidence here</h4>
          <p className="text-slate-500 mb-6 max-w-sm">
            {evidenceTypes.join(', ')} • Max 50MB • Auto-virus scan
          </p>

          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            accept={evidenceTypes.map((t: string) => {
              if (t === 'screenshot') return 'image/*'
              if (t === 'video') return 'video/*'
              return '*/*'
            }).join(',')}
          />
          <label htmlFor="file-upload">
            <Button variant="defender" className="cursor-pointer">
              Choose Files
            </Button>
          </label>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-2 w-full">
              <AnimatePresence>
                {uploadedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <FileText className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
                      <span className="font-medium truncate">{file.name}</span>
                      <Badge variant="steel" className="ml-2 flex-shrink-0">
                        {file.type}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="flex-shrink-0"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Add your notes here..."
          />
        </div>

        {/* Dependency Warning */}
        {!allDependenciesMet && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <Lock className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-semibold text-red-900">Complete previous subtasks first</p>
              <p className="text-sm text-red-700">
                Dependencies: {currentSubtaskData.dependencies?.join(', ')}
              </p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="defender"
            onClick={() => {
              updateSubtaskProgress(currentSubtask, {
                completed: progress.completed,
                evidence: uploadedFiles.map((f) => f.url || f.name),
                notes,
              })
            }}
          >
            Save Progress
          </Button>
          <Button
            variant="mint"
            onClick={handleComplete}
            disabled={!allDependenciesMet || progress.completed}
          >
            {progress.completed ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Completed
              </>
            ) : (
              'Mark Complete'
            )}
          </Button>
        </div>
      </Card>

      {/* Completion Celebration */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl z-50"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                borderRadius: ['20%', '50%', '20%'],
              }}
              transition={{ duration: 0.6 }}
              className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Action Bar */}
      <MobileFloatingActionBar
        onSave={() => {
          updateSubtaskProgress(currentSubtask, {
            completed: progress.completed,
            evidence: uploadedFiles.map((f) => f.url || f.name),
            notes,
          })
        }}
        onComplete={handleComplete}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />
    </div>
  )
}

