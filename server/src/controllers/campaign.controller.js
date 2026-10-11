import mongoose from 'mongoose'
import Campaign, { CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from '../models/Campaign.js'
import Client from '../models/Client.js'
import User from '../models/User.js'
import { validateCampaignInput, validateCampaignUpdateInput } from '../validators/campaign.validator.js'

/**
 * Normalize status strings to capitalized format (e.g. 'active' -> 'Active')
 */
function normalizeStatus(status) {
  if (!status) return 'Draft'
  const trimmed = String(status).trim()
  const found = CAMPAIGN_STATUSES.find((s) => s.toLowerCase() === trimmed.toLowerCase())
  if (!found) return trimmed
  return found.charAt(0).toUpperCase() + found.slice(1).toLowerCase()
}

/**
 * Validate status transition according to Step 12 business rules
 */
function isValidStatusTransition(currentStatus, newStatus) {
  const cur = normalizeStatus(currentStatus).toLowerCase()
  const next = normalizeStatus(newStatus).toLowerCase()

  if (cur === next) return true

  const transitions = {
    draft: ['planned', 'active', 'cancelled'],
    planned: ['active', 'paused', 'cancelled', 'draft'],
    active: ['paused', 'completed', 'cancelled'],
    paused: ['active', 'completed', 'cancelled'],
    completed: ['active', 'paused', 'cancelled'],
    cancelled: ['draft', 'planned', 'active'],
  }

  return transitions[cur] ? transitions[cur].includes(next) : true
}

/**
 * POST /api/campaigns
 * Create a new campaign strictly scoped to the authenticated organization.
 */
export async function createCampaign(req, res, next) {
  try {
    const rawData = req.body || {}

    // Explicit validation check
    const validation = validateCampaignInput(rawData)
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

    // Verify campaign manager if supplied belongs strictly to the authenticated organization
    const managerId = rawData.campaignManager || rawData.assignedTo
    if (managerId) {
      const managerUser = await User.findOne({
        _id: managerId,
        organization: req.organizationId,
      })
      if (!managerUser) {
        return res.status(400).json({
          status: 'fail',
          message: 'Assigned campaign manager does not belong to your organization.',
        })
      }
    }

    // Derive and sanitize campaign data
    const campaignType = rawData.campaignType || rawData.channel || 'SEO'
    const status = normalizeStatus(rawData.status || 'Draft')
    const channels = Array.isArray(rawData.channels)
      ? rawData.channels
      : rawData.channels
      ? [rawData.channels]
      : [campaignType]

    const campaign = await Campaign.create({
      organizationId: req.organizationId,
      organization: req.organizationId,
      clientId: client._id,
      client: client._id,
      name: rawData.name.trim(),
      description: rawData.description ? String(rawData.description).trim() : '',
      campaignType,
      channel: campaignType,
      status,
      startDate: new Date(rawData.startDate),
      endDate: new Date(rawData.endDate),
      budget: Number(rawData.budget),
      currency: (rawData.currency || 'USD').toUpperCase().trim(),
      campaignManager: managerId || null,
      assignedTo: managerId || null,
      goals: rawData.goals ? String(rawData.goals).trim() : '',
      KPIs: rawData.KPIs || {},
      targetAudience: rawData.targetAudience ? String(rawData.targetAudience).trim() : '',
      channels,
      notes: rawData.notes ? String(rawData.notes).trim() : '',
      createdBy: req.user._id,
      metrics: rawData.metrics || {},
    })

    const populated = await Campaign.findById(campaign._id)
      .populate('clientId', 'companyName contactName email industry website')
      .populate('campaignManager', 'name email role avatar')
      .populate('createdBy', 'name email role')

    res.status(201).json({
      status: 'success',
      data: {
        campaign: populated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/campaigns
 * List campaigns scoped to authenticated organization with search, filtering, and pagination.
 */
export async function listCampaigns(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      campaignType,
      channel,
      clientId,
      campaignManager,
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
      // If user has a linked client document, scope to their clientId
      if (req.user.clientId) {
        filter.clientId = req.user.clientId
      }
    }

    // Status filter
    if (status && status !== 'all') {
      const norm = normalizeStatus(status)
      filter.$or = [
        { status: norm },
        { status: norm.toLowerCase() },
      ]
    }

    // Campaign Type / Channel filter
    const activeType = campaignType || channel
    if (activeType && activeType !== 'all') {
      filter.$or = [
        { campaignType: activeType },
        { channel: activeType },
        { channels: activeType },
      ]
    }

    // Client filter
    if (clientId && clientId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(clientId)) {
        filter.clientId = clientId
      }
    }

    // Campaign Manager filter
    if (campaignManager && campaignManager !== 'all') {
      if (mongoose.Types.ObjectId.isValid(campaignManager)) {
        filter.$or = [
          { campaignManager: campaignManager },
          { assignedTo: campaignManager },
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

    // Text search on name, description, campaignType
    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(sanitized, 'i')

      // Also search client names in this organization
      const matchingClients = await Client.find({
        organizationId: req.organizationId,
        companyName: regex,
      }).select('_id')
      const matchingClientIds = matchingClients.map((c) => c._id)

      const searchConditions = [
        { name: regex },
        { description: regex },
        { campaignType: regex },
        { channel: regex },
      ]
      if (matchingClientIds.length > 0) {
        searchConditions.push({ clientId: { $in: matchingClientIds } })
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
    const allowedSortFields = ['name', 'budget', 'startDate', 'endDate', 'status', 'createdAt', 'updatedAt']
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    sort[sortField] = sortOrder === 'asc' ? 1 : -1

    // Execute queries in parallel
    const [campaigns, total, allOrgCampaigns] = await Promise.all([
      Campaign.find(filter)
        .populate('clientId', 'companyName contactName email industry website')
        .populate('campaignManager', 'name email role avatar')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Campaign.countDocuments(filter),
      Campaign.find({ organizationId: req.organizationId }).select('status budget'),
    ])

    // Compute aggregated KPI metrics for current tenant
    let totalBudget = 0
    let activeCount = 0
    let plannedCount = 0
    let completedCount = 0
    let pausedCount = 0
    let draftCount = 0

    allOrgCampaigns.forEach((c) => {
      totalBudget += Number(c.budget) || 0
      const st = String(c.status || '').toLowerCase()
      if (st === 'active') activeCount++
      else if (st === 'planned' || st === 'scheduled') plannedCount++
      else if (st === 'completed') completedCount++
      else if (st === 'paused') pausedCount++
      else if (st === 'draft') draftCount++
    })

    const totalPages = Math.ceil(total / limitNum) || 1

    res.status(200).json({
      status: 'success',
      results: campaigns.length,
      data: {
        campaigns,
        metrics: {
          total: allOrgCampaigns.length,
          active: activeCount,
          planned: plannedCount,
          completed: completedCount,
          paused: pausedCount,
          draft: draftCount,
          totalBudget: Math.round(totalBudget * 100) / 100,
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
export const getCampaigns = listCampaigns

/**
 * GET /api/campaigns/:id
 * Retrieve a single campaign by ID strictly within authenticated organization.
 */
export async function getCampaignById(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid campaign ID format.',
      })
    }

    const campaign = await Campaign.findOne({
      _id: id,
      organizationId: req.organizationId,
    })
      .populate('clientId', 'companyName contactName email phone industry website address')
      .populate('campaignManager', 'name email role avatar')
      .populate('createdBy', 'name email role')

    if (!campaign) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campaign not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        campaign,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/campaigns/:id or PATCH /api/campaigns/:id
 * Update campaign details strictly within authenticated organization.
 */
export async function updateCampaign(req, res, next) {
  try {
    const { id } = req.params
    const rawData = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid campaign ID format.',
      })
    }

    const validation = validateCampaignUpdateInput(rawData)
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.errors[0],
        errors: validation.errors,
      })
    }

    // Verify campaign exists in this organization
    const campaign = await Campaign.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!campaign) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campaign not found.',
      })
    }

    // If updating client, verify target client belongs to this organization
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
      campaign.clientId = client._id
      campaign.client = client._id
    }

    // If updating campaign manager, verify belongs to this organization
    const managerId = rawData.campaignManager || rawData.assignedTo
    if (managerId !== undefined) {
      if (managerId === null || managerId === '') {
        campaign.campaignManager = null
        campaign.assignedTo = null
      } else {
        const managerUser = await User.findOne({
          _id: managerId,
          organization: req.organizationId,
        })
        if (!managerUser) {
          return res.status(400).json({
            status: 'fail',
            message: 'Assigned campaign manager does not belong to your organization.',
          })
        }
        campaign.campaignManager = managerUser._id
        campaign.assignedTo = managerUser._id
      }
    }

    // Assign updatable fields
    if (rawData.name !== undefined) campaign.name = rawData.name.trim()
    if (rawData.description !== undefined) campaign.description = String(rawData.description).trim()
    if (rawData.campaignType !== undefined) {
      campaign.campaignType = rawData.campaignType.trim()
      campaign.channel = rawData.campaignType.trim()
    }
    if (rawData.budget !== undefined) campaign.budget = Number(rawData.budget)
    if (rawData.currency !== undefined) campaign.currency = String(rawData.currency).toUpperCase().trim()
    if (rawData.startDate !== undefined) campaign.startDate = new Date(rawData.startDate)
    if (rawData.endDate !== undefined) campaign.endDate = new Date(rawData.endDate)
    if (rawData.goals !== undefined) campaign.goals = String(rawData.goals).trim()
    if (rawData.KPIs !== undefined) campaign.KPIs = rawData.KPIs
    if (rawData.targetAudience !== undefined) campaign.targetAudience = String(rawData.targetAudience).trim()
    if (rawData.channels !== undefined) {
      campaign.channels = Array.isArray(rawData.channels) ? rawData.channels : [rawData.channels]
    }
    if (rawData.notes !== undefined) campaign.notes = String(rawData.notes).trim()
    if (rawData.metrics !== undefined) campaign.metrics = { ...campaign.metrics, ...rawData.metrics }
    if (rawData.status !== undefined) {
      const newStatus = normalizeStatus(rawData.status)
      campaign.status = newStatus
    }

    await campaign.save()

    const updated = await Campaign.findById(campaign._id)
      .populate('clientId', 'companyName contactName email industry website')
      .populate('campaignManager', 'name email role avatar')
      .populate('createdBy', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        campaign: updated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/campaigns/:id/status
 * Update campaign status with transition validation.
 */
export async function updateCampaignStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid campaign ID format.',
      })
    }

    if (!status || typeof status !== 'string' || !status.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status is required.',
      })
    }

    const campaign = await Campaign.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!campaign) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campaign not found.',
      })
    }

    const norm = normalizeStatus(status)
    const validMatch = CAMPAIGN_STATUSES.find((s) => s.toLowerCase() === norm.toLowerCase())
    if (!validMatch) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid campaign status value.',
      })
    }

    // Step 12: Transition validation
    if (!isValidStatusTransition(campaign.status, norm)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid status transition from ${campaign.status} to ${norm}.`,
      })
    }

    campaign.status = norm
    await campaign.save()

    const updated = await Campaign.findById(campaign._id)
      .populate('clientId', 'companyName contactName email industry website')
      .populate('campaignManager', 'name email role avatar')
      .populate('createdBy', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        campaign: updated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign strictly within authenticated organization.
 */
export async function deleteCampaign(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid campaign ID format.',
      })
    }

    const campaign = await Campaign.findOneAndDelete({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!campaign) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campaign not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Campaign deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/campaigns/:id/statistics
 * Calculate and return campaign statistics, pacing, and KPIs.
 */
export async function getCampaignStatistics(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid campaign ID format.',
      })
    }

    const campaign = await Campaign.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!campaign) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campaign not found.',
      })
    }

    const m = campaign.metrics || {}
    const budget = Number(campaign.budget) || 0
    const spend = Number(m.spend) || 0
    const impressions = Number(m.impressions) || 0
    const reach = Number(m.reach) || 0
    const clicks = Number(m.clicks) || 0
    const conversions = Number(m.conversions) || 0
    const revenue = Number(m.revenue) || 0

    // Computed Performance Metrics
    const budgetRemaining = Math.max(0, budget - spend)
    const budgetPacing = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const cpc = clicks > 0 ? spend / clicks : 0
    const cpa = conversions > 0 ? spend / conversions : 0
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0
    const roas = spend > 0 ? revenue / spend : 0
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0

    // Duration and Daily Pacing
    const now = new Date()
    const start = new Date(campaign.startDate)
    const end = new Date(campaign.endDate)
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
    const daysElapsed = Math.max(0, Math.min(totalDays, Math.ceil((now - start) / (1000 * 60 * 60 * 24))))
    const daysRemaining = Math.max(0, totalDays - daysElapsed)
    const targetDailySpend = budget / totalDays
    const actualDailySpend = daysElapsed > 0 ? spend / daysElapsed : 0

    res.status(200).json({
      status: 'success',
      data: {
        statistics: {
          budget,
          currency: campaign.currency || 'USD',
          spend: Math.round(spend * 100) / 100,
          budgetRemaining: Math.round(budgetRemaining * 100) / 100,
          budgetPacingPercent: Math.round(budgetPacing * 10) / 10,
          impressions,
          reach,
          clicks,
          conversions,
          revenue: Math.round(revenue * 100) / 100,
          CTR: Math.round(ctr * 100) / 100,
          CPC: Math.round(cpc * 100) / 100,
          CPA: Math.round(cpa * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          ROAS: Math.round(roas * 100) / 100,
          ROI: Math.round(roi * 100) / 100,
          timeline: {
            totalDays,
            daysElapsed,
            daysRemaining,
            targetDailySpend: Math.round(targetDailySpend * 100) / 100,
            actualDailySpend: Math.round(actualDailySpend * 100) / 100,
          },
        },
      },
    })
  } catch (err) {
    next(err)
  }
}
