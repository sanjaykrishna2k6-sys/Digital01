import mongoose from 'mongoose'
import Project, { PROJECT_TYPES, PROJECT_STATUSES, PROJECT_PRIORITIES } from '../models/Project.js'
import Client from '../models/Client.js'
import Campaign from '../models/Campaign.js'
import User from '../models/User.js'
import {
  validateProjectInput,
  validateProjectUpdateInput,
  validateProgressInput,
} from '../validators/project.validator.js'

/**
 * Normalize status strings (e.g. 'planning' -> 'Planning', 'on_hold' -> 'On Hold')
 */
function normalizeStatus(status) {
  if (!status) return 'Planning'
  const trimmed = String(status).trim()
  if (trimmed.toLowerCase() === 'on_hold' || trimmed.toLowerCase() === 'on hold') {
    return 'On Hold'
  }
  const found = PROJECT_STATUSES.find((s) => s.toLowerCase() === trimmed.toLowerCase())
  if (!found) return trimmed
  return found.charAt(0).toUpperCase() + found.slice(1).toLowerCase()
}

/**
 * Normalize priority strings (e.g. 'high' -> 'High')
 */
function normalizePriority(priority) {
  if (!priority) return 'Medium'
  const trimmed = String(priority).trim()
  const found = PROJECT_PRIORITIES.find((p) => p.toLowerCase() === trimmed.toLowerCase())
  if (!found) return trimmed
  return found.charAt(0).toUpperCase() + found.slice(1).toLowerCase()
}

/**
 * Validate status transitions (STEP 16)
 */
function isValidStatusTransition(currentStatus, newStatus) {
  const cur = normalizeStatus(currentStatus).toLowerCase()
  const next = normalizeStatus(newStatus).toLowerCase()

  if (cur === next) return true

  const transitions = {
    planning: ['active', 'on hold', 'cancelled'],
    active: ['on hold', 'completed', 'cancelled'],
    'on hold': ['active', 'cancelled', 'completed'],
    completed: ['active', 'on hold'],
    cancelled: ['planning', 'active'],
  }

  return transitions[cur] ? transitions[cur].includes(next) : true
}

/**
 * POST /api/projects
 * Create a new project strictly scoped to the authenticated organization.
 */
