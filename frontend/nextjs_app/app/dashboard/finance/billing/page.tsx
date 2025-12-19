/**
 * Billing and Transactional Operations Page
 * Manage invoice lifecycle, refunds, dunning queue, and reconciliation
 */

'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText, 
  RefreshCcw, 
  AlertCircle,
  CheckCircle,
  Download,
  Plus
} from 'lucide-react'

export default function BillingPage() {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-och-midnight flex">
        <FinanceNavigation />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-h1 font-bold text-white">Billing & Transactional Operations</h1>
              <p className="mt-1 body-m text-och-steel">
                Manage invoice lifecycle, refunds, dunning queue, and reconciliation
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-och-steel/20 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button className="border-och-defender text-och-mint whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s">
                  Invoices
                </button>
                <button className="border-transparent text-och-steel hover:text-white hover:border-och-steel/30 whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s">
                  Refunds
                </button>
                <button className="border-transparent text-och-steel hover:text-white hover:border-och-steel/30 whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s">
                  Dunning Queue
                </button>
                <button className="border-transparent text-och-steel hover:text-white hover:border-och-steel/30 whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s">
                  Reconciliation
                </button>
              </nav>
            </div>

            {/* Invoicing Section */}
            <Card className="p-6 mb-8 bg-och-midnight border border-och-steel/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 font-semibold text-white">Invoicing</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Invoice
                </Button>
              </div>
              <p className="body-m text-och-steel mb-4">
                Issue tax-compliant PDFs, amend existing invoices (where permitted), and post credits
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-och-steel/20">
                  <thead className="bg-och-midnight/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-och-steel">
                        <p className="body-m">No invoices found</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Refund Management */}
            <Card className="p-6 mb-8 bg-och-midnight border border-och-steel/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 font-semibold text-white">Refund Management</h2>
                <Button variant="outline">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Initiate Refund
                </Button>
              </div>
              <p className="body-m text-och-steel mb-4">
                Initiate and approve refunds, voids, or write-offs
              </p>
              <div className="text-center py-8 text-och-steel">
                <p className="body-m">No refund requests</p>
              </div>
            </Card>

            {/* Dunning Queue */}
            <Card className="p-6 mb-8 bg-och-midnight border border-och-steel/20">
              <h2 className="text-h2 font-semibold text-white mb-4">Dunning Queue</h2>
              <p className="body-m text-och-steel mb-4">
                Monitor the dunning queue for failed payments, including tracking retry statuses and grace periods
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-och-orange/10 border border-och-orange/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-och-orange" />
                    <div>
                      <p className="font-medium text-white">No failed payments</p>
                      <p className="body-s text-och-steel">All payments are current</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reconciliation */}
            <Card className="p-6 bg-och-midnight border border-och-steel/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 font-semibold text-white">Reconciliation Dashboard</h2>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Gateway Files
                </Button>
              </div>
              <p className="body-m text-och-steel mb-4">
                Match internal ledgers against gateway payout files (e.g., Paystack, Flutterwave)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-och-midnight/50 border border-och-steel/20 rounded-lg">
                  <p className="body-s font-medium text-och-steel mb-2">Internal Ledger</p>
                  <p className="text-2xl font-bold text-white">$0.00</p>
                </div>
                <div className="p-4 bg-och-midnight/50 border border-och-steel/20 rounded-lg">
                  <p className="body-s font-medium text-och-steel mb-2">Gateway Payout</p>
                  <p className="text-2xl font-bold text-white">$0.00</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-och-savanna-green/10 border border-och-savanna-green/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-och-savanna-green" />
                  <p className="body-s font-medium text-och-savanna-green">All transactions reconciled</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

