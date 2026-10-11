import { Router } from 'express'
import { listAuditLogs } from '../controllers/auditLog.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

router.get(
  '/',
  requireRole('super_admin', 'agency_admin'),
  listAuditLogs
)

export default router
