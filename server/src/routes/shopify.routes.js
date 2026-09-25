import { Router } from 'express'
import {
  getStoreStatus,
  initiateConnect,
  handleCallback,
  triggerSync,
  disconnectStore,
} from '../controllers/shopify.controller.js'
import { requireAuth, requireTenantScope, requireRole } from '../middleware/auth.js'

const router = Router()

// Public OAuth callback invoked by Shopify redirect
router.get('/callback', requireAuth, requireTenantScope, handleCallback)

// Protected endpoints for authenticated organization members
router.get('/status', requireAuth, requireTenantScope, getStoreStatus)

// Admin-only operations
router.get('/connect', requireAuth, requireTenantScope, requireRole('super_admin', 'agency_admin'), initiateConnect)
router.post('/sync', requireAuth, requireTenantScope, requireRole('super_admin', 'agency_admin'), triggerSync)
router.post('/disconnect', requireAuth, requireTenantScope, requireRole('super_admin', 'agency_admin'), disconnectStore)

export default router
