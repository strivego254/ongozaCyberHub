'use client'

import { useState, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'
import { UserManagementModal } from '@/components/admin/UserManagementModal'

export default function DirectorsPage() {
  const { users, isLoading } = useUsers({ page: 1, page_size: 100 })
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const directors = useMemo(() => {
    return users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'program_director')
    )
  }, [users])

  if (isLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading directors...</p>
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
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Program Directors</h1>
              <p className="text-och-steel">Manage program directors and their assignments</p>
            </div>
            <Button variant="defender" size="sm">
              + Add Director
            </Button>
          </div>

          <Card>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Roles</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directors.map((u) => (
                      <tr key={u.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                        <td className="p-3">
                          <div>
                            <p className="text-white font-semibold">
                              {u.first_name} {u.last_name}
                            </p>
                            <p className="text-xs text-och-steel">ID: {u.id}</p>
                          </div>
                        </td>
                        <td className="p-3 text-och-steel text-sm">{u.email}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {u.roles?.map((r: any, idx: number) => (
                              <Badge key={idx} variant="defender" className="text-xs">
                                {r.role}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={u.is_active && u.account_status === 'active' ? 'mint' : 'orange'}
                          >
                            {u.account_status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(u)}
                          >
                            Manage Roles
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {selectedUser && (
            <UserManagementModal
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onUpdate={() => {
                setSelectedUser(null)
                window.location.reload()
              }}
            />
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

