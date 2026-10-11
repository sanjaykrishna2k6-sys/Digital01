import express from 'express'
import { requireAuth, requireTenantScope } from '../middleware/auth.js'
import { queryAIMarketingAssistant } from '../controllers/ai.controller.js'

const router = express.Router()

router.use(requireAuth)
router.use(requireTenantScope)

router.post('/query', queryAIMarketingAssistant)

export default router
