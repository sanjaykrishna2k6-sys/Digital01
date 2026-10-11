import { Router } from 'express'
import {
  listContent,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  submitForApproval,
  reviewContent,
} from '../controllers/content.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

router.get(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  listContent
)

router.get(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getContent
)

router.post(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  createContent
)

router.patch(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  updateContent
)

router.post(
  '/:id/submit-approval',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  submitForApproval
)

router.post(
  '/:id/approval',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'client'),
  reviewContent
)

router.delete(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  deleteContent
)

export default router
