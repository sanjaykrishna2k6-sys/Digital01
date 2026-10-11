import { Router } from 'express'
import { listNotifications, markAsRead } from '../controllers/notification.controller.js'
import { requireAuth, requireTenantScope } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

router.get('/', listNotifications)
router.patch('/:id/read', markAsRead)

export default router
