import { Router } from 'express'
import {
  checkInitialized,
  bootstrap,
  login,
  logout,
  getMe,
} from '../controllers/auth.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

/**
 * @route   GET /api/auth/initialized
 * @desc    Check if system has been bootstrapped
 * @access  Public
 */
router.get('/initialized', checkInitialized)

/**
 * @route   POST /api/auth/bootstrap
 * @desc    Bootstrap the first Super Admin and organization
 * @access  Public (Permanently locked after first user exists)
 */
router.post('/bootstrap', bootstrap)

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and set HTTP-only cookie
 * @access  Public
 */
router.post('/login', login)

/**
 * @route   POST /api/auth/logout
 * @desc    Clear auth cookie and terminate session
 * @access  Public
 */
router.post('/logout', logout)

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user & organization
 * @access  Private (Requires valid HTTP-only cookie)
 */
router.get('/me', requireAuth, getMe)

/**
 * @route   GET /api/auth/admin-only
 * @desc    Protected route for super_admin and agency_admin with tenant isolation
 * @access  Private
 */
router.get(
  '/admin-only',
  requireAuth,
  requireTenantScope,
  requireRole('super_admin', 'agency_admin'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Access granted to admin workspace',
      organizationId: req.organizationId,
      userRole: req.user.role,
    })
  }
)

export default router
