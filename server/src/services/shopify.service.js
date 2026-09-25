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
  const redirectUri = `${getAppUrl()}/api/integrations/shopify/callback`

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
        myshopifyDomain
        currencyCode
        timezoneAbbreviation
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
            variants(first: 1) {
              edges {
                node {
                  price
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
      const price = parseFloat(rawPrice) || 0

      await ShopifyProduct.findOneAndUpdate(
        {
          organization: organizationId,
          shopifyStore: shopifyStoreId,
          shopifyProductId: node.id,
        },
        {
          title: node.title,
          handle: node.handle || '',
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
      const currency = node.totalPriceSet?.shopMoney?.currencyCode || 'INR'

      const lineItems = (node.lineItems?.edges || []).map((le) => ({
        title: le.node.title,
        quantity: le.node.quantity || 1,
        price: parseFloat(le.node.originalUnitPriceSet?.shopMoney?.amount || '0') || 0,
      }))

      await ShopifyOrder.findOneAndUpdate(
        {
          organization: organizationId,
          shopifyStore: shopifyStoreId,
          shopifyOrderId: node.id,
        },
        {
          orderNumber: node.name || '',
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
      const currency = node.amountSpent?.currencyCode || 'INR'

      await ShopifyCustomer.findOneAndUpdate(
        {
          organization: organizationId,
          shopifyStore: shopifyStoreId,
          shopifyCustomerId: node.id,
        },
        {
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
    }
  } catch (err) {
    store.status = 'error'
    store.syncStatus.lastError = err.message
    await store.save()
    throw err
  }
}
