import mongoose from 'mongoose'
import { CAMPAIGN_TYPES, CAMPAIGN_STATUSES } from '../models/Campaign.js'

/**
 * Pure validator for campaign creation payload
 */
export function validateCampaignInput(data) {
  const errors = []

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] }
  }

  // Anti-spoofing: reject client-supplied organizationId / organization
  if (data.organizationId !== undefined || data.organization !== undefined) {
    errors.push('Supplying organizationId in request payload is not permitted.')
  }

  // Anti-spoofing: reject client-supplied createdBy
  if (data.createdBy !== undefined) {
    errors.push('Supplying createdBy in request payload is not permitted.')
  }

  // Name
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Campaign name is required.')
  } else if (data.name.trim().length < 2) {
    errors.push('Campaign name must be at least 2 characters long.')
  } else if (data.name.trim().length > 200) {
    errors.push('Campaign name cannot exceed 200 characters.')
  }

  // Client ID
  const rawClientId = data.clientId || data.client
  if (!rawClientId) {
    errors.push('Client ID (clientId) is required.')
  } else if (!mongoose.Types.ObjectId.isValid(rawClientId)) {
    errors.push('Client ID must be a valid ObjectId.')
  }

  // Campaign Type
  if (data.campaignType !== undefined && (typeof data.campaignType !== 'string' || !data.campaignType.trim())) {
    errors.push('Campaign type must be a non-empty string.')
  }

  // Status
  if (data.status !== undefined) {
    if (typeof data.status !== 'string' || !data.status.trim()) {
      errors.push('Campaign status must be a non-empty string.')
    } else {
      const match = CAMPAIGN_STATUSES.find(
        (s) => s.toLowerCase() === data.status.trim().toLowerCase()
      )
      if (!match) {
        errors.push(`Invalid campaign status. Allowed values: Draft, Planned, Active, Paused, Completed, Cancelled.`)
      }
    }
  }

  // Budget
  if (data.budget === undefined || data.budget === null || data.budget === '') {
    errors.push('Campaign budget is required.')
  } else {
    const numBudget = Number(data.budget)
    if (isNaN(numBudget)) {
      errors.push('Campaign budget must be a number.')
    } else if (numBudget < 0) {
      errors.push('Campaign budget cannot be negative.')
    }
  }

  // Start Date & End Date
  let parsedStart = null
  let parsedEnd = null

  if (!data.startDate) {
    errors.push('Campaign start date is required.')
  } else {
    parsedStart = new Date(data.startDate)
    if (isNaN(parsedStart.getTime())) {
      errors.push('Campaign start date must be a valid date.')
    }
  }

  if (!data.endDate) {
    errors.push('Campaign end date is required.')
  } else {
    parsedEnd = new Date(data.endDate)
    if (isNaN(parsedEnd.getTime())) {
      errors.push('Campaign end date must be a valid date.')
    }
  }

  if (parsedStart && parsedEnd && !isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
    if (parsedEnd < parsedStart) {
      errors.push('Campaign end date cannot be before start date.')
    }
  }

  // Campaign Manager (optional)
  const rawManager = data.campaignManager || data.assignedTo
  if (rawManager !== undefined && rawManager !== null && rawManager !== '') {
    if (!mongoose.Types.ObjectId.isValid(rawManager)) {
      errors.push('Campaign manager must be a valid ObjectId.')
    }
  }

  // Channels (optional)
  if (data.channels !== undefined && !Array.isArray(data.channels) && typeof data.channels !== 'string') {
    errors.push('Channels must be an array of strings.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Pure validator for campaign update payload
 */
export function validateCampaignUpdateInput(data) {
  const errors = []

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] }
  }

  // Anti-spoofing
  if (data.organizationId !== undefined || data.organization !== undefined) {
    errors.push('Modifying organizationId is not permitted.')
  }
  if (data.createdBy !== undefined) {
    errors.push('Modifying createdBy is not permitted.')
  }

  // Name
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Campaign name cannot be empty.')
    } else if (data.name.trim().length < 2) {
      errors.push('Campaign name must be at least 2 characters long.')
    } else if (data.name.trim().length > 200) {
      errors.push('Campaign name cannot exceed 200 characters.')
    }
  }

  // Client ID
  if (data.clientId !== undefined) {
    if (!data.clientId || !mongoose.Types.ObjectId.isValid(data.clientId)) {
      errors.push('Client ID must be a valid ObjectId.')
    }
  }

  // Budget
  if (data.budget !== undefined) {
    const numBudget = Number(data.budget)
    if (isNaN(numBudget)) {
      errors.push('Campaign budget must be a number.')
    } else if (numBudget < 0) {
      errors.push('Campaign budget cannot be negative.')
    }
  }

  // Dates
  if (data.startDate !== undefined) {
    const d = new Date(data.startDate)
    if (isNaN(d.getTime())) {
      errors.push('Start date must be a valid date.')
    }
  }

  if (data.endDate !== undefined) {
    const d = new Date(data.endDate)
    if (isNaN(d.getTime())) {
      errors.push('End date must be a valid date.')
    }
  }

  if (data.startDate && data.endDate) {
    const s = new Date(data.startDate)
    const e = new Date(data.endDate)
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e < s) {
      errors.push('Campaign end date cannot be before start date.')
    }
  }

  // Manager
  const rawManager = data.campaignManager || data.assignedTo
  if (rawManager !== undefined && rawManager !== null && rawManager !== '') {
    if (!mongoose.Types.ObjectId.isValid(rawManager)) {
      errors.push('Campaign manager must be a valid ObjectId.')
    }
  }

  // Status
  if (data.status !== undefined) {
    const match = CAMPAIGN_STATUSES.find(
      (s) => s.toLowerCase() === String(data.status).trim().toLowerCase()
    )
    if (!match) {
      errors.push('Invalid campaign status.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Express middleware for validateCreateCampaign
 */
export function validateCreateCampaign(req, res, next) {
  const result = validateCampaignInput(req.body)
  if (!result.isValid) {
    return res.status(400).json({
      status: 'fail',
      message: result.errors[0],
      errors: result.errors,
    })
  }
  next()
}

/**
 * Express middleware for validateUpdateCampaign
 */
export function validateUpdateCampaign(req, res, next) {
  const result = validateCampaignUpdateInput(req.body)
  if (!result.isValid) {
    return res.status(400).json({
      status: 'fail',
      message: result.errors[0],
      errors: result.errors,
    })
  }
  next()
}
