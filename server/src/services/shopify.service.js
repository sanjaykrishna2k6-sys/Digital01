import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyCustomer from '../models/ShopifyCustomer.js'
import { decryptToken } from '../utils/crypto.js'

const getApiVersion = () => process.env.SHOPIFY_API_VERSION || '2025-01'
const getApiKey = () => process.env.SHOPIFY_API_KEY
const getApiSecret = () => process.env.SHOPIFY_API_SECRET
const getScopes = () => process.env.SHOPIFY_SCOPES || 'read_products,read_orders,read_customers'
const getAppUrl = () => process.env.SHOPIFY_APP_URL || 'http://localhost:5000'

/**
 * Build Shopify OAuth 2.0 authorization URL.
 */
export function buildOAuthUrl(shop, stateNonce) {
  const apiKey = getApiKey()
  const scopes = getScopes()
  const redirectUri = `${getAppUrl()}/api/shopify/callback`

  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state: stateNonce,
  })

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`
}

/**
 * Exchange temporary authorization code for permanent offline access token.
 */
export async function exchangeCodeForAccessToken(shop, code) {
  const apiKey = getApiKey()
  const apiSecret = getApiSecret()

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange Shopify authorization code.')
  }

  return {
    accessToken: data.access_token,
    scope: data.scope,
  }
}

/**
 * Execute Shopify GraphQL Admin API query with automatic rate limit backoff.
 */
export async function executeGraphQL(shop, accessToken, query, variables = {}) {
  const apiVersion = getApiVersion()
  const endpoint = `https://${shop}/admin/api/${apiVersion}/graphql.json`

  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    attempts++
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (response.status === 429) {
      // Rate limited by Shopify, wait for bucket leak
      const retryAfter = Number(response.headers.get('Retry-After') || '2')
      await new Promise((r) => setTimeout(r, retryAfter * 1000))
      continue
    }

    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(`Shopify API error (${response.status}): ${json.errors?.[0]?.message || 'Unknown error'}`)
    }

    if (json.errors && json.errors.length > 0) {
      const isThrottled = json.errors.some((e) => e.extensions?.code === 'THROTTLED')
      if (isThrottled && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      throw new Error(`Shopify GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`)
    }

    return json.data
  }

  throw new Error('Shopify API request exceeded maximum retry attempts.')
}

/**
 * Fetch shop metadata using GraphQL Admin API.
 */
export async function fetchShopDetails(shop, accessToken) {
  const query = `
    query {
      shop {
        id
        name
        email
        myshopifyDomain
        currencyCode
        timezoneAbbreviation
        billingAddress {
          country
        }
      }
    }
  `
  const data = await executeGraphQL(shop, accessToken, query)
  return data?.shop
}

/**
 * Synchronize Shopify products catalog using GraphQL with cursor-based pagination.
 */
