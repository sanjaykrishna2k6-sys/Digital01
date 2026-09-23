import dotenv from 'dotenv'
// Load environment variables before initializing components
dotenv.config()

import app from './app.js'
import { connectDB } from './config/db.js'

const PORT = process.env.PORT || 5000

async function startServer() {
  // Connect to database
  await connectDB()

  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`[Server] Digital Marketing Platform backend running on port ${PORT}`)
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`[Server] Health check: http://127.0.0.1:${PORT}/api/health`)
  })

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Server] Unhandled Rejection: ${err.message}`)
  })

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`[Server] Uncaught Exception: ${err.message}`)
  })

  // Graceful shutdown
  const shutdown = () => {
    console.log('[Server] Gracefully shutting down...')
    server.close(() => {
      console.log('[Server] HTTP server closed.')
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

startServer()
