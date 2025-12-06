'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function CurriculumPage() {
  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Curriculum & Assessment</h1>
            <p className="text-och-steel">Define curriculum structure, manage missions, and configure assessments</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Link href="/dashboard/director/curriculum/structure">
              <Card className="hover:border-och-defender/50 transition-colors cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📐</span>
                    <h3 className="text-xl font-bold text-white">Define Structure</h3>
                  </div>
                  <p className="text-och-steel">Define default structure (modules, milestones) for programs</p>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/director/curriculum/missions">
              <Card className="hover:border-och-defender/50 transition-colors cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">🚀</span>
                    <h3 className="text-xl font-bold text-white">Manage Missions</h3>
                  </div>
                  <p className="text-och-steel">Publish or adjust missions and bind them to tracks/cohorts</p>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/director/curriculum/scoring">
              <Card className="hover:border-och-defender/50 transition-colors cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📊</span>
                    <h3 className="text-xl font-bold text-white">Scoring Rules</h3>
                  </div>
                  <p className="text-och-steel">Modify scoring breakdown per track and define success metrics</p>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/director/curriculum/assessments">
              <Card className="hover:border-och-defender/50 transition-colors cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📝</span>
                    <h3 className="text-xl font-bold text-white">Assessment Windows</h3>
                  </div>
                  <p className="text-och-steel">Approve assessment windows and set eligibility rules</p>
                </div>
              </Card>
            </Link>
          </div>

          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Curriculum Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Active Programs</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Published Missions</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Assessment Windows</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Tracks Configured</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

