/**
 * Campaign Management API Service
 * 
 * SECURITY NOTICE:
 * All requests rely strictly on HTTP-only session cookies.
 * Authentication tokens, secrets, and credentials are NEVER persisted in localStorage or sessionStorage.
 */

const API_BASE = '/api/campaigns'

/**
 * Fetch paginated campaigns with search and filtering.
 */
export async function getCampaigns(params = {}) {
  const query = new URLSearchParams()

  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.campaignType && params.campaignType !== 'all') query.set('campaignType', params.campaignType)
  if (params.channel && params.channel !== 'all') query.set('channel', params.channel)
  if (params.clientId && params.clientId !== 'all') query.set('clientId', params.clientId)
  if (params.campaignManager && params.campaignManager !== 'all') {
    query.set('campaignManager', params.campaignManager)
  }
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const queryString = query.toString()
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch campaigns.')
  }

  return data
}

// Backward-compatible alias that returns the array of campaigns directly if expected
export async function fetchCampaigns(params = {}) {
  const data = await getCampaigns(params)
  return data.data?.campaigns || []
}

/**
 * Fetch a single campaign by ID.
 */
export async function getCampaign(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve campaign details.')
  }

  return data.data?.campaign
}

// Backward-compatible alias
export const fetchCampaignById = getCampaign

/**
 * Create a new campaign.
 */
export async function createCampaign(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create campaign.')
  }

  return data.data?.campaign
}

/**
 * Update campaign details.
 */
export async function updateCampaign(id, payload) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update campaign.')
  }

  return data.data?.campaign
}

/**
 * Update campaign status.
 */
export async function updateCampaignStatus(id, status) {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update campaign status.')
  }

  return data.data?.campaign
}

/**
 * Delete a campaign.
 */
export async function deleteCampaign(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete campaign.')
  }

  return data
}

/**
 * Fetch campaign statistics and pacing metrics.
 */
export async function getCampaignStatistics(id) {
  const response = await fetch(`${API_BASE}/${id}/statistics`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve campaign statistics.')
  }

  return data.data?.statistics
}
