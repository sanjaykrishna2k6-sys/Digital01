/**
 * Lead API Service
 */

const API_BASE = '/api/leads'

export async function fetchLeads(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.append('search', params.search)
  if (params.status && params.status !== 'all') query.append('status', params.status)
  if (params.source && params.source !== 'all') query.append('source', params.source)

  const url = query.toString() ? `${API_BASE}?${query.toString()}` : API_BASE

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch leads.')
  }
  return data.data?.leads || []
}

export async function fetchLeadById(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch lead.')
  }
  return data.data?.lead
}

export async function createLead(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create lead.')
  }
  return data.data?.lead
}

export async function updateLead(id, payload) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update lead.')
  }
  return data.data?.lead
}

export async function updateLeadStatus(id, status) {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update lead status.')
  }
  return data.data?.lead
}

export async function deleteLead(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete lead.')
  }
  return data
}
