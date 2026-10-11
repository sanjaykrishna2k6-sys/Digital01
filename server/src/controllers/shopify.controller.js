import crypto from 'crypto'
import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyCustomer from '../models/ShopifyCustomer.js'
import {
  buildOAuthUrl,
  exchangeCodeForAccessToken,
  fetchShopDetails,
  performFullSync,
  getShopInfo,
  getProducts,
  getProduct,
  getOrders,
  getOrder,
  getCustomers,
  getCustomer,
  syncStore,
} from '../services/shopify.service.js'
import {
  encryptToken,
  isValidShopDomain,
  verifyShopifyOAuthHmac,
} from '../utils/crypto.js'

/**
 * GET /api/shopify/status or /api/integrations/shopify/status
 * Retrieve connected Shopify store status for authenticated organization.
 */
export async function getStoreStatus(req, res, next) {
  try {
    const store = await ShopifyStore.findOne({
      $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
    })

    if (!store || store.status === 'disconnected') {
      return res.status(200).json({
        status: 'success',
        data: {
          isConnected: false,
          store: null,
        },
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        isConnected: store.status === 'connected' || store.status === 'syncing',
        store: {
          id: store._id,
          shopDomain: store.shopDomain,
          shopName: store.shopName || store.shopDomain,
          shopEmail: store.shopEmail,
          currency: store.currency,
          country: store.country,
          timezone: store.timezone,
          status: store.status,
          installedAt: store.installedAt || store.connectedAt,
          connectedAt: store.connectedAt,
          lastSyncedAt: store.lastSyncedAt,
          syncStatus: store.syncStatus,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/store
 * Retrieve detailed connected Shopify store info.
 */
export async function getStore(req, res, next) {
  try {
    const store = await ShopifyStore.findOne({
      $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
    })

    if (!store || store.status === 'disconnected') {
      return res.status(404).json({
        status: 'fail',
        message: 'No connected Shopify store found for this organization.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        store: {
          id: store._id,
          shopDomain: store.shopDomain,
          shopName: store.shopName,
          shopEmail: store.shopEmail,
          currency: store.currency,
          country: store.country,
          timezone: store.timezone,
          scopes: store.scopes,
          status: store.status,
          installedAt: store.installedAt || store.connectedAt,
          lastSyncedAt: store.lastSyncedAt,
          syncStatus: store.syncStatus,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/products
 * List synced products with pagination and search.
 */
export async function listProducts(req, res, next) {
  try {
    const { page, limit, search, status } = req.query
    const result = await getProducts(req.organizationId, { page, limit, search, status })

    res.status(200).json({
      status: 'success',
      data: {
        products: result.products,
      },
      pagination: result.pagination,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/products/:id
 * Retrieve single product details.
 */
export async function getProductById(req, res, next) {
  try {
    const product = await getProduct(req.organizationId, req.params.id)
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/orders
 * List synced orders with pagination, search, and status filters.
 */
export async function listOrders(req, res, next) {
  try {
    const { page, limit, search, financialStatus, fulfillmentStatus } = req.query
    const result = await getOrders(req.organizationId, {
      page,
      limit,
      search,
      financialStatus,
      fulfillmentStatus,
    })

    res.status(200).json({
      status: 'success',
      data: {
        orders: result.orders,
      },
      pagination: result.pagination,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/orders/:id
 * Retrieve single order details.
 */
export async function getOrderById(req, res, next) {
  try {
    const order = await getOrder(req.organizationId, req.params.id)
    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/customers
 * List synced customers with pagination and search.
 */
export async function listCustomers(req, res, next) {
  try {
    const { page, limit, search } = req.query
    const result = await getCustomers(req.organizationId, { page, limit, search })

    res.status(200).json({
      status: 'success',
      data: {
        customers: result.customers,
      },
      pagination: result.pagination,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/customers/:id
 * Retrieve single customer details.
 */
export async function getCustomerById(req, res, next) {
  try {
    const customer = await getCustomer(req.organizationId, req.params.id)
    if (!customer) {
      return res.status(404).json({
        status: 'fail',
        message: 'Customer not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        customer,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/connect
 * Initiate Shopify OAuth 2.0 installation flow.
 */
export async function initiateConnect(req, res, next) {
  try {
    let { shop } = req.query

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Shopify store domain (e.g. your-store.myshopify.com) is required.',
      })
    }

    shop = shop.trim().toLowerCase()
    if (!shop.includes('.')) {
      shop = `${shop}.myshopify.com`
    }

    if (!isValidShopDomain(shop)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid Shopify store domain format. Must be an authentic .myshopify.com domain.',
      })
    }

    // Cryptographic state nonce for CSRF prevention
    const stateNonce = crypto.randomBytes(16).toString('hex')

    // Store state in short-lived HTTP-only cookie tied to current organization
    res.cookie('shopify_oauth_state', stateNonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
    })

    const authUrl = buildOAuthUrl(shop, stateNonce)

    res.status(200).json({
      status: 'success',
      data: {
        authUrl,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/callback
 * Complete Shopify OAuth 2.0 authorization, exchange code for token, and start sync.
 */
export async function handleCallback(req, res, next) {
  try {
    const { code, shop, state, hmac } = req.query
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

    // 1. Verify state nonce from cookie
    const storedState = req.cookies?.shopify_oauth_state
    if (!storedState || storedState !== state) {
      return res.redirect(`${clientUrl}/shopify?error=invalid_oauth_state`)
    }
    res.clearCookie('shopify_oauth_state', { path: '/' })

    // 2. Validate shop domain
    if (!isValidShopDomain(shop)) {
      return res.redirect(`${clientUrl}/shopify?error=invalid_shop_domain`)
    }

    // 3. Verify HMAC signature
    if (!verifyShopifyOAuthHmac(req.query)) {
      return res.redirect(`${clientUrl}/shopify?error=invalid_hmac_signature`)
    }

    // 4. Exchange code for access token
    const { accessToken, scope } = await exchangeCodeForAccessToken(shop, code)

    // 5. Encrypt access token at rest using AES-256-GCM
    const encryptedToken = encryptToken(accessToken)

    // 6. Fetch basic shop metadata using GraphQL
    let shopDetails = {}
    try {
      shopDetails = (await fetchShopDetails(shop, accessToken)) || {}
    } catch (apiErr) {
      console.warn('[Shopify] Warning: Unable to fetch shop details during install:', apiErr.message)
    }

    // 7. Upsert store record scoped to caller's organization
    const store = await ShopifyStore.findOneAndUpdate(
      {
        $or: [
          { organizationId: req.organizationId, shopDomain: shop.toLowerCase() },
          { organization: req.organizationId, shopDomain: shop.toLowerCase() },
        ],
      },
      {
        organizationId: req.organizationId,
        organization: req.organizationId,
        shopDomain: shop.toLowerCase(),
        shopName: shopDetails.name || shop,
        shopEmail: shopDetails.email || '',
        shopifyStoreId: shopDetails.id || '',
        currency: shopDetails.currencyCode || 'USD',
        country: shopDetails.billingAddress?.country || 'US',
        timezone: shopDetails.timezoneAbbreviation || 'UTC',
        encryptedAccessToken: encryptedToken,
        scopes: scope || 'read_products,read_orders,read_customers',
        status: 'connected',
        connectedAt: new Date(),
        installedAt: new Date(),
        disconnectedAt: null,
      },
      { upsert: true, new: true }
    )

    // 8. Start initial sync in background (non-blocking)
    performFullSync(req.organizationId, store).catch((err) => {
      console.error('[Shopify] Background initial sync failed:', err.message)
    })

    // 9. Redirect back to Scalevo Shopify page with success indicator
    res.redirect(`${clientUrl}/shopify?shopify=connected`)
  } catch (err) {
    console.error('[Shopify] OAuth callback error:', err.message)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    res.redirect(`${clientUrl}/shopify?error=oauth_exchange_failed`)
  }
}

/**
 * POST /api/shopify/sync
 * Manually trigger full store synchronization.
 */
export async function triggerSync(req, res, next) {
  try {
    const store = await ShopifyStore.findOne({
      $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
      status: { $in: ['connected', 'error'] },
    }).select('+encryptedAccessToken')

    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'No active Shopify store connected to this organization workspace.',
      })
    }

    if (!store.encryptedAccessToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'Shopify credentials missing. Please reconnect your store.',
      })
    }

    const result = await performFullSync(req.organizationId, store)

    res.status(200).json({
      status: 'success',
      message: 'Shopify synchronization completed successfully.',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/shopify/disconnect
 * Disconnect Shopify store and purge credentials.
 */
export async function disconnectStore(req, res, next) {
  try {
    const store = await ShopifyStore.findOne({
      $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
      status: { $in: ['connected', 'syncing', 'error'] },
    })

    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'No connected Shopify store found.',
      })
    }

    store.status = 'disconnected'
    store.encryptedAccessToken = '' // Purge credentials
    store.disconnectedAt = new Date()
    await store.save()

    res.status(200).json({
      status: 'success',
      message: 'Shopify store disconnected successfully. Stored credentials purged.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/analytics
 * E-commerce revenue metrics & sales distribution analytics.
 */
export async function getShopifyAnalytics(req, res, next) {
  try {
    const store = await ShopifyStore.findOne({
      $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
      status: { $in: ['connected', 'syncing', 'error'] },
    })

    if (!store) {
      return res.status(200).json({
        status: 'success',
        data: {
          metrics: { grossSales: 0, netSales: 0, totalOrders: 0, averageOrderValue: 0, repeatCustomerRate: 0 },
          salesTrend: [],
        },
      })
    }

    const [orders, products, customers] = await Promise.all([
      ShopifyOrder.find({
        $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
      }),
      ShopifyProduct.find({
        $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
      }),
      ShopifyCustomer.find({
        $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
      }),
    ])

    const grossSales = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
    const refundsTotal = orders.reduce((sum, o) => sum + (o.totalRefunded || 0), 0)
    const netSales = Math.max(0, grossSales - refundsTotal)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? Math.round((grossSales / totalOrders) * 100) / 100 : 0

    const repeatCustomers = customers.filter((c) => (c.ordersCount || 0) > 1).length
    const repeatCustomerRate = customers.length > 0 ? Math.round((repeatCustomers / customers.length) * 100) : 0

    res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          grossSales,
          netSales,
          totalOrders,
          totalProducts: products.length,
          totalCustomers: customers.length,
          averageOrderValue,
          repeatCustomerRate,
          currency: store.currency || 'USD',
        },
        store: {
          shopName: store.shopName,
          shopDomain: store.shopDomain,
          lastSyncedAt: store.lastSyncedAt,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/products/export
 * Export products to CSV file.
 */
export async function exportProductsCSV(req, res, next) {
  try {
    const products = await ShopifyProduct.find({
      $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
    }).sort({ title: 1 })

    let csv = 'Product Title,SKU,Vendor,Product Type,Price,Inventory,Status,Shopify ID\n'
    products.forEach((p) => {
      csv += `"${(p.title || '').replace(/"/g, '""')}","${(p.sku || '').replace(/"/g, '""')}","${(p.vendor || '').replace(/"/g, '""')}","${(p.productType || '').replace(/"/g, '""')}",${p.price || 0},${p.totalInventory || 0},"${p.status || 'ACTIVE'}","${p.shopifyProductId || ''}"\n`
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="shopify-products.csv"')
    res.status(200).send(csv)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/shopify/orders/export
 * Export orders to CSV file.
 */
export async function exportOrdersCSV(req, res, next) {
  try {
    const orders = await ShopifyOrder.find({
      $or: [{ organizationId: req.organizationId }, { organization: req.organizationId }],
    }).sort({ createdAtShopify: -1 })

    let csv = 'Order Number,Customer Name,Customer Email,Total Price,Currency,Payment Status,Fulfillment Status,Date\n'
    orders.forEach((o) => {
      csv += `"${(o.orderNumber || '').replace(/"/g, '""')}","${(o.customerName || '').replace(/"/g, '""')}","${(o.customerEmail || '').replace(/"/g, '""')}",${o.totalPrice || 0},"${o.currency || 'USD'}","${o.financialStatus || ''}","${o.fulfillmentStatus || ''}","${o.createdAtShopify || o.createdAt}"\n`
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="shopify-orders.csv"')
    res.status(200).send(csv)
  } catch (err) {
    next(err)
  }
}

