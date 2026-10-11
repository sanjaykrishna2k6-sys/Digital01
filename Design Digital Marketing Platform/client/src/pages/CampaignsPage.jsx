import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Check,
  RefreshCw,
  Target,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import * as campaignService from '../services/campaignService'
import * as clientService from '../services/clientService'
import * as userService from '../services/userService'
import { formatDate } from '../utils/formatters'

export const CAMPAIGN_TYPES = [
  'SEO',
  'Social Media',
  'Google Ads',
  'Meta Ads',
  'Email Marketing',
  'Content Marketing',
  'Influencer Marketing',
  'Shopify Marketing',
  'Other',
]

export const CAMPAIGN_STATUSES = [
  'Draft',
  'Planned',
  'Active',
  'Paused',
  'Completed',
  'Cancelled',
]

const statusBadgeVariant = {
  active: 'success',
  planned: 'info',
  draft: 'neutral',
  paused: 'warning',
  completed: 'primary',
  cancelled: 'error',
}

const typeBadgeVariant = {
  SEO: 'info',
  'Social Media': 'primary',
  'Google Ads': 'info',
  'Meta Ads': 'primary',
  'Email Marketing': 'warning',
  'Content Marketing': 'success',
  'Influencer Marketing': 'primary',
  'Shopify Marketing': 'success',
  Other: 'neutral',
}

