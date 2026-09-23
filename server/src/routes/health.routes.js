import { Router } from 'express'

const router = Router()

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'digital-marketing-platform',
  })
})

export default router
