'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { mentorClient } from '@/services/mentorClient'
import { MissionManagementView } from '@/components/mentor/missions/MissionManagementView'
import type { MissionSubmission } from '@/services/types/mentor'

export default function MissionsPage() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()

  return (
    <RouteGuard>
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Mission Management</h1>
          <p className="text-och-steel mb-4">
            As an OCH Mentor, your management of missions is a critical component of the "human-in-the-loop" validation process, 
            specifically for mentees on the $7 Premium (Professional) tier. While AI performs the initial analysis of a submission, 
            you provide the deeper analysis required to verify skill mastery and professional readiness.
          </p>
          <div className="bg-och-midnight/50 border border-och-steel/20 rounded-lg p-4 mt-4">
            <h3 className="text-sm font-semibold text-white mb-2">Your Mission Management Responsibilities:</h3>
            <ul className="text-xs text-och-steel space-y-1 list-disc list-inside">
              <li>Review submissions for <strong className="text-white">Professional tier ($7 Premium) mentees</strong> completing Intermediate, Advanced, Mastery, and Capstone missions</li>
              <li>Provide <strong className="text-white">deeper analysis</strong> complementing AI feedback, issue pass/fail grades, and add written feedback</li>
              <li><strong className="text-white">Tag technical competencies</strong> proven or missed to update mentee skill profiles (TalentScope Analytics)</li>
              <li>Use <strong className="text-white">rubric-based scoring</strong> for Capstones and Advanced/Mastery missions</li>
              <li>Recommend <strong className="text-white">next missions or recipes</strong> based on skill gaps detected</li>
              <li>Track student progress and match it with their <strong className="text-white">Future-You persona</strong></li>
            </ul>
          </div>
        </div>

        {mentorId && (
          <MissionManagementView mentorId={mentorId} />
        )}
      </div>
    </RouteGuard>
  )
}
