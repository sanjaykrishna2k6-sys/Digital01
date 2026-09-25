import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import * as userService from '../services/userService'

// Role display configurations
const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', badge: 'primary' },
  agency_admin: { label: 'Agency Admin', badge: 'info' },
  account_manager: { label: 'Account Manager', badge: 'warning' },
  team_member: { label: 'Team Member', badge: 'neutral' },
  client: { label: 'Client', badge: 'success' },
}

// Background avatars for user initials
const AVATAR_COLORS = [
  'bg-[#EEF2FF] text-[#4F46E5]',
  'bg-[#EFF6FF] text-[#2563EB]',
  'bg-[#F0FDF4] text-[#16A34A]',
  'bg-[#FFFBEB] text-[#D97706]',
  'bg-[#FAF5FF] text-[#9333EA]',
]

export function UsersPage() {
  const { user: currentUser } = useAuth()

  // State
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  // Selected user for edit/delete/status toggle
  const [selectedUser, setSelectedUser] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'team_member',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determine permissions
  const isSuperAdmin = currentUser?.role === 'super_admin'
  const isAgencyAdmin = currentUser?.role === 'agency_admin'
  const canManage = isSuperAdmin || isAgencyAdmin

  // Fetch users on mount
  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await userService.fetchUsers()
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(err.message || 'Failed to load organization users.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Auto-dismiss feedback messages
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedbackMessage])

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchTerm.trim() ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase().trim())

      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === 'active').length
    const inactive = users.filter((u) => u.status === 'inactive').length
    const admins = users.filter(
      (u) => u.role === 'super_admin' || u.role === 'agency_admin'
    ).length
    return { total, active, inactive, admins }
  }, [users])

  // Handlers for Add User
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'team_member',
    })
    setFormErrors({})
    setIsAddModalOpen(true)
  }

  const handleValidateForm = (isEdit = false) => {
    const errors = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long.'
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      errors.email = 'Please provide a valid email address.'
    }
    if (!isEdit) {
      if (!formData.password || formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long.'
      }
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'New password must be at least 8 characters long.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!handleValidateForm(false)) return

    setIsSubmitting(true)
    try {
      const newUser = await userService.createUser(formData)
      setUsers([newUser, ...users])
      setIsAddModalOpen(false)
      setFeedbackMessage({
        type: 'success',
        text: `User ${newUser.name} created successfully.`,
      })
    } catch (err) {
      setFormErrors((prev) => ({
        ...prev,
        general: err.message || 'Failed to create user.',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handlers for Edit User
  const handleOpenEditModal = (targetUser) => {
    setSelectedUser(targetUser)
    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: '', // Blank unless updating
      role: targetUser.role,
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    if (!handleValidateForm(true)) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
      }
      if (formData.password) {
        payload.password = formData.password
      }

      const updated = await userService.updateUser(selectedUser._id, payload)
      setUsers(users.map((u) => (u._id === updated._id ? updated : u)))
      setIsEditModalOpen(false)
      setFeedbackMessage({
        type: 'success',
        text: `User ${updated.name} updated successfully.`,
      })
    } catch (err) {
      setFormErrors((prev) => ({
        ...prev,
        general: err.message || 'Failed to update user.',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handlers for Status Toggle
  const handleOpenStatusModal = (targetUser) => {
    setSelectedUser(targetUser)
    setIsStatusModalOpen(true)
  }

  const handleConfirmStatusToggle = async () => {
    if (!selectedUser) return
    const nextStatus = selectedUser.status === 'active' ? 'inactive' : 'active'

    setIsSubmitting(true)
    try {
      const updated = await userService.updateUserStatus(
        selectedUser._id,
        nextStatus
      )
      setUsers(users.map((u) => (u._id === updated._id ? updated : u)))
      setIsStatusModalOpen(false)
      setFeedbackMessage({
        type: 'success',
        text: `User ${updated.name} is now ${nextStatus}.`,
      })
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to update user status.',
      })
      setIsStatusModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handlers for Delete User
  const handleOpenDeleteModal = (targetUser) => {
    setSelectedUser(targetUser)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      await userService.deleteUser(selectedUser._id)
      setUsers(users.filter((u) => u._id !== selectedUser._id))
      setIsDeleteModalOpen(false)
      setFeedbackMessage({
        type: 'success',
        text: `User ${selectedUser.name} deleted successfully.`,
      })
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to delete user.',
      })
      setIsDeleteModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-[10px] border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#16A34A]'
              : 'bg-[#FEF2F2] border-[#FEE2E2] text-[#DC2626]'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
              User Management
            </h1>
            <Badge variant="primary" className="font-semibold">
              {currentUser?.organization?.name || 'Scalevo Agency'}
            </Badge>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage agency team members, permissions, and organization account access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={RefreshCw}
            onClick={loadUsers}
            disabled={isLoading}
          >
            Refresh
          </Button>

          {canManage && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={UserPlus}
              onClick={handleOpenAddModal}
            >
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
              Total Users
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-1">
              {metrics.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
              Active Accounts
            </p>
            <p className="text-2xl font-bold text-[#16A34A] mt-1">
              {metrics.active}
            </p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
              Inactive Accounts
            </p>
            <p className="text-2xl font-bold text-[#6B7280] mt-1">
              {metrics.inactive}
            </p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#F3F4F6] flex items-center justify-center text-[#6B7280]">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
              Admin & Managers
            </p>
            <p className="text-2xl font-bold text-[#4F46E5] mt-1">
              {metrics.admins}
            </p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            isSearch={true}
            containerClassName="mb-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B7280]">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-white border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[#374151] font-medium outline-none focus:border-[#4F46E5] cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="agency_admin">Agency Admin</option>
              <option value="account_manager">Account Manager</option>
              <option value="team_member">Team Member</option>
              <option value="client">Client</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B7280]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[#374151] font-medium outline-none focus:border-[#4F46E5] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('all')
                setStatusFilter('all')
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-12">
          <Loading
            title="Loading Users..."
            description="Fetching organization user directory"
          />
        </div>
      ) : error ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-8">
          <ErrorState
            title="Unable to load users"
            description={error}
            onRetry={loadUsers}
          />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-8">
          <EmptyState
            icon={Users}
            title={
              searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'No matching users found'
                : 'No users in organization'
            }
            description={
              searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Get started by inviting or creating your first agency team member.'
            }
            actionLabel={canManage ? 'Add User' : undefined}
            onAction={canManage ? handleOpenAddModal : undefined}
          />
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => {
                  const roleCfg = ROLE_CONFIG[u.role] || {
                    label: u.role,
                    badge: 'neutral',
                  }
                  const initials = u.name
                    ? u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'U'
                  const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                  const isCurrentTargetSuperAdmin = u.role === 'super_admin'
                  const isSelf = u._id === currentUser?._id
                  const canEditThisUser =
                    canManage && (!isCurrentTargetSuperAdmin || isSuperAdmin)
                  const canDeactivateThisUser =
                    canManage && !isCurrentTargetSuperAdmin && !isSelf
                  const canDeleteThisUser =
                    canManage && !isCurrentTargetSuperAdmin && !isSelf

                  return (
                    <tr key={u._id} className="transition-colors">
                      {/* Name & Avatar */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${colorClass}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#111827]">
                                {u.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] bg-[#EEF2FF] text-[#4F46E5] font-bold px-1.5 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[#9CA3AF] block sm:hidden">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="text-xs text-[#4B5563] font-mono">
                        {u.email}
                      </td>

                      {/* Role Badge */}
                      <td>
                        <Badge variant={roleCfg.badge} className="font-medium">
                          {roleCfg.label}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td>
                        <Badge
                          variant={u.status === 'active' ? 'success' : 'neutral'}
                          withDot={true}
                        >
                          <span className="capitalize">{u.status}</span>
                        </Badge>
                      </td>

                      {/* Created Date */}
                      <td className="text-xs text-[#6B7280] whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEditThisUser ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(u)}
                              title="Edit user"
                              className="px-2 py-1 h-8 text-[#4F46E5]"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              <span>Edit</span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title={
                                isCurrentTargetSuperAdmin
                                  ? 'Super Admin cannot be modified'
                                  : 'Read-only access'
                              }
                              className="px-2 py-1 h-8 opacity-40"
                            >
                              <Lock className="w-3.5 h-3.5 mr-1" />
                              <span>Locked</span>
                            </Button>
                          )}

                          {canDeactivateThisUser && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenStatusModal(u)}
                              title={
                                u.status === 'active'
                                  ? 'Deactivate account'
                                  : 'Activate account'
                              }
                              className={`px-2 py-1 h-8 text-xs font-semibold ${
                                u.status === 'active'
                                  ? 'hover:text-[#DC2626]'
                                  : 'hover:text-[#16A34A]'
                              }`}
                            >
                              {u.status === 'active'
                                ? 'Deactivate'
                                : 'Activate'}
                            </Button>
                          )}

                          {canDeleteThisUser && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(u)}
                              title="Delete user"
                              className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[6px] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Add New User"
        description="Create and assign a new team member to your agency organization."
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreateUser}
            >
              Create User
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[8px] text-xs text-[#DC2626] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            error={formErrors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rahul@scalevo.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={formErrors.email}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={formErrors.password}
            helperText="Minimum 8 characters. Hashed securely with bcrypt."
            required
          />

          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">
              User Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2.5 outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15"
            >
              {isSuperAdmin && (
                <option value="super_admin">Super Admin (Universal Access)</option>
              )}
              <option value="agency_admin">
                Agency Admin (Organization Management)
              </option>
              <option value="account_manager">
                Account Manager (Client Operations)
              </option>
              <option value="team_member">
                Team Member (SEO / Content / Design)
              </option>
              <option value="client">Client (Restricted Portal Access)</option>
            </select>
            <p className="text-[11px] text-[#9CA3AF] mt-1">
              Role determines permissions and platform visibility.
            </p>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit User Details"
        description="Update profile information and role permissions."
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleUpdateUser}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[8px] text-xs text-[#DC2626] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            error={formErrors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rahul@scalevo.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={formErrors.email}
            required
          />

          <Input
            label="Reset Password (Optional)"
            type="password"
            placeholder="Leave empty to keep existing password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={formErrors.password}
            helperText="Only fill if you want to reset this user's password."
          />

          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              disabled={selectedUser?.role === 'super_admin'}
              className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2.5 outline-none focus:border-[#4F46E5] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
            >
              {selectedUser?.role === 'super_admin' && (
                <option value="super_admin">Super Admin</option>
              )}
              {isSuperAdmin && selectedUser?.role !== 'super_admin' && (
                <option value="super_admin">Super Admin</option>
              )}
              <option value="agency_admin">Agency Admin</option>
              <option value="account_manager">Account Manager</option>
              <option value="team_member">Team Member</option>
              <option value="client">Client</option>
            </select>
            {selectedUser?.role === 'super_admin' && (
              <p className="text-[11px] text-[#D97706] mt-1">
                The Super Admin role cannot be demoted or changed.
              </p>
            )}
          </div>
        </form>
      </Modal>

      {/* Status Toggle Confirmation Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => !isSubmitting && setIsStatusModalOpen(false)}
        title={
          selectedUser?.status === 'active'
            ? 'Deactivate User Account'
            : 'Activate User Account'
        }
        description={
          selectedUser?.status === 'active'
            ? `Deactivating ${selectedUser?.name} will immediately prevent them from logging in to the platform.`
            : `Activating ${selectedUser?.name} will restore their login access.`
        }
        maxWidth="max-w-sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedUser?.status === 'active' ? 'danger' : 'primary'
              }
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmStatusToggle}
            >
              {selectedUser?.status === 'active'
                ? 'Yes, Deactivate'
                : 'Yes, Activate'}
            </Button>
          </>
        }
      >
        <div className="py-2 text-xs text-[#6B7280]">
          {selectedUser?.status === 'active' ? (
            <p>
              Are you sure you want to deactivate{' '}
              <strong className="text-[#111827]">{selectedUser?.email}</strong>?
              They will not be able to log in until reactivated.
            </p>
          ) : (
            <p>
              Restore full platform access for{' '}
              <strong className="text-[#111827]">{selectedUser?.email}</strong>?
            </p>
          )}
        </div>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title="Delete User Permanently"
        description="This action cannot be undone. All access will be revoked immediately."
        maxWidth="max-w-sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmDelete}
            >
              Delete User
            </Button>
          </>
        }
      >
        <div className="py-2 text-xs text-[#6B7280] space-y-2">
          <p>
            Are you sure you want to permanently delete{' '}
            <strong className="text-[#111827]">{selectedUser?.name}</strong> (
            {selectedUser?.email})?
          </p>
          <div className="p-2.5 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[6px] text-[#DC2626] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>This user will be permanently removed from the workspace.</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
