import crypto from 'crypto'

/**
 * Service for Google OAuth 2.0 / OpenID Connect operations.
 * Strictly avoids logging secrets or authorization codes.
 */

// Test override hook for automated test suites
let testExchangeHook = null
let testUserInfoHook = null

export function setGoogleOAuthTestHooks(hooks) {
  testExchangeHook = hooks?.exchange || null
  testUserInfoHook = hooks?.userInfo || null
}

/**
 * Generate cryptographically secure state parameter for CSRF protection.
 */
export function generateOAuthState() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Build Google OAuth 2.0 authorization URL.
 */
export function getGoogleAuthorizationUrl(state) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId || 'dummy_client_id')
  authUrl.searchParams.set('redirect_uri', callbackUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'select_account')

  return authUrl.toString()
}

/**
 * Exchange authorization code for tokens with Google OAuth endpoint.
 */
export async function exchangeCodeForTokens(code) {
  if (testExchangeHook) {
    return testExchangeHook(code)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured on the server.')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Google token exchange failed: HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Retrieve user profile from Google UserInfo endpoint using access token.
 */
export async function getGoogleUserProfile(accessToken) {
  if (testUserInfoHook) {
    return testUserInfoHook(accessToken)
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Google user profile: HTTP ${response.status}`)
  }

  return response.json()
}
