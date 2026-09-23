import { Router } from 'express'

import mongoose from 'mongoose'

const router = Router()

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
  res.status(200).json({
    status: 'healthy',
    service: 'digital-marketing-platform',
    database: dbStatus,
  })
})

export default router