export async function createProject(req, res, next) {
  try {
    const rawData = req.body || {}

    // Validation
    const validation = validateProjectInput(rawData)
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.errors[0],
        errors: validation.errors,
      })
    }

    const clientId = rawData.clientId || rawData.client

    // Verify client exists and belongs strictly to the authenticated organization
    const client = await Client.findOne({
      _id: clientId,
      organizationId: req.organizationId,
    })

    if (!client) {
      return res.status(400).json({
        status: 'fail',
        message: 'Referenced client does not exist or does not belong to your organization.',
      })
    }

    // Verify campaign if supplied belongs strictly to the authenticated organization
    const campaignId = rawData.campaignId || rawData.campaign
    let validatedCampaignId = null
    if (campaignId) {
      const campaign = await Campaign.findOne({
        _id: campaignId,
        organizationId: req.organizationId,
      })
      if (!campaign) {
        return res.status(400).json({
          status: 'fail',
          message: 'Referenced campaign does not exist or does not belong to your organization.',
        })
      }
      validatedCampaignId = campaign._id
    }

    // Verify project manager if supplied belongs strictly to the authenticated organization
    const managerId = rawData.projectManager || rawData.assignedTo
    let validatedManagerId = null
    if (managerId) {
      const managerUser = await User.findOne({
        _id: managerId,
        organization: req.organizationId,
      })
      if (!managerUser) {
        return res.status(400).json({
          status: 'fail',
          message: 'Assigned project manager does not belong to your organization.',
        })
      }
      validatedManagerId = managerUser._id
    }

    // Verify team members if supplied belong strictly to the authenticated organization
    const teamMemberIds = Array.isArray(rawData.teamMembers) ? rawData.teamMembers : []
    const validatedTeamMembers = []
    if (teamMemberIds.length > 0) {
      const matchingUsers = await User.find({
        _id: { $in: teamMemberIds },
        organization: req.organizationId,
      }).select('_id')

      if (matchingUsers.length !== teamMemberIds.length) {
        return res.status(400).json({
          status: 'fail',
          message: 'One or more assigned team members do not belong to your organization.',
        })
      }
      validatedTeamMembers.push(...matchingUsers.map((u) => u._id))
    }

    // Normalize Deliverables
    let deliverables = []
    if (Array.isArray(rawData.deliverables)) {
      deliverables = rawData.deliverables.map((d) => String(d).trim()).filter(Boolean)
    } else if (typeof rawData.deliverables === 'string' && rawData.deliverables.trim()) {
      deliverables = rawData.deliverables.split('\n').map((d) => d.trim()).filter(Boolean)
    }

    const project = await Project.create({
      organizationId: req.organizationId,
      organization: req.organizationId,
      clientId: client._id,
      client: client._id,
      campaignId: validatedCampaignId,
      campaign: validatedCampaignId,
      name: rawData.name.trim(),
      description: rawData.description ? String(rawData.description).trim() : '',
      projectType: rawData.projectType ? rawData.projectType.trim() : 'Website Development',
      status: normalizeStatus(rawData.status || 'Planning'),
      priority: normalizePriority(rawData.priority || 'Medium'),
      startDate: rawData.startDate ? new Date(rawData.startDate) : undefined,
      endDate: rawData.endDate ? new Date(rawData.endDate) : undefined,
      projectManager: validatedManagerId,
      assignedTo: validatedManagerId,
      teamMembers: validatedTeamMembers,
      budget: rawData.budget !== undefined ? Number(rawData.budget) : 0,
      currency: (rawData.currency || 'USD').toUpperCase().trim(),
      progress: rawData.progress !== undefined ? Math.max(0, Math.min(100, Number(rawData.progress))) : 0,
      goals: rawData.goals ? String(rawData.goals).trim() : '',
      deliverables,
      notes: rawData.notes ? String(rawData.notes).trim() : '',
      createdBy: req.user._id,
    })

    const populated = await Project.findById(project._id)
      .populate('clientId', 'companyName contactName email industry website')
      .populate('campaignId', 'name campaignType status budget')
      .populate('projectManager', 'name email role avatar')
      .populate('teamMembers', 'name email role avatar')
      .populate('createdBy', 'name email role')

    res.status(201).json({
      status: 'success',
      data: {
        project: populated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/projects
 * List projects scoped to authenticated organization with search, filtering, and pagination.
 */
export async function listProjects(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      projectType,
      clientId,
      campaignId,
      projectManager,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
    const skip = (pageNum - 1) * limitNum

    // Always scope to the authenticated organization
    const filter = {
      organizationId: req.organizationId,
    }

    // Role-based scoping for client users
    if (req.user?.role === 'client') {
      if (req.user.clientId) {
        filter.clientId = req.user.clientId
      }
    }

    // Status filter
    if (status && status !== 'all') {
      const norm = normalizeStatus(status)
      filter.$or = [{ status: norm }, { status: norm.toLowerCase() }]
    }

    // Priority filter
    if (priority && priority !== 'all') {
      const norm = normalizePriority(priority)
      filter.priority = norm
    }

    // Project Type filter
    if (projectType && projectType !== 'all') {
      filter.projectType = projectType
    }

    // Client filter
    if (clientId && clientId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(clientId)) {
        filter.clientId = clientId
      }
    }

    // Campaign filter
    if (campaignId && campaignId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(campaignId)) {
        filter.campaignId = campaignId
      }
    }

    // Project Manager filter
    if (projectManager && projectManager !== 'all') {
      if (mongoose.Types.ObjectId.isValid(projectManager)) {
        filter.$or = [
          { projectManager: projectManager },
          { assignedTo: projectManager },
        ]
      }
    }

    // Date range filter
    if (startDate) {
      const d = new Date(startDate)
      if (!isNaN(d.getTime())) {
        filter.startDate = { $gte: d }
      }
    }
    if (endDate) {
      const d = new Date(endDate)
      if (!isNaN(d.getTime())) {
        filter.endDate = { ...filter.endDate, $lte: d }
      }
    }

    // Text search on name, description, client company, campaign name
    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(sanitized, 'i')

      // Find matching clients
      const matchingClients = await Client.find({
        organizationId: req.organizationId,
        companyName: regex,
      }).select('_id')
      const matchingClientIds = matchingClients.map((c) => c._id)

      // Find matching campaigns
      const matchingCampaigns = await Campaign.find({
        organizationId: req.organizationId,
        name: regex,
      }).select('_id')
      const matchingCampaignIds = matchingCampaigns.map((c) => c._id)

      const searchConditions = [
        { name: regex },
        { description: regex },
        { projectType: regex },
      ]
      if (matchingClientIds.length > 0) {
        searchConditions.push({ clientId: { $in: matchingClientIds } })
      }
      if (matchingCampaignIds.length > 0) {
        searchConditions.push({ campaignId: { $in: matchingCampaignIds } })
      }

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }]
        delete filter.$or
      } else {
        filter.$or = searchConditions
      }
    }

    // Sorting
    const sort = {}
    const allowedSortFields = ['name', 'budget', 'progress', 'startDate', 'endDate', 'status', 'priority', 'createdAt', 'updatedAt']
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    sort[sortField] = sortOrder === 'asc' ? 1 : -1

    // Queries
    const [projects, total, allOrgProjects] = await Promise.all([
      Project.find(filter)
        .populate('clientId', 'companyName contactName email industry')
        .populate('campaignId', 'name campaignType status budget')
        .populate('projectManager', 'name email role avatar')
        .populate('teamMembers', 'name email role avatar')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Project.countDocuments(filter),
      Project.find({ organizationId: req.organizationId }).select('status budget progress'),
    ])

    // Compute aggregated KPI metrics for current tenant
    let totalBudget = 0
    let activeCount = 0
    let onHoldCount = 0
    let completedCount = 0
    let planningCount = 0
    let cancelledCount = 0
    let totalProgressSum = 0

    allOrgProjects.forEach((p) => {
      totalBudget += Number(p.budget) || 0
      totalProgressSum += Number(p.progress) || 0
      const st = String(p.status || '').toLowerCase()
      if (st === 'active') activeCount++
      else if (st === 'planning') planningCount++
      else if (st === 'on hold' || st === 'on_hold') onHoldCount++
      else if (st === 'completed') completedCount++
      else if (st === 'cancelled') cancelledCount++
    })

    const avgProgress = allOrgProjects.length > 0 ? Math.round(totalProgressSum / allOrgProjects.length) : 0
    const totalPages = Math.ceil(total / limitNum) || 1

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: {
        projects,
        metrics: {
          total: allOrgProjects.length,
          totalProjects: allOrgProjects.length,
          active: activeCount,
          activeProjects: activeCount,
          planning: planningCount,
          onHold: onHoldCount,
          projectsOnHold: onHoldCount,
          completed: completedCount,
          completedProjects: completedCount,
          cancelled: cancelledCount,
          totalBudget: Math.round(totalBudget * 100) / 100,
          averageProgress: avgProgress,
        },
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    })
  } catch (err) {
    next(err)
  }
}

