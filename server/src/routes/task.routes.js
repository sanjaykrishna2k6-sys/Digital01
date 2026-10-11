import { Router } from 'express'
import {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskProgress,
  assignTask,
  getTaskStatistics,
  getTaskDetailsStatistics,
} from '../controllers/task.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

// All task routes require authentication and tenant isolation
router.use(requireAuth, requireTenantScope)

/**
 * @route   GET /api/tasks/statistics
 * @desc    Get organization-wide task KPIs and execution rates
 * @access  Private
 */
router.get(
  '/statistics',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getTaskStatistics
)

/**
 * @route   GET /api/tasks
 * @desc    List tasks with search, filtering, and pagination
 * @access  Private
 */
router.get(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  listTasks
)

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private (super_admin, agency_admin, account_manager)
 */
router.post(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  createTask
)

/**
 * @route   GET /api/tasks/:id/statistics
 * @desc    Get single task details statistics (time tracking, checklist completion)
 * @access  Private
 */
router.get(
  '/:id/statistics',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getTaskDetailsStatistics
)

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task details
 * @access  Private
 */
router.get(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getTaskById
)

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task details
 * @access  Private (super_admin, agency_admin, account_manager, team_member)
 */
router.put(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  updateTask
)

/**
 * @route   PATCH /api/tasks/:id
 * @desc    Update task details (PATCH alias)
 * @access  Private
 */
router.patch(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  updateTask
)

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Update task status with valid transitions
 * @access  Private (super_admin, agency_admin, account_manager, team_member)
 */
router.patch(
  '/:id/status',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  updateTaskStatus
)

/**
 * @route   PATCH /api/tasks/:id/progress
 * @desc    Update task progress percentage (0 - 100)
 * @access  Private (super_admin, agency_admin, account_manager, team_member)
 */
router.patch(
  '/:id/progress',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  updateTaskProgress
)

/**
 * @route   PATCH /api/tasks/:id/assign
 * @desc    Assign task to team member
 * @access  Private (super_admin, agency_admin, account_manager)
 */
router.patch(
  '/:id/assign',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  assignTask
)

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private (super_admin, agency_admin only)
 */
router.delete(
  '/:id',
  requireRole('super_admin', 'agency_admin'),
  deleteTask
)

export default router
