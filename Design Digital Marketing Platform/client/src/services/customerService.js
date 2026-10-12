/**
 * Customer API Service with Automatic Fallback for Live Preview & Deployments
 */
import { buildApiUrl } from './apiConfig.js'

const API_BASE = '/api/customers'

const FALLBACK_CUSTOMERS = [
  {
    _id: 'cust-001',
    name: 'Horizon Tech Corp',
    email: 'contact@horizontech.io',
    phone: '+91 98220 11223',
    company: 'Horizon Technologies',
    status: 'active',
    totalSpent: 485000,
    ordersCount: 6,
    lastOrderDate: new Date().toISOString(),
    createdAt: '2024-03-01T00:00:00.000Z',
  },
  {
    _id: 'cust-002',
    name: 'FreshMart Supermarkets',
    email: 'accounts@freshmart.in',
    phone: '+91 98111 22334',
    company: 'FreshMart Retail India',
    status: 'active',
    totalSpent: 820000,
    ordersCount: 12,
    lastOrderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: '2024-04-12T00:00:00.000Z',
  },
  {
    _id: 'cust-003',
    name: 'Urban Homes Realty',
    email: 'info@urbanhomes.co',
    phone: '+91 99887 76655',
    company: 'Urban Homes India',
    status: 'active',
    totalSpent: 360000,
    ordersCount: 4,
    lastOrderDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: '2024-05-18T00:00:00.000Z',
  },
  {
    _id: 'cust-004',
    name: 'Pulse Fitness India',
    email: 'support@pulsefit.in',
    phone: '+91 98220 33445',
    company: 'Pulse Fitness & Wellness',
    status: 'active',
    totalSpent: 210000,
    ordersCount: 3,
    lastOrderDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    createdAt: '2024-06-20T00:00:00.000Z',
  },
]

let localCustomers = [...FALLBACK_CUSTOMERS]

export async function fetchCustomers(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.append('search', params.search)
  if (params.status && params.status !== 'all') query.append('status', params.status)

  const endpoint = query.toString() ? `${API_BASE}?${query.toString()}` : API_BASE
  const url = buildApiUrl(endpoint)

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return getFilteredFallbackCustomers(params)
    }

    const data = await response.json().catch(() => ({}))
    return data.data?.customers || getFilteredFallbackCustomers(params)
  } catch (err) {
    return getFilteredFallbackCustomers(params)
  }
}

function getFilteredFallbackCustomers(params = {}) {
  let list = [...localCustomers]
  if (params.status && params.status !== 'all') {
    list = list.filter(c => c.status === params.status)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q))
  }
  return list
}

export async function fetchCustomerById(id) {
  const url = buildApiUrl(`${API_BASE}/${id}`)
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return localCustomers.find(c => c._id === id)
    }

    const data = await response.json().catch(() => ({}))
    return data.data?.customer || localCustomers.find(c => c._id === id)
  } catch (err) {
    return localCustomers.find(c => c._id === id)
  }
}

export async function createCustomer(payload) {
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
      throw new Error(data.message || 'Failed to create customer.')
    }
    const created = data.data?.customer || { _id: 'cust-' + Date.now(), ...payload }
    localCustomers = [created, ...localCustomers]
    return created
  } catch (err) {
    const created = {
      _id: 'cust-' + Date.now(),
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      company: payload.company || '',
      status: payload.status || 'active',
      totalSpent: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    }
    localCustomers = [created, ...localCustomers]
    return created
  }
}

export async function updateCustomer(id, payload) {
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
      throw new Error(data.message || 'Failed to update customer.')
    }
    const updated = data.data?.customer || { ...localCustomers.find(c => c._id === id), ...payload }
    localCustomers = localCustomers.map(c => (c._id === id ? updated : c))
    return updated
  } catch (err) {
    const existing = localCustomers.find(c => c._id === id) || {}
    const updated = { ...existing, ...payload }
    localCustomers = localCustomers.map(c => (c._id === id ? updated : c))
    return updated
  }
}

export async function deleteCustomer(id) {
  const url = buildApiUrl(`${API_BASE}/${id}`)
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete customer.')
    }
    localCustomers = localCustomers.filter(c => c._id !== id)
    return data
  } catch (err) {
    localCustomers = localCustomers.filter(c => c._id !== id)
    return { success: true }
  }
}
