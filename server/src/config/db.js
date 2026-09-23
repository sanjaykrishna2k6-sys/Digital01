import mongoose from 'mongoose'

/**
 * Connect to MongoDB with graceful error handling.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.warn('[MongoDB] Warning: MONGODB_URI is not set. Operating in offline/memory mode.')
    return null
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    })

    console.log('MongoDB connected successfully')
    console.log(`[MongoDB] Connected host: ${conn.connection.host}`)
    return conn
  } catch (err) {
    console.warn(`[MongoDB] Initial connection failed: ${err.message}`)
    console.warn('[MongoDB] The server will continue running. Ensure MongoDB is started or check your MONGODB_URI.')
    return null
  }
}

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Connection error event: ${err.message}`)
})

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection disconnected.')
})
