'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useDashboardStore } from '../lib/store/dashboardStore'
import '../styles/dashboard.css'

const navItems = [
  { path: '/dashboard/student', label: 'Dashboard', icon: '🏠', badge: 0 },
  { path: '/dashboard/student/curriculum', label: 'Track', icon: '📚', badge: 0 },
  { path: '/dashboard/student/missions', label: 'Missions', icon: '🎯', badge: 0 },
  { path: '/dashboard/student/portfolio', label: 'Portfolio', icon: '📁', badge: 0 },
  { path: '/dashboard/student/mentorship', label: 'Mentor', icon: '👤', badge: 0 },
  { path: '/dashboard/student/settings', label: 'Profile', icon: '⚙️', badge: 0 },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { nextActions, events } = useDashboardStore()

  const getBadgeCount = (path: string) => {
    if (path === '/dashboard/student/missions') {
      return nextActions.filter(a => a.type === 'mission' && a.urgency === 'high').length
    }
    if (path === '/dashboard/student/portfolio') {
      return 0
    }
    return 0
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dashboard-card/95 backdrop-blur-md border-t border-white/20 md:hidden z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard/student' && pathname?.startsWith(item.path))
          const badgeCount = getBadgeCount(item.path)

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative ${
                isActive ? 'text-dashboard-accent' : 'text-och-steel'
              }`}
              aria-label={item.label}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-dashboard-accent" />
              )}
              {badgeCount > 0 && (
                <span className="absolute top-1 right-1/4 bg-dashboard-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

