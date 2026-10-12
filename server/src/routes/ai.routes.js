import express from 'express'
import { requireAuth, requireTenantScope, optionalAuth } from '../middleware/auth.js'
import { aiRateLimiter } from '../middleware/rateLimiter.js'
import {
  generateContent,
  improveContent,
  getProviderStatus,
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

// Agency Contextual QA Query: allows optional auth so it answers reliably for both logged-in and guest users
router.post('/query', optionalAuth, queryAIMarketingAssistant)

router.use(requireAuth)
router.use(requireTenantScope)

// Provider Status Check
router.get('/provider-status', getProviderStatus)

// Core Generative Features
router.post('/generate-content', aiRateLimiter, generateContent)
router.post('/improve-content', aiRateLimiter, improveContent)
router.post('/seo-assistant', aiRateLimiter, seoAssistant)
router.post('/seo-analysis', aiRateLimiter, seoAssistant) // alias
router.post('/campaign-plan', aiRateLimiter, campaignPlan)
router.post('/chat', aiRateLimiter, marketingChat)

// History, Library & Usage
router.get('/history', listGenerationHistory)
router.get('/saved', listSavedItems)
router.post('/saved', saveItem)
router.delete('/saved/:id', deleteSavedItem)
router.get('/usage', getUsageStats)

export default router