// Backward-compatible alias
export const getProjects = listProjects

/**
 * GET /api/projects/:id
 * Retrieve a single project by ID strictly within authenticated organization.
 */
export async function getProjectById(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid project ID format.',
      })
    }

    const project = await Project.findOne({
      _id: id,
      organizationId: req.organizationId,
    })
      .populate('clientId', 'companyName contactName email phone industry website address')
      .populate('campaignId', 'name campaignType status budget startDate endDate')
      .populate('projectManager', 'name email role avatar')
      .populate('teamMembers', 'name email role avatar')
      .populate('createdBy', 'name email role')

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        project,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/projects/:id or PATCH /api/projects/:id
 * Update project details strictly within authenticated organization.
 */
export async function updateProject(req, res, next) {
  try {
    const { id } = req.params
    const rawData = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid project ID format.',
      })
    }

    const validation = validateProjectUpdateInput(rawData)
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.errors[0],
        errors: validation.errors,
      })
    }

    // Verify project exists in this organization
    const project = await Project.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      })
    }

    // Verify client if updating
    if (rawData.clientId) {
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
      project.clientId = client._id
      project.client = client._id
    }

    // Verify campaign if updating
    if (rawData.campaignId !== undefined) {
      if (rawData.campaignId === null || rawData.campaignId === '') {
        project.campaignId = null
        project.campaign = null
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
        project.campaignId = campaign._id
        project.campaign = campaign._id
      }
    }

    // Verify project manager if updating
    const managerId = rawData.projectManager || rawData.assignedTo
    if (managerId !== undefined) {
      if (managerId === null || managerId === '') {
        project.projectManager = null
        project.assignedTo = null
      } else {
        const managerUser = await User.findOne({
          _id: managerId,
          organization: req.organizationId,
        })
        if (!managerUser) {
          return res.status(400).json({
            status: 'fail',
            message: 'Assigned project manager does not belong to your organization.',
          })
        }
        project.projectManager = managerUser._id
        project.assignedTo = managerUser._id
      }
    }

    // Verify team members if updating
    if (rawData.teamMembers !== undefined) {
      if (Array.isArray(rawData.teamMembers) && rawData.teamMembers.length > 0) {
        const matchingUsers = await User.find({
          _id: { $in: rawData.teamMembers },
          organization: req.organizationId,
        }).select('_id')

        if (matchingUsers.length !== rawData.teamMembers.length) {
          return res.status(400).json({
            status: 'fail',
            message: 'One or more assigned team members do not belong to your organization.',
          })
        }
        project.teamMembers = matchingUsers.map((u) => u._id)
      } else {
        project.teamMembers = []
      }
    }

    // Update regular fields
    if (rawData.name !== undefined) project.name = rawData.name.trim()
    if (rawData.description !== undefined) project.description = String(rawData.description).trim()
    if (rawData.projectType !== undefined) project.projectType = rawData.projectType.trim()
    if (rawData.priority !== undefined) project.priority = normalizePriority(rawData.priority)
    if (rawData.budget !== undefined) project.budget = Number(rawData.budget)
    if (rawData.currency !== undefined) project.currency = String(rawData.currency).toUpperCase().trim()
    if (rawData.startDate !== undefined) {
      project.startDate = rawData.startDate ? new Date(rawData.startDate) : undefined
    }
    if (rawData.endDate !== undefined) {
      project.endDate = rawData.endDate ? new Date(rawData.endDate) : undefined
    }
    if (rawData.progress !== undefined) project.progress = Math.max(0, Math.min(100, Number(rawData.progress)))
    if (rawData.goals !== undefined) project.goals = String(rawData.goals).trim()
    if (rawData.notes !== undefined) project.notes = String(rawData.notes).trim()
    if (rawData.deliverables !== undefined) {
      if (Array.isArray(rawData.deliverables)) {
        project.deliverables = rawData.deliverables.map((d) => String(d).trim()).filter(Boolean)
      } else if (typeof rawData.deliverables === 'string') {
        project.deliverables = rawData.deliverables.split('\n').map((d) => d.trim()).filter(Boolean)
      }
    }
    if (rawData.status !== undefined) {
      project.status = normalizeStatus(rawData.status)
    }

    await project.save()

    const updated = await Project.findById(project._id)
      .populate('clientId', 'companyName contactName email industry')
      .populate('campaignId', 'name campaignType status budget')
      .populate('projectManager', 'name email role avatar')
      .populate('teamMembers', 'name email role avatar')
      .populate('createdBy', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        project: updated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/projects/:id/status
 * Update project status with transition validation (STEP 16).
 */
export async function updateProjectStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid project ID format.',
      })
    }

    if (!status || typeof status !== 'string' || !status.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status is required.',
      })
    }

    const project = await Project.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      })
    }

    const norm = normalizeStatus(status)
    const validMatch = PROJECT_STATUSES.find((s) => s.toLowerCase() === norm.toLowerCase())
    if (!validMatch) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid project status value.',
      })
    }

    // Transition validation (STEP 16)
    if (!isValidStatusTransition(project.status, norm)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid status transition from ${project.status} to ${norm}.`,
      })
    }

    project.status = norm
    await project.save()

    const updated = await Project.findById(project._id)
      .populate('clientId', 'companyName contactName email industry')
      .populate('campaignId', 'name campaignType status budget')
      .populate('projectManager', 'name email role avatar')
      .populate('teamMembers', 'name email role avatar')
      .populate('createdBy', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        project: updated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/projects/:id/progress
 * Update project progress percentage (0 - 100) (STEP 17).
 */
export async function updateProjectProgress(req, res, next) {
  try {
    const { id } = req.params
    const { progress } = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid project ID format.',
      })
    }

    const validation = validateProgressInput(progress)
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.error,
      })
    }

    const project = await Project.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      })
    }

    project.progress = validation.progress
    await project.save()

    const updated = await Project.findById(project._id)
      .populate('clientId', 'companyName contactName email industry')
      .populate('campaignId', 'name campaignType status budget')
      .populate('projectManager', 'name email role avatar')
      .populate('teamMembers', 'name email role avatar')
      .populate('createdBy', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        project: updated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/projects/:id
 * Delete a project strictly within authenticated organization.
 */
export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid project ID format.',
      })
    }

    const project = await Project.findOneAndDelete({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/projects/:id/statistics
 * Compute project progress, timeline, and budget metrics.
 */
export async function getProjectStatistics(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid project ID format.',
      })
    }

    const project = await Project.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found.',
      })
    }

    const budget = Number(project.budget) || 0
    const progress = Number(project.progress) || 0
    const estimatedSpend = Math.round(budget * (progress / 100) * 100) / 100
    const budgetRemaining = Math.max(0, Math.round((budget - estimatedSpend) * 100) / 100)

    // Timeline calculation
    const now = new Date()
    const start = new Date(project.startDate)
    const end = new Date(project.endDate)
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
    const daysElapsed = Math.max(0, Math.min(totalDays, Math.ceil((now - start) / (1000 * 60 * 60 * 24))))
    const daysRemaining = Math.max(0, totalDays - daysElapsed)
    const timeElapsedPercent = Math.min(100, Math.round((daysElapsed / totalDays) * 100))

    // Deliverables calculation
    const totalDeliverables = project.deliverables?.length || 0
    const completedDeliverables = Math.round((progress / 100) * totalDeliverables)

    res.status(200).json({
      status: 'success',
      data: {
        statistics: {
          budget,
          currency: project.currency || 'USD',
          spent: estimatedSpend,
          estimatedSpend,
          remaining: budgetRemaining,
          budgetRemaining,
          progress,
          totalTasks: totalDeliverables,
          completedTasks: completedDeliverables,
          timeline: {
            totalDays,
            daysElapsed,
            daysRemaining,
            timeElapsedPercent,
          },
          deliverables: {
            total: totalDeliverables,
            completed: completedDeliverables,
          },
          teamSize: (project.teamMembers?.length || 0) + (project.projectManager ? 1 : 0),
        },
      },
    })
  } catch (err) {
    next(err)
  }
}
