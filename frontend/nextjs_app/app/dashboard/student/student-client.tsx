'use client'

import { useAuth } from '@/hooks/useAuth'
import { useDashboardCoordination } from './lib/hooks/useDashboardCoordination'
import { HeroSection } from './components/HeroSection'
import { MetricsGrid } from './components/MetricsGrid'
import { NextActionsCarousel } from './components/NextActionsCarousel'
import { LeftSidebar } from './components/LeftSidebar'
import { RightPanel } from './components/RightPanel'
import { BottomNav } from './components/BottomNav'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeToggle } from './components/ThemeToggle'
import { useKeyboardShortcuts } from './lib/hooks/useKeyboardShortcuts'
import { useFocusManagement } from './lib/hooks/useFocusManagement'
import './styles/dashboard.css'

export default function StudentClient() {
  const { user, isLoading: authLoading } = useAuth()
  useKeyboardShortcuts()
  useFocusManagement()

  // Main coordination hook - fetches ALL data + sets up real-time subscriptions
  const { isLoading, hasError } = useDashboardCoordination()

  if (authLoading || isLoading) {
    return <DashboardSkeleton />
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center p-6">
        <div className="glass-card p-6 text-center max-w-md w-full">
          <h3 className="text-lg font-bold text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-och-steel mb-4">
            There was an error loading your dashboard data. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-och-midnight flex">
        <ErrorBoundary>
          <LeftSidebar />
        </ErrorBoundary>
        
        <div className="flex-1 flex flex-col lg:ml-0">
          <main className="flex-1 overflow-y-auto relative">
            <div className="w-full py-6 px-4 sm:px-6 lg:px-8 lg:pr-[336px]">
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2 text-dashboard-accent">Dashboard</h1>
                <p className="text-och-steel">
                  Welcome back{user?.first_name ? `, ${user.first_name}` : ''}! Here's your learning overview.
                </p>
              </div>

              <ErrorBoundary>
                <div className="mb-6">
                  <HeroSection />
                </div>
              </ErrorBoundary>

              <ErrorBoundary>
                <div className="mb-6">
                  <MetricsGrid />
                </div>
              </ErrorBoundary>

              <ErrorBoundary>
                <div className="mb-6">
                  <NextActionsCarousel />
                </div>
              </ErrorBoundary>
            </div>

            <ErrorBoundary>
              <RightPanel />
            </ErrorBoundary>
          </main>
        </div>

        <BottomNav />
      </div>
    </ErrorBoundary>
  )
}
