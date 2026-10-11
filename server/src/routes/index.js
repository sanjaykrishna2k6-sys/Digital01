import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import campaignRoutes from './campaign.routes.js'
import projectRoutes from './project.routes.js'
import taskRoutes from './task.routes.js'
import clientRoutes from './client.routes.js'
import customerRoutes from './customer.routes.js'
import leadRoutes from './lead.routes.js'
import analyticsRoutes from './analytics.routes.js'
import settingsRoutes from './settings.routes.js'
import shopifyRoutes from './shopify.routes.js'
import shopifyWebhookRoutes from './shopifyWebhook.routes.js'
import serviceRoutes from './service.routes.js'
import contentRoutes from './content.routes.js'
import invoiceRoutes from './invoice.routes.js'
import notificationRoutes from './notification.routes.js'
import auditLogRoutes from './auditLog.routes.js'
import reportRoutes from './report.routes.js'

import seoRoutes from './seo.routes.js'
import automationRoutes from './automation.routes.js'
import aiRoutes from './ai.routes.js'
import integrationsRoutes from './integrations.routes.js'

const router = Router()

// Mount routes
router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/campaigns', campaignRoutes)
router.use('/projects', projectRoutes)
router.use('/tasks', taskRoutes)
router.use('/clients', clientRoutes)
router.use('/customers', customerRoutes)
router.use('/leads', leadRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/settings', settingsRoutes)
router.use('/seo', seoRoutes)
router.use('/shopify', shopifyRoutes)
router.use('/integrations/shopify', shopifyRoutes)
router.use('/webhooks/shopify', shopifyWebhookRoutes)
router.use('/services', serviceRoutes)
router.use('/content', contentRoutes)
router.use('/invoices', invoiceRoutes)
router.use('/billing', invoiceRoutes)
router.use('/billing/invoices', invoiceRoutes)
router.use('/notifications', notificationRoutes)
router.use('/audit-logs', auditLogRoutes)
router.use('/reports', reportRoutes)
router.use('/automations', automationRoutes)
router.use('/ai', aiRoutes)
router.use('/integrations', integrationsRoutes)

export default router




