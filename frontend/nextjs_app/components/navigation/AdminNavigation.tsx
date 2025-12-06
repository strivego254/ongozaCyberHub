'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard/admin', icon: '📊' },
  { 
    label: 'User Management', 
    href: '/dashboard/admin/users', 
    icon: '👥',
    children: [
      { label: 'All Users', href: '/dashboard/admin/users', icon: '👤' },
      { label: 'Program Directors', href: '/dashboard/admin/users/directors', icon: '👔' },
      { label: 'Finance Directors', href: '/dashboard/admin/users/finance', icon: '💰' },
      { label: 'Mentees & Students', href: '/dashboard/admin/users/mentees', icon: '🎓' },
    ]
  },
  { label: 'Roles & Permissions', href: '/dashboard/admin/roles', icon: '🔐' },
  { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: '📋' },
  { label: 'Platform Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
  { label: 'API Keys', href: '/dashboard/admin/api-keys', icon: '🔑' },
]

export function AdminNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  const handleLogout = async () => {
    setIsProfileOpen(false)
    await logout()
    router.push('/login/admin')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(label)) {
        newSet.delete(label)
      } else {
        newSet.add(label)
      }
      return newSet
    })
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/90 shadow-lg"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-och-midnight/95 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full w-64 bg-och-midnight border-r border-och-steel/20 z-40 transition-transform duration-300 flex flex-col',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-och-steel/20">
          <Link href="/dashboard/admin" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="text-2xl">🛡️</span>
            <span className="text-xl font-bold text-och-gold">Admin Panel</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItems.has(item.label)

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className={clsx(
                        'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        'hover:bg-och-defender/20 hover:text-och-mint',
                        active
                          ? 'bg-och-defender/30 text-och-mint border-l-4 border-och-mint'
                          : 'text-och-steel'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <span className="text-och-steel">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-och-steel/20 pl-4">
                        {item.children.map((child) => {
                          const childActive = isActive(child.href)
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={clsx(
                                'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm',
                                'hover:bg-och-defender/20 hover:text-och-mint',
                                childActive
                                  ? 'bg-och-defender/30 text-och-mint'
                                  : 'text-och-steel'
                              )}
                            >
                              <span className="text-lg">{child.icon}</span>
                              <span>{child.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      'hover:bg-och-defender/20 hover:text-och-mint',
                      active
                        ? 'bg-och-defender/30 text-och-mint border-l-4 border-och-mint'
                        : 'text-och-steel'
                    )}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-och-orange text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-och-steel/20 relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-och-defender/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-och-defender flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.first_name?.[0] || user?.email?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email || 'Admin'}
              </p>
              <p className="text-xs text-och-steel truncate">{user?.email}</p>
            </div>
            <svg
              className={`w-4 h-4 text-och-steel transition-transform flex-shrink-0 ${isProfileOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg z-50">
              <div className="py-2">
                <Link
                  href="/dashboard/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2 text-sm text-och-steel hover:bg-och-defender/20 hover:text-och-mint transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-och-orange hover:bg-och-orange/20 transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Desktop: Add margin to content when sidebar is visible */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  )
}

