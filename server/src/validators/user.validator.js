/**
 * User request validators
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES = ['super_admin', 'agency_admin', 'account_manager', 'team_member', 'client']
const VALID_STATUSES = ['active', 'inactive']

/**
 * Validate user creation payload:
 * Required: name, email, password, role
 */
export function validateCreateUser(req, res, next) {
  const { name, email, password, role } = req.body || {}

  // 1. Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      status: 'fail',
      message: 'Name is required and must be at least 2 characters long.',
    })
  }

  if (name.trim().length > 100) {
    return res.status(400).json({
      status: 'fail',
      message: 'Name cannot exceed 100 characters.',
    })
  }

  // 2. Email validation
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      status: 'fail',
      message: 'A valid email address is required.',
    })
  }

  // 3. Password validation (min 8 chars)
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      status: 'fail',
      message: 'Password is required and must be at least 8 characters long.',
    })
  }

  // 4. Role validation
  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({
      status: 'fail',
      message: `Role is required and must be one of: ${VALID_ROLES.join(', ')}.`,
    })
  }

  next()
}

/**
 * Validate user update payload (PATCH /api/users/:id)
 */
export function validateUpdateUser(req, res, next) {
  const { name, email, password, role, status, avatar } = req.body || {}

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name must be at least 2 characters long.',
      })
    }
    if (name.trim().length > 100) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name cannot exceed 100 characters.',
      })
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid email address.',
      })
    }
  }

  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters long.',
      })
    }
  }

  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        status: 'fail',
        message: `Role must be one of: ${VALID_ROLES.join(', ')}.`,
      })
    }
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}.`,
      })
    }
  }

  if (avatar !== undefined && typeof avatar !== 'string') {
    return res.status(400).json({
      status: 'fail',
      message: 'Avatar must be a valid string URL or path.',
    })
  }

  next()
}

/**
 * Validate status update payload (PATCH /api/users/:id/status)
 */
export function validateUserStatus(req, res, next) {
  const { status } = req.body || {}

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      status: 'fail',
      message: `Status is required and must be either 'active' or 'inactive'.`,
    })
  }

  next()
}
