'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'

interface AuditLog {
  id: number
  action: string
  resource_type: string
  resource_id: string | null
  changes: Record<string, any>
  result: string
  timestamp: string
  actor_identifier: string
  ip_address: string | null
}

export default function DirectorSettingsPage() {
  const { user, reloadUser, logout } = useAuth()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    phone_number: '',
    country: '',
    timezone: 'UTC',
    language: 'en',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.bio || '',
        phone_number: user.phone_number || '',
        country: user.country || '',
        timezone: user.timezone || 'UTC',
        language: user.language || 'en',
      })
    }
  }, [user])

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true)
      const logs = await apiGateway.get('/audit-logs/', {
        params: {
          resource_type: 'user',
          resource_id: user?.id?.toString(),
          range: 'month',
        },
      })
      setAuditLogs(Array.isArray(logs) ? logs : [])
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      setAuditLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    setIsSaving(true)
    setSaveStatus(null)
    try {
      await apiGateway.patch(`/users/${user.id}/`, formData)
      setSaveStatus('Account updated successfully')
      await reloadUser()
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error: any) {
      setSaveStatus(`Error: ${error.message || 'Failed to update account'}`)
      setTimeout(() => setSaveStatus(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      login: 'Logged in',
      logout: 'Logged out',
      password_change: 'Password changed',
      role_assigned: 'Role assigned',
      role_revoked: 'Role revoked',
    }
    return labels[action] || action
  }

  const formatChanges = (changes: Record<string, any>) => {
    if (!changes || Object.keys(changes).length === 0) return null
    
    return Object.entries(changes).map(([field, value]) => {
      const oldVal = value?.old || 'N/A'
      const newVal = value?.new || 'N/A'
      return `${field}: ${oldVal} → ${newVal}`
    }).join(', ')
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-orange">Account Settings</h1>
          <p className="text-och-steel">Manage your account information and view update history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Info - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Account Info */}
            <Card>
              <h2 className="text-2xl font-bold mb-4 text-white">Account Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      placeholder="US"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Chicago">America/Chicago</option>
                      <option value="America/Denver">America/Denver</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                      <option value="Africa/Nairobi">Africa/Nairobi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>
                </div>

                {saveStatus && (
                  <div
                    className={`p-3 rounded-lg ${
                      saveStatus.includes('Error')
                        ? 'bg-och-orange/20 border border-och-orange text-och-orange'
                        : 'bg-och-mint/20 border border-och-mint text-och-mint'
                    }`}
                  >
                    {saveStatus}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="orange"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (user) {
                        setFormData({
                          first_name: user.first_name || '',
                          last_name: user.last_name || '',
                          email: user.email || '',
                          bio: user.bio || '',
                          phone_number: user.phone_number || '',
                          country: user.country || '',
                          timezone: user.timezone || 'UTC',
                          language: user.language || 'en',
                        })
                      }
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            {/* Account Updates History */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Account Update History</h2>
                <Button variant="outline" size="sm" onClick={loadAuditLogs}>
                  Refresh
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <p className="text-och-steel">Loading update history...</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-och-steel">No account updates found</p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                log.result === 'success'
                                  ? 'mint'
                                  : log.result === 'failure'
                                  ? 'orange'
                                  : 'defender'
                              }
                            >
                              {getActionLabel(log.action)}
                            </Badge>
                            <span className="text-sm text-och-steel">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {formatChanges(log.changes) && (
                            <p className="text-sm text-och-steel mt-1">
                              Changes: {formatChanges(log.changes)}
                            </p>
                          )}
                          {log.ip_address && (
                            <p className="text-xs text-och-steel mt-1">
                              IP: {log.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Current User Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-2xl font-bold mb-4 text-white">Current Account</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-och-steel mb-1">User ID</p>
                  <p className="text-white font-mono text-sm">{user?.id}</p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Account Status</p>
                  <Badge
                    variant={
                      user?.account_status === 'active'
                        ? 'mint'
                        : user?.account_status === 'suspended'
                        ? 'orange'
                        : 'defender'
                    }
                  >
                    {user?.account_status || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Email Verified</p>
                  <Badge variant={user?.email_verified ? 'mint' : 'orange'}>
                    {user?.email_verified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">MFA Enabled</p>
                  <Badge variant={user?.mfa_enabled ? 'mint' : 'defender'}>
                    {user?.mfa_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Risk Level</p>
                  <Badge
                    variant={
                      user?.risk_level === 'low'
                        ? 'mint'
                        : user?.risk_level === 'high'
                        ? 'orange'
                        : 'defender'
                    }
                  >
                    {user?.risk_level || 'Unknown'}
                  </Badge>
                </div>
                {user?.created_at && (
                  <div>
                    <p className="text-sm text-och-steel mb-1">Member Since</p>
                    <p className="text-white text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {user && (user as any).last_login && (
                  <div>
                    <p className="text-sm text-och-steel mb-1">Last Login</p>
                    <p className="text-white text-sm">
                      {new Date((user as any).last_login).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="text-2xl font-bold mb-4 text-white">Quick Actions</h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Manage MFA
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  View API Keys
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Export Data
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-2xl font-bold mb-4 text-white text-och-orange">Session</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-och-steel mb-2">
                    Sign out of your current session
                  </p>
                  <Button
                    variant="orange"
                    className="w-full"
                    onClick={async () => {
                      if (confirm('Are you sure you want to logout?')) {
                        await logout()
                      }
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

