import mongoose from 'mongoose'
import { PROJECT_TYPES, PROJECT_STATUSES, PROJECT_PRIORITIES } from '../models/Project.js'

/**
 * Pure validator for project creation payload
 */
export function validateProjectInput(data) {
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
    errors.push('Project name is required.')
  } else if (data.name.trim().length < 2) {
    errors.push('Project name must be at least 2 characters long.')
  } else if (data.name.trim().length > 200) {
    errors.push('Project name cannot exceed 200 characters.')
  }

  // Client ID
  const rawClientId = data.clientId || data.client
  if (!rawClientId) {
    errors.push('Client ID (clientId) is required.')
  } else if (!mongoose.Types.ObjectId.isValid(rawClientId)) {
    errors.push('Client ID must be a valid ObjectId.')
  }

  // Campaign ID (optional)
  const rawCampaignId = data.campaignId || data.campaign
  if (rawCampaignId !== undefined && rawCampaignId !== null && rawCampaignId !== '') {
    if (!mongoose.Types.ObjectId.isValid(rawCampaignId)) {
      errors.push('Campaign ID must be a valid ObjectId.')
    }
  }

  // Project Type (optional)
  if (data.projectType !== undefined && (typeof data.projectType !== 'string' || !data.projectType.trim())) {
    errors.push('Project type must be a non-empty string.')
  }

  // Status (optional)
  if (data.status !== undefined) {
    if (typeof data.status !== 'string' || !data.status.trim()) {
      errors.push('Project status must be a non-empty string.')
    } else {
      const match = PROJECT_STATUSES.find(
        (s) => s.toLowerCase() === data.status.trim().toLowerCase()
      )
      if (!match) {
        errors.push('Invalid project status. Allowed values: Planning, Active, On Hold, Completed, Cancelled.')
      }
    }
  }

  // Priority (optional)
  if (data.priority !== undefined) {
    if (typeof data.priority !== 'string' || !data.priority.trim()) {
      errors.push('Project priority must be a non-empty string.')
    } else {
      const match = PROJECT_PRIORITIES.find(
        (p) => p.toLowerCase() === data.priority.trim().toLowerCase()
      )
      if (!match) {
        errors.push('Invalid project priority. Allowed values: Low, Medium, High, Critical.')
      }
    }
  }

  // Budget
  if (data.budget !== undefined && data.budget !== null && data.budget !== '') {
    const numBudget = Number(data.budget)
    if (isNaN(numBudget)) {
      errors.push('Project budget must be a number.')
    } else if (numBudget < 0) {
      errors.push('Project budget cannot be negative.')
    }
  }

  // Progress (optional)
  if (data.progress !== undefined && data.progress !== null && data.progress !== '') {
    const numProgress = Number(data.progress)
    if (isNaN(numProgress)) {
      errors.push('Progress must be a number.')
    } else if (numProgress < 0) {
      errors.push('Progress cannot be below 0%.')
    } else if (numProgress > 100) {
      errors.push('Progress cannot exceed 100%.')
    }
  }

  // Start Date & End Date (optional, but validated if provided)
  let parsedStart = null
  let parsedEnd = null

  if (data.startDate !== undefined && data.startDate !== null && data.startDate !== '') {
    parsedStart = new Date(data.startDate)
    if (isNaN(parsedStart.getTime())) {
      errors.push('Project start date must be a valid date.')
    }
  }

  if (data.endDate !== undefined && data.endDate !== null && data.endDate !== '') {
    parsedEnd = new Date(data.endDate)
    if (isNaN(parsedEnd.getTime())) {
      errors.push('Project end date must be a valid date.')
    }
  }

  if (parsedStart && parsedEnd && !isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
    if (parsedEnd < parsedStart) {
      errors.push('Project end date cannot be before start date.')
    }
  }

  // Project Manager (optional)
  const rawManager = data.projectManager || data.assignedTo
  if (rawManager !== undefined && rawManager !== null && rawManager !== '') {
    if (!mongoose.Types.ObjectId.isValid(rawManager)) {
      errors.push('Project manager must be a valid ObjectId.')
    }
  }

  // Team Members (optional)
  if (data.teamMembers !== undefined && data.teamMembers !== null) {
    if (!Array.isArray(data.teamMembers)) {
      errors.push('Team members must be an array of user IDs.')
    } else {
      for (const mId of data.teamMembers) {
        if (!mongoose.Types.ObjectId.isValid(mId)) {
          errors.push(`Invalid team member ID: ${mId}. Must be a valid ObjectId.`)
          break
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Pure validator for project update payload
 */
export function validateProjectUpdateInput(data) {
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
      errors.push('Project name cannot be empty.')
    } else if (data.name.trim().length < 2) {
      errors.push('Project name must be at least 2 characters long.')
    } else if (data.name.trim().length > 200) {
      errors.push('Project name cannot exceed 200 characters.')
    }
  }

  // Client ID
  if (data.clientId !== undefined) {
    if (!data.clientId || !mongoose.Types.ObjectId.isValid(data.clientId)) {
      errors.push('Client ID must be a valid ObjectId.')
    }
  }

  // Campaign ID
  if (data.campaignId !== undefined && data.campaignId !== null && data.campaignId !== '') {
    if (!mongoose.Types.ObjectId.isValid(data.campaignId)) {
      errors.push('Campaign ID must be a valid ObjectId.')
    }
  }

  // Budget
  if (data.budget !== undefined) {
    const numBudget = Number(data.budget)
    if (isNaN(numBudget)) {
      errors.push('Project budget must be a number.')
    } else if (numBudget < 0) {
      errors.push('Project budget cannot be negative.')
    }
  }

  // Progress
  if (data.progress !== undefined) {
    const numProgress = Number(data.progress)
    if (isNaN(numProgress)) {
      errors.push('Progress must be a number.')
    } else if (numProgress < 0) {
      errors.push('Progress cannot be below 0%.')
    } else if (numProgress > 100) {
      errors.push('Progress cannot exceed 100%.')
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
      errors.push('Project end date cannot be before start date.')
    }
  }

  // Project Manager
  const rawManager = data.projectManager || data.assignedTo
  if (rawManager !== undefined && rawManager !== null && rawManager !== '') {
    if (!mongoose.Types.ObjectId.isValid(rawManager)) {
      errors.push('Project manager must be a valid ObjectId.')
    }
  }

  // Team Members
  if (data.teamMembers !== undefined && data.teamMembers !== null) {
    if (!Array.isArray(data.teamMembers)) {
      errors.push('Team members must be an array of user IDs.')
    } else {
      for (const mId of data.teamMembers) {
        if (!mongoose.Types.ObjectId.isValid(mId)) {
          errors.push(`Invalid team member ID: ${mId}. Must be a valid ObjectId.`)
          break
        }
      }
    }
  }

  // Status
  if (data.status !== undefined) {
    const match = PROJECT_STATUSES.find(
      (s) => s.toLowerCase() === String(data.status).trim().toLowerCase()
    )
    if (!match) {
      errors.push('Invalid project status.')
    }
  }

  // Priority
  if (data.priority !== undefined) {
    const match = PROJECT_PRIORITIES.find(
      (p) => p.toLowerCase() === String(data.priority).trim().toLowerCase()
    )
    if (!match) {
      errors.push('Invalid project priority.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Pure validator for progress update
 */
export function validateProgressInput(progress) {
  if (progress === undefined || progress === null || progress === '') {
    return { isValid: false, error: 'Progress value is required.' }
  }
  const num = Number(progress)
  if (isNaN(num)) {
    return { isValid: false, error: 'Progress must be a numeric value.' }
  }
  if (num < 0) {
    return { isValid: false, error: 'Progress cannot be below 0%.' }
  }
  if (num > 100) {
    return { isValid: false, error: 'Progress cannot exceed 100%.' }
  }
  return { isValid: true, progress: Math.round(num) }
}

/**
 * Express middleware for validateCreateProject
 */
export function validateCreateProject(req, res, next) {
  const result = validateProjectInput(req.body)
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
 * Express middleware for validateUpdateProject
 */
export function validateUpdateProject(req, res, next) {
  const result = validateProjectUpdateInput(req.body)
  if (!result.isValid) {
    return res.status(400).json({
      status: 'fail',
      message: result.errors[0],
      errors: result.errors,
    })
  }
  next()
}
