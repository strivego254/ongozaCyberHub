'use client'

import { useState, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'
import { UserManagementModal } from '@/components/admin/UserManagementModal'

export default function UsersPage() {
  const { users, totalCount, isLoading } = useUsers({ page: 1, page_size: 100 })
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const filteredUsers = useMemo(() => {
    if (selectedRoleFilter === 'all') return users
    return users.filter((u) => {
      const userRoles = u.roles || []
      return userRoles.some((r: any) => r.role === selectedRoleFilter)
    })
  }, [users, selectedRoleFilter])

  if (isLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading users...</p>
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-gold">User Management</h1>
            <p className="text-och-steel">Manage all platform users and their roles</p>
          </div>

          <Card>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Users</option>
                  <option value="program_director">Program Directors</option>
                  <option value="finance">Finance</option>
                  <option value="mentee">Mentees</option>
                  <option value="student">Students</option>
                  <option value="mentor">Mentors</option>
                </select>
                <div className="ml-auto text-och-steel">
                  Showing {filteredUsers.length} of {totalCount || users.length} users
                </div>
              </div>
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
                    {filteredUsers.map((u) => (
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

