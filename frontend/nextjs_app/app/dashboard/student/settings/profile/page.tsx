'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { djangoClient } from '@/services/djangoClient'
import type { User } from '@/services/types/user'

interface ProfileData extends User {
  role_specific_data?: {
    student?: {
      track_name?: string
      cohort_name?: string
      enrollment_status?: string
      enrollment_type?: 'self' | 'sponsor' | 'invite' | 'director'
      seat_type?: 'paid' | 'scholarship' | 'sponsored'
      payment_status?: 'pending' | 'paid' | 'waived'
    }
  }
}

export default function ProfileSettingsPage() {
  const { user: authUser, reloadUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const profileData = await djangoClient.users.getProfile()
      setProfile(profileData)
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: keyof User, value: any) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setSaveStatus(null)
    try {
      const updateData: Partial<User> = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
      }

      await djangoClient.users.updateProfile(updateData)
      await reloadUser()
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setSaveStatus('error')
      setError(err.message || 'Failed to save profile. Please try again.')
      setTimeout(() => {
        setSaveStatus(null)
        setError(null)
      }, 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (authUser) {
      setProfile({
        ...authUser,
        bio: authUser.bio || '',
      } as User)
    }
    setError(null)
    setSaveStatus(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-mint">Profile Settings</h1>
            <p className="text-och-steel">
              Manage your personal information and profile
            </p>
          </div>
          <Card>
            <div className="p-8 text-center">
              <p className="text-och-steel">Loading profile...</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-mint">Profile Settings</h1>
            <p className="text-och-steel">
              Manage your personal information and profile
            </p>
          </div>
          <Card>
            <div className="p-8 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="mint" onClick={loadProfile}>Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const displayUser = profile || authUser

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Profile Settings</h1>
          <p className="text-och-steel">
            Manage your personal information and profile
          </p>
        </div>

        <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {saveStatus === 'success' && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">Profile updated successfully!</p>
                </div>
              )}

            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-och-defender flex items-center justify-center text-white text-2xl font-semibold">
                    {displayUser?.first_name?.[0] || ''}{displayUser?.last_name?.[0] || ''}
                </div>
                  <Button type="button" variant="outline" disabled>
                    Upload New Photo
                  </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">
                  First Name
                </label>
                <input
                  type="text"
                    value={profile?.first_name || ''}
                    onChange={(e) => handleFieldChange('first_name', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                    required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                    value={profile?.last_name || ''}
                    onChange={(e) => handleFieldChange('last_name', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                    required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Email
              </label>
              <input
                type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-och-steel cursor-not-allowed"
              />
                <p className="text-xs text-och-steel mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Bio
              </label>
              <textarea
                rows={4}
                  value={profile?.bio || ''}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender resize-y"
              />
                <p className="text-xs text-och-steel mt-1">
                  Share a bit about yourself, your interests, and goals
                </p>
            </div>

            {/* Account Details Section */}
            {profile?.role_specific_data?.student && (
              <div className="border-t border-och-steel/20 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">
                      Enrollment Type
                    </label>
                    <div className="flex items-center gap-2">
                      {profile.role_specific_data.student.enrollment_type ? (
                        <Badge 
                          variant={
                            profile.role_specific_data.student.enrollment_type === 'director' ? 'gold' :
                            profile.role_specific_data.student.enrollment_type === 'sponsor' ? 'mint' :
                            profile.role_specific_data.student.enrollment_type === 'invite' ? 'defender' :
                            'steel'
                          }
                        >
                          {profile.role_specific_data.student.enrollment_type === 'director' ? 'Director Assignation' :
                           profile.role_specific_data.student.enrollment_type === 'sponsor' ? 'Sponsor Assigned' :
                           profile.role_specific_data.student.enrollment_type === 'invite' ? 'Invited' :
                           'Self-Enrolled'}
                        </Badge>
                      ) : (
                        <span className="text-och-steel text-sm">Not available</span>
                      )}
                    </div>
                    <p className="text-xs text-och-steel mt-1">
                      {profile.role_specific_data.student.enrollment_type === 'director' && 'You were assigned to this cohort by a program director'}
                      {profile.role_specific_data.student.enrollment_type === 'sponsor' && 'You were assigned by a sponsor organization'}
                      {profile.role_specific_data.student.enrollment_type === 'invite' && 'You were invited to join this cohort'}
                      {profile.role_specific_data.student.enrollment_type === 'self' && 'You self-enrolled in this cohort'}
                      {!profile.role_specific_data.student.enrollment_type && 'Enrollment type information not available'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">
                      Seat Type
                    </label>
                    <div className="flex items-center gap-2">
                      {profile.role_specific_data.student.seat_type ? (
                        <Badge 
                          variant={
                            profile.role_specific_data.student.seat_type === 'paid' ? 'defender' :
                            profile.role_specific_data.student.seat_type === 'scholarship' ? 'gold' :
                            'mint'
                          }
                        >
                          {profile.role_specific_data.student.seat_type.charAt(0).toUpperCase() + 
                           profile.role_specific_data.student.seat_type.slice(1)}
                        </Badge>
                      ) : (
                        <span className="text-och-steel text-sm">Not available</span>
                      )}
                    </div>
                    <p className="text-xs text-och-steel mt-1">
                      {profile.role_specific_data.student.seat_type === 'paid' && 'You are enrolled as a paid student'}
                      {profile.role_specific_data.student.seat_type === 'scholarship' && 'You are enrolled with a scholarship'}
                      {profile.role_specific_data.student.seat_type === 'sponsored' && 'Your enrollment is sponsored by an organization'}
                      {!profile.role_specific_data.student.seat_type && 'Seat type information not available'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">
                      Payment Status
                    </label>
                    <div className="flex items-center gap-2">
                      {profile.role_specific_data.student.payment_status ? (
                        <Badge 
                          variant={
                            profile.role_specific_data.student.payment_status === 'paid' ? 'mint' :
                            profile.role_specific_data.student.payment_status === 'waived' ? 'gold' :
                            'orange'
                          }
                        >
                          {profile.role_specific_data.student.payment_status.charAt(0).toUpperCase() + 
                           profile.role_specific_data.student.payment_status.slice(1)}
                        </Badge>
                      ) : (
                        <span className="text-och-steel text-sm">Not available</span>
                      )}
                    </div>
                    <p className="text-xs text-och-steel mt-1">
                      {profile.role_specific_data.student.payment_status === 'paid' && 'Your payment has been processed'}
                      {profile.role_specific_data.student.payment_status === 'waived' && 'Payment has been waived (typically for director assignation or scholarship)'}
                      {profile.role_specific_data.student.payment_status === 'pending' && 'Payment is pending'}
                      {!profile.role_specific_data.student.payment_status && 'Payment status information not available'}
                    </p>
                  </div>
                </div>
                {/* Summary Message */}
                {profile.role_specific_data.student.enrollment_type && 
                 profile.role_specific_data.student.seat_type && 
                 profile.role_specific_data.student.payment_status && (
                  <div className="mt-4 p-4 bg-och-midnight/50 border border-och-steel/20 rounded-lg">
                    <p className="text-sm text-white">
                      <span className="font-semibold">Summary: </span>
                      {profile.role_specific_data.student.enrollment_type === 'director' && 
                       profile.role_specific_data.student.payment_status === 'waived' && (
                        <span>You were assigned to this cohort by a program director and payment has been waived.</span>
                      )}
                      {profile.role_specific_data.student.enrollment_type === 'director' && 
                       profile.role_specific_data.student.payment_status !== 'waived' && (
                        <span>You were assigned to this cohort by a program director.</span>
                      )}
                      {profile.role_specific_data.student.seat_type === 'paid' && 
                       profile.role_specific_data.student.payment_status === 'paid' && (
                        <span>You have a paid enrollment and payment has been processed.</span>
                      )}
                      {profile.role_specific_data.student.seat_type === 'scholarship' && (
                        <span>You are enrolled with a scholarship seat.</span>
                      )}
                      {profile.role_specific_data.student.seat_type === 'sponsored' && (
                        <span>Your enrollment is sponsored by an organization.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
                <Button 
                  type="submit" 
                  variant="mint" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
            </div>
          </div>
        </Card>
        </form>
      </div>
    </div>
  )
}

