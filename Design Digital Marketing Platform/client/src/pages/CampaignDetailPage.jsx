import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
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
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
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

export function CampaignDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [campaign, setCampaign] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManage = user?.role === 'super_admin' || user?.role === 'agency_admin'

  const loadCampaign = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await campaignService.fetchCampaignById(id)
      setCampaign(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load campaign details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCampaign()
  }, [id])

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      await campaignService.deleteCampaign(id)
      navigate('/campaigns')
    } catch (err) {
      alert(err.message || 'Failed to delete campaign.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (newStatus) => {
    try {
      const updated = await campaignService.updateCampaignStatus(id, newStatus)
      setCampaign(updated)
    } catch (err) {
      alert(err.message || 'Failed to update status.')
    }
  }

  const formatDate = (ds) => {
    if (!ds) return '—'
    return new Date(ds).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="p-12">
        <Loading title="Loading Campaign Details..." description="Retrieving performance metrics" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="p-8">
        <ErrorState
          title="Campaign Not Found"
          description={error || 'The requested campaign does not exist or belongs to another organization.'}
          onRetry={loadCampaign}
        />
        <div className="text-center mt-4">
          <Link to="/campaigns" className="text-xs text-[#4F46E5] font-semibold hover:underline">
            &larr; Back to Campaigns
          </Link>
        </div>
      </div>
    )
  }

  const metrics = campaign.metrics || {}
  const impressions = metrics.impressions ?? 0
  const reach = metrics.reach ?? 0
  const clicks = metrics.clicks ?? 0
  const leads = metrics.leads ?? 0
  const conversions = metrics.conversions ?? 0
  const spend = metrics.spend ?? campaign.budget ?? 0
  const revenue = metrics.revenue ?? 0

  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0.00%'
  const convRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) + '%' : '0.00%'
  const roi = spend > 0 ? (((revenue - spend) / spend) * 100).toFixed(1) + '%' : 'N/A'

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Back button & top navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#4F46E5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            {campaign.status === 'active' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleToggleStatus('paused')}
              >
                Pause Campaign
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleToggleStatus('active')}
              >
                Activate Campaign
              </Button>
            )}

            <Button
              variant="danger"
              size="sm"
              leftIcon={Trash2}
              onClick={() => setIsDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Main Campaign Header Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
                {campaign.name}
              </h1>
              <Badge variant={statusVariant[campaign.status] || 'neutral'} withDot={true}>
                <span className="capitalize">{campaign.status}</span>
              </Badge>
              <Badge variant="primary" className="capitalize">
                {campaign.channel.replace('_', ' ')}
              </Badge>
            </div>
            {campaign.description && (
              <p className="text-sm text-[#6B7280] mt-2 max-w-2xl">{campaign.description}</p>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-[#9CA3AF] uppercase font-semibold">Total Budget</p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{formatINR(campaign.budget)}</p>
          </div>
        </div>

        {/* Campaign Parameters Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#F3F4F6]">
          <div>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Start Date</p>
            <p className="text-xs font-semibold text-[#374151] mt-1">{formatDate(campaign.startDate)}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">End Date</p>
            <p className="text-xs font-semibold text-[#374151] mt-1">{formatDate(campaign.endDate)}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Target Audience</p>
            <p className="text-xs font-semibold text-[#374151] mt-1 truncate">
              {campaign.targetAudience || 'Broad Audience'}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Assigned Manager</p>
            <p className="text-xs font-semibold text-[#374151] mt-1">
              {campaign.assignedTo?.name || 'Scalevo Team'}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Section Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#111827]">Performance Analytics</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">Real-time deliverable metrics for this campaign</p>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Impressions</p>
          <p className="text-xl font-bold text-[#111827] mt-1">
            {impressions > 0 ? impressions.toLocaleString('en-IN') : 'No data available yet'}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Reach</p>
          <p className="text-xl font-bold text-[#111827] mt-1">
            {reach > 0 ? reach.toLocaleString('en-IN') : 'No data available yet'}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Clicks</p>
          <p className="text-xl font-bold text-[#4F46E5] mt-1">
            {clicks > 0 ? clicks.toLocaleString('en-IN') : 'No data available yet'}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Click-Through Rate (CTR)</p>
          <p className="text-xl font-bold text-[#111827] mt-1">
            {impressions > 0 ? ctr : 'N/A'}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Conversions</p>
          <p className="text-xl font-bold text-[#16A34A] mt-1">
            {conversions > 0 ? conversions.toLocaleString('en-IN') : 'No data available yet'}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Conversion Rate</p>
          <p className="text-xl font-bold text-[#16A34A] mt-1">
            {clicks > 0 ? convRate : 'N/A'}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Total Spend</p>
          <p className="text-xl font-bold text-[#111827] mt-1">
            {formatINR(spend)}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Generated Revenue</p>
          <p className="text-xl font-bold text-[#111827] mt-1">
            {revenue > 0 ? formatINR(revenue) : 'No data available yet'}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">ROI</p>
          <p className="text-xl font-bold text-[#4F46E5] mt-1">
            {roi}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Associated Leads</p>
          <p className="text-xl font-bold text-[#111827] mt-1">
            {leads > 0 ? leads.toLocaleString('en-IN') : 'No data available yet'}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Campaign"
        description="This will permanently delete this campaign and all performance records."
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={isSubmitting} onClick={handleDelete}>
              Delete Permanently
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#6B7280]">
          Are you sure you want to delete <strong className="text-[#111827]">{campaign.name}</strong>?
        </p>
      </Modal>
    </div>
  )
}
