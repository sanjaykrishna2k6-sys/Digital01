import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Sliders,
  Check,
  UserCheck,
  Building2,
  Briefcase,
  Layers,
  Filter,
  X,
  RefreshCw,
  FolderOpen,
  Calendar,
  AlertTriangle,
  ListTodo,
  CheckSquare,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import * as taskService from '../services/taskService'
import * as projectService from '../services/projectService'
import * as clientService from '../services/clientService'
import * as campaignService from '../services/campaignService'
import * as userService from '../services/userService'

export function TasksPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // RBAC permissions
  const canCreate = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canEdit = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canChangeStatus = ['super_admin', 'agency_admin', 'account_manager', 'team_member'].includes(currentUser?.role)
  const canChangeProgress = ['super_admin', 'agency_admin', 'account_manager', 'team_member'].includes(currentUser?.role)
  const canAssign = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canDelete = ['super_admin', 'agency_admin'].includes(currentUser?.role)

  // Data states
  const [tasks, setTasks] = useState([])
  const [metrics, setMetrics] = useState({
    total: 0,
    toDo: 0,
    inProgress: 0,
    review: 0,
    completed: 0,
    overdue: 0,
  })
  const [projects, setProjects] = useState([])
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
  const [projectFilter, setProjectFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [dueDateFilter, setDueDateFilter] = useState('')
  const [overdueFilter, setOverdueFilter] = useState(false)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const initialFormData = {
    title: '',
    description: '',
    projectId: '',
    clientId: '',
    campaignId: '',
    taskType: 'Development',
    priority: 'Medium',
    status: 'To Do',
    assignedTo: '',
    startDate: '',
    dueDate: '',
    estimatedHours: 0,
    actualHours: 0,
    progress: 0,
    tags: '',
    checklistText: '',
    notes: '',
  }
  const [formData, setFormData] = useState(initialFormData)
  const [formErrors, setFormErrors] = useState({})

  // Status & Progress quick update states
  const [statusChangeValue, setStatusChangeValue] = useState('')
  const [progressChangeValue, setProgressChangeValue] = useState(0)
  const [assigneeChangeValue, setAssigneeChangeValue] = useState('')

  // Load Tasks
  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (search.trim()) params.search = search.trim()
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      if (typeFilter !== 'all') params.taskType = typeFilter
      if (projectFilter !== 'all') params.projectId = projectFilter
      if (clientFilter !== 'all') params.clientId = clientFilter
      if (campaignFilter !== 'all') params.campaignId = campaignFilter
      if (assigneeFilter !== 'all') params.assignedTo = assigneeFilter
      if (dueDateFilter) params.dueDate = dueDateFilter
      if (overdueFilter) params.overdue = 'true'

      const res = await taskService.getTasks(params)
      setTasks(res.data?.tasks || [])
      if (res.data?.metrics) {
        setMetrics(res.data.metrics)
      }
      if (res.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
        }))
      }
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError(err.message || 'Failed to load tasks.')
    } finally {
      setIsLoading(false)
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    statusFilter,
    priorityFilter,
    typeFilter,
    projectFilter,
    clientFilter,
    campaignFilter,
    assigneeFilter,
    dueDateFilter,
    overdueFilter,
  ])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Load lookup options (projects, clients, users, campaigns)
  const loadLookups = useCallback(async () => {
    try {
      const [projRes, clientRes, userRes, campRes] = await Promise.allSettled([
        projectService.getProjects({ limit: 100 }),
        clientService.getClients({ limit: 100 }),
        userService.getUsers({ limit: 100 }),
        campaignService.getCampaigns({ limit: 100 }),
      ])

      if (projRes.status === 'fulfilled' && projRes.value?.data?.projects) {
        setProjects(projRes.value.data.projects)
      }
      if (clientRes.status === 'fulfilled' && clientRes.value?.data?.clients) {
        setClients(clientRes.value.data.clients)
      }
      if (userRes.status === 'fulfilled') {
        const users = Array.isArray(userRes.value) ? userRes.value : userRes.value?.data?.users || []
        setTeamMembers(users)
      }
      if (campRes.status === 'fulfilled') {
        const camps = campRes.value?.data?.campaigns || campRes.value?.campaigns || []
        setCampaigns(camps)
      }
    } catch (err) {
      console.error('Failed to load lookup options:', err)
    }
  }, [])

  useEffect(() => {
    loadLookups()
  }, [loadLookups])

  // Dynamic campaign filtering based on selected project
  const availableCampaigns = useMemo(() => {
    if (!formData.projectId) return campaigns
    const p = projects.find((proj) => proj._id === formData.projectId)
    if (p && p.campaignId) {
      const campId = p.campaignId._id || p.campaignId
      return campaigns.filter((c) => c._id === campId)
    }
    if (p && p.clientId) {
      const clId = p.clientId._id || p.clientId
      return campaigns.filter((c) => (c.clientId?._id || c.clientId) === clId)
    }
    return campaigns
  }, [formData.projectId, projects, campaigns])

  // Handle project change in form to auto-derive client
  const handleProjectSelect = (projId) => {
    const p = projects.find((proj) => proj._id === projId)
    setFormData((prev) => ({
      ...prev,
      projectId: projId,
      clientId: p?.clientId?._id || p?.clientId || prev.clientId,
      campaignId: p?.campaignId?._id || p?.campaignId || '',
    }))
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setTypeFilter('all')
    setProjectFilter('all')
    setClientFilter('all')
    setCampaignFilter('all')
    setAssigneeFilter('all')
    setDueDateFilter('')
    setOverdueFilter(false)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      ...initialFormData,
      projectId: projects[0]?._id || '',
      clientId: projects[0]?.clientId?._id || projects[0]?.clientId || '',
      campaignId: projects[0]?.campaignId?._id || projects[0]?.campaignId || '',
    })
    setFormErrors({})
    setIsAddModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (task) => {
    setSelectedTask(task)
    const checklistStr = (task.checklist || []).map((item) => item.title).join('\n')
    setFormData({
      title: task.title || '',
      description: task.description || '',
      projectId: task.projectId?._id || task.projectId || '',
      clientId: task.clientId?._id || task.clientId || '',
      campaignId: task.campaignId?._id || task.campaignId || '',
      taskType: task.taskType || 'Development',
      priority: task.priority || 'Medium',
      status: task.status || 'To Do',
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      progress: task.progress || 0,
      tags: (task.tags || []).join(', '),
      checklistText: checklistStr,
      notes: task.notes || '',
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  // Submit Add
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setFormErrors({ title: 'Task title is required.' })
      return
    }
    if (!formData.projectId) {
      setFormErrors({ projectId: 'Project selection is required.' })
      return
    }

    setIsSubmitting(true)
    try {
      const checklistItems = formData.checklistText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((title) => ({ title, isCompleted: false }))

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectId: formData.projectId,
        clientId: formData.clientId || undefined,
        campaignId: formData.campaignId || undefined,
        taskType: formData.taskType,
        priority: formData.priority,
        status: formData.status,
        assignedTo: formData.assignedTo || null,
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate || undefined,
        estimatedHours: Number(formData.estimatedHours) || 0,
        actualHours: Number(formData.actualHours) || 0,
        progress: Number(formData.progress) || 0,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        checklist: checklistItems,
        notes: formData.notes.trim(),
      }

      await taskService.createTask(payload)
      setFeedback({ type: 'success', message: 'Task created successfully.' })
      setIsAddModalOpen(false)
      loadTasks()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create task.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setFormErrors({ title: 'Task title is required.' })
      return
    }

    setIsSubmitting(true)
    try {
      const checklistItems = formData.checklistText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((title) => ({ title, isCompleted: false }))

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectId: formData.projectId,
        clientId: formData.clientId || null,
        campaignId: formData.campaignId || null,
        taskType: formData.taskType,
        priority: formData.priority,
        status: formData.status,
        assignedTo: formData.assignedTo || null,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
        estimatedHours: Number(formData.estimatedHours) || 0,
        actualHours: Number(formData.actualHours) || 0,
        progress: Number(formData.progress) || 0,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        checklist: checklistItems,
        notes: formData.notes.trim(),
      }

      await taskService.updateTask(selectedTask._id, payload)
      setFeedback({ type: 'success', message: 'Task updated successfully.' })
      setIsEditModalOpen(false)
      loadTasks()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update task.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Status Change
  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTask || !statusChangeValue) return

    setIsSubmitting(true)
    try {
      await taskService.updateTaskStatus(selectedTask._id, statusChangeValue)
      setFeedback({ type: 'success', message: `Task status changed to ${statusChangeValue}.` })
      setIsStatusModalOpen(false)
      loadTasks()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update task status.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Progress Change
  const handleProgressSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTask) return

    setIsSubmitting(true)
    try {
      await taskService.updateTaskProgress(selectedTask._id, Number(progressChangeValue))
      setFeedback({ type: 'success', message: `Task progress updated to ${progressChangeValue}%.` })
      setIsProgressModalOpen(false)
      loadTasks()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update task progress.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Assignee Change
  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTask) return

    setIsSubmitting(true)
    try {
      await taskService.assignTask(selectedTask._id, assigneeChangeValue || null)
      setFeedback({ type: 'success', message: 'Task assignment updated successfully.' })
      setIsAssignModalOpen(false)
      loadTasks()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to assign task.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!selectedTask) return

    setIsSubmitting(true)
    try {
      await taskService.deleteTask(selectedTask._id)
      setFeedback({ type: 'success', message: 'Task deleted successfully.' })
      setIsDeleteModalOpen(false)
      loadTasks()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete task.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Status and Priority styling variants
  const statusVariant = {
    'to do': 'neutral',
    'in progress': 'info',
    review: 'warning',
    blocked: 'error',
    completed: 'success',
    cancelled: 'neutral',
  }

  const priorityVariant = {
    low: 'neutral',
    medium: 'info',
    high: 'warning',
    critical: 'error',
  }

  const taskTypes = [
    'Development',
    'Design',
    'SEO',
    'Content',
    'Social Media',
    'Advertising',
    'Analytics',
    'Client Communication',
    'Testing',
    'Meeting',
    'Other',
  ]

  const taskStatuses = ['To Do', 'In Progress', 'Review', 'Blocked', 'Completed', 'Cancelled']
  const taskPriorities = ['Low', 'Medium', 'High', 'Critical']

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

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Tasks</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Plan, assign, track, and complete work across your projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={loadTasks} className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button
              size="sm"
              onClick={handleOpenAddModal}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards (STEP 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KpiCard
          label="Total Tasks"
          value={metrics.total || 0}
          change="All recorded tasks"
          positive={true}
          icon={ListTodo}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <KpiCard
          label="To Do"
          value={metrics.toDo || 0}
          change="Backlog & planned"
          positive={true}
          icon={Clock}
          iconBg="#F3F4F6"
          iconColor="#4B5563"
        />
        <KpiCard
          label="In Progress"
          value={metrics.inProgress || 0}
          change="Active execution"
          positive={true}
          icon={Sliders}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
        />
        <KpiCard
          label="In Review"
          value={metrics.review || metrics.inReview || 0}
          change="QA & verification"
          positive={true}
          icon={Eye}
          iconBg="#FFFBEB"
          iconColor="#D97706"
        />
        <KpiCard
          label="Completed"
          value={metrics.completed || 0}
          change={`${metrics.completionRate || 0}% completion`}
          positive={true}
          icon={CheckCircle2}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <KpiCard
          label="Overdue"
          value={metrics.overdue || 0}
          change="Past target due date"
          positive={false}
          icon={AlertTriangle}
          iconBg="#FEF2F2"
          iconColor="#DC2626"
        />
      </div>

      {/* Search and Filters Toolbar (STEP 11) */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search tasks, projects, clients..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className="w-full pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#4F46E5] bg-white transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Overdue Filter Toggle */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setOverdueFilter(!overdueFilter)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                overdueFilter
                  ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626]'
                  : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Overdue Only</span>
            </button>

            {(search ||
              statusFilter !== 'all' ||
              priorityFilter !== 'all' ||
              typeFilter !== 'all' ||
              projectFilter !== 'all' ||
              clientFilter !== 'all' ||
              campaignFilter !== 'all' ||
              assigneeFilter !== 'all' ||
              dueDateFilter ||
              overdueFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-[#DC2626] border-[#FEE2E2] hover:bg-[#FEF2F2]"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2 border-t border-[#F3F4F6]">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-xs outline-none bg-white"
            >
              <option value="all">All Statuses</option>
              {taskStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-xs outline-none bg-white"
            >
              <option value="all">All Priorities</option>
              {taskPriorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Task Type */}
          <div>
            <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Task Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-xs outline-none bg-white"
            >
              <option value="all">All Types</option>
              {taskTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Project
            </label>
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-xs outline-none bg-white truncate"
            >
              <option value="all">All Projects</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div>
            <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Client
            </label>
            <select
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-xs outline-none bg-white truncate"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Assignee
            </label>
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-xs outline-none bg-white truncate"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDateFilter}
              onChange={(e) => {
                setDueDateFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="w-full px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-xs outline-none bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Task Table (STEP 12) */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-20">
            <Loading text="Loading tasks..." />
          </div>
        ) : error ? (
          <div className="py-12">
            <ErrorState message={error} onRetry={loadTasks} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center">
            <EmptyState
              icon={ListTodo}
              title="No tasks found"
              description="No tasks match the active filters or search criteria. Create a new task to get started."
              action={
                canCreate ? (
                  <Button size="sm" onClick={handleOpenAddModal} className="bg-[#4F46E5] text-white">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create Task
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 min-w-[120px]">Progress</th>
                  <th className="py-3 px-4 text-right">Est. Hours</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {tasks.map((task) => {
                  const now = new Date()
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < now &&
                    !['Completed', 'Cancelled'].includes(task.status)

                  const assigneeName = task.assignedTo?.name || 'Unassigned'
                  const projectName = task.projectId?.name || 'Unknown Project'
                  const clientName = task.clientId?.companyName || '—'

                  return (
                    <tr
                      key={task._id}
                      className="hover:bg-[#F9FAFB] transition-colors group cursor-pointer"
                      onClick={() => navigate(`/tasks/${task._id}`)}
                    >
                      {/* Task Title & Type */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#111827] group-hover:text-[#4F46E5] transition-colors flex items-center gap-1.5">
                          <span>{task.title}</span>
                          {isOverdue && (
                            <span
                              title="Overdue task"
                              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]"
                            >
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6B7280] flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-[#4B5563]">{task.taskType || 'Development'}</span>
                          {task.checklist?.length > 0 && (
                            <span>
                              • {task.checklist.filter((i) => i.isCompleted).length}/{task.checklist.length} checklist
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4">
                        <span className="text-[#374151] font-medium block truncate max-w-[140px]">
                          {projectName}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 text-[#6B7280]">
                        <span className="block truncate max-w-[130px]">{clientName}</span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {assigneeName.charAt(0)}
                          </div>
                          <span className="text-[#374151] truncate max-w-[100px]">{assigneeName}</span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <Badge variant={priorityVariant[(task.priority || 'medium').toLowerCase()] || 'neutral'}>
                          {task.priority || 'Medium'}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={statusVariant[(task.status || 'to do').toLowerCase()] || 'neutral'}
                          withDot
                        >
                          {task.status || 'To Do'}
                        </Badge>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 text-[#4B5563]">
                        <span className={isOverdue ? 'text-[#DC2626] font-semibold' : ''}>
                          {formatDate(task.dueDate)}
                        </span>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                task.progress === 100
                                  ? 'bg-[#16A34A]'
                                  : task.progress >= 50
                                  ? 'bg-[#4F46E5]'
                                  : 'bg-[#F59E0B]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, task.progress || 0))}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-[#6B7280] font-semibold min-w-[28px] text-right">
                            {task.progress || 0}%
                          </span>
                        </div>
                      </td>

                      {/* Estimated Hours */}
                      <td className="py-3 px-4 text-right text-[#374151] font-mono">
                        {task.estimatedHours || 0}h
                      </td>

                      {/* Actions Column */}
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => e.stopPropagation()} // Prevent row click
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <Link
                            to={`/tasks/${task._id}`}
                            className="p-1.5 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded transition"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Update Progress */}
                          {canChangeProgress && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(task)
                                setProgressChangeValue(task.progress || 0)
                                setIsProgressModalOpen(true)
                              }}
                              className="p-1.5 text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded transition"
                              title="Update Progress"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Change Status */}
                          {canChangeStatus && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(task)
                                setStatusChangeValue(task.status || 'To Do')
                                setIsStatusModalOpen(true)
                              }}
                              className="p-1.5 text-[#6B7280] hover:text-[#D97706] hover:bg-[#FFFBEB] rounded transition"
                              title="Change Status"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Assign */}
                          {canAssign && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(task)
                                setAssigneeChangeValue(task.assignedTo?._id || task.assignedTo || '')
                                setIsAssignModalOpen(true)
                              }}
                              className="p-1.5 text-[#6B7280] hover:text-[#9333EA] hover:bg-[#FAF5FF] rounded transition"
                              title="Assign Task"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(task)}
                              className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded transition"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(task)
                                setIsDeleteModalOpen(true)
                              }}
                              className="p-1.5 text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination Toolbar */}
        {!isLoading && !error && tasks.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] text-xs text-[#6B7280] bg-[#F9FAFB]">
            <span>
              Showing {tasks.length} of {pagination.total} tasks
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="text-xs py-1 px-2.5"
              >
                Previous
              </Button>
              <span className="font-semibold text-[#111827]">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="text-xs py-1 px-2.5"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE TASK MODAL (STEP 13) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Task Title <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Implement OAuth login and password reset"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
              {formErrors.title && <p className="text-xs text-[#DC2626] mt-1">{formErrors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Project <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">Select Project</option>
                {projects.map((proj) => (
                  <option key={proj._id} value={proj._id}>
                    {proj.name}
                  </option>
                ))}
              </select>
              {formErrors.projectId && <p className="text-xs text-[#DC2626] mt-1">{formErrors.projectId}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Client (Auto-derived from Project)
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">No Client Linked</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Campaign (Optional)</label>
              <select
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">No Campaign Associated</option>
                {availableCampaigns.map((camp) => (
                  <option key={camp._id} value={camp._id}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Task Type</label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                {taskTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Assignee</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role?.replace('_', ' ')})
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
                {taskPriorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
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
                {taskStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Estimated Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
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
              <label className="block text-xs font-semibold text-[#374151] mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                placeholder="frontend, api, bugfix, release-v1"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Description</label>
              <textarea
                rows="2"
                placeholder="Provide task scope, implementation details, or context..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Checklist Items (One item per line)
              </label>
              <textarea
                rows="3"
                placeholder="Setup routes and models&#10;Write unit tests&#10;Verify responsive UI"
                value={formData.checklistText}
                onChange={(e) => setFormData({ ...formData, checklistText: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT TASK MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit Task"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Task Title <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
              {formErrors.title && <p className="text-xs text-[#DC2626] mt-1">{formErrors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                {projects.map((proj) => (
                  <option key={proj._id} value={proj._id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">No Client Linked</option>
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
                <option value="">No Campaign Associated</option>
                {availableCampaigns.map((camp) => (
                  <option key={camp._id} value={camp._id}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Task Type</label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                {taskTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Assignee</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role?.replace('_', ' ')})
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
                {taskPriorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
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
                {taskStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Estimated Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Actual Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.actualHours}
                onChange={(e) => setFormData({ ...formData, actualHours: e.target.value })}
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
              <label className="block text-xs font-semibold text-[#374151] mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none"
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

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Checklist Items</label>
              <textarea
                rows="3"
                value={formData.checklistText}
                onChange={(e) => setFormData({ ...formData, checklistText: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none font-mono text-xs"
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
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* STATUS CHANGE MODAL */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => !isSubmitting && setIsStatusModalOpen(false)}
        title="Change Task Status"
        size="sm"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Update status for <span className="font-semibold text-[#111827]">{selectedTask?.title}</span>.
          </p>

          <div className="space-y-2">
            {taskStatuses.map((st) => (
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
                    name="statusTaskOption"
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
              disabled={isSubmitting || statusChangeValue === selectedTask?.status}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Status'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* PROGRESS MODAL */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => !isSubmitting && setIsProgressModalOpen(false)}
        title="Update Task Progress"
        size="sm"
      >
        <form onSubmit={handleProgressSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Update progress for <span className="font-semibold text-[#111827]">{selectedTask?.title}</span>.
          </p>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#374151]">Progress</span>
              <span className="text-base font-bold text-[#4F46E5]">{progressChangeValue}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progressChangeValue}
              onChange={(e) => setProgressChangeValue(Number(e.target.value))}
              className="w-full accent-[#4F46E5] cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={progressChangeValue}
                onChange={(e) => setProgressChangeValue(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-24 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-sm text-center outline-none"
              />
              <span className="text-xs text-[#6B7280]">% completed</span>
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
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {isSubmitting ? 'Updating...' : 'Save Progress'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => !isSubmitting && setIsAssignModalOpen(false)}
        title="Assign Task"
        size="sm"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Assign <span className="font-semibold text-[#111827]">{selectedTask?.title}</span> to an organization team member.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Team Member</label>
            <select
              value={assigneeChangeValue}
              onChange={(e) => setAssigneeChangeValue(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role?.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title="Delete Task"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-[#FEF2F2] rounded-lg border border-[#FEE2E2] text-xs text-[#991B1B]">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#DC2626]" />
            <div>
              <p className="font-semibold text-sm text-[#DC2626]">Are you absolutely sure?</p>
              <p className="mt-1">
                This will permanently delete the task <span className="font-semibold">"{selectedTask?.title}"</span>.
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
              {isSubmitting ? 'Deleting...' : 'Delete Task'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TasksPage
