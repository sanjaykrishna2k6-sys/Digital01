/**
 * Shopify Integration API Service
 * 
 * SECURITY NOTICE:
 * All requests rely strictly on HTTP-only session cookies.
 * Authentication tokens, secrets, and credentials are NEVER persisted in localStorage or sessionStorage.
 * Exclusively communicates through Scalevo backend API with credentials: 'include'.
 */

const API_BASE = '/api/shopify'

/**
 * Fetch connected Shopify store status.
 */
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

/**
 * Fetch detailed connected store metadata.
 */
export async function getStore() {
  const response = await fetch(`${API_BASE}/store`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch store details.')
  }
  return data.data?.store
}

/**
 * Initiate OAuth installation flow for a shop domain.
 */
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

/**
 * Manually trigger store catalog, orders, and customer synchronization.
 */
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

/**
 * Disconnect active Shopify store and purge credentials on server.
 */
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

/**
 * Fetch paginated synced products with search and filtering.
 */
export async function getProducts(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  if (params.status && params.status !== 'all') query.set('status', params.status)

  const url = query.toString() ? `${API_BASE}/products?${query.toString()}` : `${API_BASE}/products`
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch products.')
  }
  return data
}

/**
 * Fetch single product details by ID.
 */
export async function getProduct(id) {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch product details.')
  }
  return data.data?.product
}

/**
 * Fetch paginated synced orders with search and filtering.
 */
export async function getOrders(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  if (params.financialStatus && params.financialStatus !== 'all') {
    query.set('financialStatus', params.financialStatus)
  }
  if (params.fulfillmentStatus && params.fulfillmentStatus !== 'all') {
    query.set('fulfillmentStatus', params.fulfillmentStatus)
  }

  const url = query.toString() ? `${API_BASE}/orders?${query.toString()}` : `${API_BASE}/orders`
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch orders.')
  }
  return data
}

/**
 * Fetch single order details by ID.
 */
export async function getOrder(id) {
  const response = await fetch(`${API_BASE}/orders/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch order details.')
  }
  return data.data?.order
}

/**
 * Fetch paginated synced customers with search.
 */
export async function getCustomers(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)

  const url = query.toString() ? `${API_BASE}/customers?${query.toString()}` : `${API_BASE}/customers`
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch customers.')
  }
  return data
}

/**
 * Fetch single customer details by ID.
 */
export async function getCustomer(id) {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch customer details.')
  }
  return data.data?.customer
}
