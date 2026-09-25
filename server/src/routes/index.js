import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import campaignRoutes from './campaign.routes.js'
import customerRoutes from './customer.routes.js'
import leadRoutes from './lead.routes.js'
import analyticsRoutes from './analytics.routes.js'
import settingsRoutes from './settings.routes.js'
import shopifyRoutes from './shopify.routes.js'
import shopifyWebhookRoutes from './shopifyWebhook.routes.js'

const router = Router()

// Mount routes
router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/campaigns', campaignRoutes)
router.use('/customers', customerRoutes)
router.use('/leads', leadRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/settings', settingsRoutes)
router.use('/integrations/shopify', shopifyRoutes)
router.use('/webhooks/shopify', shopifyWebhookRoutes)

export default router



