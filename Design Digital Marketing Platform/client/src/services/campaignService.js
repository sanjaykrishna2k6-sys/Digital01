/**
 * Campaign API Service
 */

const API_BASE = '/api/campaigns'

export async function fetchCampaigns(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.append('search', params.search)
  if (params.status && params.status !== 'all') query.append('status', params.status)
  if (params.channel && params.channel !== 'all') query.append('channel', params.channel)

  const url = query.toString() ? `${API_BASE}?${query.toString()}` : API_BASE

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch campaigns.')
  }
  return data.data?.campaigns || []
}

export async function fetchCampaignById(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch campaign.')
  }
  return data.data?.campaign
}

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

export async function updateCampaign(id, payload) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
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
