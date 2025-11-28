'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { authService } from '@/lib/auth-mock'

const personas = [
  { id: 'student', name: 'Student', color: 'defender' },
  { id: 'mentor', name: 'Mentor', color: 'mint' },
  { id: 'admin', name: 'Admin', color: 'gold' },
  { id: 'director', name: 'Program Director', color: 'orange' },
  { id: 'analyst', name: 'Analyst', color: 'steel' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authService.login(email, password)
      if (result.success && result.user) {
        // Check if onboarding/profile completion needed
        if (result.requiresOnboarding) {
          router.push('/onboarding')
        } else if (result.requiresProfileCompletion) {
          router.push('/profile')
        } else {
          // Default role is "Mentee" which maps to "student"
          router.push(`/dashboard/${result.user.role || 'student'}`)
        }
      } else {
        setError(result.message || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await authService.signupWithGoogle()
      if (result.success) {
        router.push('/onboarding')
      } else {
        setError(result.message || 'Google login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await authService.signupWithApple()
      if (result.success) {
        router.push('/onboarding')
      } else {
        setError(result.message || 'Apple login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">OCH Platform</h1>
          <p className="text-och-steel">Sign in to your account</p>
        </div>

        <Card className="mb-6">
          {error && (
            <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange/40 rounded-lg text-och-orange text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <span>🔵</span>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleAppleLogin}
              disabled={loading}
            >
              <span>⚫</span>
              Continue with Apple ID
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-och-steel/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-och-midnight text-och-steel">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-och-steel mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-och-steel mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" variant="defender" className="w-full" glow disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-och-steel text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-och-defender hover:text-och-mint transition">
              Sign up
            </Link>
          </p>
          <div className="flex justify-center gap-4 text-sm">
            {personas.map((persona) => (
              <Link
                key={persona.id}
                href={`/dashboard/${persona.id}`}
                className="text-och-steel hover:text-och-mint transition"
              >
                {persona.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

