import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  IndianRupee,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  Clock,
  Layers,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Briefcase,
  Check,
  Building2,
  BarChart3,
  Sliders,
  CheckSquare,
  ListTodo,
  FileText,
  UserCheck,
  Plus,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { formatDate, formatINR } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import * as projectService from '../services/projectService'
import * as taskService from '../services/taskService'
import * as clientService from '../services/clientService'
import * as campaignService from '../services/campaignService'
import * as userService from '../services/userService'

export function ProjectDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // RBAC permissions
  const canEdit = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canChangeStatus = ['super_admin', 'agency_admin', 'account_manager'].includes(currentUser?.role)
  const canChangeProgress = ['super_admin', 'agency_admin', 'account_manager', 'team_member'].includes(currentUser?.role)
  const canDelete = ['super_admin', 'agency_admin'].includes(currentUser?.role)

  // Data states
  const [project, setProject] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [clients, setClients] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [teamMembersList, setTeamMembersList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Status & Progress update states
  const [statusValue, setStatusValue] = useState('')
  const [progressValue, setProgressValue] = useState(0)

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    campaignId: '',
    projectType: 'Website Development',
    status: 'Planning',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    projectManager: '',
    teamMembers: [],
    budget: '',
    currency: 'USD',
    progress: 0,
    goals: '',
    deliverables: '',
    description: '',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState({})

  // Task Integration states (Step 18)
  const [projectTasks, setProjectTasks] = useState([])
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    taskType: 'Development',
    priority: 'Medium',
    status: 'To Do',
    assignedTo: '',
    startDate: '',
    dueDate: '',
    estimatedHours: 0,
  })
  const [taskFormErrors, setTaskFormErrors] = useState({})

  // Load project & statistics & tasks
  const loadProjectData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [projData, statsData, tasksRes] = await Promise.all([
        projectService.getProject(id),
        projectService.getProjectStatistics(id).catch(() => null),
        taskService.getTasks({ projectId: id, limit: 100 }).catch(() => ({ data: { tasks: [] } })),
      ])
      setProject(projData)
      setStatistics(statsData)
      const tasksList = tasksRes.data?.tasks || tasksRes.tasks || []
      setProjectTasks(tasksList)
      setStatusValue(projData.status || 'Planning')
      setProgressValue(projData.progress || 0)
    } catch (err) {
      console.error('Failed to load project:', err)
      setError(err.message || 'Failed to load project details.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProjectData()
  }, [loadProjectData])

  // Load lookup options
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
        setTeamMembersList(users)
      }
    } catch (err) {
      console.error('Failed to load options:', err)
    }
  }, [])

  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  // Load campaigns when client is selected in edit form
  useEffect(() => {
    if (!formData.clientId) {
      setCampaigns([])
      return
    }
    const fetchCampaigns = async () => {
      try {
        const res = await campaignService.getCampaigns({ clientId: formData.clientId, limit: 100 })
        const camps = res.data?.campaigns || res.campaigns || []
        setCampaigns(camps)
      } catch (err) {
        console.error('Failed to load client campaigns:', err)
        setCampaigns([])
      }
    }
    fetchCampaigns()
  }, [formData.clientId])

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!project) return
    setFormData({
      name: project.name || '',
      clientId: project.clientId?._id || project.clientId || '',
      campaignId: project.campaignId?._id || project.campaignId || '',
      projectType: project.projectType || 'Website Development',
      status: project.status || 'Planning',
      priority: project.priority || 'Medium',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      projectManager: project.projectManager?._id || project.projectManager || '',
      teamMembers: (project.teamMembers || []).map((m) => (m._id ? m._id : m)),
      budget: project.budget !== undefined ? project.budget : '',
      currency: project.currency || 'USD',
      progress: project.progress !== undefined ? project.progress : 0,
      goals: project.goals || '',
      deliverables: project.deliverables || '',
      description: project.description || '',
      notes: project.notes || '',
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormErrors({ name: 'Project name is required.' })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        clientId: formData.clientId,
        campaignId: formData.campaignId || null,
        projectType: formData.projectType,
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        projectManager: formData.projectManager || null,
        teamMembers: formData.teamMembers,
        budget: formData.budget !== '' ? Number(formData.budget) : 0,
        currency: formData.currency,
        progress: Number(formData.progress),
        goals: formData.goals.trim(),
        deliverables: formData.deliverables.trim(),
        description: formData.description.trim(),
        notes: formData.notes.trim(),
      }

      await projectService.updateProject(project._id, payload)
      setFeedback({ type: 'success', message: 'Project updated successfully.' })
      setIsEditModalOpen(false)
      loadProjectData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update project.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Status Update
  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!statusValue) return

    setIsSubmitting(true)
    try {
      await projectService.updateProjectStatus(project._id, statusValue)
      setFeedback({ type: 'success', message: `Project status changed to ${statusValue}.` })
      setIsStatusModalOpen(false)
      loadProjectData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Progress Update
  const handleProgressSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await projectService.updateProjectProgress(project._id, Number(progressValue))
      setFeedback({ type: 'success', message: `Project progress updated to ${progressValue}%.` })
      setIsProgressModalOpen(false)
      loadProjectData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update progress.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete
  const handleDeleteSubmit = async () => {
    setIsSubmitting(true)
    try {
      await projectService.deleteProject(project._id)
      navigate('/projects')
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete project.' })
      setIsSubmitting(false)
    }
  }

  // Handle Create Task for this project (Step 18)
  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault()
    if (!newTaskData.title.trim()) {
      setTaskFormErrors({ title: 'Task title is required.' })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: newTaskData.title.trim(),
        description: newTaskData.description.trim(),
        projectId: id,
        clientId: project.clientId?._id || project.clientId || null,
        campaignId: project.campaignId?._id || project.campaignId || null,
        taskType: newTaskData.taskType,
        priority: newTaskData.priority,
        status: newTaskData.status,
        assignedTo: newTaskData.assignedTo || null,
        startDate: newTaskData.startDate || null,
        dueDate: newTaskData.dueDate || null,
        estimatedHours: Number(newTaskData.estimatedHours) || 0,
      }

      await taskService.createTask(payload)
      setFeedback({ type: 'success', message: 'Task created successfully for this project.' })
      setIsCreateTaskModalOpen(false)
      loadProjectData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create task.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-24">
        <Loading text="Loading project details..." />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="py-12">
        <ErrorState message={error || 'Project not found.'} onRetry={loadProjectData} />
      </div>
    )
  }

  const clientName = project.clientId?.companyName || 'Unknown Client'
  const campaignName = project.campaignId?.name || null
  const managerName = project.projectManager?.name || 'Unassigned'
  const stats = statistics || {}

  // Project Task Metrics (Step 18)
  const taskTotal = projectTasks.length
  const taskTodo = projectTasks.filter((t) => t.status === 'To Do').length
  const taskInProgress = projectTasks.filter((t) => t.status === 'In Progress').length
  const taskReview = projectTasks.filter((t) => t.status === 'Review').length
  const taskCompleted = projectTasks.filter((t) => t.status === 'Completed').length
  const taskOverdue = projectTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed' && t.status !== 'Cancelled'
  ).length

  const statusVariant = {
    planning: 'neutral',
    active: 'success',
    'on hold': 'warning',
    completed: 'primary',
    cancelled: 'error',
  }

  const priorityVariant = {
    low: 'neutral',
    medium: 'info',
    high: 'warning',
    critical: 'error',
  }

  const projectTypes = [
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
            to="/projects"
            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition"
            title="Back to Projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-[#111827]">{project.name}</h1>
              <Badge variant={statusVariant[(project.status || 'planning').toLowerCase()] || 'neutral'} withDot>
                {project.status || 'Planning'}
              </Badge>
              <Badge variant={priorityVariant[(project.priority || 'medium').toLowerCase()] || 'neutral'}>
                {project.priority || 'Medium'} Priority
              </Badge>
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Client:</span>
              <span className="font-medium text-[#111827]">{clientName}</span>
              {campaignName && (
                <>
                  <span>•</span>
                  <span>Campaign:</span>
                  <span className="font-medium text-[#4F46E5]">{campaignName}</span>
                </>
              )}
              <span>•</span>
              <span>Manager:</span>
              <span className="font-medium text-[#111827]">{managerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadProjectData} className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          {canChangeProgress && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setProgressValue(project.progress || 0)
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
                setStatusValue(project.status || 'Planning')
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

      {/* KPI Cards / Project Statistics (Step 12) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget & Spent */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Total Budget</span>
            <IndianRupee className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            {formatINR(Number(project.budget || 0))}
          </div>
          <p className="text-xs text-[#6B7280]">
            Spent: <span className="font-semibold text-[#111827]">{formatINR(Number(stats.spent || 0))}</span>
          </p>
          <p className="text-[11px] text-[#16A34A] font-medium">
            Remaining: {formatINR(Number(stats.remaining !== undefined ? stats.remaining : project.budget || 0))}
          </p>
        </Card>

        {/* Delivery Progress */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Delivery Progress</span>
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            {project.progress || 0}%
          </div>
          <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                project.progress === 100
                  ? 'bg-[#16A34A]'
                  : project.progress >= 50
                  ? 'bg-[#4F46E5]'
                  : 'bg-[#F59E0B]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }}
            />
          </div>
          <p className="text-[11px] text-[#6B7280]">
            Status: <span className="font-medium text-[#111827]">{project.status}</span>
          </p>
        </Card>

        {/* Team Members */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Assigned Team</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            {(project.teamMembers?.length || 0) + (project.projectManager ? 1 : 0)}
          </div>
          <p className="text-xs text-[#6B7280]">
            Manager: <span className="font-medium text-[#111827]">{managerName}</span>
          </p>
          <p className="text-[11px] text-[#6B7280]">
            {project.teamMembers?.length || 0} active specialists
          </p>
        </Card>

        {/* Real Tasks KPI Card (Step 18) */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Tasks & Deliverables</span>
            <CheckSquare className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <div className="text-xl font-bold text-[#111827]">
            {taskCompleted}{' '}
            <span className="text-xs font-normal text-[#6B7280]">/ {taskTotal}</span>
          </div>
          <p className="text-xs text-[#6B7280]">
            {taskTotal > 0
              ? `${Math.round((taskCompleted / taskTotal) * 100)}% tasks completed`
              : 'No tasks created yet'}
          </p>
          <p className={`text-[11px] font-medium ${taskOverdue > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
            {taskOverdue > 0 ? `${taskOverdue} overdue task${taskOverdue > 1 ? 's' : ''}` : `${taskInProgress} in progress`}
          </p>
        </Card>
      </div>

      {/* Main Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Overview, Large Progress Bar, Goals, Deliverables, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827]">Project Overview</h2>
              <Badge variant="neutral">{project.projectType || 'Website Development'}</Badge>
            </div>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              {project.description || 'No description provided for this project.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#F3F4F6] text-xs">
              <div>
                <span className="text-[#6B7280] block">Type</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{project.projectType}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Currency</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{project.currency === 'USD' ? 'INR' : (project.currency || 'INR')}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Start Date</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{formatDate(project.startDate)}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">End Date</span>
                <span className="font-semibold text-[#111827] mt-0.5 block">{formatDate(project.endDate)}</span>
              </div>
            </div>
          </Card>

          {/* Large Progress Indicator (Step 12: 0% -> 100%) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#4F46E5]" />
                Project Completion Progress
              </h2>
              <span className="text-2xl font-black text-[#111827]">{project.progress || 0}%</span>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-[#E5E7EB] rounded-full h-4 p-0.5 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    project.progress === 100
                      ? 'bg-[#16A34A]'
                      : project.progress >= 70
                      ? 'bg-[#4F46E5]'
                      : project.progress >= 30
                      ? 'bg-[#2563EB]'
                      : 'bg-[#F59E0B]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#6B7280] px-1">
                <span>0% Planning</span>
                <span>25% In Development</span>
                <span>50% Mid-Sprint</span>
                <span>75% Quality Assurance</span>
                <span>100% Completed</span>
              </div>
            </div>
          </Card>

          {/* Goals & Deliverables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#4F46E5]" />
                Project Strategic Goals
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed bg-[#F9FAFB] p-3.5 rounded-lg border border-[#E5E7EB] whitespace-pre-wrap">
                {project.goals || 'No specific goals documented.'}
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#16A34A]" />
                Key Deliverables
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed bg-[#F9FAFB] p-3.5 rounded-lg border border-[#E5E7EB] whitespace-pre-wrap">
                {project.deliverables || 'No specific deliverables outlined.'}
              </p>
            </Card>
          </div>

          {/* Internal Notes */}
          {project.notes && (
            <Card className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#6B7280]" />
                Internal Project Notes
              </h3>
              <p className="text-xs text-[#4B5563] whitespace-pre-wrap bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                {project.notes}
              </p>
            </Card>
          )}

          {/* Timeline & Milestones */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#6B7280]" />
              Project Timeline & Milestone Milestones
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">Project Kickoff</p>
                  <p className="text-[#6B7280]">{formatDate(project.startDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">Current Milestone Progress: {project.progress || 0}%</p>
                  <p className="text-[#6B7280]">Status: {project.status}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-[#9333EA] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">Target Completion & Handover</p>
                  <p className="text-[#6B7280]">{formatDate(project.endDate)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Real Project Tasks Integration Section (Step 18) */}
          <Card className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-[#4F46E5]" />
                  <h2 className="text-base font-bold text-[#111827]">Project Tasks</h2>
                  <Badge variant="primary" size="sm">{taskTotal}</Badge>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Actionable deliverables, sprint items, and team assignments for this project.
                </p>
              </div>

              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => {
                    setNewTaskData({
                      title: '',
                      description: '',
                      taskType: 'Development',
                      priority: 'Medium',
                      status: 'To Do',
                      assignedTo: '',
                      startDate: '',
                      dueDate: '',
                      estimatedHours: 0,
                    })
                    setTaskFormErrors({})
                    setIsCreateTaskModalOpen(true)
                  }}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  + Add Task
                </Button>
              )}
            </div>

            {/* Task KPIs: Total Tasks, To Do, In Progress, Review, Completed, Overdue */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
              <div className="p-2.5 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] text-center">
                <span className="text-[11px] text-[#6B7280] block font-medium">Total</span>
                <span className="text-base font-bold text-[#111827]">{taskTotal}</span>
              </div>
              <div className="p-2.5 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] text-center">
                <span className="text-[11px] text-[#6B7280] block font-medium">To Do</span>
                <span className="text-base font-bold text-[#374151]">{taskTodo}</span>
              </div>
              <div className="p-2.5 bg-[#EEF2FF] rounded-lg border border-[#C7D2FE] text-center">
                <span className="text-[11px] text-[#4F46E5] block font-medium">In Progress</span>
                <span className="text-base font-bold text-[#4F46E5]">{taskInProgress}</span>
              </div>
              <div className="p-2.5 bg-[#F5F3FF] rounded-lg border border-[#DDD6FE] text-center">
                <span className="text-[11px] text-[#7C3AED] block font-medium">Review</span>
                <span className="text-base font-bold text-[#7C3AED]">{taskReview}</span>
              </div>
              <div className="p-2.5 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0] text-center">
                <span className="text-[11px] text-[#16A34A] block font-medium">Completed</span>
                <span className="text-base font-bold text-[#16A34A]">{taskCompleted}</span>
              </div>
              <div className={`p-2.5 rounded-lg border text-center ${taskOverdue > 0 ? 'bg-[#FEF2F2] border-[#FCA5A5]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                <span className={`text-[11px] block font-medium ${taskOverdue > 0 ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}>Overdue</span>
                <span className={`text-base font-bold ${taskOverdue > 0 ? 'text-[#DC2626]' : 'text-[#111827]'}`}>{taskOverdue}</span>
              </div>
            </div>

            {/* Tasks List */}
            {projectTasks.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E5E7EB] rounded-lg">
                <CheckSquare className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-[#374151]">No tasks created for this project yet</p>
                <p className="text-xs text-[#6B7280] mt-1">Break this project down into trackable deliverables and assignments</p>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNewTaskData({
                        title: '',
                        description: '',
                        taskType: 'Development',
                        priority: 'Medium',
                        status: 'To Do',
                        assignedTo: '',
                        startDate: '',
                        dueDate: '',
                        estimatedHours: 0,
                      })
                      setTaskFormErrors({})
                      setIsCreateTaskModalOpen(true)
                    }}
                    className="mt-3 text-xs"
                  >
                    + Add First Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectTasks.map((t) => {
                  const isTaskOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed' && t.status !== 'Cancelled'
                  return (
                    <div
                      key={t._id}
                      className="p-3.5 bg-white rounded-lg border border-[#E5E7EB] hover:border-[#CBD5E1] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/tasks/${t._id}`}
                            className="font-semibold text-sm text-[#111827] hover:text-[#4F46E5] truncate"
                          >
                            {t.title}
                          </Link>
                          <Badge variant="neutral" size="sm">{t.taskType}</Badge>
                          <Badge variant={priorityVariant[(t.priority || 'medium').toLowerCase()] || 'neutral'} size="sm">
                            {t.priority}
                          </Badge>
                          <Badge variant={statusVariant[(t.status || 'todo').toLowerCase()] || 'neutral'} size="sm" withDot>
                            {t.status}
                          </Badge>
                          {isTaskOverdue && (
                            <Badge variant="error" size="sm">Overdue</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#6B7280] flex-wrap">
                          <span>Assignee: <strong className="text-[#374151] font-medium">{t.assignedTo?.name || 'Unassigned'}</strong></span>
                          <span>Due: <strong className={isTaskOverdue ? 'text-[#DC2626] font-semibold' : 'text-[#374151] font-medium'}>{formatDate(t.dueDate)}</strong></span>
                          <span>Est: <strong className="text-[#374151] font-medium">{t.estimatedHours || 0}h</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Progress Gauge */}
                        <div className="w-24">
                          <div className="flex justify-between text-[11px] font-semibold text-[#4B5563] mb-1">
                            <span>Progress</span>
                            <span>{t.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#4F46E5] h-full rounded-full"
                              style={{ width: `${t.progress || 0}%` }}
                            />
                          </div>
                        </div>

                        <Link to={`/tasks/${t._id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Team, Client Profile, Campaign Link, Metadata */}
        <div className="space-y-6">
          {/* Team Management Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#4F46E5]" />
              Assigned Team
            </h3>

            {/* Project Manager */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                Project Manager
              </span>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-xs">
                  {managerName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-xs text-[#111827]">{managerName}</p>
                  {project.projectManager?.email && (
                    <p className="text-[11px] text-[#6B7280]">{project.projectManager.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                Team Members ({project.teamMembers?.length || 0})
              </span>
              {project.teamMembers && project.teamMembers.length > 0 ? (
                <div className="space-y-2">
                  {project.teamMembers.map((member) => (
                    <div
                      key={member._id || member}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#F3F4F6] text-[#374151] flex items-center justify-center font-bold text-[11px]">
                        {(member.name || 'U').charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#111827] truncate">{member.name || 'Team Member'}</p>
                        {member.email && <p className="text-[11px] text-[#6B7280] truncate">{member.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280] italic">No team members assigned yet.</p>
              )}
            </div>
          </Card>

          {/* Client Information */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#4F46E5]" />
              Client Profile
            </h3>
            <div>
              <p className="font-bold text-base text-[#111827]">{clientName}</p>
              {project.clientId?.contactName && (
                <p className="text-xs text-[#4B5563] mt-0.5">Contact: {project.clientId.contactName}</p>
              )}
              {project.clientId?.email && (
                <p className="text-xs text-[#6B7280] mt-0.5">{project.clientId.email}</p>
              )}
            </div>
            {project.clientId?._id && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate(`/clients/${project.clientId._id}`)}
              >
                View Client Profile
              </Button>
            )}
          </Card>

          {/* Optional Campaign Link */}
          {project.campaignId && (
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#4F46E5]" />
                Associated Campaign
              </h3>
              <div>
                <p className="font-bold text-sm text-[#111827]">{campaignName}</p>
                {project.campaignId.campaignType && (
                  <Badge variant="neutral" className="mt-1">
                    {project.campaignId.campaignType}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate(`/campaigns/${project.campaignId._id || project.campaignId}`)}
              >
                View Campaign
              </Button>
            </Card>
          )}

          {/* Metadata */}
          <Card className="p-5 space-y-2 text-xs text-[#6B7280]">
            <h3 className="text-xs font-semibold text-[#374151] uppercase tracking-wider">
              System Audit
            </h3>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span>Project ID</span>
              <span className="font-mono text-[#111827]">{project._id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span>Created</span>
              <span className="text-[#111827]">{formatDate(project.createdAt)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span>Created By</span>
              <span className="text-[#111827]">{project.createdBy?.name || 'Krishpo System'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Last Modified</span>
              <span className="text-[#111827]">{formatDate(project.updatedAt)}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* EDIT MODAL */}
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
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#4F46E5]"
              />
              {formErrors.name && <p className="text-xs text-[#DC2626] mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value, campaignId: '' })}
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
              <label className="block text-xs font-semibold text-[#374151] mb-1">Campaign (Optional)</label>
              <select
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">No Campaign</option>
                {campaigns.map((camp) => (
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
                {projectTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
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
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
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
              <label className="block text-xs font-semibold text-[#374151] mb-1">Project Manager</label>
              <select
                value={formData.projectManager}
                onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
              >
                <option value="">Unassigned</option>
                {teamMembersList.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role?.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Team Members</label>
              <select
                multiple
                value={formData.teamMembers}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                  setFormData({ ...formData, teamMembers: selected })
                }}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white h-24"
              >
                {teamMembersList.map((m) => (
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
              <label className="block text-xs font-semibold text-[#374151] mb-1">Deliverables</label>
              <textarea
                rows="2"
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
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
        title="Change Project Status"
        size="sm"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Update status for <span className="font-semibold text-[#111827]">{project.name}</span>.
          </p>

          <div className="space-y-2">
            {['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'].map((st) => (
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
              disabled={isSubmitting || statusValue === project.status}
              className="bg-[#4F46E5] hover:bg-[#4338CA]"
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
        title="Update Delivery Progress"
        size="sm"
      >
        <form onSubmit={handleProgressSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Set delivery progress for <span className="font-semibold text-[#111827]">{project.name}</span>.
          </p>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#374151]">Progress Percentage</span>
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
              className="bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? 'Updating...' : 'Save Progress'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
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
                This will permanently delete the project <span className="font-semibold">"{project.name}"</span>.
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

      {/* CREATE TASK MODAL (Step 18) */}
      <Modal
        isOpen={isCreateTaskModalOpen}
        onClose={() => !isSubmitting && setIsCreateTaskModalOpen(false)}
        title={`Add Task — ${project.name}`}
        size="md"
      >
        <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Task Title <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement header navigation and mobile drawer"
              value={newTaskData.title}
              onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5]"
            />
            {taskFormErrors.title && (
              <p className="text-xs text-[#DC2626] mt-1">{taskFormErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Task Type</label>
              <select
                value={newTaskData.taskType}
                onChange={(e) => setNewTaskData({ ...newTaskData, taskType: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
              >
                {[
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
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Priority</label>
              <select
                value={newTaskData.priority}
                onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
              >
                {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Assignee</label>
              <select
                value={newTaskData.assignedTo}
                onChange={(e) => setNewTaskData({ ...newTaskData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
              >
                <option value="">Unassigned</option>
                {teamMembersList.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
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
                value={newTaskData.estimatedHours}
                onChange={(e) => setNewTaskData({ ...newTaskData, estimatedHours: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Start Date</label>
              <input
                type="date"
                value={newTaskData.startDate}
                onChange={(e) => setNewTaskData({ ...newTaskData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Due Date</label>
              <input
                type="date"
                value={newTaskData.dueDate}
                onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Task details and scope..."
              value={newTaskData.description}
              onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateTaskModalOpen(false)}
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
              {isSubmitting ? 'Creating Task...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ProjectDetailsPage
