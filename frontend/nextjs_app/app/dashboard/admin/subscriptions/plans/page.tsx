'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import PlansManagementClient from './plans-management-client'

export default function PlansPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <PlansManagementClient />
      </AdminLayout>
    </RouteGuard>
  )
}



















<<<<<<< HEAD
=======






>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
