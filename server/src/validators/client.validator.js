import mongoose from 'mongoose'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate client creation payload
 */
export function validateCreateClient(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] }
  }

  // Reject client-supplied organizationId
  if (data.organizationId !== undefined || data.organization !== undefined) {
    errors.push('Supplying organizationId in request payload is not permitted.')
  }

  // Reject client-supplied createdBy
  if (data.createdBy !== undefined) {
    errors.push('Supplying createdBy in request payload is not permitted.')
  }

  // Company Name
  if (!data.companyName || typeof data.companyName !== 'string' || !data.companyName.trim()) {
    errors.push('Company name is required.')
  } else if (data.companyName.trim().length < 2) {
    errors.push('Company name must be at least 2 characters long.')
  } else if (data.companyName.trim().length > 200) {
    errors.push('Company name cannot exceed 200 characters.')
  }

  // Contact Name
  if (!data.contactName || typeof data.contactName !== 'string' || !data.contactName.trim()) {
    errors.push('Contact person name is required.')
  } else if (data.contactName.trim().length < 2) {
    errors.push('Contact person name must be at least 2 characters long.')
  } else if (data.contactName.trim().length > 150) {
    errors.push('Contact person name cannot exceed 150 characters.')
  }

  // Email
  if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
    errors.push('Email is required.')
  } else if (!emailRegex.test(data.email.trim())) {
    errors.push('Please provide a valid email address.')
  }

  // Phone (optional)
  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    if (typeof data.phone !== 'string') {
      errors.push('Phone number must be a string.')
    } else if (data.phone.trim().length > 50) {
      errors.push('Phone number cannot exceed 50 characters.')
    }
  }

  // Website (optional)
  if (data.website !== undefined && data.website !== null && data.website !== '') {
    if (typeof data.website !== 'string') {
      errors.push('Website URL must be a string.')
    } else if (data.website.trim().length > 255) {
      errors.push('Website URL cannot exceed 255 characters.')
    }
  }

  // Industry (optional)
  if (data.industry !== undefined && data.industry !== null && data.industry !== '') {
    if (typeof data.industry !== 'string') {
      errors.push('Industry must be a string.')
    } else if (data.industry.trim().length > 100) {
      errors.push('Industry cannot exceed 100 characters.')
    }
  }

  // Address (optional)
  if (data.address !== undefined && data.address !== null) {
    if (typeof data.address !== 'object' || Array.isArray(data.address)) {
      errors.push('Address must be an object.')
    } else {
      const addressFields = ['street', 'city', 'state', 'country', 'postalCode']
      for (const field of addressFields) {
        if (data.address[field] !== undefined && data.address[field] !== null) {
          if (typeof data.address[field] !== 'string') {
            errors.push(`Address ${field} must be a string.`)
          } else if (data.address[field].trim().length > 150) {
            errors.push(`Address ${field} cannot exceed 150 characters.`)
          }
        }
      }
    }
  }

  // Status (optional)
  if (data.status !== undefined && !['active', 'inactive'].includes(data.status)) {
    errors.push("Status must be either 'active' or 'inactive'.")
  }

  // Assigned Account Manager (optional)
  if (data.assignedAccountManager !== undefined && data.assignedAccountManager !== null && data.assignedAccountManager !== '') {
    if (!mongoose.Types.ObjectId.isValid(data.assignedAccountManager)) {
      errors.push('Assigned Account Manager must be a valid MongoDB ObjectId.')
    }
  }

  // Services (optional)
  if (data.services !== undefined && data.services !== null) {
    if (!Array.isArray(data.services)) {
      errors.push('Services must be an array of strings.')
    } else {
      for (const item of data.services) {
        if (typeof item !== 'string') {
          errors.push('Each service item must be a string.')
          break
        }
      }
    }
  }

  // Notes (optional)
  if (data.notes !== undefined && data.notes !== null && data.notes !== '') {
    if (typeof data.notes !== 'string') {
      errors.push('Notes must be a string.')
    } else if (data.notes.length > 5000) {
      errors.push('Notes cannot exceed 5000 characters.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate client update payload
 */
export function validateUpdateClient(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] }
  }

  // Reject attempts to mutate organizationId or createdBy
  if (data.organizationId !== undefined || data.organization !== undefined) {
    errors.push('organizationId cannot be modified.')
  }
  if (data.createdBy !== undefined) {
    errors.push('createdBy cannot be modified.')
  }

  // Company Name
  if (data.companyName !== undefined) {
    if (typeof data.companyName !== 'string' || !data.companyName.trim()) {
      errors.push('Company name cannot be blank.')
    } else if (data.companyName.trim().length < 2) {
      errors.push('Company name must be at least 2 characters long.')
    } else if (data.companyName.trim().length > 200) {
      errors.push('Company name cannot exceed 200 characters.')
    }
  }

  // Contact Name
  if (data.contactName !== undefined) {
    if (typeof data.contactName !== 'string' || !data.contactName.trim()) {
      errors.push('Contact person name cannot be blank.')
    } else if (data.contactName.trim().length < 2) {
      errors.push('Contact person name must be at least 2 characters long.')
    } else if (data.contactName.trim().length > 150) {
      errors.push('Contact person name cannot exceed 150 characters.')
    }
  }

  // Email
  if (data.email !== undefined) {
    if (typeof data.email !== 'string' || !data.email.trim()) {
      errors.push('Email cannot be blank.')
    } else if (!emailRegex.test(data.email.trim())) {
      errors.push('Please provide a valid email address.')
    }
  }

  // Phone
  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    if (typeof data.phone !== 'string') {
      errors.push('Phone number must be a string.')
    } else if (data.phone.trim().length > 50) {
      errors.push('Phone number cannot exceed 50 characters.')
    }
  }

  // Website
  if (data.website !== undefined && data.website !== null && data.website !== '') {
    if (typeof data.website !== 'string') {
      errors.push('Website URL must be a string.')
    } else if (data.website.trim().length > 255) {
      errors.push('Website URL cannot exceed 255 characters.')
    }
  }

  // Industry
  if (data.industry !== undefined && data.industry !== null && data.industry !== '') {
    if (typeof data.industry !== 'string') {
      errors.push('Industry must be a string.')
    } else if (data.industry.trim().length > 100) {
      errors.push('Industry cannot exceed 100 characters.')
    }
  }

  // Address
  if (data.address !== undefined && data.address !== null) {
    if (typeof data.address !== 'object' || Array.isArray(data.address)) {
      errors.push('Address must be an object.')
    } else {
      const addressFields = ['street', 'city', 'state', 'country', 'postalCode']
      for (const field of addressFields) {
        if (data.address[field] !== undefined && data.address[field] !== null) {
          if (typeof data.address[field] !== 'string') {
            errors.push(`Address ${field} must be a string.`)
          } else if (data.address[field].trim().length > 150) {
            errors.push(`Address ${field} cannot exceed 150 characters.`)
          }
        }
      }
    }
  }

  // Status
  if (data.status !== undefined && !['active', 'inactive'].includes(data.status)) {
    errors.push("Status must be either 'active' or 'inactive'.")
  }

  // Assigned Account Manager
  if (data.assignedAccountManager !== undefined && data.assignedAccountManager !== null && data.assignedAccountManager !== '') {
    if (!mongoose.Types.ObjectId.isValid(data.assignedAccountManager)) {
      errors.push('Assigned Account Manager must be a valid MongoDB ObjectId.')
    }
  }

  // Services
  if (data.services !== undefined && data.services !== null) {
    if (!Array.isArray(data.services)) {
      errors.push('Services must be an array of strings.')
    } else {
      for (const item of data.services) {
        if (typeof item !== 'string') {
          errors.push('Each service item must be a string.')
          break
        }
      }
    }
  }

  // Notes
  if (data.notes !== undefined && data.notes !== null && data.notes !== '') {
    if (typeof data.notes !== 'string') {
      errors.push('Notes must be a string.')
    } else if (data.notes.length > 5000) {
      errors.push('Notes cannot exceed 5000 characters.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
