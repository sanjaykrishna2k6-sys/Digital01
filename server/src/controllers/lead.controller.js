import mongoose from 'mongoose'
import Lead from '../models/Lead.js'

/**
 * GET /api/leads
 */
export async function getLeads(req, res, next) {
  try {
    const { search, status, source } = req.query

    const filter = {
      organization: req.organizationId,
    }

    if (status && status !== 'all') {
      filter.status = status
    }

    if (source && source !== 'all') {
      filter.source = source
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { company: searchRegex }]
    }

    const leads = await Lead.find(filter)
      .populate('campaign', 'name channel')
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      results: leads.length,
      data: {
        leads,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/leads/:id
 */
export async function getLeadById(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid lead ID format.',
      })
    }

    const lead = await Lead.findOne({
      _id: id,
      organization: req.organizationId,
    })
      .populate('campaign', 'name channel budget status')
      .populate('assignedTo', 'name email avatar role')

    if (!lead) {
      return res.status(404).json({
        status: 'fail',
        message: 'Lead not found in your organization workspace.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        lead,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/leads
 */
export async function createLead(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      company,
      source,
      campaign,
      status,
      leadScore,
      estimatedValue,
      assignedTo,
    } = req.body

    const lead = await Lead.create({
      organization: req.organizationId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      company: company ? company.trim() : '',
      source: source || 'Website',
      campaign: campaign && mongoose.Types.ObjectId.isValid(campaign) ? campaign : null,
      status: status || 'new',
      leadScore: leadScore !== undefined ? Number(leadScore) : 50,
      estimatedValue: estimatedValue ? Number(estimatedValue) : 0,
      assignedTo: assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null,
    })

    const populated = await Lead.findById(lead._id)
      .populate('campaign', 'name channel')
      .populate('assignedTo', 'name email avatar')

    res.status(201).json({
      status: 'success',
      message: 'Lead created successfully.',
      data: {
        lead: populated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/leads/:id
 */
export async function updateLead(req, res, next) {
  try {
    const { id } = req.params

    const lead = await Lead.findOne({
      _id: id,
      organization: req.organizationId,
    })

    if (!lead) {
      return res.status(404).json({
        status: 'fail',
        message: 'Lead not found in your organization workspace.',
      })
    }

    const {
      name,
      email,
      phone,
      company,
      source,
      campaign,
      status,
      leadScore,
      estimatedValue,
      assignedTo,
    } = req.body

    if (name) lead.name = name.trim()
    if (email) lead.email = email.toLowerCase().trim()
    if (phone !== undefined) lead.phone = phone.trim()
    if (company !== undefined) lead.company = company.trim()
    if (source !== undefined) lead.source = source.trim()
    if (campaign !== undefined) {
      lead.campaign = campaign && mongoose.Types.ObjectId.isValid(campaign) ? campaign : null
    }
    if (status) lead.status = status
    if (leadScore !== undefined) lead.leadScore = Number(leadScore)
    if (estimatedValue !== undefined) lead.estimatedValue = Number(estimatedValue)
    if (assignedTo !== undefined) {
      lead.assignedTo = assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null
    }
    lead.lastContact = new Date()

    await lead.save()

    const populated = await Lead.findById(lead._id)
      .populate('campaign', 'name channel')
      .populate('assignedTo', 'name email avatar')

    res.status(200).json({
      status: 'success',
      message: 'Lead updated successfully.',
      data: {
        lead: populated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/leads/:id/status
 */
export async function updateLeadStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status is required.',
      })
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: id, organization: req.organizationId },
      { status, lastContact: new Date() },
      { new: true }
    )
      .populate('campaign', 'name channel')
      .populate('assignedTo', 'name email avatar')

    if (!lead) {
      return res.status(404).json({
        status: 'fail',
        message: 'Lead not found in your organization workspace.',
      })
    }

    res.status(200).json({
      status: 'success',
      message: `Lead status updated to ${status}.`,
      data: {
        lead,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/leads/:id
 */
export async function deleteLead(req, res, next) {
  try {
    const { id } = req.params

    const lead = await Lead.findOneAndDelete({
      _id: id,
      organization: req.organizationId,
    })

    if (!lead) {
      return res.status(404).json({
        status: 'fail',
        message: 'Lead not found in your organization workspace.',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Lead deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
}
