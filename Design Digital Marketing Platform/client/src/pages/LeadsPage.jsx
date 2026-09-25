import React, { useState, useEffect, useMemo } from 'react'
import {
  Target,
  Plus,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Building,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Award,
  User,
  Megaphone,
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
import * as leadService from '../services/leadService'
import * as campaignService from '../services/campaignService'
import * as userService from '../services/userService'

const statusVariant = {
  new: 'info',
  contacted: 'neutral',
  qualified: 'primary',
  proposal: 'warning',
  converted: 'success',
  lost: 'danger',
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal Sent' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
]

const sourceOptions = [
  'Website',
  'Meta Ads',
  'Google Ads',
  'LinkedIn',
  'Email Campaign',
  'Referral',
  'Direct',
  'Other',
]

export function LeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt_desc')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Website',
    campaign: '',
    status: 'new',
    leadScore: 50,
    estimatedValue: '',
    assignedTo: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManage = user?.role === 'super_admin' || user?.role === 'agency_admin'

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [leadsData, campaignsData, usersData] = await Promise.all([
        leadService.fetchLeads(),
        campaignService.fetchCampaigns().catch(() => []),
        userService.fetchUsers().catch(() => []),
      ])
      setLeads(leadsData)
      setCampaigns(campaignsData)
      setTeamMembers(usersData)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load lead pipeline.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const filteredAndSortedLeads = useMemo(() => {
    let result = leads.filter((l) => {
      const matchesSearch =
        !searchTerm.trim() ||
        l.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        l.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (l.company && l.company.toLowerCase().includes(searchTerm.toLowerCase().trim()))

      const matchesStatus = statusFilter === 'all' || l.status === statusFilter
      const matchesSource = sourceFilter === 'all' || l.source === sourceFilter

      return matchesSearch && matchesStatus && matchesSource
    })

    result.sort((a, b) => {
      if (sortBy === 'createdAt_desc') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'createdAt_asc') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === 'score_desc') return (b.leadScore || 0) - (a.leadScore || 0)
      if (sortBy === 'value_desc') return (b.estimatedValue || 0) - (a.estimatedValue || 0)
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      return 0
    })

    return result
  }, [leads, searchTerm, statusFilter, sourceFilter, sortBy])

  const stats = useMemo(() => {
    const total = leads.length
    const qualified = leads.filter((l) => ['qualified', 'proposal'].includes(l.status)).length
    const converted = leads.filter((l) => l.status === 'converted').length
    const totalPipelineValue = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0)
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0
    return { total, qualified, converted, totalPipelineValue, conversionRate }
  }, [leads])

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      source: 'Website',
      campaign: '',
      status: 'new',
      leadScore: 50,
      estimatedValue: '',
      assignedTo: '',
    })
    setFormErrors({})
    setIsAddOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Lead name must be at least 2 characters.'
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email.'
    }
    if (formData.leadScore < 0 || formData.leadScore > 100) {
      errs.leadScore = 'Score must be between 0 and 100.'
    }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        leadScore: Number(formData.leadScore || 50),
        estimatedValue: Number(formData.estimatedValue || 0),
        campaign: formData.campaign || null,
        assignedTo: formData.assignedTo || null,
      }
      const created = await leadService.createLead(payload)
      setLeads([created, ...leads])
      setIsAddOpen(false)
      setFeedback({ type: 'success', text: `Lead "${created.name}" created successfully.` })
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, general: err.message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (lead) => {
    setSelectedLead(lead)
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source || 'Website',
      campaign: lead.campaign?._id || lead.campaign || '',
      status: lead.status || 'new',
      leadScore: lead.leadScore !== undefined ? lead.leadScore : 50,
      estimatedValue: lead.estimatedValue || '',
      assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
    })
    setFormErrors({})
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        leadScore: Number(formData.leadScore || 50),
        estimatedValue: Number(formData.estimatedValue || 0),
        campaign: formData.campaign || null,
        assignedTo: formData.assignedTo || null,
      }
      const updated = await leadService.updateLead(selectedLead._id, payload)
      setLeads(leads.map((l) => (l._id === updated._id ? updated : l)))
      setIsEditOpen(false)
      setFeedback({ type: 'success', text: `Lead "${updated.name}" updated successfully.` })
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, general: err.message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickStatusChange = async (leadId, newStatus) => {
    try {
      const updated = await leadService.updateLeadStatus(leadId, newStatus)
      setLeads(leads.map((l) => (l._id === leadId ? updated : l)))
      setFeedback({ type: 'success', text: `Status updated to ${newStatus}.` })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Status update failed.' })
    }
  }

  const handleOpenDelete = (lead) => {
    setSelectedLead(lead)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedLead) return
    setIsSubmitting(true)
    try {
      await leadService.deleteLead(selectedLead._id)
      setLeads(leads.filter((l) => l._id !== selectedLead._id))
      setIsDeleteOpen(false)
      setFeedback({ type: 'success', text: `Lead "${selectedLead.name}" removed.` })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete lead.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getScoreBadge = (score) => {
    if (score >= 80) return <Badge variant="success">{score} Hot</Badge>
    if (score >= 50) return <Badge variant="primary">{score} Warm</Badge>
    return <Badge variant="neutral">{score} Cold</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, score, and convert inbound leads across marketing campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadData} disabled={isLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm transition-all ${
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
          <span>{feedback.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-xs text-slate-400 mt-1">Across all channels</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Target className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualified / Proposal</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.qualified}</h3>
            <p className="text-xs text-slate-400 mt-1">High conversion probability</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Converted Wins</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.converted}</h3>
            <p className="text-xs text-slate-400 mt-1">{stats.conversionRate}% conversion rate</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline Value</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatINR(stats.totalPipelineValue)}</h3>
            <p className="text-xs text-slate-400 mt-1">Estimated open pipeline</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
            <DollarSign className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-medium">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Sources</option>
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="score_desc">Highest Score</option>
                <option value="value_desc">Highest Value</option>
                <option value="name_asc">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {isLoading ? (
        <Loading title="Loading leads pipeline..." />
      ) : error ? (
        <ErrorState title="Failed to load leads" message={error} onRetry={loadData} />
      ) : filteredAndSortedLeads.length === 0 ? (
        <EmptyState
          icon={Target}
          title={searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' ? 'No matching leads' : 'No leads recorded yet'}
          message={
            searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
              ? 'Try adjusting your search criteria or filter options.'
              : 'Add your first inbound lead to track sales progression and source attribution.'
          }
          actionLabel="Add First Lead"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Lead</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Campaign & Source</th>
                  <th className="py-3 px-4">Estimated Value</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Lead Info */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-medium text-slate-900">{lead.name}</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.company && (
                            <span className="flex items-center gap-1 font-medium text-slate-600">
                              <Building className="w-3 h-3 text-slate-400" />
                              {lead.company}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4">{getScoreBadge(lead.leadScore ?? 50)}</td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleQuickStatusChange(lead._id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          lead.status === 'converted'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : lead.status === 'qualified'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : lead.status === 'proposal'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : lead.status === 'lost'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Campaign & Source */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          {lead.campaign?.name ? (
                            <>
                              <Megaphone className="w-3 h-3 text-indigo-500" />
                              {lead.campaign.name}
                            </>
                          ) : (
                            <span className="text-slate-400">Direct Inbound</span>
                          )}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">{lead.source || 'Website'}</div>
                      </div>
                    </td>

                    {/* Estimated Value */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {lead.estimatedValue ? formatINR(lead.estimatedValue) : <span className="text-slate-400 font-normal">—</span>}
                    </td>

                    {/* Assigned User */}
                    <td className="py-3.5 px-4">
                      {lead.assignedTo?.name ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {lead.assignedTo.name[0].toUpperCase()}
                          </div>
                          <span>{lead.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(lead)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Lead"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <button
                            onClick={() => handleOpenDelete(lead)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Lead"
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

      {/* Add Lead Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Inbound Lead">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formErrors.email && <p className="text-xs text-rose-500 mt-1">{formErrors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Channel</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Campaign</label>
              <select
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None / Organic Inbound</option>
                {campaigns.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.channel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.leadScore}
                onChange={(e) => setFormData({ ...formData, leadScore: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Deal Value (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                placeholder="50000"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Team Member</label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Lead">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign</label>
              <select
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None / Organic Inbound</option>
                {campaigns.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.channel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.leadScore}
                onChange={(e) => setFormData({ ...formData, leadScore: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Deal Value (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Team Member</label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Lead">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-slate-900">{selectedLead?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete Lead'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
