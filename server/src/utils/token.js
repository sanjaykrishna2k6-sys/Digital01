import jwt from 'jsonwebtoken'

const getCookieName = () => process.env.COOKIE_NAME || 'scalevo_token'

/**
 * Sign JWT token with secret and expiration.
 */
export function generateToken(payload) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing')
  }
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

/**
 * Verify JWT token.
 */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing')
  }
  return jwt.verify(token, secret)
}

/**
 * Set HTTP-only authentication cookie on response.
 */
export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieName = getCookieName()

  res.cookie(cookieName, token, {
    httpOnly: true, // Prevents client-side scripts from accessing the cookie
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax', // CSRF mitigation
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  })
}

/**
 * Clear authentication cookie on response (logout).
 */
export function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieName = getCookieName()

  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  })
}
