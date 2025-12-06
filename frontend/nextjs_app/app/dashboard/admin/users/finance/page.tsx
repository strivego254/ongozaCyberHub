'use client'

import { useState, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'

export default function FinancePage() {
  const { users, isLoading } = useUsers({ page: 1, page_size: 100 })

  const financeUsers = useMemo(() => {
    return users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'finance')
    )
  }, [users])

  if (isLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading finance users...</p>
            </div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Finance Directors</h1>
              <p className="text-och-steel">Manage finance users and financial operations</p>
            </div>
            <Button variant="gold" size="sm">
              + Add Finance User
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-och-gold">$0</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Pending Refunds</p>
                <p className="text-2xl font-bold text-och-orange">0</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Active Subscriptions</p>
                <p className="text-2xl font-bold text-och-mint">0</p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeUsers.map((u) => (
                      <tr key={u.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                        <td className="p-3">
                          <p className="text-white font-semibold">
                            {u.first_name} {u.last_name}
                          </p>
                        </td>
                        <td className="p-3 text-och-steel text-sm">{u.email}</td>
                        <td className="p-3">
                          <Badge
                            variant={u.is_active && u.account_status === 'active' ? 'mint' : 'orange'}
                          >
                            {u.account_status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

