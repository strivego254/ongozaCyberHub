'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface Role {
  id: number
  name: string
  display_name: string
  description: string
  role_type: string
  is_system: boolean
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setIsLoading(true)
      const data = await apiGateway.get<Role[] | { results: Role[] }>('/roles/')
      const rolesArray = Array.isArray(data) ? data : (data?.results || [])
      setRoles(rolesArray)
    } catch (error) {
      console.error('Failed to load roles:', error)
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading roles...</p>
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
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Role & Policy Management</h1>
              <p className="text-och-steel">Manage system roles and permissions</p>
            </div>
            <Button variant="defender" size="sm">
              + Create Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-white">{role.display_name}</h4>
                      <p className="text-xs text-och-steel">{role.name}</p>
                    </div>
                    {role.is_system && (
                      <Badge variant="gold" className="text-xs">System</Badge>
                    )}
                  </div>
                  <p className="text-sm text-och-steel mb-3">{role.description}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Permissions
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

