import { Router } from 'express'
import {
  checkInitialized,
  bootstrap,
  signup,
  login,
  logout,
  getMe,
  initiateGoogleAuth,
  handleGoogleCallback,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/auth.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'

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
router.post('/bootstrap', authRateLimiter, bootstrap)

/**
 * @route   POST /api/auth/signup
 * @desc    Create a new organization and agency admin user
 * @access  Public
 */
router.post('/signup', authRateLimiter, signup)

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and set HTTP-only cookie
 * @access  Public
 */
router.post('/login', authRateLimiter, login)

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
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth 2.0 flow
 * @access  Public
 */
router.get('/google', initiateGoogleAuth)

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth 2.0 callback
 * @access  Public
 */
router.get('/google/callback', handleGoogleCallback)

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', authRateLimiter, forgotPassword)

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using secure token
 * @access  Public
 */
router.post('/reset-password', authRateLimiter, resetPassword)

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password', requireAuth, authRateLimiter, changePassword)

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
