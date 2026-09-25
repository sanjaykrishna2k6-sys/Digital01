import { Router } from 'express'
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
} from '../controllers/campaign.controller.js'
import { requireAuth, requireTenantScope } from '../middleware/auth.js'
import {
  validateCreateCampaign,
  validateUpdateCampaign,
} from '../validators/campaign.validator.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

router.get('/', getCampaigns)
router.get('/:id', getCampaignById)
router.post('/', validateCreateCampaign, createCampaign)
router.patch('/:id', validateUpdateCampaign, updateCampaign)
router.patch('/:id/status', updateCampaignStatus)
router.delete('/:id', deleteCampaign)

export default router
