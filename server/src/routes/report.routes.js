import { Router } from 'express'
import { generateClientReport } from '../controllers/report.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

router.get(
  '/client-report',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  generateClientReport
)

export default router
