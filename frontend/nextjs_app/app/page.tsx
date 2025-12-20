'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login or dashboard based on auth status
    // For now, redirect to login
    router.push('/login/student')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400">Redirecting...</p>
      </div>
    </div>
  )
}
