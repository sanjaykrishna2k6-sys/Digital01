import { Router } from 'express'
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
  getCampaignStatistics,
} from '../controllers/campaign.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

// All campaign routes require authentication and tenant scoping
router.use(requireAuth, requireTenantScope)

/**
 * @route   GET /api/campaigns
 * @desc    List campaigns scoped to organization with search, filtering, and pagination
 * @access  Private (super_admin, agency_admin, account_manager, team_member, client)
 */
router.get(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  listCampaigns
)

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private (super_admin, agency_admin, account_manager; team_member and client prohibited)
 */
router.post(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  createCampaign
)

/**
 * @route   GET /api/campaigns/:id/statistics
 * @desc    Get campaign statistics, pacing, and KPIs
 * @access  Private (super_admin, agency_admin, account_manager, team_member, client)
 */
router.get(
  '/:id/statistics',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getCampaignStatistics
)

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get single campaign details by ID
 * @access  Private (super_admin, agency_admin, account_manager, team_member, client)
 */
router.get(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getCampaignById
)

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update campaign details
 * @access  Private (super_admin, agency_admin, account_manager; team_member and client prohibited)
 */
router.put(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateCampaign
)

/**
 * @route   PATCH /api/campaigns/:id
 * @desc    Update campaign details (PATCH alias)
 * @access  Private (super_admin, agency_admin, account_manager; team_member and client prohibited)
 */
router.patch(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateCampaign
)

/**
 * @route   PATCH /api/campaigns/:id/status
 * @desc    Update campaign status with business transition validation
 * @access  Private (super_admin, agency_admin, account_manager; team_member and client prohibited)
 */
router.patch(
  '/:id/status',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateCampaignStatus
)

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete a campaign
 * @access  Private (super_admin, agency_admin only; account_manager, team_member, client prohibited)
 */
router.delete(
  '/:id',
  requireRole('super_admin', 'agency_admin'),
  deleteCampaign
)

export default router
