'use client'

import type { ReactNode } from 'react'
import { MentorNavigation } from '@/components/navigation/MentorNavigation'
import { StudentHeader } from '@/components/navigation/StudentHeader'

export default function MentorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-och-midnight flex">
      <MentorNavigation />
      <div className="flex-1 flex flex-col lg:ml-64">
        <StudentHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}


