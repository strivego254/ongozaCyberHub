'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { marketplaceClient, type MarketplaceProfile } from '@/services/marketplaceClient'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, CheckCircle, XCircle, TrendingUp, Clock, User } from 'lucide-react'
import Link from 'next/link'

export default function MarketplaceProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await marketplaceClient.getMyProfile()
      setProfile(data)
    } catch (err: any) {
      console.error('Failed to load marketplace profile:', err)
      setError(err.message || 'Failed to load marketplace profile')
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async () => {
    if (!profile) return
    try {
      setUpdating(true)
      const updated = await marketplaceClient.updateProfileVisibility(!profile.is_visible)
      setProfile(updated)
    } catch (err: any) {
      console.error('Failed to update visibility:', err)
      alert(err.message || 'Failed to update visibility')
    } finally {
      setUpdating(false)
    }
  }

  const getReadinessColor = (score: number | null) => {
    if (!score) return 'steel'
    if (score >= 80) return 'mint'
    if (score >= 60) return 'gold'
    return 'steel'
  }

  const getReadinessLabel = (score: number | null) => {
    if (!score) return 'Not Available'
    if (score >= 80) return 'High'
    if (score >= 60) return 'Medium'
    return 'Low'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'mint' | 'gold' | 'steel'> = {
      job_ready: 'mint',
      emerging_talent: 'gold',
      foundation_mode: 'steel',
    }
    return variants[status] || 'steel'
  }

  const getTierDisplay = (tier: string) => {
    if (tier === 'professional') return { name: 'Professional', color: 'mint', canContact: true }
    if (tier === 'starter') return { name: 'Starter', color: 'steel', canContact: false }
    return { name: 'Free', color: 'steel', canContact: false }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-och-midnight p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center text-och-steel">Loading marketplace profile...</div>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-och-midnight p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center text-red-400">{error || 'Profile not found'}</div>
          </Card>
        </div>
      </div>
    )
  }

  const tierInfo = getTierDisplay(profile.tier)

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-gold">Marketplace Profile</h1>
          <p className="text-och-steel mb-4">Manage your visibility to employers and view your career readiness.</p>
          <div className="bg-och-defender/20 border border-och-defender/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-och-steel">
              <strong className="text-white">💡 How it works:</strong> Make yourself discoverable by employers by upgrading your tier, granting consent, and toggling visibility ON. 
              Improve your readiness score by completing missions and building your portfolio to increase your chances of being hired.
            </p>
          </div>
        </div>

        {/* Visibility Toggle */}
        <Card className="mb-6 p-6">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Profile Visibility</h2>
              <p className="text-och-steel mb-2">
                {profile.is_visible
                  ? 'Your profile is visible to employers in the marketplace.'
                  : 'Your profile is hidden from employers.'}
              </p>
              {!profile.is_visible && (
                <div className="bg-och-midnight/50 rounded-lg p-3 mt-3">
                  <p className="text-xs text-och-steel">
                    <strong className="text-white">To be visible:</strong> You need Starter+ tier, employer consent, and visibility ON. 
                    {profile.tier === 'free' && ' Upgrade your tier first.'}
                    {!profile.employer_share_consent && ' Grant employer consent in settings.'}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant={profile.is_visible ? 'gold' : 'outline'}
              onClick={toggleVisibility}
              disabled={updating || profile.tier === 'free' || !profile.employer_share_consent}
              title={
                profile.tier === 'free'
                  ? 'Upgrade to Starter+ tier to enable visibility'
                  : !profile.employer_share_consent
                  ? 'Grant employer consent in settings first'
                  : profile.is_visible
                  ? 'Click to hide your profile from employers'
                  : 'Click to make your profile visible to employers'
              }
            >
              {updating ? (
                'Updating...'
              ) : profile.is_visible ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Visible
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hidden
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Tier & Consent Status */}
        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Subscription & Privacy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-defender/20">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-och-gold" />
                <span className="text-sm text-och-steel font-medium">Subscription Tier</span>
              </div>
              <Badge variant={tierInfo.color as any} className="text-lg mb-2">
                {tierInfo.name}
              </Badge>
              {profile.tier === 'free' ? (
                <div className="bg-och-orange/10 border border-och-orange/30 rounded p-2 mt-2">
                  <p className="text-xs text-och-orange font-medium">
                    ⚠️ Free tier profiles are never visible to employers. Upgrade to Starter ($3) or Professional ($7) to be discoverable.
                  </p>
                </div>
              ) : !tierInfo.canContact ? (
                <p className="text-xs text-och-steel mt-2">
                  ✅ Visible to employers. Upgrade to Professional tier to enable direct employer contact.
                </p>
              ) : (
                <p className="text-xs text-och-mint mt-2">
                  ✅ Visible and contactable! Employers can reach out to you directly.
                </p>
              )}
            </div>
            <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-defender/20">
              <div className="flex items-center gap-2 mb-2">
                {profile.employer_share_consent ? (
                  <CheckCircle className="w-5 h-5 text-och-mint" />
                ) : (
                  <XCircle className="w-5 h-5 text-och-steel" />
                )}
                <span className="text-sm text-och-steel font-medium">Employer Share Consent</span>
              </div>
              <Badge variant={profile.employer_share_consent ? 'mint' : 'steel'} className="mb-2">
                {profile.employer_share_consent ? 'Granted' : 'Not Granted'}
              </Badge>
              {!profile.employer_share_consent ? (
                <div className="bg-och-orange/10 border border-och-orange/30 rounded p-2 mt-2">
                  <p className="text-xs text-och-orange font-medium">
                    ⚠️ You must grant employer consent in Settings → Consent Management to be visible.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-och-mint mt-2">
                  ✅ You've granted permission for employers to view your profile.
                </p>
              )}
            </div>
          </div>
          
          {/* Requirements Checklist */}
          <div className="mt-4 p-4 bg-och-midnight/30 rounded-lg border border-och-defender/20">
            <h3 className="text-sm font-bold text-white mb-3">Requirements to be Discoverable:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {profile.tier !== 'free' ? (
                  <CheckCircle className="w-4 h-4 text-och-mint" />
                ) : (
                  <XCircle className="w-4 h-4 text-och-steel" />
                )}
                <span className={`text-xs ${profile.tier !== 'free' ? 'text-och-mint' : 'text-och-steel'}`}>
                  {profile.tier !== 'free' ? '✓' : '✗'} Subscription Tier: {profile.tier === 'free' ? 'Upgrade to Starter+ ($3/month minimum)' : `Current tier: ${tierInfo.name}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {profile.employer_share_consent ? (
                  <CheckCircle className="w-4 h-4 text-och-mint" />
                ) : (
                  <XCircle className="w-4 h-4 text-och-steel" />
                )}
                <span className={`text-xs ${profile.employer_share_consent ? 'text-och-mint' : 'text-och-steel'}`}>
                  {profile.employer_share_consent ? '✓' : '✗'} Employer Consent: {profile.employer_share_consent ? 'Granted' : 'Grant in Settings → Consent Management'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {profile.is_visible ? (
                  <CheckCircle className="w-4 h-4 text-och-mint" />
                ) : (
                  <XCircle className="w-4 h-4 text-och-steel" />
                )}
                <span className={`text-xs ${profile.is_visible ? 'text-och-mint' : 'text-och-steel'}`}>
                  {profile.is_visible ? '✓' : '✗'} Profile Visibility: {profile.is_visible ? 'Visible to employers' : 'Toggle visibility ON above'}
                </span>
              </div>
            </div>
            {profile.tier !== 'free' && profile.employer_share_consent && profile.is_visible && (
              <div className="mt-3 p-2 bg-och-mint/10 border border-och-mint/30 rounded">
                <p className="text-xs text-och-mint font-medium">
                  🎉 All requirements met! Your profile is discoverable by employers.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Career Readiness Report */}
        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Career Readiness Report</h2>
          
          {profile.readiness_score !== null ? (
            <div className="space-y-6">
              {/* Readiness Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-och-steel">Overall Readiness Score</span>
                  <Badge variant={getReadinessColor(profile.readiness_score)} className="text-lg">
                    {profile.readiness_score}% - {getReadinessLabel(profile.readiness_score)}
                  </Badge>
                </div>
                <div className="w-full bg-och-midnight/50 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      profile.readiness_score >= 80
                        ? 'bg-och-mint'
                        : profile.readiness_score >= 60
                        ? 'bg-och-gold'
                        : 'bg-och-steel'
                    }`}
                    style={{ width: `${profile.readiness_score}%` }}
                  />
                </div>
              </div>

              {/* Job Fit Score */}
              {profile.job_fit_score !== null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-och-steel">Job Fit Score</span>
                    <Badge variant={getReadinessColor(profile.job_fit_score)}>
                      {profile.job_fit_score}%
                    </Badge>
                  </div>
                  <div className="w-full bg-och-midnight/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        profile.job_fit_score >= 80
                          ? 'bg-och-mint'
                          : profile.job_fit_score >= 60
                          ? 'bg-och-gold'
                          : 'bg-och-steel'
                      }`}
                      style={{ width: `${profile.job_fit_score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Hiring Timeline */}
              {profile.hiring_timeline_days !== null && (
                <div className="flex items-center gap-2 text-och-steel">
                  <Clock className="w-5 h-5" />
                  <span>
                    Estimated hiring timeline: <strong className="text-white">{profile.hiring_timeline_days} days</strong>
                  </span>
                </div>
              )}

              {/* Profile Status */}
              <div>
                <span className="text-och-steel mr-2">Profile Status:</span>
                <Badge variant={getStatusBadge(profile.profile_status)}>
                  {profile.profile_status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-och-steel">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Complete missions and update your portfolio to generate readiness scores.</p>
            </div>
          )}
        </Card>

        {/* Skills & Portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Skills</h3>
            {profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="defender">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-och-steel text-sm">No skills listed yet.</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Portfolio Depth</h3>
            <Badge variant="gold" className="text-lg">
              {profile.portfolio_depth}
            </Badge>
            <p className="text-sm text-och-steel mt-2">
              {profile.portfolio_depth === 'deep'
                ? 'Your portfolio shows comprehensive work and achievements.'
                : profile.portfolio_depth === 'moderate'
                ? 'Your portfolio has good depth. Add more items to improve visibility.'
                : 'Consider adding more portfolio items to showcase your work.'}
            </p>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Profile Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-och-steel">Primary Role:</span>
              <p className="text-white">{profile.primary_role || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-och-steel">Primary Track:</span>
              <p className="text-white">{profile.primary_track_key || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-och-steel">Last Updated:</span>
              <p className="text-white">{new Date(profile.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/dashboard/student/portfolio">
            <Button variant="gold">Update Portfolio</Button>
          </Link>
          {profile.tier !== 'professional' && (
            <Link href="/dashboard/student/subscription">
              <Button variant="outline">Upgrade to Professional</Button>
            </Link>
          )}
          {!profile.employer_share_consent && (
            <Link href="/settings">
              <Button variant="outline">Grant Employer Consent</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}


