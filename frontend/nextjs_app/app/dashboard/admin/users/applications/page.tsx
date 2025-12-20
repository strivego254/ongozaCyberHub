'use client'

import { useState, useEffect, useMemo } from 'react'
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<User | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveAssignRole, setApproveAssignRole] = useState<string>('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadApplications()
    loadRoles()
  }, [currentPage, debouncedSearch])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      const response = await djangoClient.users.getPendingApplications({
        page: currentPage,
        page_size: pageSize,
      })
      setApplications(response.results || [])
      setTotalCount(response.count || 0)
    } catch (error: any) {
      console.error('Error loading applications:', error)
      alert(error.message || 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await apiGateway.get<Role[] | { results: Role[] }>('/roles/')
      const rolesArray = Array.isArray(data) ? data : (data?.results || [])
      setRoles(rolesArray)
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleApprove = async (user: User, assignRole?: string) => {
    if (!confirm(`Approve ${user.email} and activate their account?`)) {
      return
    }

    setIsProcessing(user.id)
    try {
      await djangoClient.users.approveApplication(user.id, assignRole)
      alert('Application approved successfully!')
      await loadApplications()
      setShowApproveModal(false)
      setSelectedApplication(null)
    } catch (error: any) {
      console.error('Error approving application:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to approve application'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleReject = async (user: User, reason?: string) => {
    if (!confirm(`Reject ${user.email}'s application? This will deactivate their account.`)) {
      return
    }

    setIsProcessing(user.id)
    try {
      await djangoClient.users.rejectApplication(user.id, reason)
      alert('Application rejected successfully')
      await loadApplications()
      setShowRejectModal(false)
      setSelectedApplication(null)
      setRejectReason('')
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to reject application'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(null)
    }
  }

  const filteredApplications = useMemo(() => {
    if (!debouncedSearch) return applications
    const query = debouncedSearch.toLowerCase()
    return applications.filter(
      (app) =>
        app.email.toLowerCase().includes(query) ||
        app.first_name?.toLowerCase().includes(query) ||
        app.last_name?.toLowerCase().includes(query) ||
        app.username?.toLowerCase().includes(query)
    )
  }, [applications, debouncedSearch])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Pending Applications</h1>
              <p className="text-och-steel">
                Review and manage user applications waiting for approval
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadApplications}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-och-steel mb-1">Total Pending</p>
                  <p className="text-3xl font-bold text-och-mint">{totalCount}</p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Current Page</p>
                  <p className="text-3xl font-bold text-white">
                    {currentPage} / {totalPages || 1}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Showing</p>
                  <p className="text-3xl font-bold text-white">
                    {filteredApplications.length} / {applications.length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Search */}
          <Card className="mb-6">
            <div className="p-4">
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </Card>

          {/* Applications List */}
          <Card>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading applications...</p>
                  </div>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-och-steel text-lg mb-2">No pending applications found</p>
                  <p className="text-och-steel text-sm">
                    {debouncedSearch
                      ? 'Try adjusting your search criteria'
                      : 'All applications have been processed'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-och-steel/20">
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Created</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr
                            key={app.id}
                            className="border-b border-och-steel/10 hover:bg-och-midnight/50"
                          >
                            <td className="p-3">
                              <div>
                                <p className="text-white font-semibold">
                                  {app.first_name} {app.last_name}
                                </p>
                                <p className="text-xs text-och-steel">@{app.username}</p>
                              </div>
                            </td>
                            <td className="p-3 text-och-steel text-sm">{app.email}</td>
                            <td className="p-3 text-och-steel text-sm">
                              {new Date(app.created_at).toLocaleDateString()}
                              <br />
                              <span className="text-xs">
                                {new Date(app.created_at).toLocaleTimeString()}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge variant="orange">{app.account_status}</Badge>
                              {!app.email_verified && (
                                <Badge variant="steel" className="ml-2 text-xs">
                                  Email Not Verified
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="mint"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(app)
                                    setShowApproveModal(true)
                                  }}
                                  disabled={isProcessing === app.id}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(app)
                                    setShowRejectModal(true)
                                  }}
                                  disabled={isProcessing === app.id}
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-och-steel">
                        Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} applications
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1 || isLoading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Approve Modal */}
          {showApproveModal && selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md m-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Approve Application</h2>
                    <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                      ✕
                    </Button>
                  </div>

                  <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-sm text-och-steel mb-1">User</p>
                    <p className="text-white font-semibold">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                    <p className="text-sm text-och-steel">{selectedApplication.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Assign Role (Optional)
                      </label>
                      <select
                        value={approveAssignRole}
                        onChange={(e) => setApproveAssignRole(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      >
                        <option value="">No role assignment</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.display_name} - {role.description}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-och-steel mt-1">
                        Optionally assign a role when approving the application
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowApproveModal(false)
                          setSelectedApplication(null)
                          setApproveAssignRole('')
                        }}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="mint"
                        onClick={() => handleApprove(selectedApplication, approveAssignRole || undefined)}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                        glow
                      >
                        {isProcessing === selectedApplication.id
                          ? 'Approving...'
                          : 'Approve Application'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md m-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Reject Application</h2>
                    <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                      ✕
                    </Button>
                  </div>

                  <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-sm text-och-steel mb-1">User</p>
                    <p className="text-white font-semibold">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                    <p className="text-sm text-och-steel">{selectedApplication.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Rejection Reason (Optional)
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender min-h-[100px]"
                      />
                      <p className="text-xs text-och-steel mt-1">
                        This reason will be logged in the audit trail
                      </p>
                    </div>

                    <div className="p-4 bg-och-orange/10 border border-och-orange/20 rounded-lg">
                      <p className="text-sm text-och-orange">
                        ⚠️ Rejecting this application will deactivate the user's account.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectModal(false)
                          setSelectedApplication(null)
                          setRejectReason('')
                        }}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="orange"
                        onClick={() => handleReject(selectedApplication, rejectReason || undefined)}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        {isProcessing === selectedApplication.id
                          ? 'Rejecting...'
                          : 'Reject Application'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}



import { useState, useEffect, useMemo } from 'react'
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<User | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveAssignRole, setApproveAssignRole] = useState<string>('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadApplications()
    loadRoles()
  }, [currentPage, debouncedSearch])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      const response = await djangoClient.users.getPendingApplications({
        page: currentPage,
        page_size: pageSize,
      })
      setApplications(response.results || [])
      setTotalCount(response.count || 0)
    } catch (error: any) {
      console.error('Error loading applications:', error)
      alert(error.message || 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await apiGateway.get<Role[] | { results: Role[] }>('/roles/')
      const rolesArray = Array.isArray(data) ? data : (data?.results || [])
      setRoles(rolesArray)
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleApprove = async (user: User, assignRole?: string) => {
    if (!confirm(`Approve ${user.email} and activate their account?`)) {
      return
    }

    setIsProcessing(user.id)
    try {
      await djangoClient.users.approveApplication(user.id, assignRole)
      alert('Application approved successfully!')
      await loadApplications()
      setShowApproveModal(false)
      setSelectedApplication(null)
    } catch (error: any) {
      console.error('Error approving application:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to approve application'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleReject = async (user: User, reason?: string) => {
    if (!confirm(`Reject ${user.email}'s application? This will deactivate their account.`)) {
      return
    }

    setIsProcessing(user.id)
    try {
      await djangoClient.users.rejectApplication(user.id, reason)
      alert('Application rejected successfully')
      await loadApplications()
      setShowRejectModal(false)
      setSelectedApplication(null)
      setRejectReason('')
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to reject application'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(null)
    }
  }

  const filteredApplications = useMemo(() => {
    if (!debouncedSearch) return applications
    const query = debouncedSearch.toLowerCase()
    return applications.filter(
      (app) =>
        app.email.toLowerCase().includes(query) ||
        app.first_name?.toLowerCase().includes(query) ||
        app.last_name?.toLowerCase().includes(query) ||
        app.username?.toLowerCase().includes(query)
    )
  }, [applications, debouncedSearch])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Pending Applications</h1>
              <p className="text-och-steel">
                Review and manage user applications waiting for approval
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadApplications}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-och-steel mb-1">Total Pending</p>
                  <p className="text-3xl font-bold text-och-mint">{totalCount}</p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Current Page</p>
                  <p className="text-3xl font-bold text-white">
                    {currentPage} / {totalPages || 1}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Showing</p>
                  <p className="text-3xl font-bold text-white">
                    {filteredApplications.length} / {applications.length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Search */}
          <Card className="mb-6">
            <div className="p-4">
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </Card>

          {/* Applications List */}
          <Card>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading applications...</p>
                  </div>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-och-steel text-lg mb-2">No pending applications found</p>
                  <p className="text-och-steel text-sm">
                    {debouncedSearch
                      ? 'Try adjusting your search criteria'
                      : 'All applications have been processed'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-och-steel/20">
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Created</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr
                            key={app.id}
                            className="border-b border-och-steel/10 hover:bg-och-midnight/50"
                          >
                            <td className="p-3">
                              <div>
                                <p className="text-white font-semibold">
                                  {app.first_name} {app.last_name}
                                </p>
                                <p className="text-xs text-och-steel">@{app.username}</p>
                              </div>
                            </td>
                            <td className="p-3 text-och-steel text-sm">{app.email}</td>
                            <td className="p-3 text-och-steel text-sm">
                              {new Date(app.created_at).toLocaleDateString()}
                              <br />
                              <span className="text-xs">
                                {new Date(app.created_at).toLocaleTimeString()}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge variant="orange">{app.account_status}</Badge>
                              {!app.email_verified && (
                                <Badge variant="steel" className="ml-2 text-xs">
                                  Email Not Verified
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="mint"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(app)
                                    setShowApproveModal(true)
                                  }}
                                  disabled={isProcessing === app.id}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(app)
                                    setShowRejectModal(true)
                                  }}
                                  disabled={isProcessing === app.id}
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-och-steel">
                        Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} applications
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1 || isLoading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Approve Modal */}
          {showApproveModal && selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md m-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Approve Application</h2>
                    <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                      ✕
                    </Button>
                  </div>

                  <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-sm text-och-steel mb-1">User</p>
                    <p className="text-white font-semibold">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                    <p className="text-sm text-och-steel">{selectedApplication.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Assign Role (Optional)
                      </label>
                      <select
                        value={approveAssignRole}
                        onChange={(e) => setApproveAssignRole(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      >
                        <option value="">No role assignment</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.display_name} - {role.description}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-och-steel mt-1">
                        Optionally assign a role when approving the application
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowApproveModal(false)
                          setSelectedApplication(null)
                          setApproveAssignRole('')
                        }}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="mint"
                        onClick={() => handleApprove(selectedApplication, approveAssignRole || undefined)}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                        glow
                      >
                        {isProcessing === selectedApplication.id
                          ? 'Approving...'
                          : 'Approve Application'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md m-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Reject Application</h2>
                    <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                      ✕
                    </Button>
                  </div>

                  <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-sm text-och-steel mb-1">User</p>
                    <p className="text-white font-semibold">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                    <p className="text-sm text-och-steel">{selectedApplication.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Rejection Reason (Optional)
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender min-h-[100px]"
                      />
                      <p className="text-xs text-och-steel mt-1">
                        This reason will be logged in the audit trail
                      </p>
                    </div>

                    <div className="p-4 bg-och-orange/10 border border-och-orange/20 rounded-lg">
                      <p className="text-sm text-och-orange">
                        ⚠️ Rejecting this application will deactivate the user's account.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectModal(false)
                          setSelectedApplication(null)
                          setRejectReason('')
                        }}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="orange"
                        onClick={() => handleReject(selectedApplication, rejectReason || undefined)}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        {isProcessing === selectedApplication.id
                          ? 'Rejecting...'
                          : 'Reject Application'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<User | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveAssignRole, setApproveAssignRole] = useState<string>('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadApplications()
    loadRoles()
  }, [currentPage, debouncedSearch])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      const response = await djangoClient.users.getPendingApplications({
        page: currentPage,
        page_size: pageSize,
      })
      setApplications(response.results || [])
      setTotalCount(response.count || 0)
    } catch (error: any) {
      console.error('Error loading applications:', error)
      alert(error.message || 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await apiGateway.get<Role[] | { results: Role[] }>('/roles/')
      const rolesArray = Array.isArray(data) ? data : (data?.results || [])
      setRoles(rolesArray)
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleApprove = async (user: User, assignRole?: string) => {
    if (!confirm(`Approve ${user.email} and activate their account?`)) {
      return
    }

    setIsProcessing(user.id)
    try {
      await djangoClient.users.approveApplication(user.id, assignRole)
      alert('Application approved successfully!')
      await loadApplications()
      setShowApproveModal(false)
      setSelectedApplication(null)
    } catch (error: any) {
      console.error('Error approving application:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to approve application'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleReject = async (user: User, reason?: string) => {
    if (!confirm(`Reject ${user.email}'s application? This will deactivate their account.`)) {
      return
    }

    setIsProcessing(user.id)
    try {
      await djangoClient.users.rejectApplication(user.id, reason)
      alert('Application rejected successfully')
      await loadApplications()
      setShowRejectModal(false)
      setSelectedApplication(null)
      setRejectReason('')
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to reject application'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(null)
    }
  }

  const filteredApplications = useMemo(() => {
    if (!debouncedSearch) return applications
    const query = debouncedSearch.toLowerCase()
    return applications.filter(
      (app) =>
        app.email.toLowerCase().includes(query) ||
        app.first_name?.toLowerCase().includes(query) ||
        app.last_name?.toLowerCase().includes(query) ||
        app.username?.toLowerCase().includes(query)
    )
  }, [applications, debouncedSearch])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Pending Applications</h1>
              <p className="text-och-steel">
                Review and manage user applications waiting for approval
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadApplications}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-och-steel mb-1">Total Pending</p>
                  <p className="text-3xl font-bold text-och-mint">{totalCount}</p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Current Page</p>
                  <p className="text-3xl font-bold text-white">
                    {currentPage} / {totalPages || 1}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Showing</p>
                  <p className="text-3xl font-bold text-white">
                    {filteredApplications.length} / {applications.length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Search */}
          <Card className="mb-6">
            <div className="p-4">
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </Card>

          {/* Applications List */}
          <Card>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading applications...</p>
                  </div>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-och-steel text-lg mb-2">No pending applications found</p>
                  <p className="text-och-steel text-sm">
                    {debouncedSearch
                      ? 'Try adjusting your search criteria'
                      : 'All applications have been processed'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-och-steel/20">
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Created</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr
                            key={app.id}
                            className="border-b border-och-steel/10 hover:bg-och-midnight/50"
                          >
                            <td className="p-3">
                              <div>
                                <p className="text-white font-semibold">
                                  {app.first_name} {app.last_name}
                                </p>
                                <p className="text-xs text-och-steel">@{app.username}</p>
                              </div>
                            </td>
                            <td className="p-3 text-och-steel text-sm">{app.email}</td>
                            <td className="p-3 text-och-steel text-sm">
                              {new Date(app.created_at).toLocaleDateString()}
                              <br />
                              <span className="text-xs">
                                {new Date(app.created_at).toLocaleTimeString()}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge variant="orange">{app.account_status}</Badge>
                              {!app.email_verified && (
                                <Badge variant="steel" className="ml-2 text-xs">
                                  Email Not Verified
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="mint"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(app)
                                    setShowApproveModal(true)
                                  }}
                                  disabled={isProcessing === app.id}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(app)
                                    setShowRejectModal(true)
                                  }}
                                  disabled={isProcessing === app.id}
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-och-steel">
                        Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} applications
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1 || isLoading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Approve Modal */}
          {showApproveModal && selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md m-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Approve Application</h2>
                    <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                      ✕
                    </Button>
                  </div>

                  <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-sm text-och-steel mb-1">User</p>
                    <p className="text-white font-semibold">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                    <p className="text-sm text-och-steel">{selectedApplication.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Assign Role (Optional)
                      </label>
                      <select
                        value={approveAssignRole}
                        onChange={(e) => setApproveAssignRole(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      >
                        <option value="">No role assignment</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.display_name} - {role.description}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-och-steel mt-1">
                        Optionally assign a role when approving the application
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowApproveModal(false)
                          setSelectedApplication(null)
                          setApproveAssignRole('')
                        }}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="mint"
                        onClick={() => handleApprove(selectedApplication, approveAssignRole || undefined)}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                        glow
                      >
                        {isProcessing === selectedApplication.id
                          ? 'Approving...'
                          : 'Approve Application'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md m-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Reject Application</h2>
                    <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                      ✕
                    </Button>
                  </div>

                  <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-sm text-och-steel mb-1">User</p>
                    <p className="text-white font-semibold">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                    <p className="text-sm text-och-steel">{selectedApplication.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Rejection Reason (Optional)
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender min-h-[100px]"
                      />
                      <p className="text-xs text-och-steel mt-1">
                        This reason will be logged in the audit trail
                      </p>
                    </div>

                    <div className="p-4 bg-och-orange/10 border border-och-orange/20 rounded-lg">
                      <p className="text-sm text-och-orange">
                        ⚠️ Rejecting this application will deactivate the user's account.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectModal(false)
                          setSelectedApplication(null)
                          setRejectReason('')
                        }}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="orange"
                        onClick={() => handleReject(selectedApplication, rejectReason || undefined)}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        {isProcessing === selectedApplication.id
                          ? 'Rejecting...'
                          : 'Reject Application'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}



import { useState, useEffect, useMemo } from 'react'
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<User | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveAssignRole, setApproveAssignRole] = useState<string>('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadApplications()
    loadRoles()
  }, [currentPage, debouncedSearch])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      const response = await djangoClient.users.getPendingApplications({
        page: currentPage,
        page_size: pageSize,
      })
      setApplications(response.results || [])
      setTotalCount(response.count || 0)
    } catch (error: any) {
      console.error('Error loading applications:', error)
      alert(error.message || 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await apiGateway.get<Role[] | { results: Role[] }>('/roles/')
      const rolesArray = Array.isArray(data) ? data : (data?.results || [])
      setRoles(rolesArray)
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleApprove = async (user: User, assignRole?: string) => {
    if (!confirm(`Approve ${user.email} and activate their account?`)) {
      return
    }

    setIsProcessing(user.id)
    try {
      await djangoClient.users.approveApplication(user.id, assignRole)
      alert('Application approved successfully!')
      await loadApplications()
      setShowApproveModal(false)
      setSelectedApplication(null)
    } catch (error: any) {
      console.error('Error approving application:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to approve application'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleReject = async (user: User, reason?: string) => {
    if (!confirm(`Reject ${user.email}'s application? This will deactivate their account.`)) {
      return
    }

    setIsProcessing(user.id)
    try {
      await djangoClient.users.rejectApplication(user.id, reason)
      alert('Application rejected successfully')
      await loadApplications()
      setShowRejectModal(false)
      setSelectedApplication(null)
      setRejectReason('')
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to reject application'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(null)
    }
  }

  const filteredApplications = useMemo(() => {
    if (!debouncedSearch) return applications
    const query = debouncedSearch.toLowerCase()
    return applications.filter(
      (app) =>
        app.email.toLowerCase().includes(query) ||
        app.first_name?.toLowerCase().includes(query) ||
        app.last_name?.toLowerCase().includes(query) ||
        app.username?.toLowerCase().includes(query)
    )
  }, [applications, debouncedSearch])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Pending Applications</h1>
              <p className="text-och-steel">
                Review and manage user applications waiting for approval
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadApplications}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-och-steel mb-1">Total Pending</p>
                  <p className="text-3xl font-bold text-och-mint">{totalCount}</p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Current Page</p>
                  <p className="text-3xl font-bold text-white">
                    {currentPage} / {totalPages || 1}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Showing</p>
                  <p className="text-3xl font-bold text-white">
                    {filteredApplications.length} / {applications.length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Search */}
          <Card className="mb-6">
            <div className="p-4">
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </Card>

          {/* Applications List */}
          <Card>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading applications...</p>
                  </div>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-och-steel text-lg mb-2">No pending applications found</p>
                  <p className="text-och-steel text-sm">
                    {debouncedSearch
                      ? 'Try adjusting your search criteria'
                      : 'All applications have been processed'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-och-steel/20">
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Created</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr
                            key={app.id}
                            className="border-b border-och-steel/10 hover:bg-och-midnight/50"
                          >
                            <td className="p-3">
                              <div>
                                <p className="text-white font-semibold">
                                  {app.first_name} {app.last_name}
                                </p>
                                <p className="text-xs text-och-steel">@{app.username}</p>
                              </div>
                            </td>
                            <td className="p-3 text-och-steel text-sm">{app.email}</td>
                            <td className="p-3 text-och-steel text-sm">
                              {new Date(app.created_at).toLocaleDateString()}
                              <br />
                              <span className="text-xs">
                                {new Date(app.created_at).toLocaleTimeString()}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge variant="orange">{app.account_status}</Badge>
                              {!app.email_verified && (
                                <Badge variant="steel" className="ml-2 text-xs">
                                  Email Not Verified
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="mint"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(app)
                                    setShowApproveModal(true)
                                  }}
                                  disabled={isProcessing === app.id}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(app)
                                    setShowRejectModal(true)
                                  }}
                                  disabled={isProcessing === app.id}
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-och-steel">
                        Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} applications
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1 || isLoading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Approve Modal */}
          {showApproveModal && selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md m-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Approve Application</h2>
                    <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                      ✕
                    </Button>
                  </div>

                  <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-sm text-och-steel mb-1">User</p>
                    <p className="text-white font-semibold">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                    <p className="text-sm text-och-steel">{selectedApplication.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Assign Role (Optional)
                      </label>
                      <select
                        value={approveAssignRole}
                        onChange={(e) => setApproveAssignRole(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      >
                        <option value="">No role assignment</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.display_name} - {role.description}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-och-steel mt-1">
                        Optionally assign a role when approving the application
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowApproveModal(false)
                          setSelectedApplication(null)
                          setApproveAssignRole('')
                        }}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="mint"
                        onClick={() => handleApprove(selectedApplication, approveAssignRole || undefined)}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                        glow
                      >
                        {isProcessing === selectedApplication.id
                          ? 'Approving...'
                          : 'Approve Application'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md m-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Reject Application</h2>
                    <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                      ✕
                    </Button>
                  </div>

                  <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-sm text-och-steel mb-1">User</p>
                    <p className="text-white font-semibold">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                    <p className="text-sm text-och-steel">{selectedApplication.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Rejection Reason (Optional)
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender min-h-[100px]"
                      />
                      <p className="text-xs text-och-steel mt-1">
                        This reason will be logged in the audit trail
                      </p>
                    </div>

                    <div className="p-4 bg-och-orange/10 border border-och-orange/20 rounded-lg">
                      <p className="text-sm text-och-orange">
                        ⚠️ Rejecting this application will deactivate the user's account.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectModal(false)
                          setSelectedApplication(null)
                          setRejectReason('')
                        }}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="orange"
                        onClick={() => handleReject(selectedApplication, rejectReason || undefined)}
                        className="flex-1"
                        disabled={isProcessing === selectedApplication.id}
                      >
                        {isProcessing === selectedApplication.id
                          ? 'Rejecting...'
                          : 'Reject Application'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}



