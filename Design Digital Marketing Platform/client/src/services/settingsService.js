/**
 * Settings API Service
 */

const API_BASE = '/api/settings'

export async function fetchOrganizationSettings() {
  const response = await fetch(`${API_BASE}/organization`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch organization settings.')
  }
  return data.data?.organization
}

export async function updateOrganizationSettings(payload) {
  const response = await fetch(`${API_BASE}/organization`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update organization settings.')
  }
  return data.data?.organization
}

export async function updateProfile(payload) {
  const response = await fetch(`${API_BASE}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile.')
  }
  return data.data?.user
}

export async function updatePassword(currentPassword, newPassword) {
  const response = await fetch(`${API_BASE}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update password.')
  }
  return data
}
