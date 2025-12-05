'use client'

import { useState, useEffect } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

interface TeamMember {
  id: string
  email: string
  name?: string
  role: 'admin' | 'viewer' | 'finance'
  status: 'active' | 'invited' | 'inactive'
  invited_at?: string
  last_active?: string
}

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' as const })

  useEffect(() => {
    loadTeam()
  }, [])

  const loadTeam = async () => {
    try {
      setLoading(true)
      // TODO: Implement API endpoint
      // const data = await sponsorClient.getTeamMembers()
      // setMembers(data)
      setMembers([])
    } catch (error) {
      console.error('Failed to load team:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    try {
      // TODO: Implement invite API
      console.log('Invite team member:', inviteForm)
      alert('Team invite feature coming soon')
      setShowInviteModal(false)
      setInviteForm({ email: '', role: 'viewer' })
    } catch (error) {
      console.error('Failed to invite member:', error)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    
    try {
      // TODO: Implement remove API
      console.log('Remove member:', memberId)
      alert('Remove member feature coming soon')
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    viewer: 'bg-blue-100 text-blue-700',
    finance: 'bg-emerald-100 text-emerald-700',
  }

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    invited: 'bg-amber-100 text-amber-700',
    inactive: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👥 Team Management</h1>
            <p className="text-gray-600 mt-1">Manage team member access and permissions</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            + Invite Member
          </button>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold mb-4">Invite Team Member</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="colleague@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="viewer">Viewer - Read-only access</option>
                    <option value="finance">Finance - Billing & invoices</option>
                    <option value="admin">Admin - Full access</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleInvite}
                    disabled={!inviteForm.email}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Invite
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteModal(false)
                      setInviteForm({ email: '', role: 'viewer' })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Members Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Loading team members...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No team members found. Invite your first team member to get started.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {member.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[member.role]}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[member.status]}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

