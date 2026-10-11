import { Router } from 'express'
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  updateProjectProgress,
  deleteProject,
  getProjectStatistics,
} from '../controllers/project.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

// All project routes require authentication and tenant scoping
router.use(requireAuth, requireTenantScope)

/**
 * @route   GET /api/projects
 * @desc    List projects scoped to organization with search, filtering, and pagination
 * @access  Private (super_admin, agency_admin, account_manager, team_member, client)
 */
router.get(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  listProjects
)

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (super_admin, agency_admin, account_manager; team_member and client prohibited)
 */
router.post(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  createProject
)

/**
 * @route   GET /api/projects/:id/statistics
 * @desc    Get project statistics and progress metrics
 * @access  Private (super_admin, agency_admin, account_manager, team_member, client)
 */
router.get(
  '/:id/statistics',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getProjectStatistics
)

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project details by ID
 * @access  Private (super_admin, agency_admin, account_manager, team_member, client)
 */
router.get(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getProjectById
)

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private (super_admin, agency_admin, account_manager; team_member and client prohibited)
 */
router.put(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateProject
)

/**
 * @route   PATCH /api/projects/:id
 * @desc    Update project details (PATCH alias)
 * @access  Private (super_admin, agency_admin, account_manager; team_member and client prohibited)
 */
router.patch(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateProject
)

/**
 * @route   PATCH /api/projects/:id/status
 * @desc    Update project status with transition validation
 * @access  Private (super_admin, agency_admin, account_manager; team_member and client prohibited)
 */
router.patch(
  '/:id/status',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateProjectStatus
)

/**
 * @route   PATCH /api/projects/:id/progress
 * @desc    Update project progress percentage (0 - 100)
 * @access  Private (super_admin, agency_admin, account_manager, team_member; client prohibited)
 */
router.patch(
  '/:id/progress',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  updateProjectProgress
)

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private (super_admin, agency_admin only; account_manager, team_member, client prohibited)
 */
router.delete(
  '/:id',
  requireRole('super_admin', 'agency_admin'),
  deleteProject
)

export default router
