import crypto from 'crypto'
import ShopifyStore from '../models/ShopifyStore.js'
import {
  buildOAuthUrl,
  exchangeCodeForAccessToken,
  fetchShopDetails,
  performFullSync,
} from '../services/shopify.service.js'
import {
  encryptToken,
  isValidShopDomain,
  verifyShopifyOAuthHmac,
} from '../utils/crypto.js'

/**
 * GET /api/integrations/shopify/status
 * Retrieve connected Shopify store status for authenticated organization.
 */
export async function getStoreStatus(req, res, next) {
  try {
    const store = await ShopifyStore.findOne({ organization: req.organizationId })

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
          currency: store.currency,
          timezone: store.timezone,
          status: store.status,
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
 * GET /api/integrations/shopify/connect
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
      path: '/api/integrations/shopify',
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
 * GET /api/integrations/shopify/callback
 * Complete Shopify OAuth 2.0 authorization, exchange code for token, and start sync.
 */
export async function handleCallback(req, res, next) {
  try {
    const { code, shop, state, hmac } = req.query
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

    // 1. Verify state nonce from cookie
    const storedState = req.cookies?.shopify_oauth_state
    if (!storedState || storedState !== state) {
      return res.redirect(`${clientUrl}/integrations?error=invalid_oauth_state`)
    }
    res.clearCookie('shopify_oauth_state', { path: '/api/integrations/shopify' })

    // 2. Validate shop domain
    if (!isValidShopDomain(shop)) {
      return res.redirect(`${clientUrl}/integrations?error=invalid_shop_domain`)
    }

    // 3. Verify HMAC signature
    if (!verifyShopifyOAuthHmac(req.query)) {
      return res.redirect(`${clientUrl}/integrations?error=invalid_hmac_signature`)
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
        organization: req.organizationId,
        shopDomain: shop.toLowerCase(),
      },
      {
        shopName: shopDetails.name || shop,
        shopifyStoreId: shopDetails.id || '',
        currency: shopDetails.currencyCode || 'INR',
        timezone: shopDetails.timezoneAbbreviation || 'Asia/Kolkata',
        encryptedAccessToken: encryptedToken,
        scopes: scope || 'read_products,read_orders,read_customers',
        status: 'connected',
        connectedAt: new Date(),
        disconnectedAt: null,
      },
      { upsert: true, new: true }
    )

    // 8. Start initial sync in background (non-blocking)
    performFullSync(req.organizationId, store).catch((err) => {
      console.error('[Shopify] Background initial sync failed:', err.message)
    })

    // 9. Redirect back to Scalevo Integrations Hub with success indicator
    res.redirect(`${clientUrl}/integrations?shopify=connected`)
  } catch (err) {
    console.error('[Shopify] OAuth callback error:', err.message)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    res.redirect(`${clientUrl}/integrations?error=oauth_exchange_failed`)
  }
}

/**
 * POST /api/integrations/shopify/sync
 * Manually trigger full store synchronization.
 */
export async function triggerSync(req, res, next) {
  try {
    const store = await ShopifyStore.findOne({
      organization: req.organizationId,
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
 * POST /api/integrations/shopify/disconnect
 * Disconnect Shopify store and purge credentials.
 */
export async function disconnectStore(req, res, next) {
  try {
    const store = await ShopifyStore.findOne({
      organization: req.organizationId,
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
