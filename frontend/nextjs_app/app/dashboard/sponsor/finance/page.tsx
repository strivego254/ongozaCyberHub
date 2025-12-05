'use client'

import { useState, useEffect } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  due_date: string
  cohort_id?: string
}

interface RefundRequest {
  id: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' })

  useEffect(() => {
    loadFinanceData()
  }, [])

  const loadFinanceData = async () => {
    try {
      setLoading(true)
      // TODO: Implement API endpoints
      // const [invoicesData, refundsData] = await Promise.all([
      //   sponsorClient.getInvoices(),
      //   sponsorClient.getRefunds(),
      // ])
      // setInvoices(invoicesData)
      // setRefunds(refundsData)
      setInvoices([])
      setRefunds([])
    } catch (error) {
      console.error('Failed to load finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRefund = async () => {
    try {
      // TODO: Implement refund request API
      console.log('Request refund:', refundForm)
      alert('Refund request feature coming soon')
      setShowRefundModal(false)
      setRefundForm({ amount: '', reason: '' })
    } catch (error) {
      console.error('Failed to request refund:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-red-100 text-red-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Finance & Billing</h1>
            <p className="text-gray-600 mt-1">Manage invoices and refund requests</p>
          </div>
          <button
            onClick={() => setShowRefundModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
          >
            Request Refund
          </button>
        </div>

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold mb-4">Request Refund</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (BWP)
                  </label>
                  <input
                    type="number"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={4}
                    placeholder="Explain the reason for this refund request..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRequestRefund}
                    disabled={!refundForm.amount || !refundForm.reason}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Request
                  </button>
                  <button
                    onClick={() => {
                      setShowRefundModal(false)
                      setRefundForm({ amount: '', reason: '' })
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoices */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[invoice.status]}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refund Requests */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Refund Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Loading refunds...
                      </td>
                    </tr>
                  ) : refunds.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No refund requests
                      </td>
                    </tr>
                  ) : (
                    refunds.map((refund) => (
                      <tr key={refund.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                          {formatCurrency(refund.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {refund.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[refund.status]}`}>
                            {refund.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(refund.created_at).toLocaleDateString()}
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
    </div>
  )
}

