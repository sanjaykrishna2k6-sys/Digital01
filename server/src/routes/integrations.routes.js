import express from 'express'
import { requireAuth, requireTenantScope, requireRole } from '../middleware/auth.js'
import { getIntegrationHealth, getAuditTrail } from '../controllers/integrations.controller.js'

const router = express.Router()

router.use(requireAuth)
router.use(requireTenantScope)

router.get('/health', getIntegrationHealth)
router.get('/audit-trail', getAuditTrail)

export default router
