import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Briefcase,
  UserSquare2,
  FolderOpen,
  Megaphone,
  CheckSquare,
  Activity,
  Layers,
  Edit2,
  Power,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  UserCheck,
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

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'services', label: 'Services', icon: Layers },
  { id: 'activity', label: 'Activity', icon: Activity },
]

export function ClientDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [client, setClient] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [teamUsers, setTeamUsers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Edit form state
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    services: [],
    notes: '',
    assignedAccountManager: '',
  })

  // Permission checks
  const canEdit = currentUser && ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser.role)
  const canDelete = currentUser && ['super_admin', 'agency_admin'].includes(currentUser.role)

  const fetchClientDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await clientService.getClient(id)
      setClient(data)
      try {
        const wsData = await clientService.getClientWorkspace(id)
        setWorkspace(wsData)
      } catch (wsErr) {
        console.warn('Workspace intelligence data optional load:', wsErr.message)
      }
    } catch (err) {
      setError(err.message || 'Failed to load client details.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamUsers = async () => {
    try {
      const res = await userService.getUsers()
      const usersList = Array.isArray(res) ? res : (res.users || res.data || [])
      setTeamUsers(usersList.filter((u) => u.role !== 'client'))
    } catch (err) {
      console.warn('Could not fetch team users for manager assignment:', err.message)
    }
  }

  useEffect(() => {
    fetchClientDetails()
    fetchTeamUsers()
  }, [id])

  const openEditModal = () => {
    if (!client) return
    setFormData({
      companyName: client.companyName || '',
      contactName: client.contactName || '',
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      industry: client.industry || '',
      street: client.address?.street || '',
      city: client.address?.city || '',
      state: client.address?.state || '',
      country: client.address?.country || '',
      postalCode: client.address?.postalCode || '',
      services: client.services || [],
      notes: client.notes || '',
      assignedAccountManager: client.assignedAccountManager?._id || client.assignedAccountManager || '',
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormErrors({})

    try {
      const payload = {
        companyName: formData.companyName.trim(),
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim(),
        industry: formData.industry,
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          postalCode: formData.postalCode.trim(),
        },
        services: formData.services,
        notes: formData.notes.trim(),
        assignedAccountManager: formData.assignedAccountManager || null,
      }

      const updated = await clientService.updateClient(id, payload)
      setClient(updated)
      setIsEditModalOpen(false)
      setFeedback({ type: 'success', message: 'Client details updated successfully.' })
      setTimeout(() => setFeedback(null), 4000)
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to update client details.' })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!client) return
    const newStatus = client.status === 'active' ? 'inactive' : 'active'
    setFormSubmitting(true)
    try {
      const updated = await clientService.updateClientStatus(id, newStatus)
      setClient(updated)
      setIsStatusModalOpen(false)
      setFeedback({
        type: 'success',
        message: `Client has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      })
      setTimeout(() => setFeedback(null), 4000)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!client) return
    setFormSubmitting(true)
    try {
      await clientService.deleteClient(id)
      setIsDeleteModalOpen(false)
      navigate('/clients', {
        state: { feedback: { type: 'success', message: `Client "${client.companyName}" was deleted.` } },
      })
    } catch (err) {
      setFormErrors({ delete: err.message || 'Failed to delete client.' })
    } finally {
      setFormSubmitting(false)
    }
  }

  const toggleService = (srv) => {
    setFormData((prev) => {
      const exists = prev.services.includes(srv)
      return {
        ...prev,
        services: exists ? prev.services.filter((s) => s !== srv) : [...prev.services, srv],
      }
    })
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <Loading size="lg" message="Loading client details..." />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link
          to="/clients"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <ErrorState
          title="Client Not Found"
          message={error || 'The requested client record does not exist or you do not have permission to view it.'}
          onRetry={fetchClientDetails}
        />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/clients"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7280] hover:text-[#4F46E5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
      </div>

      {/* Global feedback message */}
      {feedback && (
        <div
          className={`p-4 rounded-[10px] text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
              : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Client Header Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Company & Core Details */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-[12px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-xl uppercase shadow-xs shrink-0">
              {client.companyName?.slice(0, 2) || 'CL'}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-[#111827] tracking-tight">{client.companyName}</h1>
                <Badge variant={client.status === 'active' ? 'success' : 'default'} dot>
                  {client.status === 'active' ? 'Active Client' : 'Inactive Client'}
                </Badge>
                {client.industry && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563]">
                    {client.industry}
                  </span>
                )}
              </div>

              {/* Meta items */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <UserSquare2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span className="font-medium text-[#374151]">{client.contactName}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <a
                    href={`mailto:${client.email}`}
                    className="hover:text-[#4F46E5] hover:underline transition-colors"
                  >
                    {client.email}
                  </a>
                </div>

                {client.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <a href={`tel:${client.phone}`} className="hover:text-[#4F46E5] transition-colors">
                      {client.phone}
                    </a>
                  </div>
                )}

                {client.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <a
                      href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-[#4F46E5] hover:underline"
                    >
                      <span>{client.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStatusModalOpen(true)}
                  className="gap-1.5"
                >
                  <Power className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>{client.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={openEditModal}
                  className="gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Client</span>
                </Button>
              </>
            )}

            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="gap-1.5 text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#FCA5A5]"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Delete</span>
              </Button>
            )}
          {/* Data Freshness & Pending Actions Banner */}
      {workspace?.pendingActions && workspace.pendingActions.length > 0 && (
        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-[12px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#FFEDD5] flex items-center justify-center text-[#EA580C] shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#9A3412]">
                {workspace.pendingActions.length} Pending Action{workspace.pendingActions.length > 1 ? 's' : ''} Require Attention
              </h3>
              <p className="text-xs text-[#C2410C] mt-0.5">
                {workspace.pendingActions.map(a => a.title).join(' • ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {workspace.dataFreshness?.shopifyLastSynced && (
              <span className="text-[11px] font-medium text-[#6B7280] bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-md">
                Sync Freshness: {new Date(workspace.dataFreshness.shopifyLastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>

      {/* Tabs navigation */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#4F46E5] text-[#4F46E5]'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Details (Left 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact & Company Details */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#F3F4F6] pb-3">
                  <Building2 className="w-4 h-4 text-[#4F46E5]" />
                  Contact & Organization Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <span className="block text-[#9CA3AF] font-medium mb-1">Company Legal Name</span>
                    <span className="font-semibold text-[#111827]">{client.companyName}</span>
                  </div>

                  <div>
                    <span className="block text-[#9CA3AF] font-medium mb-1">Primary Contact Name</span>
                    <span className="font-semibold text-[#111827]">{client.contactName}</span>
                  </div>

                  <div>
                    <span className="block text-[#9CA3AF] font-medium mb-1">Email Address</span>
                    <a href={`mailto:${client.email}`} className="text-[#4F46E5] font-medium hover:underline">
                      {client.email}
                    </a>
                  </div>

                  <div>
                    <span className="block text-[#9CA3AF] font-medium mb-1">Phone Number</span>
                    <span className="text-[#374151] font-medium">{client.phone || '—'}</span>
                  </div>

                  <div>
                    <span className="block text-[#9CA3AF] font-medium mb-1">Website URL</span>
                    {client.website ? (
                      <a
                        href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#4F46E5] font-medium inline-flex items-center gap-1 hover:underline"
                      >
                        {client.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[#9CA3AF]">—</span>
                    )}
                  </div>

                  <div>
                    <span className="block text-[#9CA3AF] font-medium mb-1">Industry Sector</span>
                    <span className="text-[#374151] font-medium">{client.industry || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#F3F4F6] pb-3">
                  <MapPin className="w-4 h-4 text-[#4F46E5]" />
                  Billing & Office Address
                </h3>

                {client.address && (client.address.street || client.address.city || client.address.country) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-[#9CA3AF] font-medium mb-1">Street Address</span>
                      <span className="text-[#374151] font-medium">{client.address.street || '—'}</span>
                    </div>

                    <div>
                      <span className="block text-[#9CA3AF] font-medium mb-1">City</span>
                      <span className="text-[#374151] font-medium">{client.address.city || '—'}</span>
                    </div>

                    <div>
                      <span className="block text-[#9CA3AF] font-medium mb-1">State / Province</span>
                      <span className="text-[#374151] font-medium">{client.address.state || '—'}</span>
                    </div>

                    <div>
                      <span className="block text-[#9CA3AF] font-medium mb-1">Country</span>
                      <span className="text-[#374151] font-medium">{client.address.country || '—'}</span>
                    </div>

                    <div>
                      <span className="block text-[#9CA3AF] font-medium mb-1">Postal Code</span>
                      <span className="text-[#374151] font-medium">{client.address.postalCode || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#9CA3AF] italic">No physical address on file for this client.</p>
                )}
              </div>

              {/* Internal Notes */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#F3F4F6] pb-3">
                  <FileText className="w-4 h-4 text-[#4F46E5]" />
                  Internal Notes & Relationship Context
                </h3>
                {client.notes ? (
                  <div className="p-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-[8px] text-xs text-[#374151] whitespace-pre-wrap leading-relaxed">
                    {client.notes}
                  </div>
                ) : (
                  <p className="text-xs text-[#9CA3AF] italic">No internal notes added yet.</p>
                )}
              </div>
            </div>

            {/* Account & Services Sidebar (Right 1 col) */}
            <div className="space-y-6">
              {/* Account Manager Card */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#F3F4F6] pb-3">
                  <UserCheck className="w-4 h-4 text-[#4F46E5]" />
                  Assigned Account Manager
                </h3>

                {client.assignedAccountManager ? (
                  <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-[10px] border border-[#F3F4F6]">
                    <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs shrink-0">
                      {client.assignedAccountManager.firstName?.[0] || 'A'}
                      {client.assignedAccountManager.lastName?.[0] || 'M'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] truncate">
                        {client.assignedAccountManager.firstName} {client.assignedAccountManager.lastName}
                      </p>
                      <p className="text-[11px] text-[#6B7280] truncate">{client.assignedAccountManager.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-semibold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded">
                        {client.assignedAccountManager.role?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-[#F9FAFB] rounded-[10px] border border-dashed border-[#E5E7EB]">
                    <p className="text-xs text-[#9CA3AF] mb-2">No account manager currently assigned.</p>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={openEditModal} className="text-xs">
                        Assign Manager
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Subscribed Services Card */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#F3F4F6] pb-3">
                  <Layers className="w-4 h-4 text-[#4F46E5]" />
                  Active Agency Services ({client.services?.length || 0})
                </h3>

                {client.services && client.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {client.services.map((service) => (
                      <span
                        key={service}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#4F46E5]" />
                        {service}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#9CA3AF] italic">No services currently selected.</p>
                )}
              </div>

              {/* Account Timestamps */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm space-y-3 text-xs">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#F3F4F6] pb-3">
                  <Clock className="w-4 h-4 text-[#4F46E5]" />
                  Metadata
                </h3>

                <div className="flex justify-between py-1 text-[#6B7280]">
                  <span>Client Created</span>
                  <span className="font-medium text-[#111827]">{formatDate(client.createdAt)}</span>
                </div>

                <div className="flex justify-between py-1 text-[#6B7280]">
                  <span>Last Updated</span>
                  <span className="font-medium text-[#111827]">{formatDate(client.updatedAt)}</span>
                </div>

                {client.createdBy && (
                  <div className="flex justify-between py-1 text-[#6B7280]">
                    <span>Created By</span>
                    <span className="font-medium text-[#111827]">
                      {client.createdBy.firstName
                        ? `${client.createdBy.firstName} ${client.createdBy.lastName || ''}`
                        : 'System Admin'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <EmptyState
            icon={FolderOpen}
            title="No Projects Connected Yet"
            description="Projects and deliverables for this client will be connected once the Project Management module is enabled."
            className="my-12 py-12"
          />
        )}

        {/* CAMPAIGNS TAB */}
        {activeTab === 'campaigns' && (
          <EmptyState
            icon={Megaphone}
            title="No Active Campaigns"
            description="Ad campaigns and multi-channel marketing initiatives for this client will be connected in the Campaign Management module."
            className="my-12 py-12"
          />
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <EmptyState
            icon={CheckSquare}
            title="No Tasks Assigned"
            description="Workflow tasks, sprint items, and creative requests for this client will appear here once the Task Management module is connected."
            className="my-12 py-12"
          />
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Contracted Agency Services</h3>
                <p className="text-xs text-[#6B7280]">Review all services included in the engagement package for {client.companyName}.</p>
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={openEditModal} className="gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  Manage Services
                </Button>
              )}
            </div>

            {client.services && client.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {client.services.map((service) => (
                  <div
                    key={service}
                    className="p-5 bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm flex items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-[8px] bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] mb-2">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-[#111827]">{service}</h4>
                      <p className="text-xs text-[#6B7280]">Managed campaign engagement service</p>
                    </div>
                    <Badge variant="success" dot>
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Layers}
                title="No Services Assigned"
                description="Assign marketing services to this client to track agency scope and deliverable allocation."
                actionLabel={canEdit ? 'Assign Services' : undefined}
                onAction={canEdit ? openEditModal : undefined}
                className="my-12 py-12"
              />
            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <EmptyState
            icon={Activity}
            title="No Activity Logged"
            description="Client timeline, team communications, and historical relationship events will be recorded here once the Activity module is connected."
            className="my-12 py-12"
          />
        )}
      </div>

      {/* EDIT CLIENT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client Information"
        description="Update company contacts, address, assigned account manager, and services."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={formSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-5 text-xs">
          {formErrors.submit && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[8px] text-[#DC2626] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.submit}</span>
            </div>
          )}

          {/* Company & Contact Primary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Acme Corporation"
              required
            />
            <Input
              label="Contact Person Name *"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@acme.com"
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://acme.com"
            />
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full text-xs rounded-[8px] border border-[#D1D5DB] px-3 py-2 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address Section */}
          <div className="pt-2 border-t border-[#F3F4F6]">
            <h4 className="font-bold text-[#111827] mb-3">Office Address</h4>
            <div className="space-y-3">
              <Input
                label="Street Address"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="123 Innovation Way"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                />
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                />
                <Input
                  label="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="USA"
                />
                <Input
                  label="Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          {/* Account Manager Assignment */}
          <div className="pt-2 border-t border-[#F3F4F6]">
            <label className="block text-xs font-semibold text-[#374151] mb-1">Assigned Account Manager</label>
            <select
              value={formData.assignedAccountManager}
              onChange={(e) => setFormData({ ...formData, assignedAccountManager: e.target.value })}
              className="w-full text-xs rounded-[8px] border border-[#D1D5DB] px-3 py-2 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            >
              <option value="">No manager assigned</option>
              {teamUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName} {u.lastName} ({u.role?.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Services Checklist */}
          <div className="pt-2 border-t border-[#F3F4F6]">
            <label className="block text-xs font-semibold text-[#374151] mb-2">Agency Services Provided</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-[#F9FAFB] rounded-[8px] border border-[#F3F4F6]">
              {AVAILABLE_SERVICES.map((srv) => (
                <label key={srv} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                  <input
                    type="checkbox"
                    checked={formData.services.includes(srv)}
                    onChange={() => toggleService(srv)}
                    className="rounded border-[#D1D5DB] text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <span className="text-xs text-[#374151]">{srv}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-[#F3F4F6]">
            <label className="block text-xs font-semibold text-[#374151] mb-1">Internal Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add internal background, contract terms, or account preferences..."
              className="w-full text-xs rounded-[8px] border border-[#D1D5DB] p-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>
        </form>
      </Modal>

      {/* TOGGLE STATUS MODAL */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={client.status === 'active' ? 'Deactivate Client' : 'Activate Client'}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} disabled={formSubmitting}>
              Cancel
            </Button>
            <Button
              variant={client.status === 'active' ? 'danger' : 'primary'}
              onClick={handleToggleStatus}
              disabled={formSubmitting}
            >
              {formSubmitting
                ? 'Updating...'
                : client.status === 'active'
                ? 'Deactivate Client'
                : 'Activate Client'}
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#4B5563] leading-relaxed">
          {client.status === 'active'
            ? `Are you sure you want to deactivate "${client.companyName}"? While inactive, the client remains archived in the system and active campaign reporting may be paused.`
            : `Are you sure you want to activate "${client.companyName}"? This client will be marked as active in all campaign and reporting views.`}
        </p>
      </Modal>

      {/* DELETE CLIENT MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Client Record"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={formSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteClient} disabled={formSubmitting}>
              {formSubmitting ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {formErrors.delete && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[8px] text-[#DC2626] font-medium text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.delete}</span>
            </div>
          )}
          <p className="text-xs text-[#4B5563] leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-[#111827]">{client.companyName}</strong>? This action cannot be undone and will
            remove all associated records for this organization.
          </p>
        </div>
      </Modal>
    </div>
  )
}
