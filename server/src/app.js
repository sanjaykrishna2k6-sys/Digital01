import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { apiRateLimiter } from './middleware/rateLimiter.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import { errorHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'

const app = express()

// 1. Security Headers
app.use(helmet())

// 2. CORS configuration with CLIENT_URL
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true)
      const isDev = process.env.NODE_ENV !== 'production'
      if (
        isDev ||
        origin === clientUrl ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.') ||
        origin.includes('.loca.lt')
      ) {
        return callback(null, true)
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`))
    },
    credentials: true,
  })
)

// 3. Request Parsers & Body Size Limits (with rawBody capture for webhook HMAC)
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      req.rawBody = buf
    },
  })
)
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(cookieParser())

// 4. Rate Limiter on API routes
app.use('/api', apiRateLimiter)

// Root route for friendly welcome message when visiting http://localhost:5000/ directly
app.get('/', (req, res) => {
  res.json({
    name: 'Digital Marketing Platform API',
    status: 'online',
    frontendUrl: 'http://localhost:8443',
    healthCheck: 'http://localhost:5000/api/health',
    message: 'Backend server is running! To view the user interface dashboard, open http://localhost:8443 in your browser.'
  })
})

// 5. API Routes
app.use('/api', routes)

// 6. 404 Not Found Handler
app.use(notFoundHandler)

// 7. Centralized Error Handler
app.use(errorHandler)

export default app
