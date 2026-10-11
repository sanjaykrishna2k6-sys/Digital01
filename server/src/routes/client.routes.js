import { Router } from 'express'
import {
  listClients,
  getClient,
  getClientWorkspace,
  createClient,
  updateClient,
  updateClientStatus,
  deleteClient,
} from '../controllers/client.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

// All client routes require authentication and tenant scoping
router.use(requireAuth, requireTenantScope)

/**
 * @route   GET /api/clients
 * @desc    List clients with search, filtering, and pagination
 * @access  Private (super_admin, agency_admin, account_manager, team_member)
 */
router.get(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  listClients
)

/**
 * @route   GET /api/clients/:id/workspace
 * @desc    Get unified client workspace intelligence summary
 * @access  Private (super_admin, agency_admin, account_manager, team_member, client)
 */
router.get(
  '/:id/workspace',
  getClientWorkspace
)

/**
 * @route   GET /api/clients/:id
 * @desc    Get single client details
 * @access  Private (super_admin, agency_admin, account_manager, team_member)
 */
router.get(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  getClient
)

/**
 * @route   POST /api/clients
 * @desc    Create a new client
 * @access  Private (super_admin, agency_admin, account_manager)
 */
router.post(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  createClient
)

/**
 * @route   PATCH /api/clients/:id
 * @desc    Update client details
 * @access  Private (super_admin, agency_admin, account_manager)
 */
router.patch(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateClient
)

/**
 * @route   PATCH /api/clients/:id/status
 * @desc    Update client status (active | inactive)
 * @access  Private (super_admin, agency_admin, account_manager)
 */
router.patch(
  '/:id/status',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateClientStatus
)

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete a client
 * @access  Private (super_admin, agency_admin only; account_manager prohibited)
 */
router.delete(
  '/:id',
  requireRole('super_admin', 'agency_admin'),
  deleteClient
)

export default router
