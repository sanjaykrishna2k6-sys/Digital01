import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  IndianRupee,
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
  Sliders,
  PauseCircle,
  Flag,
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
import * as projectService from '../services/projectService'
import * as clientService from '../services/clientService'
import * as campaignService from '../services/campaignService'
import * as userService from '../services/userService'
import { formatDate } from '../utils/formatters'

export const PROJECT_TYPES = [
  'Website Development',
  'SEO',
  'Social Media',
  'Paid Advertising',
  'Content Marketing',
  'Branding',
  'Email Marketing',
  'Shopify',
  'Analytics',
  'Other',
]

export const PROJECT_STATUSES = [
  'Planning',
  'Active',
  'On Hold',
  'Completed',
  'Cancelled',
]

export const PROJECT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

const statusBadgeVariant = {
  active: 'success',
  planning: 'info',
  'on hold': 'warning',
  on_hold: 'warning',
  completed: 'primary',
  cancelled: 'error',
}

const priorityBadgeVariant = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // RBAC Permission checks
  const canCreate = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canEdit = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canChangeStatus = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canUpdateProgress = ['super_admin', 'agency_admin', 'account_manager', 'team_member'].includes(currentUser?.role)
  const canDelete = ['super_admin', 'agency_admin'].includes(currentUser?.role)

  // Data states
  const [projects, setProjects] = useState([])
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    planning: 0,
    onHold: 0,
    completed: 0,
    cancelled: 0,
    totalBudget: 0,
    averageProgress: 0,
  })
  const [clients, setClients] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Filter & Search states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const initialFormData = {
    name: '',
    clientId: '',
    campaignId: '',
    projectType: 'Website Development',
    projectManager: '',
    teamMembers: [],
    description: '',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    budget: '',
    currency: 'INR',
    progress: 0,
    goals: '',
    deliverables: '',
    notes: '',
    status: 'Planning',
  }
  const [formData, setFormData] = useState(initialFormData)
  const [formErrors, setFormErrors] = useState({})
  const [statusChangeValue, setStatusChangeValue] = useState('')
  const [progressChangeValue, setProgressChangeValue] = useState(0)

  // Load clients, campaigns, users
  const loadDependencies = useCallback(async () => {
    try {
      const [clientRes, campRes, userRes] = await Promise.allSettled([
        clientService.getClients({ limit: 100 }),
        campaignService.getCampaigns({ limit: 100 }),
        userService.getUsers({ limit: 100 }),
      ])

      if (clientRes.status === 'fulfilled' && clientRes.value?.data?.clients) {
        setClients(clientRes.value.data.clients)
      }
      if (campRes.status === 'fulfilled' && campRes.value?.data?.campaigns) {
        setCampaigns(campRes.value.data.campaigns)
      }
      if (userRes.status === 'fulfilled') {
        const users = Array.isArray(userRes.value) ? userRes.value : userRes.value?.data?.users || []
        setTeamMembers(users)
      }
    } catch (err) {
      console.error('Error loading project dependencies:', err)
    }
  }, [])

  // Filtered campaigns for selected client in modal
  const availableCampaignsForClient = useMemo(() => {
    if (!formData.clientId) return campaigns
    return campaigns.filter(
      (c) => (c.clientId?._id || c.clientId) === formData.clientId
    )
  }, [campaigns, formData.clientId])

  // Load projects from API
  const loadProjects = useCallback(
    async (page = 1) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await projectService.getProjects({
          page,
          limit: pagination.limit,
          search,
          status: statusFilter,
          priority: priorityFilter,
          projectType: typeFilter,
          clientId: clientFilter,
          campaignId: campaignFilter,
          projectManager: managerFilter,
          startDate: startDateFilter,
          endDate: endDateFilter,
        })

        setProjects(res.data?.projects || [])
        if (res.data?.metrics) {
          setMetrics(res.data.metrics)
        }
        if (res.pagination) {
          setPagination(res.pagination)
        }
      } catch (err) {
        console.error('Failed to load projects:', err)
        setError(err.message || 'Failed to load projects.')
      } finally {
        setIsLoading(false)
      }
    },
    [
      search,
      statusFilter,
      priorityFilter,
      typeFilter,
      clientFilter,
      campaignFilter,
      managerFilter,
      startDateFilter,
      endDateFilter,
      pagination.limit,
    ]
  )

  useEffect(() => {
    loadDependencies()
  }, [loadDependencies])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [loadProjects])

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
      errs.name = 'Project name is required.'
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Project name must be at least 2 characters.'
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

    if (formData.budget !== '' && formData.budget !== null && formData.budget !== undefined) {
      if (isNaN(Number(formData.budget)) || Number(formData.budget) < 0) {
        errs.budget = 'Budget must be a non-negative number.'
      }
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
  const handleOpenEdit = (project) => {
    setSelectedProject(project)
    setFormData({
      name: project.name || '',
      clientId: project.clientId?._id || project.clientId || '',
      campaignId: project.campaignId?._id || project.campaignId || '',
      projectType: project.projectType || 'Website Development',
      projectManager: project.projectManager?._id || project.projectManager || '',
      teamMembers: Array.isArray(project.teamMembers)
        ? project.teamMembers.map((m) => m._id || m)
        : [],
      description: project.description || '',
      priority: project.priority || 'Medium',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      budget: project.budget !== undefined ? project.budget : 0,
      currency: project.currency === 'USD' ? 'INR' : (project.currency || 'INR'),
      progress: project.progress || 0,
      goals: project.goals || '',
      deliverables: Array.isArray(project.deliverables) ? project.deliverables.join('\n') : '',
      notes: project.notes || '',
      status: project.status || 'Planning',
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  // Open Status Change Modal
  const handleOpenStatus = (project) => {
    setSelectedProject(project)
    setStatusChangeValue(project.status || 'Planning')
    setIsStatusModalOpen(true)
  }

  // Open Progress Modal
  const handleOpenProgress = (project) => {
    setSelectedProject(project)
    setProgressChangeValue(project.progress || 0)
    setIsProgressModalOpen(true)
  }

  // Open Delete Modal
  const handleOpenDelete = (project) => {
    setSelectedProject(project)
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
        campaignId: formData.campaignId || null,
        projectType: formData.projectType,
        projectManager: formData.projectManager || undefined,
        teamMembers: formData.teamMembers,
        description: formData.description.trim(),
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget !== '' ? Number(formData.budget) : 0,
        currency: formData.currency,
        progress: Number(formData.progress) || 0,
        goals: formData.goals.trim(),
        deliverables: formData.deliverables
          ? formData.deliverables.split('\n').map((d) => d.trim()).filter(Boolean)
          : [],
        notes: formData.notes.trim(),
        status: formData.status,
      }

      await projectService.createProject(payload)
      setFeedback({ type: 'success', message: 'Project created successfully.' })
      setIsAddModalOpen(false)
      loadProjects(1)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create project.' })
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
        campaignId: formData.campaignId || null,
        projectType: formData.projectType,
        projectManager: formData.projectManager || null,
        teamMembers: formData.teamMembers,
        description: formData.description.trim(),
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget !== '' ? Number(formData.budget) : 0,
        currency: formData.currency,
        progress: Number(formData.progress) || 0,
        goals: formData.goals.trim(),
        deliverables: formData.deliverables
          ? formData.deliverables.split('\n').map((d) => d.trim()).filter(Boolean)
          : [],
        notes: formData.notes.trim(),
        status: formData.status,
      }

      await projectService.updateProject(selectedProject._id, payload)
      setFeedback({ type: 'success', message: 'Project updated successfully.' })
      setIsEditModalOpen(false)
      loadProjects(pagination.page)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update project.' })
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
      await projectService.updateProjectStatus(selectedProject._id, statusChangeValue)
      setFeedback({
        type: 'success',
        message: `Project status changed to ${statusChangeValue}.`,
      })
      setIsStatusModalOpen(false)
      loadProjects(pagination.page)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Progress Change
  const handleProgressSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await projectService.updateProjectProgress(selectedProject._id, progressChangeValue)
      setFeedback({
        type: 'success',
        message: `Project progress updated to ${progressChangeValue}%.`,
      })
      setIsProgressModalOpen(false)
      loadProjects(pagination.page)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update progress.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Delete
  const handleDeleteSubmit = async () => {
    setIsSubmitting(true)
    try {
      await projectService.deleteProject(selectedProject._id)
      setFeedback({ type: 'success', message: 'Project deleted successfully.' })
      setIsDeleteModalOpen(false)
      loadProjects(1)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete project.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Allowed transitions helper for status modal
  const allowedNextStatuses = useMemo(() => {
    if (!selectedProject?.status) return PROJECT_STATUSES
    const cur = selectedProject.status.toLowerCase()
    const map = {
      planning: ['Active', 'On Hold', 'Cancelled'],
      active: ['On Hold', 'Completed', 'Cancelled'],
      'on hold': ['Active', 'Cancelled', 'Completed'],
      completed: ['Active', 'On Hold'],
      cancelled: ['Planning', 'Active'],
    }
    return map[cur] || PROJECT_STATUSES
  }, [selectedProject])

  // Team member toggling in form
  const toggleTeamMember = (memberId) => {
    setFormData((prev) => {
      const exists = prev.teamMembers.includes(memberId)
      if (exists) {
        return { ...prev, teamMembers: prev.teamMembers.filter((id) => id !== memberId) }
      } else {
        return { ...prev, teamMembers: [...prev.teamMembers, memberId] }
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

      {/* Header (STEP 9) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Projects</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage client projects, teams, timelines, and delivery progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadProjects(pagination.page)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA]">
              <Plus className="w-4 h-4" />
              + Create Project
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards (STEP 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Projects"
          value={metrics.total.toString()}
          icon={FolderOpen}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
          change="+100%"
          positive
          timeframe="across agency"
        />
        <KpiCard
          label="Active Projects"
          value={metrics.active.toString()}
          icon={TrendingUp}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          change="In progress"
          positive
          timeframe="live delivery"
        />
        <KpiCard
          label="Projects On Hold"
          value={metrics.onHold.toString()}
          icon={PauseCircle}
          iconBg="#FFFBEB"
          iconColor="#D97706"
          change="Paused"
          positive={false}
          timeframe="pending client"
        />
        <KpiCard
          label="Completed Projects"
          value={metrics.completed.toString()}
          icon={CheckCircle2}
          iconBg="#FAF5FF"
          iconColor="#9333EA"
          change="Delivered"
          positive
          timeframe="closed successfully"
        />
        <KpiCard
          label="Total Budget"
          value={`₹${Number(metrics.totalBudget || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          change="Contracted"
          positive
          timeframe="agency pipeline"
        />
      </div>

      {/* Search & Filters Section (STEP 9) */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by project name, client, or campaign..."
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
              {PROJECT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white text-[#374151]"
            >
              <option value="all">All Priorities</option>
              {PROJECT_PRIORITIES.slice(0, 4).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Project Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white text-[#374151]"
            >
              <option value="all">All Types</option>
              {PROJECT_TYPES.map((t) => (
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

          {/* Campaign Filter */}
          <div>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="w-full py-2 px-3 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white text-[#374151]"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((camp) => (
                <option key={camp._id} value={camp._id}>
                  {camp.name}
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
            priorityFilter !== 'all' ||
            typeFilter !== 'all' ||
            clientFilter !== 'all' ||
            campaignFilter !== 'all' ||
            managerFilter !== 'all' ||
            startDateFilter ||
            endDateFilter) && (
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setPriorityFilter('all')
                setTypeFilter('all')
                setClientFilter('all')
                setCampaignFilter('all')
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

      {/* Main Project Table (STEP 10) */}
      <Card className="overflow-hidden p-0 border border-[#E5E7EB]">
        {isLoading ? (
          <div className="py-16">
            <Loading text="Loading projects..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={() => loadProjects(pagination.page)} />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title="No projects found"
              description="Get started by launching your first project to coordinate team deliverables and track delivery milestones."
              actionLabel={canCreate ? '+ Create Project' : undefined}
              onAction={canCreate ? handleOpenAdd : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#374151]">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Project</th>
                  <th scope="col" className="px-6 py-3.5">Client</th>
                  <th scope="col" className="px-6 py-3.5">Campaign</th>
                  <th scope="col" className="px-6 py-3.5">Manager</th>
                  <th scope="col" className="px-6 py-3.5">Priority</th>
                  <th scope="col" className="px-6 py-3.5">Dates</th>
                  <th scope="col" className="px-6 py-3.5">Progress</th>
                  <th scope="col" className="px-6 py-3.5">Budget</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {projects.map((proj) => {
                  const normalizedSt = (proj.status || 'Planning').toLowerCase()
                  const badgeVariant = statusBadgeVariant[normalizedSt] || 'neutral'
                  const prioVariant = priorityBadgeVariant[(proj.priority || 'Medium').toLowerCase()] || 'neutral'
                  const clientName = proj.clientId?.companyName || proj.client?.companyName || 'Unknown Client'
                  const campaignName = proj.campaignId?.name || proj.campaign?.name || '—'
                  const managerName = proj.projectManager?.name || proj.assignedTo?.name || 'Unassigned'
                  const progressVal = Number(proj.progress || 0)

                  return (
                    <tr key={proj._id} className="hover:bg-[#F9FAFB] transition group">
                      {/* Project Name */}
                      <td className="px-6 py-4">
                        <Link
                          to={`/projects/${proj._id}`}
                          className="font-medium text-[#111827] hover:text-[#4F46E5] transition flex items-center gap-1.5"
                        >
                          {proj.name}
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="text-xs text-[#6B7280] line-clamp-1 max-w-xs mt-0.5">
                          {proj.projectType}
                        </p>
                      </td>

                      {/* Client */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-[#111827]">{clientName}</span>
                      </td>

                      {/* Campaign */}
                      <td className="px-6 py-4">
                        {proj.campaignId ? (
                          <Link
                            to={`/campaigns/${proj.campaignId._id || proj.campaignId}`}
                            className="text-xs text-[#4F46E5] hover:underline font-medium"
                          >
                            {campaignName}
                          </Link>
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">—</span>
                        )}
                      </td>

                      {/* Manager */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                            {managerName.charAt(0)}
                          </div>
                          <span className="text-xs text-[#374151] truncate max-w-[110px]">
                            {managerName}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <Badge variant={prioVariant}>{proj.priority || 'Medium'}</Badge>
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-[#6B7280]">
                        <div>{formatDate(proj.startDate)}</div>
                        <div className="text-[11px] text-[#9CA3AF]">to {formatDate(proj.endDate)}</div>
                      </td>

                      {/* Progress Bar (STEP 10) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-[#111827]">
                            <span>{progressVal}%</span>
                          </div>
                          <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                progressVal === 100
                                  ? 'bg-[#16A34A]'
                                  : progressVal >= 50
                                  ? 'bg-[#4F46E5]'
                                  : 'bg-[#2563EB]'
                              }`}
                              style={{ width: `${progressVal}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-[#111827]">
                          ₹{Number(proj.budget || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-[#6B7280] ml-1">{proj.currency || 'INR'}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={badgeVariant} withDot>
                          {proj.status || 'Planning'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/projects/${proj._id}`)}
                            title="View Details"
                            className="p-1.5 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canUpdateProgress && (
                            <button
                              onClick={() => handleOpenProgress(proj)}
                              title="Update Progress"
                              className="p-1.5 text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded transition"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          )}

                          {canChangeStatus && (
                            <button
                              onClick={() => handleOpenStatus(proj)}
                              title="Change Status"
                              className="p-1.5 text-[#6B7280] hover:text-[#D97706] hover:bg-[#FFFBEB] rounded transition"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(proj)}
                              title="Edit Project"
                              className="p-1.5 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleOpenDelete(proj)}
                              title="Delete Project"
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
        {!isLoading && projects.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <div>
              Showing page <span className="font-semibold text-[#111827]">{pagination.page}</span> of{' '}
              <span className="font-semibold text-[#111827]">{pagination.totalPages}</span> ({pagination.total} total projects)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => loadProjects(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadProjects(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE PROJECT MODAL (STEP 11) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Create New Project"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Project Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. NextGen Shopify Store Redesign & CRO"
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
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value, campaignId: '' })}
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

            {/* Campaign Select (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Associated Campaign (Optional)
              </label>
              <select
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                <option value="">None / Standalone Project</option>
                {availableCampaignsForClient.map((camp) => (
                  <option key={camp._id} value={camp._id}>
                    {camp.name} ({camp.campaignType})
                  </option>
                ))}
              </select>
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Project Type <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                {PROJECT_PRIORITIES.slice(0, 4).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Manager */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Project Manager
              </label>
              <select
                value={formData.projectManager}
                onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5] bg-white"
              >
                <option value="">Assign to manager...</option>
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
                {PROJECT_STATUSES.map((st) => (
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
              <label className="block text-xs font-semibold text-[#374151] mb-1">Budget</label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="10000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-l-lg text-sm outline-none transition ${
                    formErrors.budget ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#4F46E5]'
                  }`}
                />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="px-2.5 py-2 border border-l-0 border-[#E5E7EB] rounded-r-lg bg-[#F9FAFB] text-xs font-semibold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              {formErrors.budget && <p className="text-xs text-[#DC2626] mt-1">{formErrors.budget}</p>}
            </div>

            {/* Initial Progress */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Progress ({formData.progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                className="w-full accent-[#4F46E5] h-2 bg-[#E5E7EB] rounded-lg cursor-pointer"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Description</label>
              <textarea
                rows="2"
                placeholder="High-level project scope and delivery objectives..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Team Members Assignment */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Assign Team Members
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-[#E5E7EB] rounded-lg">
                {teamMembers.map((m) => {
                  const selected = formData.teamMembers.includes(m._id)
                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => toggleTeamMember(m._id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                        selected
                          ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#4F46E5]'
                          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 inline mr-1" />}
                      {m.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Goals</label>
              <textarea
                rows="2"
                placeholder="Key delivery and business goals..."
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Deliverables */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Deliverables (One per line)
              </label>
              <textarea
                rows="2"
                placeholder="Wireframes&#10;Staging build&#10;QA Review&#10;Production Launch"
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Internal Notes</label>
              <textarea
                rows="2"
                placeholder="Operational notes, design links, repositories..."
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
              {isSubmitting ? 'Creating Project...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT PROJECT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit Project"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Project Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                  formErrors.name ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#4F46E5]'
                }`}
              />
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
              <label className="block text-xs font-semibold text-[#374151] mb-1">Campaign</label>
              <select
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">None / Standalone</option>
                {availableCampaignsForClient.map((camp) => (
                  <option key={camp._id} value={camp._id}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Project Type</label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                {PROJECT_PRIORITIES.slice(0, 4).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Project Manager</label>
              <select
                value={formData.projectManager}
                onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
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

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                {PROJECT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
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
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Progress ({formData.progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                className="w-full accent-[#4F46E5] h-2 bg-[#E5E7EB] rounded-lg cursor-pointer"
              />
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
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#4F46E5] hover:bg-[#4338CA]">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* UPDATE PROGRESS MODAL (STEP 17) */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => !isSubmitting && setIsProgressModalOpen(false)}
        title="Update Project Progress"
        size="sm"
      >
        <form onSubmit={handleProgressSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Update progress for <span className="font-semibold text-[#111827]">{selectedProject?.name}</span>.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-[#111827]">
              <span>Delivery Completion:</span>
              <span className="text-base text-[#4F46E5]">{progressChangeValue}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressChangeValue}
              onChange={(e) => setProgressChangeValue(Number(e.target.value))}
              className="w-full accent-[#4F46E5] h-2.5 bg-[#E5E7EB] rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-[#9CA3AF]">
              <span>0% (Not started)</span>
              <span>50% (In progress)</span>
              <span>100% (Completed)</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProgressModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? 'Saving...' : 'Save Progress'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* STATUS CHANGE MODAL (STEP 16) */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => !isSubmitting && setIsStatusModalOpen(false)}
        title="Update Project Status"
        size="sm"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Change status for <span className="font-semibold text-[#111827]">{selectedProject?.name}</span>.
            Current status is <Badge variant="neutral">{selectedProject?.status || 'Planning'}</Badge>.
          </p>

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
                    name="projectStatusOption"
                    value={st}
                    checked={statusChangeValue === st}
                    onChange={(e) => setStatusChangeValue(e.target.value)}
                    className="text-[#4F46E5]"
                  />
                  <span className="text-sm font-medium">{st}</span>
                </div>
                <Badge variant={statusBadgeVariant[st.toLowerCase()] || 'neutral'} withDot>
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
              disabled={isSubmitting || statusChangeValue === selectedProject?.status}
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
        title="Delete Project"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-[#FEF2F2] rounded-lg border border-[#FEE2E2] text-xs text-[#991B1B]">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#DC2626]" />
            <div>
              <p className="font-semibold text-sm text-[#DC2626]">Are you absolutely sure?</p>
              <p className="mt-1">
                This will permanently delete the project{' '}
                <span className="font-semibold">"{selectedProject?.name}"</span>. This action cannot be undone.
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
              {isSubmitting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProjectsPage
