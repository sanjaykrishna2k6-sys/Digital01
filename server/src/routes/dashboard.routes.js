import { Router } from 'express'
import { getDashboardStats } from '../controllers/dashboard.controller.js'
import { requireAuth, requireTenantScope } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get real-time organization dashboard metrics, KPIs, and charts
 * @access  Private
 */
router.get('/stats', getDashboardStats)

export default router
