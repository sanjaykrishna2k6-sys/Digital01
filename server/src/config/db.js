import mongoose from 'mongoose'

let mongoMemoryServer = null

async function getOrStartMemoryServer() {
  if (mongoMemoryServer) return mongoMemoryServer
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  mongoMemoryServer = await MongoMemoryServer.create()
  return mongoMemoryServer
}

/**
 * Connect to MongoDB with graceful error handling and in-memory fallback for testing.
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  const isTest = process.env.NODE_ENV === 'test' || process.env.USE_MEMORY_DB === 'true'
  const uri = process.env.MONGODB_URI

  if (uri && process.env.USE_MEMORY_DB !== 'true') {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
      })
      console.log('MongoDB connected successfully')
      console.log(`[MongoDB] Connected host: ${conn.connection.host}`)
      return conn
    } catch (err) {
      console.warn(`[MongoDB] Atlas connection failed: ${err.message}. Switching to local in-memory database...`)
      await mongoose.disconnect().catch(() => {})
    }
  }

  // Fallback to MongoMemoryServer if in test mode, no URI, or connection failed
  try {
    await mongoose.disconnect().catch(() => {})
    const serverInstance = await getOrStartMemoryServer()
    const memUri = serverInstance.getUri()
    const conn = await mongoose.connect(memUri)
    console.log(`[MongoDB] In-Memory Database connected: ${memUri}`)
    return conn
  } catch (memErr) {
    console.error(`[MongoDB] Failed to start MongoMemoryServer: ${memErr.message}`)
    return null
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop()
    mongoMemoryServer = null
  }
}

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Connection error event: ${err.message}`)
})

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection disconnected.')
})
