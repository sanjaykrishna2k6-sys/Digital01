/**
 * Shopify Integration API Service
 * Exclusively communicates through Scalevo backend API proxies with credentials: 'include'.
 * Never directly contacts Shopify or handles client secrets.
 */

const API_BASE = '/api/integrations/shopify'

export async function fetchShopifyStatus() {
  const response = await fetch(`${API_BASE}/status`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch Shopify integration status.')
  }
  return data.data
}

export async function connectShopify(shopDomain) {
  const query = new URLSearchParams({ shop: shopDomain })
  const response = await fetch(`${API_BASE}/connect?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to initiate Shopify connection.')
  }
  return data.data?.authUrl
}

export async function syncShopify() {
  const response = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Shopify synchronization failed.')
  }
  return data.data
}

export async function disconnectShopify() {
  const response = await fetch(`${API_BASE}/disconnect`, {
    method: 'POST',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to disconnect Shopify store.')
  }
  return data
}
