'use client'

import { useState, useEffect } from 'react'
import { SponsorCodeGenerator } from './SponsorCodeGenerator'
import { GraduatePool } from './GraduatePool'
import { sponsorClient } from '@/services/sponsorClient'

export function EnhancedSidebar() {
  const [graduates, setGraduates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGraduates()
  }, [])

  const loadGraduates = async () => {
    try {
      setLoading(true)
      const data = await sponsorClient.getGraduates({ readiness_gte: 80, limit: 10 })
      setGraduates(data || [])
    } catch (error) {
      console.error('Failed to load graduates:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Sponsor Code Generator */}
      <SponsorCodeGenerator />
      
      {/* Bulk Employee Invite */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          📧 Bulk Employee Invite
        </h3>
        <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
          Invite multiple employees to enroll using sponsor codes
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard/sponsor/employees'}
          className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors font-semibold text-xs md:text-sm"
        >
          Upload CSV / Invite
        </button>
      </div>
      
      {/* Request Custom Report */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          📊 Request Custom Report
        </h3>
        <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
          Request detailed analytics from Program Director
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard/sponsor/reports'}
          className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-colors font-semibold text-xs md:text-sm"
        >
          Request Report
        </button>
      </div>
      
      {/* Top Graduates Pool */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-center py-4">Loading graduates...</p>
        </div>
      ) : (
        <GraduatePool graduates={graduates} />
      )}
    </div>
  )
}


