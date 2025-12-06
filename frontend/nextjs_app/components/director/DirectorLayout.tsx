'use client'

import { ReactNode } from 'react'
import { DirectorNavigation } from '@/components/navigation/DirectorNavigation'

interface DirectorLayoutProps {
  children: ReactNode
}

export function DirectorLayout({ children }: DirectorLayoutProps) {
  return (
    <div className="min-h-screen bg-och-midnight">
      <DirectorNavigation />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

