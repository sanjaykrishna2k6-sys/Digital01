import { Router } from 'express'
import { handleWebhook } from '../controllers/shopifyWebhook.controller.js'

const router = Router()

// All incoming webhook topics arrive at this endpoint
router.post('/', handleWebhook)
router.post('/orders', handleWebhook)
router.post('/products', handleWebhook)
router.post('/customers', handleWebhook)
router.post('/app-uninstalled', handleWebhook)

export default router
