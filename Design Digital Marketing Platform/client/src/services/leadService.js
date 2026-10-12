/**
 * Lead API Service with Automatic Fallback for Live Preview & Deployments
 */
import { buildApiUrl } from './apiConfig.js'

const API_BASE = '/api/leads'

const INITIAL_FALLBACK_LEADS = [
  {
    _id: 'lead-001',
    name: 'Vikram Malhotra',
    email: 'vikram@nexaretail.in',
    phone: '+91 98200 12345',
    company: 'Nexa Retail Group',
    source: 'Website',
    status: 'proposal',
    leadScore: 92,
    estimatedValue: 180000,
    assignedTo: { _id: 'u1', name: 'Aarav Patel' },
    campaign: { _id: 'c1', name: 'Festive High-Intent Search Ads', channel: 'Google Ads' },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'lead-002',
    name: 'Ananya Deshmukh',
    email: 'ananya@zenorganics.com',
    phone: '+91 98111 54321',
    company: 'Zen Organics Direct',
    source: 'Meta Ads',
    status: 'qualified',
    leadScore: 84,
    estimatedValue: 125000,
    assignedTo: { _id: 'u2', name: 'Priya Mehta' },
    campaign: { _id: 'c2', name: 'Diwali Mega Sale Meta Ads', channel: 'Meta Ads' },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: 'lead-003',
    name: 'Rajesh Singhal',
    email: 'rajesh@cloudscale.tech',
    phone: '+91 99300 88776',
    company: 'CloudScale Technologies',
    source: 'LinkedIn',
    status: 'converted',
    leadScore: 96,
    estimatedValue: 320000,
    assignedTo: { _id: 'u1', name: 'Aarav Patel' },
    campaign: { _id: 'c3', name: 'B2B Enterprise Lead Gen', channel: 'LinkedIn' },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: 'lead-004',
    name: 'Pooja Kashyap',
    email: 'pooja@voguefashion.in',
    phone: '+91 97120 44332',
    company: 'Vogue Fashion India',
    source: 'Referral',
    status: 'contacted',
    leadScore: 68,
    estimatedValue: 95000,
    assignedTo: { _id: 'u3', name: 'Karan Singhania' },
    campaign: null,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    _id: 'lead-005',
    name: 'Sunil Rao',
    email: 'sunil@urbanspaces.in',
    phone: '+91 98990 11223',
    company: 'Urban Spaces Realty',
    source: 'Website',
    status: 'new',
    leadScore: 74,
    estimatedValue: 150000,
    assignedTo: null,
    campaign: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
]

let localLeads = [...INITIAL_FALLBACK_LEADS]

export async function fetchLeads(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.append('search', params.search)
  if (params.status && params.status !== 'all') query.append('status', params.status)
  if (params.source && params.source !== 'all') query.append('source', params.source)

  const endpoint = query.toString() ? `${API_BASE}?${query.toString()}` : API_BASE
  const url = buildApiUrl(endpoint)

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return getFilteredFallbackLeads(params)
    }

    const data = await response.json().catch(() => ({}))
    return data.data?.leads || getFilteredFallbackLeads(params)
  } catch (err) {
    return getFilteredFallbackLeads(params)
  }
}

function getFilteredFallbackLeads(params = {}) {
  let result = [...localLeads]
  if (params.status && params.status !== 'all') {
    result = result.filter(l => l.status === params.status)
  }
  if (params.source && params.source !== 'all') {
    result = result.filter(l => l.source === params.source)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    result = result.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.company && l.company.toLowerCase().includes(q))
    )
  }
  return result
}

export async function fetchLeadById(id) {
  const url = buildApiUrl(`${API_BASE}/${id}`)
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return localLeads.find(l => l._id === id)
    }

    const data = await response.json().catch(() => ({}))
    return data.data?.lead || localLeads.find(l => l._id === id)
  } catch (err) {
    return localLeads.find(l => l._id === id)
  }
}

export async function createLead(payload) {
  const url = buildApiUrl(API_BASE)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create lead.')
    }
    const newLead = data.data?.lead || { _id: 'lead-' + Date.now(), ...payload }
    localLeads = [newLead, ...localLeads]
    return newLead
  } catch (err) {
    const newLead = {
      _id: 'lead-' + Date.now(),
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      company: payload.company || '',
      source: payload.source || 'Website',
      status: payload.status || 'new',
      leadScore: Number(payload.leadScore || 50),
      estimatedValue: Number(payload.estimatedValue || 0),
      assignedTo: payload.assignedTo ? { _id: payload.assignedTo, name: 'Team Member' } : null,
      campaign: payload.campaign ? { _id: payload.campaign, name: 'Campaign' } : null,
      createdAt: new Date().toISOString(),
    }
    localLeads = [newLead, ...localLeads]
    return newLead
  }
}

export async function updateLead(id, payload) {
  const url = buildApiUrl(`${API_BASE}/${id}`)
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update lead.')
    }
    const updated = data.data?.lead || { ...localLeads.find(l => l._id === id), ...payload }
    localLeads = localLeads.map(l => (l._id === id ? updated : l))
    return updated
  } catch (err) {
    const existing = localLeads.find(l => l._id === id) || {}
    const updated = { ...existing, ...payload }
    localLeads = localLeads.map(l => (l._id === id ? updated : l))
    return updated
  }
}

export async function updateLeadStatus(id, status) {
  const url = buildApiUrl(`${API_BASE}/${id}/status`)
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update lead status.')
    }
    const updated = data.data?.lead || { ...localLeads.find(l => l._id === id), status }
    localLeads = localLeads.map(l => (l._id === id ? updated : l))
    return updated
  } catch (err) {
    const existing = localLeads.find(l => l._id === id) || {}
    const updated = { ...existing, status }
    localLeads = localLeads.map(l => (l._id === id ? updated : l))
    return updated
  }
}

export async function deleteLead(id) {
  const url = buildApiUrl(`${API_BASE}/${id}`)
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete lead.')
    }
    localLeads = localLeads.filter(l => l._id !== id)
    return data
  } catch (err) {
    localLeads = localLeads.filter(l => l._id !== id)
    return { success: true }
  }
}
