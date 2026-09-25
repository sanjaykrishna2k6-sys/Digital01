import mongoose from 'mongoose'
import Campaign from '../models/Campaign.js'

/**
 * GET /api/campaigns
 * List campaigns scoped to organization.
 */
export async function getCampaigns(req, res, next) {
  try {
    const { search, status, channel } = req.query

    const filter = {
      organization: req.organizationId,
    }

    if (status && status !== 'all') {
      filter.status = status
    }

    if (channel && channel !== 'all') {
      filter.channel = channel
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      filter.$or = [{ name: searchRegex }, { description: searchRegex }]
    }

    const campaigns = await Campaign.find(filter)
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      results: campaigns.length,
      data: {
        campaigns,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/campaigns/:id
 * Retrieve single campaign by ID scoped to organization.
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
      organization: req.organizationId,
    }).populate('assignedTo', 'name email avatar role')

    if (!campaign) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campaign not found in your organization workspace.',
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
 * POST /api/campaigns
 * Create a new campaign scoped to caller's organization.
 */
export async function createCampaign(req, res, next) {
  try {
    const {
      name,
      description,
      channel,
      status,
      startDate,
      endDate,
      budget,
      spent,
      targetAudience,
      goals,
      assignedTo,
      metrics,
    } = req.body

    const campaign = await Campaign.create({
      organization: req.organizationId,
      name: name.trim(),
      description: description ? description.trim() : '',
      channel: channel || 'Meta Ads',
      status: status || 'active',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budget: Number(budget || 0),
      spent: spent ? Number(spent) : 0,
      targetAudience: targetAudience ? targetAudience.trim() : '',
      goals: goals ? goals.trim() : '',
      assignedTo: assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null,
      metrics: metrics || {
        impressions: 0,
        reach: 0,
        clicks: 0,
        leads: 0,
        conversions: 0,
        spend: spent ? Number(spent) : 0,
        revenue: 0,
      },
    })

    const populated = await Campaign.findById(campaign._id).populate('assignedTo', 'name email avatar')

    res.status(201).json({
      status: 'success',
      message: 'Campaign created successfully.',
      data: {
        campaign: populated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/campaigns/:id
 * Update campaign details.
 */
export async function updateCampaign(req, res, next) {
  try {
    const { id } = req.params

    const campaign = await Campaign.findOne({
      _id: id,
      organization: req.organizationId,
    })

    if (!campaign) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campaign not found in your organization workspace.',
      })
    }

    const {
      name,
      description,
      channel,
      status,
      startDate,
      endDate,
      budget,
      spent,
      targetAudience,
      goals,
      assignedTo,
      metrics,
    } = req.body

    if (name) campaign.name = name.trim()
    if (description !== undefined) campaign.description = description.trim()
    if (channel) campaign.channel = channel
    if (status) campaign.status = status
    if (startDate) campaign.startDate = new Date(startDate)
    if (endDate) campaign.endDate = new Date(endDate)
    if (budget !== undefined) campaign.budget = Number(budget)
    if (spent !== undefined) campaign.spent = Number(spent)
    if (targetAudience !== undefined) campaign.targetAudience = targetAudience.trim()
    if (goals !== undefined) campaign.goals = goals.trim()
    if (assignedTo !== undefined) {
      campaign.assignedTo = assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null
    }
    if (metrics) {
      campaign.metrics = { ...campaign.metrics, ...metrics }
    }

    await campaign.save()

    const populated = await Campaign.findById(campaign._id).populate('assignedTo', 'name email avatar')

    res.status(200).json({
      status: 'success',
      message: 'Campaign updated successfully.',
      data: {
        campaign: populated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/campaigns/:id/status
 * Quick update of campaign status.
 */
export async function updateCampaignStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status is required.',
      })
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, organization: req.organizationId },
      { status },
      { new: true }
    ).populate('assignedTo', 'name email avatar')

    if (!campaign) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campaign not found in your organization workspace.',
      })
    }

    res.status(200).json({
      status: 'success',
      message: `Campaign status updated to ${status}.`,
      data: {
        campaign,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/campaigns/:id
 * Delete campaign.
 */
export async function deleteCampaign(req, res, next) {
  try {
    const { id } = req.params

    const campaign = await Campaign.findOneAndDelete({
      _id: id,
      organization: req.organizationId,
    })

    if (!campaign) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campaign not found in your organization workspace.',
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
