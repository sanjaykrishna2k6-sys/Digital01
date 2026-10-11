import mongoose from 'mongoose'
import Task, { TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js'
import Project from '../models/Project.js'
import Campaign from '../models/Campaign.js'
import Client from '../models/Client.js'
import User from '../models/User.js'
import {
  validateTaskInput,
  validateTaskUpdateInput,
  validateTaskProgressInput,
  validateTaskStatusInput,
  validateTaskAssignInput,
} from '../validators/task.validator.js'

function normalizeEnum(val, list) {
  if (!val) return list[0]
  const match = list.find((item) => item.toLowerCase() === val.trim().toLowerCase())
  return match || val.trim()
}

/**
 * Valid task status transitions:
 * To Do -> In Progress, Cancelled
 * In Progress -> Review, Blocked, Cancelled
 * Review -> In Progress, Completed
 * Blocked -> In Progress, Cancelled
 * Completed -> In Progress, Review (reopen)
 * Cancelled -> To Do, In Progress
 */
function isValidTaskStatusTransition(currentStatus, nextStatus) {
  const cur = (currentStatus || 'To Do').trim().toLowerCase()
  const next = (nextStatus || '').trim().toLowerCase()

  if (cur === next) return true

  const transitions = {
    'to do': ['in progress', 'cancelled'],
    'in progress': ['review', 'blocked', 'cancelled'],
    review: ['in progress', 'completed'],
    blocked: ['in progress', 'cancelled'],
    completed: ['in progress', 'review', 'to do'],
    cancelled: ['to do', 'in progress'],
  }

  return transitions[cur] ? transitions[cur].includes(next) : false
}

/**
 * POST /api/tasks
 * Create a new task strictly scoped to authenticated organization and verified project.
 */
export async function createTask(req, res, next) {
  try {
    const rawData = req.body || {}

    // Validation
    const validation = validateTaskInput(rawData)
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.errors[0],
        errors: validation.errors,
      })
    }

    const projectId = rawData.projectId || rawData.project

    // 1. Verify project exists and belongs strictly to the authenticated organization
    const project = await Project.findOne({
      _id: projectId,
      organizationId: req.organizationId,
    })

    if (!project) {
      return res.status(400).json({
        status: 'fail',
        message: 'Referenced project does not exist or does not belong to your organization.',
      })
    }

    // 2. Client verification & consistency with project
    const rawClientId = rawData.clientId || rawData.client
    let validatedClientId = null

    if (rawClientId) {
      const client = await Client.findOne({
        _id: rawClientId,
        organizationId: req.organizationId,
      })
      if (!client) {
        return res.status(400).json({
          status: 'fail',
          message: 'Referenced client does not exist or does not belong to your organization.',
        })
      }
      // Check consistency: if project already has a client, task client must match
      if (project.clientId && project.clientId.toString() !== client._id.toString()) {
        return res.status(400).json({
          status: 'fail',
          message: 'Referenced client does not match the project client.',
        })
      }
      validatedClientId = client._id
    } else if (project.clientId) {
      // Automatically inherit client from project if not explicitly supplied
      validatedClientId = project.clientId
    }

    // 3. Campaign verification & consistency with project
    const rawCampaignId = rawData.campaignId || rawData.campaign
    let validatedCampaignId = null

    if (rawCampaignId) {
      const campaign = await Campaign.findOne({
        _id: rawCampaignId,
        organizationId: req.organizationId,
      })
      if (!campaign) {
        return res.status(400).json({
          status: 'fail',
          message: 'Referenced campaign does not exist or does not belong to your organization.',
        })
      }
      // If project has campaignId set, task campaign should be consistent
      if (project.campaignId && project.campaignId.toString() !== campaign._id.toString()) {
        return res.status(400).json({
          status: 'fail',
          message: 'Referenced campaign does not match the project campaign.',
        })
      }
      validatedCampaignId = campaign._id
    } else if (project.campaignId) {
      // Automatically inherit campaign from project if available
      validatedCampaignId = project.campaignId
    }

    // 4. Assigned user verification
    let validatedAssignedTo = null
    if (rawData.assignedTo) {
      const user = await User.findOne({
        _id: rawData.assignedTo,
        organization: req.organizationId,
      })
      if (!user) {
        return res.status(400).json({
          status: 'fail',
          message: 'Assigned user does not belong to your organization.',
        })
      }
      validatedAssignedTo = user._id
    }

    // 5. Checklist normalization
    let checklist = []
    if (Array.isArray(rawData.checklist)) {
      checklist = rawData.checklist
        .filter((item) => item && typeof item === 'object' && item.title && String(item.title).trim())
        .map((item) => ({
          title: String(item.title).trim(),
          isCompleted: Boolean(item.isCompleted),
          completedAt: item.isCompleted ? new Date() : null,
          completedBy: item.isCompleted ? req.user._id : null,
        }))
    }

    // 6. Dependencies verification
    let validatedDependencies = []
    if (Array.isArray(rawData.dependencies) && rawData.dependencies.length > 0) {
      const existingDeps = await Task.find({
        _id: { $in: rawData.dependencies },
        organizationId: req.organizationId,
      }).select('_id')
      validatedDependencies = existingDeps.map((d) => d._id)
    }

    const taskStatus = normalizeEnum(rawData.status || 'To Do', TASK_STATUSES)
    const taskProgress = rawData.progress !== undefined ? Math.max(0, Math.min(100, Number(rawData.progress))) : 0
    const isCompleted = taskStatus === 'Completed'

    const task = await Task.create({
      organizationId: req.organizationId,
      organization: req.organizationId,
      projectId: project._id,
      project: project._id,
      campaignId: validatedCampaignId,
      campaign: validatedCampaignId,
      clientId: validatedClientId,
      client: validatedClientId,
      title: rawData.title.trim(),
      description: rawData.description ? String(rawData.description).trim() : '',
      taskType: normalizeEnum(rawData.taskType || 'Development', TASK_TYPES),
      status: taskStatus,
      priority: normalizeEnum(rawData.priority || 'Medium', TASK_PRIORITIES),
      assignedTo: validatedAssignedTo,
      createdBy: req.user._id,
      startDate: rawData.startDate ? new Date(rawData.startDate) : null,
      dueDate: rawData.dueDate ? new Date(rawData.dueDate) : null,
      estimatedHours: rawData.estimatedHours !== undefined ? Math.max(0, Number(rawData.estimatedHours)) : 0,
      actualHours: rawData.actualHours !== undefined ? Math.max(0, Number(rawData.actualHours)) : 0,
      progress: isCompleted ? 100 : taskProgress,
      tags: Array.isArray(rawData.tags) ? rawData.tags : [],
      checklist,
      dependencies: validatedDependencies,
      notes: rawData.notes ? String(rawData.notes).trim() : '',
      completedAt: isCompleted ? new Date() : null,
    })

    const populated = await Task.findById(task._id)
      .populate('projectId', 'name status priority startDate endDate')
      .populate('clientId', 'companyName contactName email')
      .populate('campaignId', 'name campaignType status')
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role')

    res.status(201).json({
      status: 'success',
      data: {
        task: populated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/tasks
 * List tasks with search, project, campaign, client, assignee, status, priority, dueDate, overdue filters and pagination.
 */
export async function listTasks(req, res, next) {
  try {
    const {
      search,
      projectId,
      project,
      campaignId,
      campaign,
      clientId,
      client,
      assignedTo,
      assignee,
      status,
      priority,
      taskType,
      dueDate,
      overdue,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const filter = {
      organizationId: req.organizationId,
    }

    // Role-specific filtering for clients
    if (req.user?.role === 'client') {
      const clientRecord = await Client.findOne({
        email: req.user.email,
        organizationId: req.organizationId,
      })
      if (clientRecord) {
        filter.clientId = clientRecord._id
      }
    }

    // Project filter
    const targetProject = projectId || project
    if (targetProject && mongoose.Types.ObjectId.isValid(targetProject)) {
      filter.projectId = targetProject
    }

    // Campaign filter
    const targetCampaign = campaignId || campaign
    if (targetCampaign && mongoose.Types.ObjectId.isValid(targetCampaign)) {
      filter.campaignId = targetCampaign
    }

    // Client filter
    const targetClient = clientId || client
    if (targetClient && mongoose.Types.ObjectId.isValid(targetClient)) {
      filter.clientId = targetClient
    }

    // Assignee filter
    const targetAssignee = assignedTo || assignee
    if (targetAssignee) {
      if (targetAssignee === 'unassigned') {
        filter.assignedTo = null
      } else if (mongoose.Types.ObjectId.isValid(targetAssignee)) {
        filter.assignedTo = targetAssignee
      }
    }

    // Status filter
    if (status && status !== 'all') {
      const match = TASK_STATUSES.find((s) => s.toLowerCase() === status.trim().toLowerCase())
      if (match) {
        filter.status = match
      }
    }

    // Priority filter
    if (priority && priority !== 'all') {
      const match = TASK_PRIORITIES.find((p) => p.toLowerCase() === priority.trim().toLowerCase())
      if (match) {
        filter.priority = match
      }
    }

    // Task Type filter
    if (taskType && taskType !== 'all') {
      const match = TASK_TYPES.find((t) => t.toLowerCase() === taskType.trim().toLowerCase())
      if (match) {
        filter.taskType = match
      }
    }

    // Due Date filter
    if (dueDate) {
      const targetDate = new Date(dueDate)
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(targetDate)
        endOfDay.setHours(23, 59, 59, 999)
        filter.dueDate = { $gte: startOfDay, $lte: endOfDay }
      }
    }

    // Overdue filter: dueDate < now and status not Completed or Cancelled
    if (overdue === 'true' || overdue === true) {
      filter.dueDate = { $lt: new Date() }
      filter.status = { $nin: ['Completed', 'Cancelled'] }
    }

    // Search filter across title and description
    if (search && search.trim()) {
      const term = search.trim()
      const searchRegex = new RegExp(term, 'i')

      // Also search matching projects or clients to include their tasks
      const [matchingProjects, matchingClients] = await Promise.all([
        Project.find({ organizationId: req.organizationId, name: searchRegex }).select('_id'),
        Client.find({ organizationId: req.organizationId, companyName: searchRegex }).select('_id'),
      ])

      const matchedProjIds = matchingProjects.map((p) => p._id)
      const matchedClientIds = matchingClients.map((c) => c._id)

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { projectId: { $in: matchedProjIds } },
        { clientId: { $in: matchedClientIds } },
      ]
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
    const skip = (pageNum - 1) * limitNum

    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1
    const sortField = ['title', 'dueDate', 'priority', 'status', 'progress', 'createdAt'].includes(sortBy)
      ? sortBy
      : 'createdAt'

    const [tasks, total, allOrgTasks] = await Promise.all([
      Task.find(filter)
        .populate('projectId', 'name status priority')
        .populate('clientId', 'companyName')
        .populate('campaignId', 'name')
        .populate('assignedTo', 'name email role avatar')
        .populate('createdBy', 'name email role')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(filter),
      Task.find({ organizationId: req.organizationId }).select('status dueDate progress estimatedHours actualHours'),
    ])

    // Compute organization task metrics
    const now = new Date()
    let toDoCount = 0
    let inProgressCount = 0
    let reviewCount = 0
    let blockedCount = 0
    let completedCount = 0
    let cancelledCount = 0
    let overdueCount = 0
    let totalEst = 0
    let totalAct = 0
    let progressSum = 0

    for (const t of allOrgTasks) {
      const st = (t.status || '').toLowerCase()
      if (st === 'to do') toDoCount++
      else if (st === 'in progress') inProgressCount++
      else if (st === 'review') reviewCount++
      else if (st === 'blocked') blockedCount++
      else if (st === 'completed') completedCount++
      else if (st === 'cancelled') cancelledCount++

      if (t.dueDate && new Date(t.dueDate) < now && !['completed', 'cancelled'].includes(st)) {
        overdueCount++
      }

      totalEst += Number(t.estimatedHours) || 0
      totalAct += Number(t.actualHours) || 0
      progressSum += Number(t.progress) || 0
    }

    const avgProgress = allOrgTasks.length > 0 ? Math.round(progressSum / allOrgTasks.length) : 0
    const completionRate =
      allOrgTasks.length > 0 ? Math.round((completedCount / allOrgTasks.length) * 100) : 0

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: {
        tasks,
        metrics: {
          total: allOrgTasks.length,
          totalTasks: allOrgTasks.length,
          toDo: toDoCount,
          inProgress: inProgressCount,
          review: reviewCount,
          inReview: reviewCount,
          blocked: blockedCount,
          completed: completedCount,
          cancelled: cancelledCount,
          overdue: overdueCount,
          averageProgress: avgProgress,
          completionRate,
          totalEstimatedHours: totalEst,
          totalActualHours: totalAct,
        },
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/tasks/:id
 * Retrieve a single task by ID strictly within authenticated organization.
 */
export async function getTaskById(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid task ID format.',
      })
    }

    const task = await Task.findOne({
      _id: id,
      organizationId: req.organizationId,
    })
      .populate('projectId', 'name status priority startDate endDate budget')
      .populate('clientId', 'companyName contactName email phone industry website')
      .populate('campaignId', 'name campaignType status budget')
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role')
      .populate('dependencies', 'title status priority dueDate')

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        task,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/tasks/:id
 * Update task details with organization, project, client, campaign, and user validation.
 */
export async function updateTask(req, res, next) {
  try {
    const { id } = req.params
    const rawData = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid task ID format.',
      })
    }

    const validation = validateTaskUpdateInput(rawData)
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.errors[0],
        errors: validation.errors,
      })
    }

    const task = await Task.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found.',
      })
    }

    // Role check: team_member can only update assigned tasks
    if (req.user?.role === 'team_member') {
      const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString()
      if (!isAssigned) {
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have permission to modify this task.',
        })
      }
    }

    // Verify project if updated
    let targetProject = null
    if (rawData.projectId) {
      targetProject = await Project.findOne({
        _id: rawData.projectId,
        organizationId: req.organizationId,
      })
      if (!targetProject) {
        return res.status(400).json({
          status: 'fail',
          message: 'Referenced project does not exist or does not belong to your organization.',
        })
      }
      task.projectId = targetProject._id
      task.project = targetProject._id
    } else {
      targetProject = await Project.findById(task.projectId)
    }

    // Verify client if updated
    if (rawData.clientId !== undefined) {
      if (rawData.clientId === null || rawData.clientId === '') {
        task.clientId = null
        task.client = null
      } else {
        const client = await Client.findOne({
          _id: rawData.clientId,
          organizationId: req.organizationId,
        })
        if (!client) {
          return res.status(400).json({
            status: 'fail',
            message: 'Referenced client does not exist or does not belong to your organization.',
          })
        }
        if (targetProject && targetProject.clientId && targetProject.clientId.toString() !== client._id.toString()) {
          return res.status(400).json({
            status: 'fail',
            message: 'Referenced client does not match the project client.',
          })
        }
        task.clientId = client._id
        task.client = client._id
      }
    }

    // Verify campaign if updated
    if (rawData.campaignId !== undefined) {
      if (rawData.campaignId === null || rawData.campaignId === '') {
        task.campaignId = null
        task.campaign = null
      } else {
        const campaign = await Campaign.findOne({
          _id: rawData.campaignId,
          organizationId: req.organizationId,
        })
        if (!campaign) {
          return res.status(400).json({
            status: 'fail',
            message: 'Referenced campaign does not exist or does not belong to your organization.',
          })
        }
        if (targetProject && targetProject.campaignId && targetProject.campaignId.toString() !== campaign._id.toString()) {
          return res.status(400).json({
            status: 'fail',
            message: 'Referenced campaign does not match the project campaign.',
          })
        }
        task.campaignId = campaign._id
        task.campaign = campaign._id
      }
    }

    // Verify assignee if updated
    if (rawData.assignedTo !== undefined) {
      if (rawData.assignedTo === null || rawData.assignedTo === '') {
        task.assignedTo = null
      } else {
        const user = await User.findOne({
          _id: rawData.assignedTo,
          organization: req.organizationId,
        })
        if (!user) {
          return res.status(400).json({
            status: 'fail',
            message: 'Assigned user does not belong to your organization.',
          })
        }
        task.assignedTo = user._id
      }
    }

    // Update regular fields
    if (rawData.title !== undefined) task.title = rawData.title.trim()
    if (rawData.description !== undefined) task.description = String(rawData.description).trim()
    if (rawData.taskType !== undefined) task.taskType = normalizeEnum(rawData.taskType, TASK_TYPES)
    if (rawData.priority !== undefined) task.priority = normalizeEnum(rawData.priority, TASK_PRIORITIES)
    if (rawData.startDate !== undefined) {
      task.startDate = rawData.startDate ? new Date(rawData.startDate) : null
    }
    if (rawData.dueDate !== undefined) {
      task.dueDate = rawData.dueDate ? new Date(rawData.dueDate) : null
    }
    if (rawData.estimatedHours !== undefined) {
      task.estimatedHours = Math.max(0, Number(rawData.estimatedHours))
    }
    if (rawData.actualHours !== undefined) {
      task.actualHours = Math.max(0, Number(rawData.actualHours))
    }
    if (rawData.tags !== undefined && Array.isArray(rawData.tags)) {
      task.tags = rawData.tags
    }
    if (rawData.notes !== undefined) {
      task.notes = String(rawData.notes).trim()
    }
    if (rawData.checklist !== undefined && Array.isArray(rawData.checklist)) {
      task.checklist = rawData.checklist
        .filter((i) => i && typeof i === 'object' && i.title && String(i.title).trim())
        .map((i) => ({
          title: String(i.title).trim(),
          isCompleted: Boolean(i.isCompleted),
          completedAt: i.isCompleted ? (i.completedAt || new Date()) : null,
          completedBy: i.isCompleted ? (i.completedBy || req.user._id) : null,
        }))
    }
    if (rawData.dependencies !== undefined && Array.isArray(rawData.dependencies)) {
      task.dependencies = rawData.dependencies
    }

    // Handle status changes & completion
    if (rawData.status !== undefined) {
      const nextStatus = normalizeEnum(rawData.status, TASK_STATUSES)
      if (nextStatus !== task.status) {
        if (!isValidTaskStatusTransition(task.status, nextStatus)) {
          return res.status(400).json({
            status: 'fail',
            message: `Invalid status transition from "${task.status}" to "${nextStatus}".`,
          })
        }
        task.status = nextStatus
        if (nextStatus === 'Completed') {
          task.completedAt = new Date()
          task.progress = 100
        } else {
          task.completedAt = null
        }
      }
    }

    if (rawData.progress !== undefined) {
      const nextProgress = Math.max(0, Math.min(100, Number(rawData.progress)))
      task.progress = nextProgress
      if (nextProgress === 100 && task.status !== 'Completed') {
        task.status = 'Completed'
        task.completedAt = new Date()
      }
    }

    await task.save()

    const updated = await Task.findById(task._id)
      .populate('projectId', 'name status priority')
      .populate('clientId', 'companyName')
      .populate('campaignId', 'name')
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role')

    res.status(200).json({
      status: 'success',
      data: {
        task: updated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/tasks/:id
 * Permanently delete task scoped to organization.
 */
export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid task ID format.',
      })
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/tasks/:id/status
 * Update status enforcing valid transitions, RBAC permissions, and recording completedAt.
 */
export async function updateTaskStatus(req, res, next) {
  try {
    const { id } = req.params
    const rawData = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid task ID format.',
      })
    }

    const validation = validateTaskStatusInput(rawData)
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.errors[0],
      })
    }

    const task = await Task.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found.',
      })
    }

    // Role check: team_member can only update status on assigned tasks
    if (req.user?.role === 'team_member') {
      const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString()
      if (!isAssigned) {
        return res.status(403).json({
          status: 'fail',
          message: 'Team members can only update status on tasks assigned to them.',
        })
      }
    }

    const nextStatus = normalizeEnum(rawData.status, TASK_STATUSES)

    if (nextStatus !== task.status) {
      if (!isValidTaskStatusTransition(task.status, nextStatus)) {
        return res.status(400).json({
          status: 'fail',
          message: `Invalid status transition from "${task.status}" to "${nextStatus}".`,
        })
      }

      task.status = nextStatus
      if (nextStatus === 'Completed') {
        task.completedAt = new Date()
        task.progress = 100
      } else {
        task.completedAt = null
      }

      await task.save()
    }

    const updated = await Task.findById(task._id)
      .populate('projectId', 'name status priority')
      .populate('clientId', 'companyName')
      .populate('campaignId', 'name')
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role')

    res.status(200).json({
      status: 'success',
      data: {
        task: updated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/tasks/:id/progress
 * Update progress percentage (0 - 100).
 */
export async function updateTaskProgress(req, res, next) {
  try {
    const { id } = req.params
    const rawData = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid task ID format.',
      })
    }

    const validation = validateTaskProgressInput(rawData)
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.errors[0],
      })
    }

    const task = await Task.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found.',
      })
    }

    // Role check: team_member can only update progress on assigned tasks
    if (req.user?.role === 'team_member') {
      const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString()
      if (!isAssigned) {
        return res.status(403).json({
          status: 'fail',
          message: 'Team members can only update progress on tasks assigned to them.',
        })
      }
    }

    const newProgress = Math.max(0, Math.min(100, Number(rawData.progress)))
    task.progress = newProgress

    if (newProgress === 100 && task.status !== 'Completed') {
      task.status = 'Completed'
      task.completedAt = new Date()
    }

    await task.save()

    const updated = await Task.findById(task._id)
      .populate('projectId', 'name status priority')
      .populate('clientId', 'companyName')
      .populate('campaignId', 'name')
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role')

    res.status(200).json({
      status: 'success',
      data: {
        task: updated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/tasks/:id/assign
 * Assign task to an organization user.
 */
export async function assignTask(req, res, next) {
  try {
    const { id } = req.params
    const rawData = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid task ID format.',
      })
    }

    const validation = validateTaskAssignInput(rawData)
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.errors[0],
      })
    }

    const task = await Task.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found.',
      })
    }

    // Validate assignee belongs to organization
    const rawAssignee = rawData.assignedTo || rawData.userId
    if (rawAssignee) {
      const user = await User.findOne({
        _id: rawAssignee,
        organization: req.organizationId,
      })
      if (!user) {
        return res.status(400).json({
          status: 'fail',
          message: 'Assigned user does not belong to your organization.',
        })
      }
      task.assignedTo = user._id
    } else {
      task.assignedTo = null
    }

    await task.save()

    const updated = await Task.findById(task._id)
      .populate('projectId', 'name status priority')
      .populate('clientId', 'companyName')
      .populate('campaignId', 'name')
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role')

    res.status(200).json({
      status: 'success',
      data: {
        task: updated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/tasks/statistics
 * Compute organization-wide task KPIs and execution rates.
 */
export async function getTaskStatistics(req, res, next) {
  try {
    const tasks = await Task.find({ organizationId: req.organizationId })

    const now = new Date()
    let toDoCount = 0
    let inProgressCount = 0
    let reviewCount = 0
    let blockedCount = 0
    let completedCount = 0
    let cancelledCount = 0
    let overdueCount = 0
    let totalEst = 0
    let totalAct = 0
    let progressSum = 0

    for (const t of tasks) {
      const st = (t.status || '').toLowerCase()
      if (st === 'to do') toDoCount++
      else if (st === 'in progress') inProgressCount++
      else if (st === 'review') reviewCount++
      else if (st === 'blocked') blockedCount++
      else if (st === 'completed') completedCount++
      else if (st === 'cancelled') cancelledCount++

      if (t.dueDate && new Date(t.dueDate) < now && !['completed', 'cancelled'].includes(st)) {
        overdueCount++
      }

      totalEst += Number(t.estimatedHours) || 0
      totalAct += Number(t.actualHours) || 0
      progressSum += Number(t.progress) || 0
    }

    const total = tasks.length
    const avgProgress = total > 0 ? Math.round(progressSum / total) : 0
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0

    res.status(200).json({
      status: 'success',
      data: {
        statistics: {
          totalTasks: total,
          total,
          toDo: toDoCount,
          inProgress: inProgressCount,
          review: reviewCount,
          inReview: reviewCount,
          blocked: blockedCount,
          completed: completedCount,
          cancelled: cancelledCount,
          overdue: overdueCount,
          overdueTasks: overdueCount,
          averageProgress: avgProgress,
          completionRate,
          totalEstimatedHours: totalEst,
          totalActualHours: totalAct,
          byStatus: {
            toDo: toDoCount,
            inProgress: inProgressCount,
            review: reviewCount,
            blocked: blockedCount,
            completed: completedCount,
            cancelled: cancelledCount,
          },
          byPriority: {
            low: tasks.filter(t => t.priority === 'Low').length,
            medium: tasks.filter(t => t.priority === 'Medium').length,
            high: tasks.filter(t => t.priority === 'High').length,
            critical: tasks.filter(t => t.priority === 'Critical').length,
          },
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/tasks/:id/statistics
 * Compute single task progress, checklist, and time tracking metrics.
 */
export async function getTaskDetailsStatistics(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid task ID format.',
      })
    }

    const task = await Task.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found.',
      })
    }

    const estimatedHours = Number(task.estimatedHours) || 0
    const actualHours = Number(task.actualHours) || 0
    const varianceHours = Math.round((estimatedHours - actualHours) * 100) / 100

    const checklistTotal = task.checklist?.length || 0
    const checklistCompleted = task.checklist?.filter((i) => i.isCompleted).length || 0
    const checklistPercent = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0

    const now = new Date()
    const isOverdue =
      Boolean(task.dueDate) &&
      new Date(task.dueDate) < now &&
      !['Completed', 'Cancelled'].includes(task.status)

    res.status(200).json({
      status: 'success',
      data: {
        statistics: {
          taskId: task._id,
          progress: task.progress || 0,
          status: task.status,
          priority: task.priority,
          estimatedHours,
          actualHours,
          varianceHours,
          isOverdue,
          checklist: {
            total: checklistTotal,
            completed: checklistCompleted,
            percent: checklistPercent,
          },
        },
      },
    })
  } catch (err) {
    next(err)
  }
}
