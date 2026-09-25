/**
 * Customer API Service
 */

const API_BASE = '/api/customers'

export async function fetchCustomers(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.append('search', params.search)
  if (params.status && params.status !== 'all') query.append('status', params.status)

  const url = query.toString() ? `${API_BASE}?${query.toString()}` : API_BASE

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch customers.')
  }
  return data.data?.customers || []
}

export async function fetchCustomerById(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch customer.')
  }
  return data.data?.customer
}

export async function createCustomer(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create customer.')
  }
  return data.data?.customer
}

export async function updateCustomer(id, payload) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update customer.')
  }
  return data.data?.customer
}

export async function deleteCustomer(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete customer.')
  }
  return data
}
