'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import SubscriptionOverviewClient from './subscription-overview-client'

export default function SubscriptionsPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <SubscriptionOverviewClient />
      </AdminLayout>
    </RouteGuard>
  )
}



















<<<<<<< HEAD
=======






>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