export async function syncProducts(organizationId, shopifyStoreId, shop, accessToken) {
  let hasNextPage = true
  let cursor = null
  let count = 0

  const query = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            status
            vendor
            productType
            totalInventory
            variants(first: 5) {
              edges {
                node {
                  price
                  sku
                }
              }
            }
            createdAt
            updatedAt
          }
        }
      }
    }
  `

  while (hasNextPage) {
    const data = await executeGraphQL(shop, accessToken, query, { first: 50, after: cursor })
    const productsData = data?.products
    const edges = productsData?.edges || []

    for (const edge of edges) {
      const node = edge.node
      const rawPrice = node.variants?.edges?.[0]?.node?.price || '0'
      const sku = node.variants?.edges?.[0]?.node?.sku || ''
      const price = parseFloat(rawPrice) || 0

      await ShopifyProduct.findOneAndUpdate(
        {
          $or: [
            { organizationId, shopifyStore: shopifyStoreId, shopifyProductId: node.id },
            { organization: organizationId, shopifyStore: shopifyStoreId, shopifyProductId: node.id },
          ],
        },
        {
          organizationId,
          organization: organizationId,
          shopifyStore: shopifyStoreId,
          shopifyProductId: node.id,
          title: node.title,
          handle: node.handle || '',
          sku,
          status: node.status || 'ACTIVE',
          vendor: node.vendor || '',
          productType: node.productType || '',
          totalInventory: node.totalInventory || 0,
          price,
          createdAtShopify: node.createdAt ? new Date(node.createdAt) : null,
          updatedAtShopify: node.updatedAt ? new Date(node.updatedAt) : null,
          syncedAt: new Date(),
        },
        { upsert: true, new: true }
      )
      count++
    }

    hasNextPage = productsData?.pageInfo?.hasNextPage || false
    cursor = productsData?.pageInfo?.endCursor || null
  }

  return count
}

/**
 * Synchronize Shopify orders using GraphQL with cursor-based pagination.
 */
export async function syncOrders(organizationId, shopifyStoreId, shop, accessToken) {
  let hasNextPage = true
  let cursor = null
  let count = 0

  const query = `
    query getOrders($first: Int!, $after: String) {
      orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            name
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            subtotalPriceSet {
              shopMoney {
                amount
              }
            }
            totalTaxSet {
              shopMoney {
                amount
              }
            }
            totalDiscountsSet {
              shopMoney {
                amount
              }
            }
            customer {
              firstName
              lastName
              email
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  originalUnitPriceSet {
                    shopMoney {
                      amount
                    }
                  }
                }
              }
            }
            createdAt
            processedAt
            cancelledAt
          }
        }
      }
    }
  `

  while (hasNextPage) {
    const data = await executeGraphQL(shop, accessToken, query, { first: 50, after: cursor })
    const ordersData = data?.orders
    const edges = ordersData?.edges || []

    for (const edge of edges) {
      const node = edge.node
      const totalPrice = parseFloat(node.totalPriceSet?.shopMoney?.amount || '0') || 0
      const subtotal = parseFloat(node.subtotalPriceSet?.shopMoney?.amount || '0') || 0
      const totalTax = parseFloat(node.totalTaxSet?.shopMoney?.amount || '0') || 0
      const discountTotal = parseFloat(node.totalDiscountsSet?.shopMoney?.amount || '0') || 0
      const currency = node.totalPriceSet?.shopMoney?.currencyCode || 'USD'

      const customerName = node.customer
        ? `${node.customer.firstName || ''} ${node.customer.lastName || ''}`.trim()
        : 'Guest Customer'
      const customerEmail = node.customer?.email || ''

      const lineItems = (node.lineItems?.edges || []).map((le) => ({
        title: le.node.title,
        quantity: le.node.quantity || 1,
        price: parseFloat(le.node.originalUnitPriceSet?.shopMoney?.amount || '0') || 0,
      }))

      await ShopifyOrder.findOneAndUpdate(
        {
          $or: [
            { organizationId, shopifyStore: shopifyStoreId, shopifyOrderId: node.id },
            { organization: organizationId, shopifyStore: shopifyStoreId, shopifyOrderId: node.id },
          ],
        },
        {
          organizationId,
          organization: organizationId,
          shopifyStore: shopifyStoreId,
          shopifyOrderId: node.id,
          orderNumber: node.name || '',
          customerName,
          customerEmail,
          financialStatus: node.displayFinancialStatus || 'PAID',
          fulfillmentStatus: node.displayFulfillmentStatus || 'UNFULFILLED',
          currency,
          subtotal,
          totalTax,
          totalPrice,
          discountTotal,
          lineItems,
          createdAtShopify: node.createdAt ? new Date(node.createdAt) : null,
          processedAt: node.processedAt ? new Date(node.processedAt) : null,
          cancelledAt: node.cancelledAt ? new Date(node.cancelledAt) : null,
          syncedAt: new Date(),
        },
        { upsert: true, new: true }
      )
      count++
    }

    hasNextPage = ordersData?.pageInfo?.hasNextPage || false
    cursor = ordersData?.pageInfo?.endCursor || null
  }

  return count
}

/**
 * Synchronize Shopify customers using GraphQL with cursor-based pagination.
 */
export async function syncCustomers(organizationId, shopifyStoreId, shop, accessToken) {
  let hasNextPage = true
  let cursor = null
  let count = 0

  const query = `
    query getCustomers($first: Int!, $after: String) {
      customers(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            firstName
            lastName
            email
            phone
            numberOfOrders
            amountSpent {
              amount
              currencyCode
            }
            createdAt
          }
        }
      }
    }
  `

  while (hasNextPage) {
    const data = await executeGraphQL(shop, accessToken, query, { first: 50, after: cursor })
    const customersData = data?.customers
    const edges = customersData?.edges || []

    for (const edge of edges) {
      const node = edge.node
      const ordersCount = parseInt(node.numberOfOrders || '0', 10) || 0
      const totalSpent = parseFloat(node.amountSpent?.amount || '0') || 0
      const currency = node.amountSpent?.currencyCode || 'USD'

      await ShopifyCustomer.findOneAndUpdate(
        {
          $or: [
            { organizationId, shopifyStore: shopifyStoreId, shopifyCustomerId: node.id },
            { organization: organizationId, shopifyStore: shopifyStoreId, shopifyCustomerId: node.id },
          ],
        },
        {
          organizationId,
          organization: organizationId,
          shopifyStore: shopifyStoreId,
          shopifyCustomerId: node.id,
          firstName: node.firstName || '',
          lastName: node.lastName || '',
          email: node.email ? node.email.toLowerCase().trim() : '',
          phone: node.phone || '',
          ordersCount,
          totalSpent,
          currency,
          createdAtShopify: node.createdAt ? new Date(node.createdAt) : null,
          syncedAt: new Date(),
        },
        { upsert: true, new: true }
      )
      count++
    }

    hasNextPage = customersData?.pageInfo?.hasNextPage || false
    cursor = customersData?.pageInfo?.endCursor || null
  }

  return count
}

/**
 * Execute full catalog, order, and customer synchronization for a store.
 */
export async function performFullSync(organizationId, store) {
  try {
    store.status = 'syncing'
    await store.save()

    const accessToken = decryptToken(store.encryptedAccessToken)

    const [productsCount, ordersCount, customersCount] = await Promise.all([
      syncProducts(organizationId, store._id, store.shopDomain, accessToken),
      syncOrders(organizationId, store._id, store.shopDomain, accessToken),
      syncCustomers(organizationId, store._id, store.shopDomain, accessToken),
    ])

    store.status = 'connected'
    store.lastSyncedAt = new Date()
    store.syncStatus = {
      productsCount,
      ordersCount,
      customersCount,
      lastError: '',
    }
    await store.save()

    return {
      status: 'success',
      productsCount,
      ordersCount,
      customersCount,
      lastSyncedAt: store.lastSyncedAt,
    }
  } catch (err) {
    store.status = 'error'
    store.syncStatus = store.syncStatus || {}
    store.syncStatus.lastError = err.message
    await store.save()
    throw err
  }
}

// =========================================================================
// Encapsulated Service Functions specified in Section 5
// =========================================================================

/**
 * Retrieve connected ShopifyStore record for the authenticated organization.
 */
export async function getShopifyStore(organizationId) {
  return ShopifyStore.findOne({
    $or: [{ organizationId }, { organization: organizationId }],
  })
}

/**
 * Retrieve live shop info from Shopify Admin API or cached store metadata.
 */
export async function getShopInfo(organizationId) {
  const store = await ShopifyStore.findOne({
    $or: [{ organizationId }, { organization: organizationId }],
    status: { $in: ['connected', 'syncing'] },
  }).select('+encryptedAccessToken')

  if (!store || !store.encryptedAccessToken) {
    return null
  }

  try {
    const accessToken = decryptToken(store.encryptedAccessToken)
    const remoteDetails = await fetchShopDetails(store.shopDomain, accessToken)
    return {
      ...remoteDetails,
      shopDomain: store.shopDomain,
      connectedAt: store.connectedAt,
      lastSyncedAt: store.lastSyncedAt,
      syncStatus: store.syncStatus,
    }
  } catch (err) {
    // Return cached details on remote API error or offline dev
    return {
      name: store.shopName,
      myshopifyDomain: store.shopDomain,
      currencyCode: store.currency,
      timezoneAbbreviation: store.timezone,
      connectedAt: store.connectedAt,
      lastSyncedAt: store.lastSyncedAt,
      syncStatus: store.syncStatus,
    }
  }
}

/**
 * Get paginated products for an organization.
 */
export async function getProducts(organizationId, { page = 1, limit = 20, search, status } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (pageNum - 1) * limitNum

  const filter = {
    $or: [{ organizationId }, { organization: organizationId }],
  }

  if (status && status !== 'all') {
    filter.status = status.toUpperCase()
  }

  if (search && search.trim()) {
    const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(sanitized, 'i')
    filter.$and = filter.$and || []
    filter.$and.push({
      $or: [{ title: regex }, { handle: regex }, { vendor: regex }, { productType: regex }, { sku: regex }],
    })
  }

  const [products, total] = await Promise.all([
    ShopifyProduct.find(filter).sort({ createdAtShopify: -1, createdAt: -1 }).skip(skip).limit(limitNum),
    ShopifyProduct.countDocuments(filter),
  ])

  return {
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  }
}

/**
 * Get single product by ID for an organization.
 */
export async function getProduct(organizationId, id) {
  const filter = {
    $or: [{ organizationId }, { organization: organizationId }],
  }

  if (id.startsWith('gid://shopify/Product/')) {
    filter.shopifyProductId = id
  } else {
    filter._id = id
  }

  return ShopifyProduct.findOne(filter)
}

/**
 * Get paginated orders for an organization.
 */
export async function getOrders(
  organizationId,
  { page = 1, limit = 20, search, financialStatus, fulfillmentStatus } = {}
) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (pageNum - 1) * limitNum

  const filter = {
    $or: [{ organizationId }, { organization: organizationId }],
  }

  if (financialStatus && financialStatus !== 'all') {
    filter.financialStatus = financialStatus.toUpperCase()
  }

  if (fulfillmentStatus && fulfillmentStatus !== 'all') {
    filter.fulfillmentStatus = fulfillmentStatus.toUpperCase()
  }

  if (search && search.trim()) {
    const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(sanitized, 'i')
    filter.$and = filter.$and || []
    filter.$and.push({
      $or: [{ orderNumber: regex }, { customerName: regex }, { customerEmail: regex }],
    })
  }

  const [orders, total] = await Promise.all([
    ShopifyOrder.find(filter).sort({ createdAtShopify: -1, createdAt: -1 }).skip(skip).limit(limitNum),
    ShopifyOrder.countDocuments(filter),
  ])

  return {
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  }
}

/**
 * Get single order by ID for an organization.
 */
export async function getOrder(organizationId, id) {
  const filter = {
    $or: [{ organizationId }, { organization: organizationId }],
  }

  if (id.startsWith('gid://shopify/Order/')) {
    filter.shopifyOrderId = id
  } else {
    filter._id = id
  }

  return ShopifyOrder.findOne(filter)
}

/**
 * Get paginated customers for an organization.
 */
export async function getCustomers(organizationId, { page = 1, limit = 20, search } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (pageNum - 1) * limitNum

  const filter = {
    $or: [{ organizationId }, { organization: organizationId }],
  }

  if (search && search.trim()) {
    const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(sanitized, 'i')
    filter.$and = filter.$and || []
    filter.$and.push({
      $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }],
    })
  }

  const [customers, total] = await Promise.all([
    ShopifyCustomer.find(filter).sort({ createdAtShopify: -1, createdAt: -1 }).skip(skip).limit(limitNum),
    ShopifyCustomer.countDocuments(filter),
  ])

  return {
    customers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  }
}

/**
 * Get single customer by ID for an organization.
 */
export async function getCustomer(organizationId, id) {
  const filter = {
    $or: [{ organizationId }, { organization: organizationId }],
  }

  if (id.startsWith('gid://shopify/Customer/')) {
    filter.shopifyCustomerId = id
  } else {
    filter._id = id
  }

  return ShopifyCustomer.findOne(filter)
}

/**
 * Trigger full store sync by organization ID.
 */
export async function syncStore(organizationId) {
  const store = await ShopifyStore.findOne({
    $or: [{ organizationId }, { organization: organizationId }],
    status: { $in: ['connected', 'error'] },
  }).select('+encryptedAccessToken')

  if (!store) {
    throw new Error('No connected Shopify store found for this organization.')
  }

  if (!store.encryptedAccessToken) {
    throw new Error('Shopify credentials missing. Please reconnect your store.')
  }

  return performFullSync(organizationId, store)
}
