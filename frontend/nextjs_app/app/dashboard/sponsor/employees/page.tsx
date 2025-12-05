'use client'

import { useState, useEffect } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

interface Employee {
  id: string
  email: string
  name?: string
  seat_status: 'pending' | 'assigned' | 'enrolled' | 'inactive'
  preferred_track?: string
  cohort_id?: string
  assigned_at?: string
}

export default function EmployeeRosterPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showBulkInvite, setShowBulkInvite] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      // TODO: Implement API endpoint
      // const data = await sponsorClient.getEmployees()
      // setEmployees(data)
      setEmployees([])
    } catch (error) {
      console.error('Failed to load employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkInvite = async () => {
    if (!csvFile) return
    
    try {
      // TODO: Implement bulk invite API
      console.log('Bulk invite with file:', csvFile.name)
      alert('Bulk invite feature coming soon')
    } catch (error) {
      console.error('Failed to bulk invite:', error)
    }
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    assigned: 'bg-blue-100 text-blue-700',
    enrolled: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👥 Employee Roster</h1>
            <p className="text-gray-600 mt-1">Manage sponsored employee enrollments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkInvite(!showBulkInvite)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              📧 Bulk Invite
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
              Export CSV
            </button>
          </div>
        </div>

        {/* Bulk Invite Modal */}
        {showBulkInvite && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Bulk Employee Invite</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  CSV format: email, name, preferred_track (optional)
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleBulkInvite}
                  disabled={!csvFile}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invites
                </button>
                <button
                  onClick={() => setShowBulkInvite(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employees Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Track
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Loading employees...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No employees found. Use Bulk Invite to add employees.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {employee.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[employee.seat_status]}`}>
                          {employee.seat_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {employee.preferred_track || 'Any'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.assigned_at ? new Date(employee.assigned_at).toLocaleDateString() : 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-800 font-semibold">
                          Assign Seat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

