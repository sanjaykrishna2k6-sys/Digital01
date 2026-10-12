import express from 'express'
import { requireAuth, requireTenantScope } from '../middleware/auth.js'
import {
  generateContent,
  seoAssistant,
  campaignPlan,
  marketingChat,
  listGenerationHistory,
  listSavedItems,
  saveItem,
  deleteSavedItem,
  getUsageStats,
  queryAIMarketingAssistant,
} from '../controllers/ai.controller.js'

const router = express.Router()

router.use(requireAuth)
router.use(requireTenantScope)

// Core Generative Features
router.post('/generate-content', generateContent)
router.post('/seo-assistant', seoAssistant)
router.post('/seo-analysis', seoAssistant) // alias
router.post('/campaign-plan', campaignPlan)
router.post('/chat', marketingChat)

// History, Library & Usage
router.get('/history', listGenerationHistory)
router.get('/saved', listSavedItems)
router.post('/saved', saveItem)
router.delete('/saved/:id', deleteSavedItem)
router.get('/usage', getUsageStats)

// Agency Contextual QA Query
router.post('/query', queryAIMarketingAssistant)

export default router

