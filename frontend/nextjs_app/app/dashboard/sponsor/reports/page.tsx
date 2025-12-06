'use client'

import { useState, useEffect } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

interface ReportRequest {
  id: string
  request_type: 'graduate_breakdown' | 'roi_projection' | 'cohort_analytics' | 'custom'
  cohort_id?: string
  details?: any
  status: 'pending' | 'delivered' | 'cancelled'
  created_at: string
  delivered_at?: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({
    request_type: 'graduate_breakdown' as const,
    cohort_id: '',
    details: '',
  })

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      // TODO: Implement API endpoint
      // const data = await sponsorClient.getReportRequests()
      // setReports(data)
      setReports([])
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReport = async () => {
    try {
      // TODO: Implement report request API
      // await sponsorClient.requestDirectorReport(requestForm)
      console.log('Request report:', requestForm)
      alert('Report request feature coming soon')
      setShowRequestModal(false)
      setRequestForm({ request_type: 'graduate_breakdown', cohort_id: '', details: '' })
      loadReports()
    } catch (error) {
      console.error('Failed to request report:', error)
    }
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-gray-100 text-gray-700',
  }

  const reportTypeLabels = {
    graduate_breakdown: 'Graduate Breakdown',
    roi_projection: 'ROI Projection',
    cohort_analytics: 'Cohort Analytics',
    custom: 'Custom Report',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Custom Reports</h1>
            <p className="text-gray-600 mt-1">Request detailed analytics from Program Director</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            + Request Report
          </button>
        </div>

        {/* Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold mb-4">Request Custom Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={requestForm.request_type}
                    onChange={(e) => setRequestForm({ ...requestForm, request_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="graduate_breakdown">Graduate Breakdown</option>
                    <option value="roi_projection">ROI Projection</option>
                    <option value="cohort_analytics">Cohort Analytics</option>
                    <option value="custom">Custom Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cohort (Optional)
                  </label>
                  <input
                    type="text"
                    value={requestForm.cohort_id}
                    onChange={(e) => setRequestForm({ ...requestForm, cohort_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Cohort ID or name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    value={requestForm.details}
                    onChange={(e) => setRequestForm({ ...requestForm, details: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    placeholder="Specify any additional requirements..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRequestReport}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    Submit Request
                  </button>
                  <button
                    onClick={() => {
                      setShowRequestModal(false)
                      setRequestForm({ request_type: 'graduate_breakdown', cohort_id: '', details: '' })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Report Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Cohort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Requested
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
                      Loading reports...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No report requests found. Request your first custom report.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {reportTypeLabels[report.request_type]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {report.cohort_id || 'All Cohorts'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[report.status]}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {report.status === 'delivered' ? (
                          <button className="text-blue-600 hover:text-blue-800 font-semibold">
                            Download
                          </button>
                        ) : (
                          <button className="text-gray-400 cursor-not-allowed">
                            Pending
                          </button>
                        )}
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

