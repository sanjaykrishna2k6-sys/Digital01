import rateLimit from 'express-rate-limit'

/**
 * Standard API rate limiter to protect against brute-force and DoS.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
})

/**
 * Strict authentication rate limiter for sensitive endpoints (login, signup, password resets).
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'fail',
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
})

/**
 * AI generation rate limiter to prevent local model overloading.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI generations per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'fail',
    message: 'Too many AI requests. Please wait a minute before generating more content.',
  },
})

