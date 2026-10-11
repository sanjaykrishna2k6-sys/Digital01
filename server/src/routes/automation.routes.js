import express from 'express'
import { requireAuth, requireTenantScope, requireRole } from '../middleware/auth.js'
import {
  listAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  triggerAutomationEngine,
} from '../controllers/automation.controller.js'

const router = express.Router()

router.use(requireAuth)
router.use(requireTenantScope)

const AGENCY_ROLES = ['super_admin', 'agency_admin', 'admin', 'manager', 'account_manager']

router.route('/')
  .get(listAutomations)
  .post(requireRole(...AGENCY_ROLES), createAutomation)

router.post('/run', requireRole(...AGENCY_ROLES), triggerAutomationEngine)

router.route('/:id')
  .patch(requireRole(...AGENCY_ROLES), updateAutomation)
  .delete(requireRole('super_admin', 'agency_admin', 'admin'), deleteAutomation)

export default router
