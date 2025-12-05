'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export function DirectorHeader() {
  const { user } = useAuth()
  
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link href="/dashboard/director" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">OCH</span>
          </Link>
          
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-gray-500">Program Director</div>
            </div>
            
            {/* Programs Badge */}
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              5 Programs
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.first_name?.[0] || 'U'}
                </div>
                <span className="hidden md:block text-sm text-gray-700">▼</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

