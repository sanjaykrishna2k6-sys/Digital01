import mongoose from 'mongoose'
import { TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js'

/**
 * Pure validator for task creation payload.
 */
export function validateTaskInput(data) {
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

  // Title
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('Task title is required.')
  } else if (data.title.trim().length < 2) {
    errors.push('Task title must be at least 2 characters long.')
  } else if (data.title.trim().length > 250) {
    errors.push('Task title cannot exceed 250 characters.')
  }

  // Project ID
  const rawProjectId = data.projectId || data.project
  if (!rawProjectId) {
    errors.push('Project ID (projectId) is required.')
  } else if (!mongoose.Types.ObjectId.isValid(rawProjectId)) {
    errors.push('Project ID must be a valid ObjectId.')
  }

  // Client ID (optional)
  const rawClientId = data.clientId || data.client
  if (rawClientId !== undefined && rawClientId !== null && rawClientId !== '') {
    if (!mongoose.Types.ObjectId.isValid(rawClientId)) {
      errors.push('Client ID must be a valid ObjectId.')
    }
  }

  // Campaign ID (optional)
  const rawCampaignId = data.campaignId || data.campaign
  if (rawCampaignId !== undefined && rawCampaignId !== null && rawCampaignId !== '') {
    if (!mongoose.Types.ObjectId.isValid(rawCampaignId)) {
      errors.push('Campaign ID must be a valid ObjectId.')
    }
  }

  // Task Type (optional)
  if (data.taskType !== undefined && data.taskType !== null && data.taskType !== '') {
    if (typeof data.taskType !== 'string' || !data.taskType.trim()) {
      errors.push('Task type must be a non-empty string.')
    } else {
      const match = TASK_TYPES.find(
        (t) => t.toLowerCase() === data.taskType.trim().toLowerCase()
      )
      if (!match) {
        errors.push(`Invalid task type. Allowed values: ${TASK_TYPES.join(', ')}.`)
      }
    }
  }

  // Status (optional)
  if (data.status !== undefined && data.status !== null && data.status !== '') {
    if (typeof data.status !== 'string' || !data.status.trim()) {
      errors.push('Task status must be a non-empty string.')
    } else {
      const match = TASK_STATUSES.find(
        (s) => s.toLowerCase() === data.status.trim().toLowerCase()
      )
      if (!match) {
        errors.push(`Invalid task status. Allowed values: ${TASK_STATUSES.join(', ')}.`)
      }
    }
  }

  // Priority (optional)
  if (data.priority !== undefined && data.priority !== null && data.priority !== '') {
    if (typeof data.priority !== 'string' || !data.priority.trim()) {
      errors.push('Task priority must be a non-empty string.')
    } else {
      const match = TASK_PRIORITIES.find(
        (p) => p.toLowerCase() === data.priority.trim().toLowerCase()
      )
      if (!match) {
        errors.push(`Invalid task priority. Allowed values: ${TASK_PRIORITIES.join(', ')}.`)
      }
    }
  }

  // Assigned To (optional)
  const rawAssignedTo = data.assignedTo
  if (rawAssignedTo !== undefined && rawAssignedTo !== null && rawAssignedTo !== '') {
    if (!mongoose.Types.ObjectId.isValid(rawAssignedTo)) {
      errors.push('Assigned user ID must be a valid ObjectId.')
    }
  }

  // Estimated Hours (optional)
  if (data.estimatedHours !== undefined && data.estimatedHours !== null && data.estimatedHours !== '') {
    const num = Number(data.estimatedHours)
    if (isNaN(num)) {
      errors.push('Estimated hours must be a number.')
    } else if (num < 0) {
      errors.push('Estimated hours cannot be negative.')
    }
  }

  // Actual Hours (optional)
  if (data.actualHours !== undefined && data.actualHours !== null && data.actualHours !== '') {
    const num = Number(data.actualHours)
    if (isNaN(num)) {
      errors.push('Actual hours must be a number.')
    } else if (num < 0) {
      errors.push('Actual hours cannot be negative.')
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

  // Dates: startDate and dueDate
  let parsedStart = null
  let parsedDue = null

  if (data.startDate !== undefined && data.startDate !== null && data.startDate !== '') {
    parsedStart = new Date(data.startDate)
    if (isNaN(parsedStart.getTime())) {
      errors.push('Start date must be a valid date.')
    }
  }

  if (data.dueDate !== undefined && data.dueDate !== null && data.dueDate !== '') {
    parsedDue = new Date(data.dueDate)
    if (isNaN(parsedDue.getTime())) {
      errors.push('Due date must be a valid date.')
    }
  }

  if (parsedStart && parsedDue && !isNaN(parsedStart.getTime()) && !isNaN(parsedDue.getTime())) {
    if (parsedDue < parsedStart) {
      errors.push('Due date cannot be before start date.')
    }
  }

  // Checklist (optional)
  if (data.checklist !== undefined && data.checklist !== null) {
    if (!Array.isArray(data.checklist)) {
      errors.push('Checklist must be an array of items.')
    } else {
      for (let i = 0; i < data.checklist.length; i++) {
        const item = data.checklist[i]
        if (!item || typeof item !== 'object' || !item.title || !String(item.title).trim()) {
          errors.push(`Checklist item #${i + 1} must have a non-empty title.`)
          break
        }
      }
    }
  }

  // Dependencies (optional)
  if (data.dependencies !== undefined && data.dependencies !== null) {
    if (!Array.isArray(data.dependencies)) {
      errors.push('Dependencies must be an array of task IDs.')
    } else {
      for (const depId of data.dependencies) {
        if (!mongoose.Types.ObjectId.isValid(depId)) {
          errors.push(`Invalid dependency ID: ${depId}. Must be a valid ObjectId.`)
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
 * Pure validator for task update payload.
 */
export function validateTaskUpdateInput(data) {
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

  // Title
  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || !data.title.trim()) {
      errors.push('Task title cannot be empty.')
    } else if (data.title.trim().length < 2) {
      errors.push('Task title must be at least 2 characters long.')
    } else if (data.title.trim().length > 250) {
      errors.push('Task title cannot exceed 250 characters.')
    }
  }

  // Project ID
  if (data.projectId !== undefined) {
    if (!data.projectId || !mongoose.Types.ObjectId.isValid(data.projectId)) {
      errors.push('Project ID must be a valid ObjectId.')
    }
  }

  // Client ID
  if (data.clientId !== undefined && data.clientId !== null && data.clientId !== '') {
    if (!mongoose.Types.ObjectId.isValid(data.clientId)) {
      errors.push('Client ID must be a valid ObjectId.')
    }
  }

  // Campaign ID
  if (data.campaignId !== undefined && data.campaignId !== null && data.campaignId !== '') {
    if (!mongoose.Types.ObjectId.isValid(data.campaignId)) {
      errors.push('Campaign ID must be a valid ObjectId.')
    }
  }

  // Task Type
  if (data.taskType !== undefined) {
    if (typeof data.taskType !== 'string' || !data.taskType.trim()) {
      errors.push('Task type must be a non-empty string.')
    } else {
      const match = TASK_TYPES.find(
        (t) => t.toLowerCase() === data.taskType.trim().toLowerCase()
      )
      if (!match) {
        errors.push(`Invalid task type. Allowed values: ${TASK_TYPES.join(', ')}.`)
      }
    }
  }

  // Status
  if (data.status !== undefined) {
    if (typeof data.status !== 'string' || !data.status.trim()) {
      errors.push('Task status must be a non-empty string.')
    } else {
      const match = TASK_STATUSES.find(
        (s) => s.toLowerCase() === data.status.trim().toLowerCase()
      )
      if (!match) {
        errors.push(`Invalid task status. Allowed values: ${TASK_STATUSES.join(', ')}.`)
      }
    }
  }

  // Priority
  if (data.priority !== undefined) {
    if (typeof data.priority !== 'string' || !data.priority.trim()) {
      errors.push('Task priority must be a non-empty string.')
    } else {
      const match = TASK_PRIORITIES.find(
        (p) => p.toLowerCase() === data.priority.trim().toLowerCase()
      )
      if (!match) {
        errors.push(`Invalid task priority. Allowed values: ${TASK_PRIORITIES.join(', ')}.`)
      }
    }
  }

  // Assigned To
  if (data.assignedTo !== undefined && data.assignedTo !== null && data.assignedTo !== '') {
    if (!mongoose.Types.ObjectId.isValid(data.assignedTo)) {
      errors.push('Assigned user ID must be a valid ObjectId.')
    }
  }

  // Estimated Hours
  if (data.estimatedHours !== undefined && data.estimatedHours !== null && data.estimatedHours !== '') {
    const num = Number(data.estimatedHours)
    if (isNaN(num)) {
      errors.push('Estimated hours must be a number.')
    } else if (num < 0) {
      errors.push('Estimated hours cannot be negative.')
    }
  }

  // Actual Hours
  if (data.actualHours !== undefined && data.actualHours !== null && data.actualHours !== '') {
    const num = Number(data.actualHours)
    if (isNaN(num)) {
      errors.push('Actual hours must be a number.')
    } else if (num < 0) {
      errors.push('Actual hours cannot be negative.')
    }
  }

  // Progress
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

  // Dates
  let parsedStart = null
  let parsedDue = null

  if (data.startDate !== undefined && data.startDate !== null && data.startDate !== '') {
    parsedStart = new Date(data.startDate)
    if (isNaN(parsedStart.getTime())) {
      errors.push('Start date must be a valid date.')
    }
  }

  if (data.dueDate !== undefined && data.dueDate !== null && data.dueDate !== '') {
    parsedDue = new Date(data.dueDate)
    if (isNaN(parsedDue.getTime())) {
      errors.push('Due date must be a valid date.')
    }
  }

  if (parsedStart && parsedDue && !isNaN(parsedStart.getTime()) && !isNaN(parsedDue.getTime())) {
    if (parsedDue < parsedStart) {
      errors.push('Due date cannot be before start date.')
    }
  }

  // Dependencies
  if (data.dependencies !== undefined && data.dependencies !== null) {
    if (!Array.isArray(data.dependencies)) {
      errors.push('Dependencies must be an array of task IDs.')
    } else {
      for (const depId of data.dependencies) {
        if (!mongoose.Types.ObjectId.isValid(depId)) {
          errors.push(`Invalid dependency ID: ${depId}. Must be a valid ObjectId.`)
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
 * Pure validator for progress update.
 */
export function validateTaskProgressInput(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] }
  }

  if (data.progress === undefined || data.progress === null || data.progress === '') {
    errors.push('Progress is required.')
  } else {
    const num = Number(data.progress)
    if (isNaN(num)) {
      errors.push('Progress must be a number.')
    } else if (num < 0) {
      errors.push('Progress cannot be below 0%.')
    } else if (num > 100) {
      errors.push('Progress cannot exceed 100%.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Pure validator for status update.
 */
export function validateTaskStatusInput(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] }
  }

  if (!data.status || typeof data.status !== 'string' || !data.status.trim()) {
    errors.push('Status is required.')
  } else {
    const match = TASK_STATUSES.find(
      (s) => s.toLowerCase() === data.status.trim().toLowerCase()
    )
    if (!match) {
      errors.push(`Invalid task status. Allowed values: ${TASK_STATUSES.join(', ')}.`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Pure validator for assignment.
 */
export function validateTaskAssignInput(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] }
  }

  // assignedTo can be null/empty string to unassign, but if provided must be a valid ObjectId
  if (data.assignedTo !== undefined && data.assignedTo !== null && data.assignedTo !== '') {
    if (!mongoose.Types.ObjectId.isValid(data.assignedTo)) {
      errors.push('Assigned user ID must be a valid ObjectId.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
