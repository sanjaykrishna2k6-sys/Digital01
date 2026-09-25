/**
 * User Management API Service
 * 
 * SECURITY NOTICE:
 * All authentication relies exclusively on HTTP-only cookies.
 * Passwords, tokens, and sensitive credentials are never stored in localStorage or sessionStorage.
 * All requests include credentials: 'include'.
 */

const API_BASE = '/api/users'

/**
 * Fetch users belonging to current organization workspace.
 * Supports query params: { search, role, status }
 */
export async function fetchUsers(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.append('search', params.search)
  if (params.role && params.role !== 'all') query.append('role', params.role)
  if (params.status && params.status !== 'all') query.append('status', params.status)

  const url = query.toString() ? `${API_BASE}?${query.toString()}` : API_BASE

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users.')
  }

  return data.data?.users || []
}

/**
 * Fetch a single user by ID.
 */
export async function fetchUserById(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user.')
  }

  return data.data?.user
}

/**
 * Create a new user in the organization.
 * Payload: { name, email, password, role }
 */
export async function createUser(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create user.')
  }

  return data.data?.user
}

/**
 * Update an existing user's details.
 * Payload: { name, email, role, avatar, password? }
 */
export async function updateUser(id, payload) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user.')
  }

  return data.data?.user
}

/**
 * Update user status (active / inactive).
 */
export async function updateUserStatus(id, status) {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user status.')
  }

  return data.data?.user
}

/**
 * Delete a user from the organization.
 */
export async function deleteUser(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete user.')
  }

  return data
}
