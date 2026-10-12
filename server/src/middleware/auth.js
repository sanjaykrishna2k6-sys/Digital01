import { verifyToken } from '../utils/token.js'
import User from '../models/User.js'

const getCookieName = () => process.env.COOKIE_NAME || 'scalevo_token'

/**
 * Middleware: Verify HTTP-only cookie authentication and attach user & organization context.
 */
export async function requireAuth(req, res, next) {
  try {
    const cookieName = getCookieName()
    let token = req.cookies?.[cookieName]

    // Fallback support for Authorization: Bearer <token> (e.g. CLI or API clients)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. Please log in.',
      })
    }

    // Verify token
    let decoded
    try {
      decoded = verifyToken(token)
    } catch (err) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired authentication session. Please log in again.',
      })
    }

    // Load active user and organization
    const user = await User.findById(decoded.userId).populate('organization')
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this session no longer exists.',
      })
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'fail',
        message: `Account is ${user.status}. Please contact your administrator.`,
      })
    }

    if (!user.organization || user.organization.status !== 'active') {
      return res.status(403).json({
        status: 'fail',
        message: 'Organization workspace is suspended or inactive.',
      })
    }

    // Attach user and tenant context to request
    req.user = user
    req.organizationId = user.organization._id
    req.organization = user.organization

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Middleware: Optional Authentication.
 * If valid credentials exist, attaches req.user and req.organizationId.
 * If not authenticated, proceeds without blocking (useful for demo/assistant queries).
 */
export async function optionalAuth(req, res, next) {
  try {
    const cookieName = getCookieName()
    let token = req.cookies?.[cookieName]

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (token) {
      try {
        const decoded = verifyToken(token)
        if (decoded?.userId) {
          const user = await User.findById(decoded.userId).populate('organization')
          if (user && user.status === 'active' && user.organization?.status === 'active') {
            req.user = user
            req.organizationId = user.organization._id
            req.organization = user.organization
          }
        }
      } catch (tokenErr) {
        // Silently ignore expired/invalid token in optional auth
      }
    }
    next()
  } catch (err) {
    next()
  }
}

/**
 * Middleware: Role-Based Access Control (RBAC).
 * Allows specified roles. Super admin always has universal access.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required.',
      })
    }

    // Super admin has unrestricted access across the platform
    if (req.user.role === 'super_admin') {
      return next()
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `Access denied. Requires one of: ${allowedRoles.join(', ')}.`,
      })
    }

    next()
  }
}

/**
 * Middleware: Enforces that requests have a valid organization context.
 */
export function requireTenantScope(req, res, next) {
  if (!req.organizationId) {
    return res.status(400).json({
      status: 'fail',
      message: 'Multi-tenant organization context missing from request.',
    })
  }
  next()
}
