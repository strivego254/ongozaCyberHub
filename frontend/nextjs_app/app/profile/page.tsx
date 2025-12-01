'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { authService } from '@/lib/auth-mock'

interface ProfileData {
  fullName: string
  country: string
  timezone: string
  learningStyle: string
  careerGoals: string
  cyberExposureLevel: string
  linkedInProfile: string
}

const learningStyles = [
  'Visual Learner',
  'Auditory Learner',
  'Kinesthetic Learner',
  'Reading/Writing Learner',
]

const cyberExposureLevels = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
]

const timezones = [
  'UTC-12:00',
  'UTC-11:00',
  'UTC-10:00',
  'UTC-09:00',
  'UTC-08:00',
  'UTC-07:00',
  'UTC-06:00',
  'UTC-05:00',
  'UTC-04:00',
  'UTC-03:00',
  'UTC-02:00',
  'UTC-01:00',
  'UTC+00:00',
  'UTC+01:00',
  'UTC+02:00',
  'UTC+03:00',
  'UTC+04:00',
  'UTC+05:00',
  'UTC+06:00',
  'UTC+07:00',
  'UTC+08:00',
  'UTC+09:00',
  'UTC+10:00',
  'UTC+11:00',
  'UTC+12:00',
]

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [skippedFields, setSkippedFields] = useState<Set<string>>(new Set())
  const [profile, setProfile] = useState<ProfileData>({
    fullName: '',
    country: '',
    timezone: '',
    learningStyle: '',
    careerGoals: '',
    cyberExposureLevel: '',
    linkedInProfile: '',
  })

  const handleFieldChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setSkippedFields(prev => {
      const newSet = new Set(prev)
      newSet.delete(field)
      return newSet
    })
  }

  const handleSkip = (field: keyof ProfileData) => {
    setSkippedFields(prev => new Set(prev).add(field))
  }

  const isFieldSkipped = (field: keyof ProfileData) => skippedFields.has(field)
  const canSubmit = () => {
    return profile.fullName && profile.country && profile.timezone
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canSubmit()) {
      alert('Please complete all required fields')
      return
    }

    setLoading(true)
    try {
      // Mock: Save profile data (in real app, send to backend)
      console.log('Profile data:', profile)
      console.log('Skipped fields:', Array.from(skippedFields))
      
      // Mock: Complete profile
      const mockUserId = 'user_current'
      await authService.completeProfile(mockUserId)

      // Mock: Feed into TalentScope baseline calculations
      console.log('Feeding profile data into TalentScope baseline calculations...')
      
      // Redirect to dashboard
      router.push('/dashboard/student')
    } catch (err) {
      console.error('Error saving profile:', err)
      alert('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Complete Your Profile</h1>
          <p className="text-och-steel">
            Help us personalize your experience. Required fields are marked with <span className="text-och-orange">*</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-och-steel mb-1">
                  Full Name <span className="text-och-orange">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  placeholder="John Doe"
                  required
                  disabled={loading || isFieldSkipped('fullName')}
                />
                {isFieldSkipped('fullName') && (
                  <Badge variant="steel" className="mt-1">Skipped - will prompt later</Badge>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-och-steel mb-1">
                  Country <span className="text-och-orange">*</span>
                </label>
                <input
                  id="country"
                  type="text"
                  value={profile.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  placeholder="United States"
                  required
                  disabled={loading || isFieldSkipped('country')}
                />
                {isFieldSkipped('country') && (
                  <Badge variant="steel" className="mt-1">Skipped - will prompt later</Badge>
                )}
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-och-steel mb-1">
                  Time Zone <span className="text-och-orange">*</span>
                </label>
                <select
                  id="timezone"
                  value={profile.timezone}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  required
                  disabled={loading || isFieldSkipped('timezone')}
                >
                  <option value="">Select timezone</option>
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                {isFieldSkipped('timezone') && (
                  <Badge variant="steel" className="mt-1">Skipped - will prompt later</Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Learning Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="learningStyle" className="block text-sm font-medium text-och-steel mb-1">
                  Preferred Learning Style
                </label>
                <select
                  id="learningStyle"
                  value={profile.learningStyle}
                  onChange={(e) => handleFieldChange('learningStyle', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  disabled={loading || isFieldSkipped('learningStyle')}
                >
                  <option value="">Select learning style</option>
                  {learningStyles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                {!isFieldSkipped('learningStyle') && !profile.learningStyle && (
                  <button
                    type="button"
                    onClick={() => handleSkip('learningStyle')}
                    className="mt-1 text-xs text-och-steel hover:text-och-mint transition"
                  >
                    Skip for now
                  </button>
                )}
                {isFieldSkipped('learningStyle') && (
                  <Badge variant="steel" className="mt-1">Skipped - will prompt later</Badge>
                )}
              </div>

              <div>
                <label htmlFor="careerGoals" className="block text-sm font-medium text-och-steel mb-1">
                  Career Goals
                </label>
                <textarea
                  id="careerGoals"
                  value={profile.careerGoals}
                  onChange={(e) => handleFieldChange('careerGoals', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender min-h-[100px]"
                  placeholder="Describe your career aspirations and goals..."
                  disabled={loading || isFieldSkipped('careerGoals')}
                />
                {!isFieldSkipped('careerGoals') && !profile.careerGoals && (
                  <button
                    type="button"
                    onClick={() => handleSkip('careerGoals')}
                    className="mt-1 text-xs text-och-steel hover:text-och-mint transition"
                  >
                    Skip for now
                  </button>
                )}
                {isFieldSkipped('careerGoals') && (
                  <Badge variant="steel" className="mt-1">Skipped - will prompt later</Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Cyber Security Background</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="cyberExposureLevel" className="block text-sm font-medium text-och-steel mb-1">
                  Cyber Exposure Level
                </label>
                <select
                  id="cyberExposureLevel"
                  value={profile.cyberExposureLevel}
                  onChange={(e) => handleFieldChange('cyberExposureLevel', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  disabled={loading || isFieldSkipped('cyberExposureLevel')}
                >
                  <option value="">Select your level</option>
                  {cyberExposureLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {!isFieldSkipped('cyberExposureLevel') && !profile.cyberExposureLevel && (
                  <button
                    type="button"
                    onClick={() => handleSkip('cyberExposureLevel')}
                    className="mt-1 text-xs text-och-steel hover:text-och-mint transition"
                  >
                    Skip for now
                  </button>
                )}
                {isFieldSkipped('cyberExposureLevel') && (
                  <Badge variant="steel" className="mt-1">Skipped - will prompt later</Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Optional Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="linkedInProfile" className="block text-sm font-medium text-och-steel mb-1">
                  LinkedIn Profile (Optional)
                </label>
                <input
                  id="linkedInProfile"
                  type="url"
                  value={profile.linkedInProfile}
                  onChange={(e) => handleFieldChange('linkedInProfile', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  placeholder="https://linkedin.com/in/yourprofile"
                  disabled={loading || isFieldSkipped('linkedInProfile')}
                />
                {!isFieldSkipped('linkedInProfile') && !profile.linkedInProfile && (
                  <button
                    type="button"
                    onClick={() => handleSkip('linkedInProfile')}
                    className="mt-1 text-xs text-och-steel hover:text-och-mint transition"
                  >
                    Skip for now
                  </button>
                )}
                {isFieldSkipped('linkedInProfile') && (
                  <Badge variant="steel" className="mt-1">Skipped - will prompt later</Badge>
                )}
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/student')}
              className="flex-1"
              disabled={loading}
            >
              Complete Later
            </Button>
            <Button
              type="submit"
              variant="defender"
              className="flex-1"
              glow
              disabled={loading || !canSubmit()}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-och-defender/10 border border-och-defender/20 rounded-lg">
            <p className="text-sm text-och-steel">
              <strong className="text-och-mint">Note:</strong> Your profile data will feed into TalentScope baseline calculations
              to help personalize your learning experience and mentor matching.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

