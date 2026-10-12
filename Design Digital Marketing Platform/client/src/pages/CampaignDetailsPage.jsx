import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  TrendingUp,
  Users,
  Target,
  Eye,
  MousePointer,
  CheckCircle2,
  Clock,
  Layers,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Briefcase,
  Share2,
  Check,
  Building2,
  BarChart3,
  Percent,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import * as campaignService from '../services/campaignService'
import * as clientService from '../services/clientService'
import * as userService from '../services/userService'

export function CampaignDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // RBAC permissions
  const canEdit = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canChangeStatus = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canDelete = ['super_admin', 'agency_admin'].includes(currentUser?.role)

  // Data states
  const [campaign, setCampaign] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [clients, setClients] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [statusChangeValue, setStatusChangeValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    campaignType: 'SEO',
    campaignManager: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    currency: 'INR',
    targetAudience: '',
    channels: [],
    goals: '',
    kpiROAS: '',
    kpiCPA: '',
    kpiConversions: '',
    notes: '',
    status: 'Draft',
  })
  const [formErrors, setFormErrors] = useState({})

  // Load campaign and statistics
  const loadCampaignData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [campData, statsData] = await Promise.all([
        campaignService.getCampaign(id),
        campaignService.getCampaignStatistics(id).catch(() => null),
      ])

      setCampaign(campData)
      setStatistics(statsData)
    } catch (err) {
      console.error('Failed to load campaign:', err)
      setError(err.message || 'Failed to load campaign details.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCampaignData()
  }, [loadCampaignData])

  // Load select options for edit modal
  const loadOptions = useCallback(async () => {
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
      console.error(err)
    }
  }, [])

  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!campaign) return
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

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormErrors({ name: 'Campaign name is required.' })
      return
    }

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

      await campaignService.updateCampaign(campaign._id, payload)
      setFeedback({ type: 'success', message: 'Campaign updated successfully.' })
      setIsEditModalOpen(false)
      loadCampaignData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update campaign.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Status Update
  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!statusChangeValue) return

    setIsSubmitting(true)
    try {
      await campaignService.updateCampaignStatus(campaign._id, statusChangeValue)
      setFeedback({ type: 'success', message: `Campaign status changed to ${statusChangeValue}.` })
      setIsStatusModalOpen(false)
      loadCampaignData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete
  const handleDeleteSubmit = async () => {
    setIsSubmitting(true)
    try {
      await campaignService.deleteCampaign(campaign._id)
      navigate('/campaigns')
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete campaign.' })
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-24">
        <Loading text="Loading campaign details..." />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="py-12">
        <ErrorState message={error || 'Campaign not found.'} onRetry={loadCampaignData} />
      </div>
    )
  }

  const clientName = campaign.clientId?.companyName || campaign.client?.companyName || 'Unknown Client'
  const managerName = campaign.campaignManager?.name || campaign.assignedTo?.name || 'Unassigned'
  const m = campaign.metrics || {}
  const stats = statistics || {}

  const statusVariant = {
    active: 'success',
    planned: 'info',
    draft: 'neutral',
    paused: 'warning',
    completed: 'primary',
    cancelled: 'error',
  }

  return (
    <div className="space-y-6 pb-16">
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

      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/campaigns"
            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition"
            title="Back to Campaigns"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111827]">{campaign.name}</h1>
              <Badge variant={statusVariant[(campaign.status || 'Draft').toLowerCase()] || 'neutral'} withDot>
                {campaign.status || 'Draft'}
              </Badge>
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5 flex items-center gap-1.5">
              <span>Client:</span>
              <span className="font-medium text-[#111827]">{clientName}</span>
              <span>•</span>
              <span>Manager:</span>
              <span className="font-medium text-[#111827]">{managerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={loadCampaignData} className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          {canChangeStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusChangeValue(campaign.status || 'Draft')
                setIsStatusModalOpen(true)
              }}
              className="flex items-center gap-1.5 border-[#D97706] text-[#D97706] hover:bg-[#FFFBEB]"
            >
              <Check className="w-4 h-4" />
              Change Status
            </Button>
          )}

          {canEdit && (
            <Button variant="outline" size="sm" onClick={handleOpenEdit} className="flex items-center gap-1.5">
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}

          {canDelete && (
            <Button
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards / Performance Statistics (Step 5 & 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget & Pacing */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Budget & Spend</span>
            <IndianRupee className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            ₹{Number(stats.spend || m.spend || 0).toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-[#6B7280]">/ ₹{Number(campaign.budget || 0).toLocaleString('en-IN')}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#4F46E5] h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, stats.budgetPacingPercent || 0)}%` }}
            />
          </div>
          <p className="text-[11px] text-[#6B7280]">
            {stats.budgetPacingPercent || 0}% budget utilized (₹{Number(stats.budgetRemaining || 0).toLocaleString('en-IN')} remaining)
          </p>
        </Card>

        {/* Impressions & Reach */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Impressions & Reach</span>
            <Eye className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            {Number(stats.impressions || m.impressions || 0).toLocaleString()}
          </div>
          <p className="text-xs text-[#6B7280]">
            Reach: <span className="font-semibold text-[#111827]">{Number(stats.reach || m.reach || 0).toLocaleString()}</span> unique users
          </p>
          <p className="text-[11px] text-[#16A34A] font-medium">Verified channel delivery</p>
        </Card>

        {/* Clicks & CTR */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Clicks & CTR</span>
            <MousePointer className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            {Number(stats.clicks || m.clicks || 0).toLocaleString()}
          </div>
          <p className="text-xs text-[#6B7280]">
            CTR:{' '}
            <span className="font-semibold text-[#111827]">
              {stats.CTR !== undefined ? stats.CTR : m.clicks && m.impressions ? ((m.clicks / m.impressions) * 100).toFixed(2) : 0}%
            </span>
          </p>
          <p className="text-[11px] text-[#6B7280]">CPC: ${Number(stats.CPC || 0).toFixed(2)}</p>
        </Card>

        {/* Conversions & ROAS */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Conversions & ROAS</span>
            <TrendingUp className="w-4 h-4 text-[#9333EA]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            {Number(stats.conversions || m.conversions || 0).toLocaleString()}
          </div>
          <p className="text-xs text-[#6B7280]">
            ROAS: <span className="font-semibold text-[#16A34A]">{Number(stats.ROAS || 0).toFixed(2)}x</span>
          </p>
          <p className="text-[11px] text-[#6B7280]">CPA: ${Number(stats.CPA || 0).toFixed(2)}</p>
        </Card>
      </div>

      {/* Main Campaign Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Overview, Goals, Audience, Channels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview & Description */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-[#111827]">Campaign Overview</h2>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              {campaign.description || 'No description provided for this campaign.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#F3F4F6] text-xs">
              <div>
                <span className="text-[#6B7280] block">Type</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{campaign.campaignType || 'SEO'}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Currency</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{campaign.currency === 'USD' ? 'INR (₹)' : (campaign.currency || 'INR (₹)')}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Start Date</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{formatDate(campaign.startDate)}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">End Date</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{formatDate(campaign.endDate)}</span>
              </div>
            </div>
          </Card>

          {/* Goals & KPIs (Step 11) */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#4F46E5]" />
              Strategic Goals & Key Performance Indicators
            </h2>

            <div>
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">
                Campaign Goals
              </span>
              <p className="text-sm text-[#374151] bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                {campaign.goals || 'No specific strategic goals defined yet.'}
              </p>
            </div>

            <div className="pt-2">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-2">
                Target KPIs
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#EEF2FF] rounded-lg border border-[#E0E7FF]">
                  <span className="text-xs text-[#4F46E5] font-medium block">Target ROAS</span>
                  <span className="text-lg font-bold text-[#1E1B4B]">
                    {campaign.KPIs?.targetROAS ? `${campaign.KPIs.targetROAS}x` : 'Not Set'}
                  </span>
                </div>
                <div className="p-3 bg-[#F0FDF4] rounded-lg border border-[#DCFCE7]">
                  <span className="text-xs text-[#16A34A] font-medium block">Target CPA</span>
                  <span className="text-lg font-bold text-[#064E3B]">
                    {campaign.KPIs?.targetCPA ? `$${campaign.KPIs.targetCPA}` : 'Not Set'}
                  </span>
                </div>
                <div className="p-3 bg-[#EFF6FF] rounded-lg border border-[#DBEAFE]">
                  <span className="text-xs text-[#2563EB] font-medium block">Target Conversions</span>
                  <span className="text-lg font-bold text-[#1E3A8A]">
                    {campaign.KPIs?.targetConversions ? Number(campaign.KPIs.targetConversions).toLocaleString() : 'Not Set'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Target Audience & Marketing Channels (Step 11) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#4F46E5]" />
                Target Audience
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                {campaign.targetAudience || 'Target audience profile not specified.'}
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#4F46E5]" />
                Marketing Channels
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {campaign.channels && campaign.channels.length > 0 ? (
                  campaign.channels.map((ch) => (
                    <Badge key={ch} variant="primary">
                      {ch}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">{campaign.campaignType || 'SEO'}</Badge>
                )}
              </div>
            </Card>
          </div>

          {/* Notes (Step 11) */}
          {campaign.notes && (
            <Card className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-[#111827]">Operational Notes</h3>
              <p className="text-xs text-[#4B5563] whitespace-pre-wrap bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                {campaign.notes}
              </p>
            </Card>
          )}

          {/* Campaign Activity / Timeline (Step 11) */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#6B7280]" />
              Campaign Activity & Audit History
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#16A34A] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">Campaign initialized</p>
                  <p className="text-[#6B7280]">
                    Created by {campaign.createdBy?.name || 'Authorized User'} on {formatDate(campaign.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">Current status: {campaign.status}</p>
                  <p className="text-[#6B7280]">Last updated on {formatDate(campaign.updatedAt)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Client Profile, Manager, Metadata */}
        <div className="space-y-6">
          {/* Client Card */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Client Information
            </h3>
            <div>
              <p className="font-bold text-base text-[#111827]">{clientName}</p>
              {campaign.clientId?.contactName && (
                <p className="text-xs text-[#4B5563] mt-0.5">Contact: {campaign.clientId.contactName}</p>
              )}
              {campaign.clientId?.email && (
                <p className="text-xs text-[#6B7280] mt-0.5">{campaign.clientId.email}</p>
              )}
              {campaign.clientId?.industry && (
                <Badge variant="neutral" className="mt-2">
                  {campaign.clientId.industry}
                </Badge>
              )}
            </div>
            {campaign.clientId?._id && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate(`/clients/${campaign.clientId._id}`)}
              >
                View Client Profile
              </Button>
            )}
          </Card>

          {/* Campaign Manager Card */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Campaign Manager
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-sm">
                {managerName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm text-[#111827]">{managerName}</p>
                {campaign.campaignManager?.email && (
                  <p className="text-xs text-[#6B7280]">{campaign.campaignManager.email}</p>
                )}
                {campaign.campaignManager?.role && (
                  <span className="text-[11px] text-[#4F46E5] font-medium">
                    {campaign.campaignManager.role.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Meta Details */}
          <Card className="p-5 space-y-2 text-xs text-[#6B7280]">
            <h3 className="text-xs font-semibold text-[#374151] uppercase tracking-wider">
              Metadata
            </h3>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span>Campaign ID</span>
              <span className="font-mono text-[#111827]">{campaign._id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span>Created</span>
              <span className="text-[#111827]">{formatDate(campaign.createdAt)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Last Modified</span>
              <span className="text-[#111827]">{formatDate(campaign.updatedAt)}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit Campaign"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Campaign Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
              {formErrors.name && <p className="text-xs text-[#DC2626] mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Campaign Type</label>
              <input
                type="text"
                value={formData.campaignType}
                onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Budget</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Campaign Manager</label>
              <select
                value={formData.campaignManager}
                onChange={(e) => setFormData({ ...formData, campaignManager: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Description</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Goals</label>
              <textarea
                rows="2"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Internal Notes</label>
              <textarea
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-[#4F46E5] hover:bg-[#4338CA]">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* STATUS CHANGE MODAL */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => !isSubmitting && setIsStatusModalOpen(false)}
        title="Change Campaign Status"
        size="sm"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Update status for <span className="font-semibold text-[#111827]">{campaign.name}</span>.
          </p>

          <div className="space-y-2">
            {['Draft', 'Planned', 'Active', 'Paused', 'Completed', 'Cancelled'].map((st) => (
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
                    name="statusDetailOption"
                    value={st}
                    checked={statusChangeValue === st}
                    onChange={(e) => setStatusChangeValue(e.target.value)}
                    className="text-[#4F46E5]"
                  />
                  <span className="text-sm font-medium">{st}</span>
                </div>
                <Badge variant={statusVariant[st.toLowerCase()] || 'neutral'} withDot>
                  {st}
                </Badge>
              </label>
            ))}
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
              disabled={isSubmitting || statusChangeValue === campaign.status}
              className="bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Status'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
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
                This will permanently delete the campaign <span className="font-semibold">"{campaign.name}"</span>.
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

export default CampaignDetailsPage
