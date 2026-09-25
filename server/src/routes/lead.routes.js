import { Router } from 'express'
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadStatus,
  deleteLead,
} from '../controllers/lead.controller.js'
import { requireAuth, requireTenantScope } from '../middleware/auth.js'
import { validateLead } from '../validators/lead.validator.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

router.get('/', getLeads)
router.get('/:id', getLeadById)
router.post('/', validateLead, createLead)
router.patch('/:id', validateLead, updateLead)
router.patch('/:id/status', updateLeadStatus)
router.delete('/:id', deleteLead)

export default router