export function CampaignsPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // RBAC Permission checks
  const canCreate = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canEdit = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canChangeStatus = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canDelete = ['super_admin', 'agency_admin'].includes(currentUser?.role)

  // Data states
  const [campaigns, setCampaigns] = useState([])
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    planned: 0,
    completed: 0,
    paused: 0,
    draft: 0,
    totalBudget: 0,
  })
  const [clients, setClients] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Filter & Search states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const initialFormData = {
    name: '',
    clientId: '',
    campaignType: 'SEO',
    campaignManager: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    currency: 'USD',
    targetAudience: '',
    channels: ['SEO'],
    goals: '',
    kpiROAS: '',
    kpiCPA: '',
    kpiConversions: '',
    notes: '',
    status: 'Draft',
  }
  const [formData, setFormData] = useState(initialFormData)
  const [formErrors, setFormErrors] = useState({})
  const [statusChangeValue, setStatusChangeValue] = useState('')

  // Load clients and users for selects
  const loadDependencies = useCallback(async () => {
    try {
      const [clientRes, userRes] = await Promise.allSettled([
        clientService.getClients({ limit: 100 }),
        userService.getUsers({ limit: 100 }),
      ])

      if (clientRes.status === 'fulfilled' && clientRes.value?.data?.clients) {
        setClients(clientRes.value.data.clients)
      }
      if (userRes.status === 'fulfilled') {
        const users = Array.isArray(userRes.value) ? userRes.value : userRes.value?.data?.users || []
        setTeamMembers(users)
      }
    } catch (err) {
      console.error('Error loading campaign dependencies:', err)
    }
  }, [])

  // Load campaigns from API
  const loadCampaigns = useCallback(
    async (page = 1) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await campaignService.getCampaigns({
          page,
          limit: pagination.limit,
          search,
          status: statusFilter,
          campaignType: typeFilter,
          clientId: clientFilter,
          campaignManager: managerFilter,
          startDate: startDateFilter,
          endDate: endDateFilter,
        })

        setCampaigns(res.data?.campaigns || [])
        if (res.data?.metrics) {
          setMetrics(res.data.metrics)
        }
        if (res.pagination) {
          setPagination(res.pagination)
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err)
        setError(err.message || 'Failed to load campaigns.')
      } finally {
        setIsLoading(false)
      }
    },
    [search, statusFilter, typeFilter, clientFilter, managerFilter, startDateFilter, endDateFilter, pagination.limit]
  )

  useEffect(() => {
    loadDependencies()
  }, [loadDependencies])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCampaigns(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [loadCampaigns])

  // Clear toast feedback
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(t)
    }
  }, [feedback])

  // Form Validation
  const validateForm = () => {
    const errs = {}
    if (!formData.name.trim()) {
      errs.name = 'Campaign name is required.'
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Campaign name must be at least 2 characters.'
    }

    if (!formData.clientId) {
      errs.clientId = 'Please select a client.'
    }

    if (!formData.startDate) {
      errs.startDate = 'Start date is required.'
    }

    if (!formData.endDate) {
      errs.endDate = 'End date is required.'
    }

    if (formData.startDate && formData.endDate) {
      const s = new Date(formData.startDate)
      const e = new Date(formData.endDate)
      if (e < s) {
        errs.endDate = 'End date cannot be earlier than start date.'
      }
    }

    if (formData.budget === '' || formData.budget === null || formData.budget === undefined) {
      errs.budget = 'Budget is required.'
    } else if (isNaN(Number(formData.budget)) || Number(formData.budget) < 0) {
      errs.budget = 'Budget must be a non-negative number.'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Open Create Modal
  const handleOpenAdd = () => {
    setFormData(initialFormData)
    setFormErrors({})
    setIsAddModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (campaign) => {
    setSelectedCampaign(campaign)
    const kpis = campaign.KPIs || {}
    setFormData({
      name: campaign.name || '',
      clientId: campaign.clientId?._id || campaign.clientId || '',
      campaignType: campaign.campaignType || 'SEO',
      campaignManager: campaign.campaignManager?._id || campaign.campaignManager || '',
      description: campaign.description || '',
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
      budget: campaign.budget !== undefined ? campaign.budget : '',
      currency: campaign.currency || 'USD',
      targetAudience: campaign.targetAudience || '',
      channels: campaign.channels?.length ? campaign.channels : [campaign.campaignType || 'SEO'],
      goals: campaign.goals || '',
      kpiROAS: kpis.targetROAS || '',
      kpiCPA: kpis.targetCPA || '',
      kpiConversions: kpis.targetConversions || '',
      notes: campaign.notes || '',
      status: campaign.status || 'Draft',
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  // Open Status Change Modal
  const handleOpenStatus = (campaign) => {
    setSelectedCampaign(campaign)
    setStatusChangeValue(campaign.status || 'Draft')
    setIsStatusModalOpen(true)
  }

  // Open Delete Modal
  const handleOpenDelete = (campaign) => {
    setSelectedCampaign(campaign)
    setIsDeleteModalOpen(true)
  }

  // Submit Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        clientId: formData.clientId,
        campaignType: formData.campaignType,
        campaignManager: formData.campaignManager || undefined,
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: Number(formData.budget),
        currency: formData.currency,
        targetAudience: formData.targetAudience.trim(),
        channels: formData.channels,
        goals: formData.goals.trim(),
        KPIs: {
          targetROAS: formData.kpiROAS ? Number(formData.kpiROAS) : undefined,
          targetCPA: formData.kpiCPA ? Number(formData.kpiCPA) : undefined,
          targetConversions: formData.kpiConversions ? Number(formData.kpiConversions) : undefined,
        },
        notes: formData.notes.trim(),
        status: formData.status,
      }

      await campaignService.createCampaign(payload)
      setFeedback({ type: 'success', message: 'Campaign created successfully.' })
      setIsAddModalOpen(false)
      loadCampaigns(1)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create campaign.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        clientId: formData.clientId,
        campaignType: formData.campaignType,
        campaignManager: formData.campaignManager || null,
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: Number(formData.budget),
        currency: formData.currency,
        targetAudience: formData.targetAudience.trim(),
        channels: formData.channels,
        goals: formData.goals.trim(),
        KPIs: {
          targetROAS: formData.kpiROAS ? Number(formData.kpiROAS) : undefined,
          targetCPA: formData.kpiCPA ? Number(formData.kpiCPA) : undefined,
          targetConversions: formData.kpiConversions ? Number(formData.kpiConversions) : undefined,
        },
        notes: formData.notes.trim(),
        status: formData.status,
      }

      await campaignService.updateCampaign(selectedCampaign._id, payload)
      setFeedback({ type: 'success', message: 'Campaign updated successfully.' })
      setIsEditModalOpen(false)
      loadCampaigns(pagination.page)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update campaign.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Status Change
  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!statusChangeValue) return

    setIsSubmitting(true)
    try {
      await campaignService.updateCampaignStatus(selectedCampaign._id, statusChangeValue)
      setFeedback({
        type: 'success',
        message: `Campaign status changed to ${statusChangeValue}.`,
      })
      setIsStatusModalOpen(false)
      loadCampaigns(pagination.page)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Delete
  const handleDeleteSubmit = async () => {
    setIsSubmitting(true)
    try {
      await campaignService.deleteCampaign(selectedCampaign._id)
      setFeedback({ type: 'success', message: 'Campaign deleted successfully.' })
      setIsDeleteModalOpen(false)
      loadCampaigns(1)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete campaign.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Allowed transitions helper for status modal
  const allowedNextStatuses = useMemo(() => {
    if (!selectedCampaign?.status) return CAMPAIGN_STATUSES
    const cur = selectedCampaign.status.toLowerCase()
    const map = {
      draft: ['Planned', 'Active', 'Cancelled'],
      planned: ['Active', 'Paused', 'Cancelled', 'Draft'],
      active: ['Paused', 'Completed', 'Cancelled'],
      paused: ['Active', 'Completed', 'Cancelled'],
      completed: ['Active', 'Paused', 'Cancelled'],
      cancelled: ['Draft', 'Planned', 'Active'],
    }
    return map[cur] || CAMPAIGN_STATUSES
  }, [selectedCampaign])

  // Channel toggling in form
  const toggleChannel = (channelName) => {
    setFormData((prev) => {
      const exists = prev.channels.includes(channelName)
      if (exists) {
        return { ...prev, channels: prev.channels.filter((c) => c !== channelName) }
      } else {
        return { ...prev, channels: [...prev.channels, channelName] }
      }
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]'
              : 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header (Step 9) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Campaigns</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage and monitor your digital marketing campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCampaigns(pagination.page)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA]">
              <Plus className="w-4 h-4" />
              + Create Campaign
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards (Step 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Campaigns"
          value={metrics.total.toString()}
          icon={Megaphone}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
          change="+100%"
          positive
          timeframe="across agency"
        />
        <KpiCard
          label="Active Campaigns"
          value={metrics.active.toString()}
          icon={TrendingUp}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          change="Running live"
          positive
          timeframe="in market"
        />
        <KpiCard
          label="Planned Campaigns"
          value={metrics.planned.toString()}
          icon={Calendar}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          change="Scheduled"
          positive
          timeframe="ready to launch"
        />
        <KpiCard
          label="Completed Campaigns"
          value={metrics.completed.toString()}
          icon={CheckCircle2}
          iconBg="#FAF5FF"
          iconColor="#9333EA"
          change="Finished"
          positive
          timeframe="successful runs"
        />
        <KpiCard
          label="Total Budget"
          value={`$${Number(metrics.totalBudget || 0).toLocaleString()}`}
          icon={DollarSign}
          iconBg="#FFFBEB"
          iconColor="#D97706"
          change="Allocated"
          positive
          timeframe="total agency spend"
        />
      </div>

      {/* Search & Filters Section (Step 9) */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by campaign name, client, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white text-[#374151]"
            >
              <option value="all">All Statuses</option>
              {CAMPAIGN_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white text-[#374151]"
            >
              <option value="all">All Types</option>
              {CAMPAIGN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full py-2 px-3 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white text-[#374151]"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Manager Filter */}
          <div>
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="w-full py-2 px-3 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white text-[#374151]"
            >
              <option value="all">All Managers</option>
              {teamMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Sub-Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F3F4F6] text-xs text-[#6B7280]">
          <span className="font-medium text-[#374151] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <span>From:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="px-2 py-1 border border-[#E5E7EB] rounded text-xs outline-none focus:border-[#4F46E5]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="px-2 py-1 border border-[#E5E7EB] rounded text-xs outline-none focus:border-[#4F46E5]"
            />
          </div>
          {(search ||
            statusFilter !== 'all' ||
            typeFilter !== 'all' ||
            clientFilter !== 'all' ||
            managerFilter !== 'all' ||
            startDateFilter ||
            endDateFilter) && (
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setTypeFilter('all')
                setClientFilter('all')
                setManagerFilter('all')
                setStartDateFilter('')
                setEndDateFilter('')
              }}
              className="text-[#4F46E5] hover:underline font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Main Campaign Table (Step 9) */}
      <Card className="overflow-hidden p-0 border border-[#E5E7EB]">
        {isLoading ? (
          <div className="py-16">
            <Loading text="Loading campaigns..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={() => loadCampaigns(pagination.page)} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title="No campaigns found"
              description="Get started by launching your first digital marketing campaign for your clients."
              actionLabel={canCreate ? '+ Create Campaign' : undefined}
              onAction={canCreate ? handleOpenAdd : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#374151]">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Campaign</th>
                  <th scope="col" className="px-6 py-3.5">Client</th>
                  <th scope="col" className="px-6 py-3.5">Type</th>
                  <th scope="col" className="px-6 py-3.5">Manager</th>
                  <th scope="col" className="px-6 py-3.5">Dates</th>
                  <th scope="col" className="px-6 py-3.5">Budget</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {campaigns.map((camp) => {
                  const normalizedSt = (camp.status || 'Draft').toLowerCase()
                  const badgeVariant = statusBadgeVariant[normalizedSt] || 'neutral'
                  const typeVariant = typeBadgeVariant[camp.campaignType] || 'neutral'
                  const clientName = camp.clientId?.companyName || camp.client?.companyName || 'Unknown Client'
                  const managerName = camp.campaignManager?.name || camp.assignedTo?.name || 'Unassigned'

                  return (
                    <tr key={camp._id} className="hover:bg-[#F9FAFB] transition group">
                      {/* Campaign Column */}
                      <td className="px-6 py-4">
                        <Link
                          to={`/campaigns/${camp._id}`}
                          className="font-medium text-[#111827] hover:text-[#4F46E5] transition flex items-center gap-1.5"
                        >
                          {camp.name}
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {camp.description && (
                          <p className="text-xs text-[#6B7280] line-clamp-1 max-w-xs mt-0.5">
                            {camp.description}
                          </p>
                        )}
                      </td>

                      {/* Client Column */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-[#111827]">{clientName}</span>
                        {camp.clientId?.contactName && (
                          <p className="text-xs text-[#6B7280]">{camp.clientId.contactName}</p>
                        )}
                      </td>

                      {/* Type Column */}
                      <td className="px-6 py-4">
                        <Badge variant={typeVariant}>{camp.campaignType || 'SEO'}</Badge>
                      </td>

                      {/* Manager Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                            {managerName.charAt(0)}
                          </div>
                          <span className="text-xs text-[#374151] truncate max-w-[120px]">
                            {managerName}
                          </span>
                        </div>
                      </td>

                      {/* Dates Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-[#6B7280]">
                        <div>{formatDate(camp.startDate)}</div>
                        <div className="text-[11px] text-[#9CA3AF]">to {formatDate(camp.endDate)}</div>
                      </td>

                      {/* Budget Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-[#111827]">
                          ${Number(camp.budget || 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-[#6B7280] ml-1">{camp.currency || 'USD'}</span>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={badgeVariant} withDot>
                          {camp.status || 'Draft'}
                        </Badge>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/campaigns/${camp._id}`)}
                            title="View Details"
                            className="p-1.5 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canChangeStatus && (
                            <button
                              onClick={() => handleOpenStatus(camp)}
                              title="Change Status"
                              className="p-1.5 text-[#6B7280] hover:text-[#D97706] hover:bg-[#FFFBEB] rounded transition text-xs font-medium"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(camp)}
                              title="Edit Campaign"
                              className="p-1.5 text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleOpenDelete(camp)}
                              title="Delete Campaign"
                              className="p-1.5 text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition"
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
        )}

        {/* Pagination Footer */}
        {!isLoading && campaigns.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <div>
              Showing page <span className="font-semibold text-[#111827]">{pagination.page}</span> of{' '}
              <span className="font-semibold text-[#111827]">{pagination.totalPages}</span> ({pagination.total} total campaigns)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => loadCampaigns(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadCampaigns(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE CAMPAIGN MODAL (Step 10) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Create New Campaign"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campaign Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Campaign Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Q4 Black Friday Omnichannel Boost"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                  formErrors.name ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#4F46E5]'
                }`}
              />
              {formErrors.name && <p className="text-xs text-[#DC2626] mt-1">{formErrors.name}</p>}
            </div>

            {/* Client Select */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Client <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white transition ${
                  formErrors.clientId ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#4F46E5]'
                }`}
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName} ({c.contactName})
                  </option>
                ))}
              </select>
              {formErrors.clientId && <p className="text-xs text-[#DC2626] mt-1">{formErrors.clientId}</p>}
            </div>

            {/* Campaign Type */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Campaign Type <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={formData.campaignType}
                onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                {CAMPAIGN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign Manager */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Campaign Manager
              </label>
              <select
                value={formData.campaignManager}
                onChange={(e) => setFormData({ ...formData, campaignManager: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                <option value="">Assign to team member...</option>
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                {CAMPAIGN_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Start Date <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                  formErrors.startDate ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#4F46E5]'
                }`}
              />
              {formErrors.startDate && <p className="text-xs text-[#DC2626] mt-1">{formErrors.startDate}</p>}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                End Date <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                  formErrors.endDate ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#4F46E5]'
                }`}
              />
              {formErrors.endDate && <p className="text-xs text-[#DC2626] mt-1">{formErrors.endDate}</p>}
            </div>

            {/* Budget & Currency */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Budget <span className="text-[#DC2626]">*</span>
              </label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="5000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-l-lg text-sm outline-none transition ${
                    formErrors.budget ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#4F46E5]'
                  }`}
                />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="px-2.5 py-2 border border-l-0 border-[#E5E7EB] rounded-r-lg bg-[#F9FAFB] text-xs font-semibold outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              {formErrors.budget && <p className="text-xs text-[#DC2626] mt-1">{formErrors.budget}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Description</label>
              <textarea
                rows="2"
                placeholder="High-level description of campaign purpose and strategy..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Marketing Channels Multi-select */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Marketing Channels
              </label>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_TYPES.map((c) => {
                  const selected = formData.channels.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChannel(c)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                        selected
                          ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#4F46E5]'
                          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 inline mr-1" />}
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Strategic Goals */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Goals</label>
              <textarea
                rows="2"
                placeholder="e.g. Generate 500 qualified leads, achieve 4x ROAS"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Target Audience</label>
              <textarea
                rows="2"
                placeholder="e.g. US eCommerce founders, 25-45, tech-savvy"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* KPI Targets */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Target ROAS (x)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="3.5"
                  value={formData.kpiROAS}
                  onChange={(e) => setFormData({ ...formData, kpiROAS: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded text-sm bg-white outline-none focus:border-[#4F46E5]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Target CPA ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  value={formData.kpiCPA}
                  onChange={(e) => setFormData({ ...formData, kpiCPA: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded text-sm bg-white outline-none focus:border-[#4F46E5]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Target Conversions</label>
                <input
                  type="number"
                  placeholder="150"
                  value={formData.kpiConversions}
                  onChange={(e) => setFormData({ ...formData, kpiConversions: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded text-sm bg-white outline-none focus:border-[#4F46E5]"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Internal Notes</label>
              <textarea
                rows="2"
                placeholder="Operational notes, creative briefs, tracking links..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#4F46E5] hover:bg-[#4338CA]">
              {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT CAMPAIGN MODAL (Step 10) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit Campaign"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campaign Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Campaign Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                  formErrors.name ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#4F46E5]'
                }`}
              />
              {formErrors.name && <p className="text-xs text-[#DC2626] mt-1">{formErrors.name}</p>}
            </div>

            {/* Client Select */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Client <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName} ({c.contactName})
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign Type */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Campaign Type <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={formData.campaignType}
                onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                {CAMPAIGN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign Manager */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Campaign Manager
              </label>
              <select
                value={formData.campaignManager}
                onChange={(e) => setFormData({ ...formData, campaignManager: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                <option value="">Assign to team member...</option>
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                {CAMPAIGN_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Start Date <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                End Date <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
              {formErrors.endDate && <p className="text-xs text-[#DC2626] mt-1">{formErrors.endDate}</p>}
            </div>

            {/* Budget */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Budget <span className="text-[#DC2626]">*</span>
              </label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 border rounded-l-lg text-sm outline-none focus:border-[#4F46E5]"
                />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="px-2.5 py-2 border border-l-0 border-[#E5E7EB] rounded-r-lg bg-[#F9FAFB] text-xs font-semibold"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              {formErrors.budget && <p className="text-xs text-[#DC2626] mt-1">{formErrors.budget}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Description</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Channels */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Marketing Channels
              </label>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_TYPES.map((c) => {
                  const selected = formData.channels.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChannel(c)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                        selected
                          ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#4F46E5]'
                          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 inline mr-1" />}
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Strategic Goals */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Goals</label>
              <textarea
                rows="2"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Target Audience</label>
              <textarea
                rows="2"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Internal Notes</label>
              <textarea
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#4F46E5] hover:bg-[#4338CA]">
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* STATUS CHANGE MODAL (Step 12) */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => !isSubmitting && setIsStatusModalOpen(false)}
        title="Update Campaign Status"
        size="sm"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Change status for <span className="font-semibold text-[#111827]">{selectedCampaign?.name}</span>.
            Current status is <Badge variant="neutral">{selectedCampaign?.status || 'Draft'}</Badge>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Target Status
            </label>
            <div className="space-y-2">
              {allowedNextStatuses.map((st) => (
                <label
                  key={st}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                    statusChangeValue === st
                      ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5]'
                      : 'hover:bg-[#F9FAFB] border-[#E5E7EB] text-[#374151]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="campaignStatusOption"
                      value={st}
                      checked={statusChangeValue === st}
                      onChange={(e) => setStatusChangeValue(e.target.value)}
                      className="text-[#4F46E5] focus:ring-[#4F46E5]"
                    />
                    <span className="text-sm font-medium">{st}</span>
                  </div>
                  <Badge variant={statusBadgeVariant[st.toLowerCase()] || 'neutral'} withDot>
                    {st}
                  </Badge>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || statusChangeValue === selectedCampaign?.status}
              className="bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Status'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title="Delete Campaign"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-[#FEF2F2] rounded-lg border border-[#FEE2E2] text-xs text-[#991B1B]">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#DC2626]" />
            <div>
              <p className="font-semibold text-sm text-[#DC2626]">Are you absolutely sure?</p>
              <p className="mt-1">
                This will permanently delete the campaign{' '}
                <span className="font-semibold">"{selectedCampaign?.name}"</span> and all its recorded metrics. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteSubmit}
              disabled={isSubmitting}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Campaign'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CampaignsPage
