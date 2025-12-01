'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

// Auto-generate breadcrumbs from pathname if items not provided
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Always start with Dashboard
  breadcrumbs.push({ label: 'Dashboard', href: '/dashboard/student' })

  // Map path segments to readable labels
  const labelMap: Record<string, string> = {
    student: 'Student',
    missions: 'Missions',
    coaching: 'Coaching',
    curriculum: 'Curriculum',
    portfolio: 'Portfolio',
    community: 'Community',
    mentorship: 'Mentorship',
    settings: 'Settings',
    profile: 'Profile',
  }

  let currentPath = '/dashboard/student'
  segments.forEach((segment, index) => {
    // Skip 'dashboard' and 'student' segments
    if (segment === 'dashboard' || segment === 'student') {
      return
    }

    currentPath += `/${segment}`
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({ label, href: currentPath })
  })

  return breadcrumbs
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname()
  const breadcrumbs = items || generateBreadcrumbs(pathname || '')

  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1
        return (
          <div key={item.href} className="flex items-center gap-2">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-och-steel"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {isLast ? (
              <span className="text-och-mint font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-och-steel hover:text-och-mint transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

