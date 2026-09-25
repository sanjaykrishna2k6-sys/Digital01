import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { formatINR } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import * as campaignService from '../services/campaignService'

const statusVariant = {
  active: 'success',
  scheduled: 'info',
  draft: 'neutral',
  paused: 'warning',
  completed: 'primary',
  archived: 'neutral',
}

const channelBadgeVariant = {
  google_ads: 'info',
  meta_ads: 'primary',
  email: 'warning',
  organic: 'success',
  social: 'neutral',
}

export function CampaignsPage() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'meta_ads',
    status: 'active',
    startDate: '',
    endDate: '',
    budget: '',
    targetAudience: '',
    goals: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManage = user?.role === 'super_admin' || user?.role === 'agency_admin'

  const loadCampaigns = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await campaignService.fetchCampaigns()
      setCampaigns(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load campaigns.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        !searchTerm.trim() ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        c.channel.toLowerCase().includes(searchTerm.toLowerCase().trim())

      const matchesChannel = channelFilter === 'all' || c.channel === channelFilter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter

      return matchesSearch && matchesChannel && matchesStatus
    })
  }, [campaigns, searchTerm, channelFilter, statusFilter])

  // KPIs
  const stats = useMemo(() => {
    const total = campaigns.length
    const active = campaigns.filter((c) => c.status === 'active').length
    const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0)
    const totalConversions = campaigns.reduce(
      (acc, c) => acc + (c.metrics?.conversions || 0),
      0
    )
    return { total, active, totalBudget, totalConversions }
  }, [campaigns])

  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0]
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    setFormData({
      name: '',
      description: '',
      channel: 'meta_ads',
      status: 'active',
      startDate: today,
      endDate: nextMonth,
      budget: '',
      targetAudience: '',
      goals: '',
    })
    setFormErrors({})
    setIsCreateOpen(true)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Campaign name must be at least 2 characters.'
    }
    if (!formData.startDate) {
      errors.startDate = 'Start date is required.'
    }
    if (!formData.endDate) {
      errors.endDate = 'End date is required.'
    }
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errors.endDate = 'End date cannot be earlier than start date.'
      }
    }
    if (
      formData.budget === '' ||
      isNaN(Number(formData.budget)) ||
      Number(formData.budget) < 0
    ) {
      errors.budget = 'Please enter a valid positive budget amount.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const created = await campaignService.createCampaign({
        ...formData,
        budget: Number(formData.budget),
      })
      setCampaigns([created, ...campaigns])
      setIsCreateOpen(false)
      setFeedback({ type: 'success', text: `Campaign "${created.name}" launched.` })
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, general: err.message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (camp) => {
    setSelectedCampaign(camp)
    setFormData({
      name: camp.name,
      description: camp.description || '',
      channel: camp.channel,
      status: camp.status,
      startDate: camp.startDate ? camp.startDate.split('T')[0] : '',
      endDate: camp.endDate ? camp.endDate.split('T')[0] : '',
      budget: camp.budget,
      targetAudience: camp.targetAudience || '',
      goals: camp.goals || '',
    })
    setFormErrors({})
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const updated = await campaignService.updateCampaign(selectedCampaign._id, {
        ...formData,
        budget: Number(formData.budget),
      })
      setCampaigns(campaigns.map((c) => (c._id === updated._id ? updated : c)))
      setIsEditOpen(false)
      setFeedback({ type: 'success', text: `Campaign "${updated.name}" updated.` })
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, general: err.message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDelete = (camp) => {
    setSelectedCampaign(camp)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCampaign) return
    setIsSubmitting(true)
    try {
      await campaignService.deleteCampaign(selectedCampaign._id)
      setCampaigns(campaigns.filter((c) => c._id !== selectedCampaign._id))
      setIsDeleteOpen(false)
      setFeedback({ type: 'success', text: 'Campaign removed from organization.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete.' })
      setIsDeleteOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (ds) => {
    if (!ds) return '—'
    return new Date(ds).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-[10px] border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#16A34A]'
              : 'bg-[#FEF2F2] border-[#FEE2E2] text-[#DC2626]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
            Campaign Management
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Deploy, track, and optimize cross-channel marketing campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={loadCampaigns}>
            Refresh
          </Button>

          {canManage && (
            <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenCreate}>
              New Campaign
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Total Campaigns</p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Active Campaigns</p>
            <p className="text-2xl font-bold text-[#16A34A] mt-1">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Total Budget</p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{formatINR(stats.totalBudget)}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Total Conversions</p>
            <p className="text-2xl font-bold text-[#4F46E5] mt-1">{stats.totalConversions.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            isSearch={true}
            containerClassName="mb-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B7280]">Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs bg-white border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[#374151] font-medium outline-none focus:border-[#4F46E5] cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="google_ads">Google Ads</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="email">Email</option>
              <option value="organic">Organic</option>
              <option value="social">Social Media</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B7280]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[#374151] font-medium outline-none focus:border-[#4F46E5] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {(searchTerm || channelFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setChannelFilter('all')
                setStatusFilter('all')
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main Campaign Directory */}
      {isLoading ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-12">
          <Loading title="Loading Campaigns..." description="Fetching marketing campaigns" />
        </div>
      ) : error ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-8">
          <ErrorState title="Failed to load campaigns" description={error} onRetry={loadCampaigns} />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-8">
          <EmptyState
            icon={Megaphone}
            title={
              searchTerm || channelFilter !== 'all' || statusFilter !== 'all'
                ? 'No matching campaigns'
                : 'No campaigns created yet'
            }
            description="Create your first marketing deliverable to start tracking clicks, impressions, and conversions."
            actionLabel={canManage ? 'New Campaign' : undefined}
            onAction={canManage ? handleOpenCreate : undefined}
          />
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Timeline</th>
                  <th>Impressions</th>
                  <th>Conversions</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((camp) => (
                  <tr key={camp._id}>
                    <td>
                      <div>
                        <Link
                          to={`/campaigns/${camp._id}`}
                          className="font-semibold text-[#111827] hover:text-[#4F46E5] transition-colors block"
                        >
                          {camp.name}
                        </Link>
                        {camp.description && (
                          <p className="text-xs text-[#9CA3AF] truncate max-w-xs mt-0.5">
                            {camp.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td>
                      <Badge variant={channelBadgeVariant[camp.channel] || 'neutral'} className="capitalize">
                        {camp.channel.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td>
                      <Badge variant={statusVariant[camp.status] || 'neutral'} withDot={true}>
                        <span className="capitalize">{camp.status}</span>
                      </Badge>
                    </td>

                    <td className="font-mono text-xs font-semibold text-[#111827]">
                      {formatINR(camp.budget)}
                    </td>

                    <td className="text-xs text-[#6B7280] whitespace-nowrap">
                      {formatDate(camp.startDate)} &rarr; {formatDate(camp.endDate)}
                    </td>

                    <td className="text-xs text-[#4B5563]">
                      {(camp.metrics?.impressions || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="text-xs font-semibold text-[#16A34A]">
                      {(camp.metrics?.conversions || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/campaigns/${camp._id}`}
                          className="p-1.5 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded-[6px] transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(camp)}
                            className="p-1.5 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded-[6px] transition-colors"
                            title="Edit Campaign"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(camp)}
                            className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[6px] transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !isSubmitting && setIsCreateOpen(false)}
        title="Launch New Campaign"
        description="Configure target audience, budget, schedule, and marketing channel."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleCreateSubmit}>
              Create Campaign
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[8px] text-xs text-[#DC2626] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <Input
            label="Campaign Name"
            placeholder="e.g. Q4 Meta Ads Performance Surge"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1.5">Channel</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2 outline-none focus:border-[#4F46E5]"
              >
                <option value="meta_ads">Meta Ads (Instagram / FB)</option>
                <option value="google_ads">Google Ads (Search & PMax)</option>
                <option value="email">Email Campaign</option>
                <option value="organic">Organic SEO</option>
                <option value="social">Social Media</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2 outline-none focus:border-[#4F46E5]"
              >
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              error={formErrors.startDate}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              error={formErrors.endDate}
              required
            />
          </div>

          <Input
            label="Total Budget (INR)"
            type="number"
            placeholder="e.g. 75000"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            error={formErrors.budget}
            required
          />

          <Input
            label="Target Audience"
            placeholder="e.g. Fitness enthusiasts aged 22-40 in Tier 1 cities"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
          />

          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">Description & Goals</label>
            <textarea
              rows={2}
              placeholder="e.g. Drive 250 qualified leads with CPA under ₹300"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2.5 outline-none focus:border-[#4F46E5]"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !isSubmitting && setIsEditOpen(false)}
        title="Edit Campaign"
        description="Update budget, dates, and campaign parameters."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Campaign Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1.5">Channel</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2 outline-none focus:border-[#4F46E5]"
              >
                <option value="meta_ads">Meta Ads</option>
                <option value="google_ads">Google Ads</option>
                <option value="email">Email</option>
                <option value="organic">Organic</option>
                <option value="social">Social</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2 outline-none focus:border-[#4F46E5]"
              >
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              error={formErrors.startDate}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              error={formErrors.endDate}
              required
            />
          </div>

          <Input
            label="Total Budget (INR)"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            error={formErrors.budget}
            required
          />

          <Input
            label="Target Audience"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
          />
        </form>
      </Modal>

      {/* Delete Campaign Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !isSubmitting && setIsDeleteOpen(false)}
        title="Delete Campaign"
        description="Permanently remove this campaign from your agency workspace."
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={isSubmitting} onClick={handleDeleteConfirm}>
              Delete Campaign
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#6B7280]">
          Are you sure you want to delete <strong className="text-[#111827]">{selectedCampaign?.name}</strong>?
          Historical performance metrics associated with this campaign will also be deleted.
        </p>
      </Modal>
    </div>
  )
}
