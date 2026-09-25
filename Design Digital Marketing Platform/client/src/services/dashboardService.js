/**
 * Dashboard API Service
 */

const API_BASE = '/api/dashboard'

export async function fetchDashboardStats() {
  const response = await fetch(`${API_BASE}/stats`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dashboard metrics.')
  }
  return data.data
}
