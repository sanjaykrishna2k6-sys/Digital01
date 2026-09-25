import { Router } from 'express'
import { requireAuth, requireTenantScope } from '../middleware/auth.js'
import { getAnalyticsOverview } from '../controllers/analytics.controller.js'

const router = Router()

// All analytics endpoints require authenticated session and organization context
router.use(requireAuth, requireTenantScope)

router.get('/overview', getAnalyticsOverview)

export default router
