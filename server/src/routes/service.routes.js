import { Router } from 'express'
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
} from '../controllers/service.controller.js'
import { validateCreateService, validateUpdateService } from '../validators/service.validator.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

router.get(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  listServices
)

router.get(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getService
)

router.post(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  validateCreateService,
  createService
)

router.patch(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  validateUpdateService,
  updateService
)

router.delete(
  '/:id',
  requireRole('super_admin', 'agency_admin'),
  deleteService
)

export default router
