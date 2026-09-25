import { Router } from 'express'
import { requireAuth, requireTenantScope, requireRole } from '../middleware/auth.js'
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  updateProfile,
  updatePassword,
} from '../controllers/settings.controller.js'

const router = Router()

// All settings routes require authentication and organization context
router.use(requireAuth, requireTenantScope)

// Organization settings (Viewable by org members, editable by Admins only)
router.get('/organization', getOrganizationSettings)
router.patch('/organization', requireRole('super_admin', 'agency_admin'), updateOrganizationSettings)

// User personal settings
router.patch('/profile', updateProfile)
router.patch('/password', updatePassword)

export default router
