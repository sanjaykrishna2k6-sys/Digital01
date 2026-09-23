/**
 * Authentication API Service
 * 
 * SECURITY NOTICE:
 * All authentication relies exclusively on HTTP-only cookies managed by the browser.
 * Tokens, JWTs, and passwords are NEVER persisted in localStorage or sessionStorage.
 */

const API_BASE = '/api/auth'

/**
 * Perform login request with credentials.
 */
export async function login(email, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Ensures HTTP-only cookies are received and sent
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Login failed. Please check your credentials.')
  }

  return data
}

/**
 * Check active session and fetch current authenticated user and organization.
 */
export async function getMe() {
  const response = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json().catch(() => ({}))
  return data?.data?.user || null
}

/**
 * Log out and clear HTTP-only session cookie.
 */
export async function logout() {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch (err) {
    console.error('Logout error:', err)
  }
}

/**
 * Check if the agency platform has been bootstrapped.
 */
export async function checkInitialized() {
  try {
    const response = await fetch(`${API_BASE}/initialized`, {
      method: 'GET',
      credentials: 'include',
    })
    const data = await response.json()
    return data.initialized ?? true
  } catch (err) {
    return true
  }
}

/**
 * Bootstrap initial super admin and primary organization (first setup only).
 */
export async function bootstrap(payload) {
  const response = await fetch(`${API_BASE}/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Bootstrap failed.')
  }

  return data
}
