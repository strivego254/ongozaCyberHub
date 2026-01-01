'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { djangoClient } from '@/services/djangoClient'
import { apiGateway } from '@/services/apiGateway'
import type { User } from '@/services/types'

interface Role {
  id: number
  name: string
  display_name: string
  description: string
}
