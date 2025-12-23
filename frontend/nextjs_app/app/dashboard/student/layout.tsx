/**
 * Redesigned Student Layout
 * Implements the persistent Mission Control navigation.
 */

'use client';

import { DashboardProviders } from './providers';
import { LeftSidebar } from './components/LeftSidebar';
import { BottomNav } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useDashboardCoordination } from './lib/hooks/useDashboardCoordination';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { useKeyboardShortcuts } from './lib/hooks/useKeyboardShortcuts';
import { useFocusManagement } from './lib/hooks/useFocusManagement';
import { useDashboardStore } from './lib/store/dashboardStore';
import clsx from 'clsx';

function LayoutContent({ children }: { children: React.ReactNode }) {
  // Global dashboard behavior
  useKeyboardShortcuts();
  useFocusManagement();

  // Coordinated data fetching for sidebar and other components
  const { isLoading } = useDashboardCoordination();
  const { isSidebarCollapsed } = useDashboardStore();

  return (
    <div className="min-h-screen bg-och-midnight flex flex-col lg:flex-row overflow-hidden text-slate-200">
      {/* Persistent Desktop Sidebar */}
      <div className={clsx(
        "hidden lg:block shrink-0 transition-all duration-500",
        isSidebarCollapsed ? "w-[80px]" : "w-[280px]"
      )}>
        <ErrorBoundary>
          <LeftSidebar />
        </ErrorBoundary>
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto relative scrollbar-hide">
          <div className={clsx(
            "w-full p-4 lg:p-10 pb-32 lg:pb-10 transition-all duration-500",
            isSidebarCollapsed ? "max-w-none" : "max-w-[1600px] mx-auto"
          )}>
            <ErrorBoundary>
              {isLoading ? <DashboardSkeleton /> : children}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProviders>
      <LayoutContent>
        {children}
      </LayoutContent>
    </DashboardProviders>
  );
}
