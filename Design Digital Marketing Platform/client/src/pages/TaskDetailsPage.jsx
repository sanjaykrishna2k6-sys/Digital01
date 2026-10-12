import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp,
  User,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  Edit2,
  Trash2,
  RefreshCw,
  Briefcase,
  Building2,
  Sliders,
  Check,
  UserCheck,
  CheckSquare,
  Square,
  FileText,
  ListTodo,
  ShieldAlert,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import * as taskService from '../services/taskService'
import * as projectService from '../services/projectService'
import * as clientService from '../services/clientService'
import * as campaignService from '../services/campaignService'
import * as userService from '../services/userService'

export function TaskDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // RBAC permissions
  const canEdit = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canChangeStatus = ['super_admin', 'agency_admin', 'account_manager', 'team_member'].includes(currentUser?.role)
  const canChangeProgress = ['super_admin', 'agency_admin', 'account_manager', 'team_member'].includes(currentUser?.role)
  const canAssign = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canDelete = ['super_admin', 'agency_admin'].includes(currentUser?.role)

  // Data states
  const [task, setTask] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form & Quick Action states
  const [formData, setFormData] = useState({
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
    notes: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [statusValue, setStatusValue] = useState('')
  const [progressValue, setProgressValue] = useState(0)
  const [assigneeValue, setAssigneeValue] = useState('')

  // Load Task & Statistics
  const loadTaskData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [taskData, statsData] = await Promise.all([
        taskService.getTask(id),
        taskService.getTaskDetailsStatistics(id).catch(() => null),
      ])
      setTask(taskData)
      setStatistics(statsData)
      setStatusValue(taskData.status || 'To Do')
      setProgressValue(taskData.progress || 0)
      setAssigneeValue(taskData.assignedTo?._id || taskData.assignedTo || '')
    } catch (err) {
      console.error('Failed to load task:', err)
      setError(err.message || 'Failed to load task details.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadTaskData()
  }, [loadTaskData])

  // Load lookups
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
      console.error('Failed to load lookups:', err)
    }
  }, [])

  useEffect(() => {
    loadLookups()
  }, [loadLookups])

  // Toggle checklist item completion
  const handleToggleChecklistItem = async (index) => {
    if (!task) return
    const updatedChecklist = [...(task.checklist || [])]
    const currentItem = updatedChecklist[index]
    if (!currentItem) return

    const newCompleted = !currentItem.isCompleted
    updatedChecklist[index] = {
      ...currentItem,
      isCompleted: newCompleted,
      completedAt: newCompleted ? new Date() : null,
      completedBy: newCompleted ? currentUser?._id : null,
    }

    // Auto-update progress based on checklist completion ratio if items exist
    const completedCount = updatedChecklist.filter((i) => i.isCompleted).length
    const calcProgress = Math.round((completedCount / updatedChecklist.length) * 100)

    try {
      const updated = await taskService.updateTask(task._id, {
        checklist: updatedChecklist,
        progress: calcProgress,
        status: calcProgress === 100 ? 'Completed' : task.status,
      })
      setTask(updated)
      setFeedback({ type: 'success', message: 'Checklist updated.' })
      loadTaskData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update checklist.' })
    }
  }

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!task) return
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
      notes: task.notes || '',
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setFormErrors({ title: 'Task title is required.' })
      return
    }

    setIsSubmitting(true)
    try {
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
        notes: formData.notes.trim(),
      }

      await taskService.updateTask(task._id, payload)
      setFeedback({ type: 'success', message: 'Task updated successfully.' })
      setIsEditModalOpen(false)
      loadTaskData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update task.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Status Submit
  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!statusValue) return

    setIsSubmitting(true)
    try {
      await taskService.updateTaskStatus(task._id, statusValue)
      setFeedback({ type: 'success', message: `Task status changed to ${statusValue}.` })
      setIsStatusModalOpen(false)
      loadTaskData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Progress Submit
  const handleProgressSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await taskService.updateTaskProgress(task._id, Number(progressValue))
      setFeedback({ type: 'success', message: `Task progress updated to ${progressValue}%.` })
      setIsProgressModalOpen(false)
      loadTaskData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update progress.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Assign Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await taskService.assignTask(task._id, assigneeValue || null)
      setFeedback({ type: 'success', message: 'Task assignment updated.' })
      setIsAssignModalOpen(false)
      loadTaskData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update assignment.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete
  const handleDeleteSubmit = async () => {
    setIsSubmitting(true)
    try {
      await taskService.deleteTask(task._id)
      navigate('/tasks')
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete task.' })
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-24">
        <Loading text="Loading task details..." />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="py-12">
        <ErrorState message={error || 'Task not found.'} onRetry={loadTaskData} />
      </div>
    )
  }

  const projectName = task.projectId?.name || 'Unknown Project'
  const clientName = task.clientId?.companyName || '—'
  const campaignName = task.campaignId?.name || null
  const assigneeName = task.assignedTo?.name || 'Unassigned'
  const creatorName = task.createdBy?.name || 'Krishpo System'
  const stats = statistics || {}

  const now = new Date()
  const isOverdue =
    Boolean(task.dueDate) &&
    new Date(task.dueDate) < now &&
    !['Completed', 'Cancelled'].includes(task.status)

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

  const taskStatuses = ['To Do', 'In Progress', 'Review', 'Blocked', 'Completed', 'Cancelled']
  const taskPriorities = ['Low', 'Medium', 'High', 'Critical']
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

  const est = Number(task.estimatedHours) || 0
  const act = Number(task.actualHours) || 0
  const variance = est - act

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

      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/tasks"
            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition"
            title="Back to Tasks"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-[#111827]">{task.title}</h1>
              <Badge variant={statusVariant[(task.status || 'to do').toLowerCase()] || 'neutral'} withDot>
                {task.status || 'To Do'}
              </Badge>
              <Badge variant={priorityVariant[(task.priority || 'medium').toLowerCase()] || 'neutral'}>
                {task.priority || 'Medium'} Priority
              </Badge>
              {isOverdue && (
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]">
                  Overdue
                </span>
              )}
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Project:</span>
              <Link
                to={`/projects/${task.projectId?._id || task.projectId}`}
                className="font-medium text-[#4F46E5] hover:underline"
              >
                {projectName}
              </Link>
              {clientName !== '—' && (
                <>
                  <span>•</span>
                  <span>Client:</span>
                  <span className="font-medium text-[#111827]">{clientName}</span>
                </>
              )}
              {campaignName && (
                <>
                  <span>•</span>
                  <span>Campaign:</span>
                  <span className="font-medium text-[#4F46E5]">{campaignName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadTaskData} className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          {canChangeProgress && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setProgressValue(task.progress || 0)
                setIsProgressModalOpen(true)
              }}
              className="flex items-center gap-1.5 border-[#4F46E5] text-[#4F46E5] hover:bg-[#EEF2FF]"
            >
              <Sliders className="w-4 h-4" />
              Update Progress
            </Button>
          )}

          {canChangeStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusValue(task.status || 'To Do')
                setIsStatusModalOpen(true)
              }}
              className="flex items-center gap-1.5 border-[#D97706] text-[#D97706] hover:bg-[#FFFBEB]"
            >
              <Check className="w-4 h-4" />
              Change Status
            </Button>
          )}

          {canAssign && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAssigneeValue(task.assignedTo?._id || task.assignedTo || '')
                setIsAssignModalOpen(true)
              }}
              className="flex items-center gap-1.5 border-[#9333EA] text-[#9333EA] hover:bg-[#FAF5FF]"
            >
              <UserCheck className="w-4 h-4" />
              Assign
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

      {/* KPI Cards / Task Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress Metric */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Completion Progress</span>
            <TrendingUp className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">{task.progress || 0}%</div>
          <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
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
          <p className="text-[11px] text-[#6B7280]">Status: {task.status}</p>
        </Card>

        {/* Time Tracking (STEP 14) */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Time Tracking</span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            {act}h <span className="text-xs font-normal text-[#6B7280]">/ {est}h est.</span>
          </div>
          <p className="text-xs text-[#6B7280]">
            Variance:{' '}
            <span className={`font-semibold ${variance >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {variance >= 0 ? `+${variance}h remaining` : `${variance}h over budget`}
            </span>
          </p>
          <p className="text-[11px] text-[#6B7280]">Tracked work hours</p>
        </Card>

        {/* Checklist Count */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Checklist Tasks</span>
            <CheckSquare className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            {task.checklist?.filter((i) => i.isCompleted).length || 0}{' '}
            <span className="text-xs font-normal text-[#6B7280]">/ {task.checklist?.length || 0}</span>
          </div>
          <p className="text-xs text-[#6B7280]">
            {task.checklist?.length > 0
              ? `${Math.round(
                  ((task.checklist.filter((i) => i.isCompleted).length || 0) / task.checklist.length) * 100
                )}% items completed`
              : 'No checklist items'}
          </p>
          <p className="text-[11px] text-[#16A34A] font-medium">Interactive checklist</p>
        </Card>

        {/* Due Date & Pacing */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Target Schedule</span>
            <Calendar className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">{formatDate(task.dueDate)}</div>
          <p className="text-xs text-[#6B7280]">Started: {formatDate(task.startDate)}</p>
          <p className={`text-[11px] font-medium ${isOverdue ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
            {isOverdue ? 'Action needed: Past due date' : 'On track with milestone'}
          </p>
        </Card>
      </div>

      {/* Main Task Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Overview, Checklist, Notes, Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description & Overview */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827]">Task Description</h2>
              <Badge variant="neutral">{task.taskType || 'Development'}</Badge>
            </div>
            <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap">
              {task.description || 'No description provided for this task.'}
            </p>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F4F6] text-[#374151]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#F3F4F6] text-xs">
              <div>
                <span className="text-[#6B7280] block">Type</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{task.taskType}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Priority</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{task.priority}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Start Date</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{formatDate(task.startDate)}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Due Date</span>
                <span className={`font-semibold mt-0.5 block ${isOverdue ? 'text-[#DC2626]' : 'text-[#111827]'}`}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
            </div>
          </Card>

          {/* Large Progress Indicator (STEP 14: 0% -> 100%) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#4F46E5]" />
                Task Delivery Progress
              </h2>
              <span className="text-2xl font-black text-[#111827]">{task.progress || 0}%</span>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-[#E5E7EB] rounded-full h-4 p-0.5 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    task.progress === 100
                      ? 'bg-[#16A34A]'
                      : task.progress >= 70
                      ? 'bg-[#4F46E5]'
                      : task.progress >= 30
                      ? 'bg-[#2563EB]'
                      : 'bg-[#F59E0B]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, task.progress || 0))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#6B7280] px-1">
                <span>0% To Do</span>
                <span>25% In Progress</span>
                <span>50% Mid-Execution</span>
                <span>75% Review</span>
                <span>100% Completed</span>
              </div>
            </div>
          </Card>

          {/* Checklist (STEP 14) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#16A34A]" />
                Actionable Checklist Items
              </h2>
              <span className="text-xs text-[#6B7280]">
                {task.checklist?.filter((i) => i.isCompleted).length || 0} of {task.checklist?.length || 0} completed
              </span>
            </div>

            {task.checklist && task.checklist.length > 0 ? (
              <div className="space-y-2.5">
                {task.checklist.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    onClick={() => handleToggleChecklistItem(idx)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      item.isCompleted
                        ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]'
                        : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="mt-0.5">
                      {item.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#9CA3AF]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${item.isCompleted ? 'line-through text-[#6B7280]' : ''}`}>
                        {item.title}
                      </p>
                      {item.completedAt && (
                        <p className="text-[10px] text-[#16A34A] mt-0.5">
                          Completed on {formatDate(item.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6B7280] italic bg-[#F9FAFB] p-3.5 rounded-lg border border-[#E5E7EB]">
                No checklist items defined for this task. Click Edit to add actionable checkpoints.
              </p>
            )}
          </Card>

          {/* Dependencies (STEP 14) */}
          {task.dependencies && task.dependencies.length > 0 && (
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#D97706]" />
                Task Dependencies
              </h3>
              <div className="space-y-2">
                {task.dependencies.map((dep) => (
                  <div
                    key={dep._id || dep}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs"
                  >
                    <span className="font-semibold text-[#111827]">{dep.title || dep}</span>
                    <Badge variant={statusVariant[(dep.status || 'to do').toLowerCase()] || 'neutral'}>
                      {dep.status || 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Internal Notes */}
          {task.notes && (
            <Card className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#6B7280]" />
                Internal Task Notes
              </h3>
              <p className="text-xs text-[#4B5563] whitespace-pre-wrap bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                {task.notes}
              </p>
            </Card>
          )}

          {/* Activity / Audit History (STEP 14) */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#6B7280]" />
              Activity & Audit History
            </h2>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">Task Created</p>
                  <p className="text-[#6B7280]">
                    Created by {creatorName} on {formatDate(task.createdAt)}
                  </p>
                </div>
              </div>
              {task.assignedTo && (
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#9333EA] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#111827]">Assigned to {assigneeName}</p>
                    <p className="text-[#6B7280]">Specialist assigned for execution</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">Current Status: {task.status}</p>
                  <p className="text-[#6B7280]">Progress currently at {task.progress || 0}%</p>
                </div>
              </div>
              {task.completedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#16A34A]">Task Completed</p>
                    <p className="text-[#6B7280]">Verified and marked done on {formatDate(task.completedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Assignee, Project Profile, Client Info, Metadata */}
        <div className="space-y-6">
          {/* Assignee Card */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#4F46E5]" />
              Assigned Specialist
            </h3>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
              <div className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-sm">
                {assigneeName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#111827] truncate">{assigneeName}</p>
                {task.assignedTo?.email && (
                  <p className="text-xs text-[#6B7280] truncate">{task.assignedTo.email}</p>
                )}
                {task.assignedTo?.role && (
                  <span className="text-[11px] text-[#4F46E5] font-medium">
                    {task.assignedTo.role.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Project Card */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#4F46E5]" />
              Associated Project
            </h3>
            <div>
              <p className="font-bold text-base text-[#111827]">{projectName}</p>
              {task.projectId?.projectType && (
                <Badge variant="neutral" className="mt-1">
                  {task.projectId.projectType}
                </Badge>
              )}
            </div>
            {task.projectId?._id && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate(`/projects/${task.projectId._id}`)}
              >
                View Project Details
              </Button>
            )}
          </Card>

          {/* Client Profile */}
          {task.clientId && (
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#4F46E5]" />
                Client Account
              </h3>
              <div>
                <p className="font-bold text-sm text-[#111827]">{clientName}</p>
                {task.clientId?.contactName && (
                  <p className="text-xs text-[#4B5563] mt-0.5">Contact: {task.clientId.contactName}</p>
                )}
                {task.clientId?.email && (
                  <p className="text-xs text-[#6B7280] mt-0.5">{task.clientId.email}</p>
                )}
              </div>
            </Card>
          )}

          {/* System Metadata */}
          <Card className="p-5 space-y-2 text-xs text-[#6B7280]">
            <h3 className="text-xs font-semibold text-[#374151] uppercase tracking-wider">
              System Audit
            </h3>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span>Task ID</span>
              <span className="font-mono text-[#111827]">{task._id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span>Created By</span>
              <span className="text-[#111827]">{creatorName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span>Created</span>
              <span className="text-[#111827]">{formatDate(task.createdAt)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Last Modified</span>
              <span className="text-[#111827]">{formatDate(task.updatedAt)}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* EDIT MODAL */}
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
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            Update status for <span className="font-semibold text-[#111827]">{task.title}</span>.
          </p>

          <div className="space-y-2">
            {taskStatuses.map((st) => (
              <label
                key={st}
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                  statusValue === st
                    ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5]'
                    : 'hover:bg-[#F9FAFB] border-[#E5E7EB] text-[#374151]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="statusDetailOption"
                    value={st}
                    checked={statusValue === st}
                    onChange={(e) => setStatusValue(e.target.value)}
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
              disabled={isSubmitting || statusValue === task.status}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Status'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* UPDATE PROGRESS MODAL */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => !isSubmitting && setIsProgressModalOpen(false)}
        title="Update Task Progress"
        size="sm"
      >
        <form onSubmit={handleProgressSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Set progress percentage for <span className="font-semibold text-[#111827]">{task.title}</span>.
          </p>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#374151]">Progress</span>
              <span className="text-base font-bold text-[#4F46E5]">{progressValue}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) => setProgressValue(Number(e.target.value))}
              className="w-full accent-[#4F46E5] cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={progressValue}
                onChange={(e) => setProgressValue(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-24 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-sm text-center outline-none"
              />
              <span className="text-xs text-[#6B7280]">% complete</span>
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
            Assign <span className="font-semibold text-[#111827]">{task.title}</span> to an organization team member.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Team Member</label>
            <select
              value={assigneeValue}
              onChange={(e) => setAssigneeValue(e.target.value)}
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
                This will permanently delete the task <span className="font-semibold">"{task.title}"</span>.
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

export default TaskDetailsPage
