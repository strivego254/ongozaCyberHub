'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/login/student')
  }, [router])

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center">
      <div className="text-och-steel">Redirecting...</div>
    </div>
  )
}

