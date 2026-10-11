import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Building2,
  Briefcase,
  Calendar,
  Eye,
  Check,
  Power,
  RotateCcw,
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
import * as clientService from '../services/clientService'
import * as userService from '../services/userService'
import { formatDate } from '../utils/formatters'

const AVAILABLE_SERVICES = [
  'SEO Optimization',
  'Paid Search (PPC)',
  'Meta & Social Ads',
  'Content Marketing',
  'Email Marketing',
  'Social Media Management',
  'Web Development',
  'Brand Strategy',
  'Conversion Rate Optimization',
]

const INDUSTRIES = [
  'E-commerce & Retail',
  'Technology & SaaS',
  'Healthcare & Wellness',
  'Real Estate',
  'Financial Services',
  'Education',
  'Hospitality & Travel',
  'Automotive',
  'B2B Services',
  'Other',
]

const AVATAR_COLORS = [
  'bg-[#EEF2FF] text-[#4F46E5]',
  'bg-[#EFF6FF] text-[#2563EB]',
  'bg-[#F0FDF4] text-[#16A34A]',
  'bg-[#FFFBEB] text-[#D97706]',
  'bg-[#FAF5FF] text-[#9333EA]',
]

export function ClientsPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // State
  const [clients, setClients] = useState([])
  const [metrics, setMetrics] = useState({ total: 0, active: 0, inactive: 0, newLast30Days: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 })
  const [teamUsers, setTeamUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [accountManagerFilter, setAccountManagerFilter] = useState('all')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  // Form states
  const initialFormData = {
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    industry: 'Technology & SaaS',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
    },
    services: [],
    notes: '',
    assignedAccountManager: '',
    status: 'active',
  }

  const [formData, setFormData] = useState(initialFormData)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // RBAC Permission checks
  const isSuperAdmin = currentUser?.role === 'super_admin'
  const isAgencyAdmin = currentUser?.role === 'agency_admin'
  const isAccountManager = currentUser?.role === 'account_manager'
  const canCreate = isSuperAdmin || isAgencyAdmin || isAccountManager
  const canEdit = isSuperAdmin || isAgencyAdmin || isAccountManager
  const canChangeStatus = isSuperAdmin || isAgencyAdmin || isAccountManager
  const canDelete = isSuperAdmin || isAgencyAdmin // Account managers CANNOT delete clients

  // Load team users for account manager assignments
  useEffect(() => {
    async function loadTeam() {
      try {
        const users = await userService.fetchUsers()
        setTeamUsers(users.filter((u) => u.status === 'active' && u.role !== 'client'))
      } catch (err) {
        console.error('Failed to load team users for client management:', err)
      }
    }
    loadTeam()
  }, [])

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Load Clients
  const loadClients = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await clientService.getClients({
        page,
        limit: 15,
        search,
        status: statusFilter,
        industry: industryFilter,
        assignedAccountManager: accountManagerFilter,
      })
      setClients(result.data?.clients || [])
      setMetrics(result.data?.metrics || { total: 0, active: 0, inactive: 0, newLast30Days: 0 })
      setPagination(result.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 })
    } catch (err) {
      setError(err.message || 'Failed to retrieve clients.')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, industryFilter, accountManagerFilter])

  // Fetch on filter or search change
  useEffect(() => {
    const handler = setTimeout(() => {
      loadClients(1)
    }, 250)
    return () => clearTimeout(handler)
  }, [loadClients])

  // Form Validation
  const validateForm = () => {
    const errs = {}
    if (!formData.companyName.trim()) {
      errs.companyName = 'Company name is required.'
    } else if (formData.companyName.trim().length < 2) {
      errs.companyName = 'Company name must be at least 2 characters.'
    }

    if (!formData.contactName.trim()) {
      errs.contactName = 'Contact person name is required.'
    } else if (formData.contactName.trim().length < 2) {
      errs.contactName = 'Contact name must be at least 2 characters.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.'
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address.'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Handle Add Client Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await clientService.createClient({
        ...formData,
        assignedAccountManager: formData.assignedAccountManager || null,
      })
      setIsAddModalOpen(false)
      setFormData(initialFormData)
      setFeedback({ type: 'success', message: 'Client created successfully.' })
      loadClients(1)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create client.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (client) => {
    setSelectedClient(client)
    setFormData({
      companyName: client.companyName || '',
      contactName: client.contactName || '',
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      industry: client.industry || 'Technology & SaaS',
      address: {
        street: client.address?.street || '',
        city: client.address?.city || '',
        state: client.address?.state || '',
        country: client.address?.country || 'India',
        postalCode: client.address?.postalCode || '',
      },
      services: client.services || [],
      notes: client.notes || '',
      assignedAccountManager: client.assignedAccountManager?._id || client.assignedAccountManager || '',
      status: client.status || 'active',
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  // Handle Edit Client Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm() || !selectedClient) return

    setIsSubmitting(true)
    try {
      await clientService.updateClient(selectedClient._id, {
        companyName: formData.companyName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        industry: formData.industry,
        address: formData.address,
        services: formData.services,
        notes: formData.notes,
        assignedAccountManager: formData.assignedAccountManager || null,
        status: formData.status,
      })
      setIsEditModalOpen(false)
      setSelectedClient(null)
      setFeedback({ type: 'success', message: 'Client details updated successfully.' })
      loadClients(pagination.page)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update client.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle Client Status
  const handleStatusToggle = async () => {
    if (!selectedClient) return
    setIsSubmitting(true)
    const newStatus = selectedClient.status === 'active' ? 'inactive' : 'active'
    try {
      await clientService.updateClientStatus(selectedClient._id, newStatus)
      setIsStatusModalOpen(false)
      setSelectedClient(null)
      setFeedback({ type: 'success', message: `Client status updated to ${newStatus}.` })
      loadClients(pagination.page)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle client status.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete Client
  const handleDeleteSubmit = async () => {
    if (!selectedClient) return
    setIsSubmitting(true)
    try {
      await clientService.deleteClient(selectedClient._id)
      setIsDeleteModalOpen(false)
      setSelectedClient(null)
      setFeedback({ type: 'success', message: 'Client deleted successfully.' })
      loadClients(1)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete client.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleService = (service) => {
    setFormData((prev) => {
      const exists = prev.services.includes(service)
      return {
        ...prev,
        services: exists ? prev.services.filter((s) => s !== service) : [...prev.services, service],
      }
    })
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            Clients
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your agency clients, contractual services, and assigned relationships.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="md"
            leftIcon={UserPlus}
            onClick={() => {
              setFormData(initialFormData)
              setFormErrors({})
              setIsAddModalOpen(true)
            }}
          >
            Add Client
          </Button>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Clients</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{metrics.total}</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Clients</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">{metrics.active}</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive</p>
            <h3 className="text-2xl font-bold text-slate-700 mt-0.5">{metrics.inactive}</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New (Last 30d)</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-0.5">{metrics.newLast30Days}</h3>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, contact, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Clients</option>
              <option value="inactive">Inactive Clients</option>
            </select>
          </div>

          {/* Industry filter */}
          <div>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            >
              <option value="all">All Industries</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Account Manager filter */}
          <div>
            <select
              value={accountManagerFilter}
              onChange={(e) => setAccountManagerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            >
              <option value="all">All Account Managers</option>
              {teamUsers.map((mgr) => (
                <option key={mgr._id} value={mgr._id}>
                  {mgr.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Main Client Table / Content */}
      {isLoading ? (
        <Loading title="Loading agency clients..." />
      ) : error ? (
        <ErrorState
          title="Could not load clients"
          description={error}
          onRetry={() => loadClients(pagination.page)}
        />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No clients found"
          description={
            search || statusFilter !== 'all' || industryFilter !== 'all' || accountManagerFilter !== 'all'
              ? 'No clients match your filter criteria. Try clearing search filters.'
              : 'Start by registering your first client in your agency workspace.'
          }
          actionLabel={canCreate ? 'Add Client' : undefined}
          onAction={
            canCreate
              ? () => {
                  setFormData(initialFormData)
                  setIsAddModalOpen(true)
                }
              : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Industry</th>
                  <th className="py-3.5 px-4">Account Manager</th>
                  <th className="py-3.5 px-4">Services</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {clients.map((client, idx) => {
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                  const initial = client.companyName ? client.companyName[0].toUpperCase() : 'C'

                  return (
                    <tr key={client._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Company */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor}`}
                          >
                            {initial}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => navigate(`/clients/${client._id}`)}
                              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-left"
                            >
                              {client.companyName}
                            </button>
                            {client.website && (
                              <a
                                href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-500 mt-0.5"
                              >
                                <Globe className="w-3 h-3" />
                                {client.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{client.contactName}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {client.email}
                        </p>
                      </td>

                      {/* Industry */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {client.industry || 'General'}
                        </span>
                      </td>

                      {/* Account Manager */}
                      <td className="py-3 px-4">
                        {client.assignedAccountManager ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {client.assignedAccountManager.name ? client.assignedAccountManager.name[0] : 'U'}
                            </div>
                            <span className="text-slate-800 font-medium">{client.assignedAccountManager.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Services */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {client.services?.length > 0 ? (
                            <>
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-medium">
                                {client.services[0]}
                              </span>
                              {client.services.length > 1 && (
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                  +{client.services.length - 1}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">None</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={client.status === 'active' ? 'success' : 'neutral'}
                          withDot
                        >
                          {client.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Created */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDate(client.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/clients/${client._id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View Client Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(client)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit Client"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canChangeStatus && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClient(client)
                                setIsStatusModalOpen(true)
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                client.status === 'active'
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={client.status === 'active' ? 'Deactivate Client' : 'Activate Client'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClient(client)
                                setIsDeleteModalOpen(true)
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Client"
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

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <span>
                Showing <strong>{clients.length}</strong> of <strong>{pagination.total}</strong> clients
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadClients(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="font-semibold text-slate-800">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadClients(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ADD CLIENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Client"
        description="Register a new client company and assign agency account ownership."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAddSubmit}
              isLoading={isSubmitting}
            >
              Create Client
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              placeholder="e.g. Zenith Media Tech"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              error={formErrors.companyName}
              required
            />
            <Input
              label="Contact Person Name *"
              placeholder="e.g. Maya Sharma"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              error={formErrors.contactName}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client Email *"
              type="email"
              placeholder="e.g. contact@zenith.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Website"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Account Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Account Manager
            </label>
            <select
              value={formData.assignedAccountManager}
              onChange={(e) => setFormData({ ...formData, assignedAccountManager: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Unassigned</option>
              {teamUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Address Fields */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-700 mb-2">Billing & Office Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="sm:col-span-2">
                <Input
                  label="Street Address"
                  placeholder="Suite 400, MG Road"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                />
              </div>
              <Input
                label="City"
                placeholder="Bengaluru"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="State"
                placeholder="Karnataka"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
              />
              <Input
                label="Country"
                placeholder="India"
                value={formData.address.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, country: e.target.value },
                  })
                }
              />
              <Input
                label="Postal Code"
                placeholder="560001"
                value={formData.address.postalCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, postalCode: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Services Checklist */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-700 mb-2">Agency Services Provided</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_SERVICES.map((srv) => {
                const checked = formData.services.includes(srv)
                return (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => toggleService(srv)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
                      checked
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                        checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {checked && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className="truncate">{srv}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Client Notes
            </label>
            <textarea
              rows={3}
              placeholder="Notes on client expectations, billing cycles, key stakeholders..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* EDIT CLIENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client"
        description="Update profile, industry, assigned manager, or service packages."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleEditSubmit}
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              error={formErrors.companyName}
              required
            />
            <Input
              label="Contact Person Name *"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              error={formErrors.contactName}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Account Manager
              </label>
              <select
                value={formData.assignedAccountManager}
                onChange={(e) => setFormData({ ...formData, assignedAccountManager: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {teamUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address Fields */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-700 mb-2">Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="sm:col-span-2">
                <Input
                  label="Street Address"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                />
              </div>
              <Input
                label="City"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="State"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
              />
              <Input
                label="Country"
                value={formData.address.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, country: e.target.value },
                  })
                }
              />
              <Input
                label="Postal Code"
                value={formData.address.postalCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, postalCode: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Services Checklist */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-700 mb-2">Agency Services</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_SERVICES.map((srv) => {
                const checked = formData.services.includes(srv)
                return (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => toggleService(srv)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
                      checked
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                        checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {checked && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className="truncate">{srv}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Client Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* TOGGLE STATUS CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={selectedClient?.status === 'active' ? 'Deactivate Client' : 'Activate Client'}
        description={`Are you sure you want to change the status for ${selectedClient?.companyName}?`}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={selectedClient?.status === 'active' ? 'warning' : 'primary'}
              size="md"
              onClick={handleStatusToggle}
              isLoading={isSubmitting}
            >
              {selectedClient?.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          {selectedClient?.status === 'active'
            ? 'Deactivating this client marks their agency account as paused. Existing campaigns and data remain preserved.'
            : 'Activating this client restores full visibility and campaign execution permissions.'}
        </p>
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE CLIENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Client"
        description="Are you sure you want to delete this client?"
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDeleteSubmit}
              isLoading={isSubmitting}
            >
              Delete Client
            </Button>
          </>
        }
      >
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800">
          <p className="font-semibold">Warning: This action is permanent.</p>
          <p className="mt-1">
            Deleting <strong>{selectedClient?.companyName}</strong> removes their client profile from this agency workspace.
          </p>
        </div>
      </Modal>
    </div>
  )
}
