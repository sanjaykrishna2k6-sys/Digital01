import { Router } from 'express'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} from '../controllers/user.controller.js'
import { requireAuth, requireTenantScope } from '../middleware/auth.js'
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserStatus,
} from '../validators/user.validator.js'

const router = Router()

// All user management routes require valid authentication and organization scope
router.use(requireAuth, requireTenantScope)

/**
 * @route   GET /api/users
 * @desc    List all users in the organization
 * @access  Private (Super Admin, Agency Admin, Account Manager, Team Member)
 */
router.get('/', getUsers)

/**
 * @route   GET /api/users/:id
 * @desc    Get user details by ID
 * @access  Private (Super Admin, Agency Admin, Account Manager, Team Member)
 */
router.get('/:id', getUserById)

/**
 * @route   POST /api/users
 * @desc    Create a new user within the organization
 * @access  Private (Super Admin, Agency Admin)
 */
router.post('/', validateCreateUser, createUser)

/**
 * @route   PATCH /api/users/:id
 * @desc    Update an existing user's details
 * @access  Private (Super Admin, Agency Admin)
 */
router.patch('/:id', validateUpdateUser, updateUser)

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update a user's active/inactive status
 * @access  Private (Super Admin, Agency Admin)
 */
router.patch('/:id/status', validateUserStatus, updateUserStatus)

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user from the organization
 * @access  Private (Super Admin, Agency Admin)
 */
router.delete('/:id', deleteUser)

export default router
