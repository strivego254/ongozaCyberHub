'use client'

import { StudentNavigation } from '@/components/navigation/StudentNavigation'
import { StudentHeader } from '@/components/navigation/StudentHeader'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-och-midnight flex">
      <StudentNavigation />
      <div className="flex-1 flex flex-col lg:ml-64">
        <StudentHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

