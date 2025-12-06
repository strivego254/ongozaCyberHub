'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePrograms } from '@/hooks/usePrograms'
import Link from 'next/link'

export default function ProgramsPage() {
  const { programs, isLoading } = usePrograms()

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading programs...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-defender">Programs & Cohorts</h1>
              <p className="text-och-steel">Manage programs, tracks, and cohorts</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/director/programs/new">
                <Button variant="defender" size="sm">
                  + Create Program
                </Button>
              </Link>
              <Link href="/dashboard/director/cohorts/new">
                <Button variant="outline" size="sm">
                  + Create Cohort
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs && programs.length > 0 ? (
              programs.map((program: any) => (
                <Card key={program.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{program.name}</h3>
                        <p className="text-sm text-och-steel">{program.description}</p>
                      </div>
                      <Badge variant="defender">{program.status || 'active'}</Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Duration</span>
                        <span className="text-white">{program.duration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Tracks</span>
                        <span className="text-white">{program.tracks?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Cohorts</span>
                        <span className="text-white">{program.cohorts?.length || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/director/programs/${program.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/dashboard/director/programs/${program.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <div className="p-12 text-center">
                  <p className="text-och-steel mb-4">No programs found</p>
                  <Link href="/dashboard/director/programs/new">
                    <Button variant="defender">Create Your First Program</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

