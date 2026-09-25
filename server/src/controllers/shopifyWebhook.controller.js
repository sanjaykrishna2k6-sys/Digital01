import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import ShopifyCustomer from '../models/ShopifyCustomer.js'
import { verifyShopifyWebhookHmac } from '../utils/crypto.js'

/**
 * Handle incoming Shopify webhooks with HMAC verification and idempotent handling.
 * POST /api/webhooks/shopify
 */
export async function handleWebhook(req, res, next) {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256']
    const shopDomain = req.headers['x-shopify-shop-domain']
    const topic = req.headers['x-shopify-topic']

    // 1. Verify HMAC signature
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body))
    const isValid = verifyShopifyWebhookHmac(rawBody, hmacHeader)

    if (!isValid && process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid Shopify webhook signature.',
      })
    }

    if (!shopDomain) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing x-shopify-shop-domain header.',
      })
    }

    // 2. Find associated store
    const store = await ShopifyStore.findOne({
      shopDomain: shopDomain.toLowerCase(),
    })

    if (!store) {
      // Return 200 so Shopify does not repeatedly retry webhooks for an unlinked store
      return res.status(200).json({
        status: 'success',
        message: 'Shopify store not recognized by Scalevo.',
      })
    }

    store.lastWebhookAt = new Date()
    await store.save()

    const payload = req.body || {}

    // 3. Process topic
    switch (topic) {
      case 'orders/create':
      case 'orders/updated': {
        const orderId = payload.admin_graphql_api_id || `gid://shopify/Order/${payload.id}`
        const totalPrice = parseFloat(payload.total_price || '0') || 0
        const subtotal = parseFloat(payload.subtotal_price || '0') || 0
        const totalTax = parseFloat(payload.total_tax || '0') || 0

        const lineItems = (payload.line_items || []).map((li) => ({
          title: li.title || '',
          quantity: li.quantity || 1,
          price: parseFloat(li.price || '0') || 0,
        }))

        await ShopifyOrder.findOneAndUpdate(
          {
            organization: store.organization,
            shopifyStore: store._id,
            shopifyOrderId: orderId,
          },
          {
            orderNumber: payload.name || `#${payload.order_number}`,
            financialStatus: (payload.financial_status || 'paid').toUpperCase(),
            fulfillmentStatus: (payload.fulfillment_status || 'unfulfilled').toUpperCase(),
            currency: payload.currency || 'INR',
            subtotal,
            totalTax,
            totalPrice,
            lineItems,
            createdAtShopify: payload.created_at ? new Date(payload.created_at) : new Date(),
            processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
            syncedAt: new Date(),
          },
          { upsert: true, new: true }
        )
        break
      }

      case 'orders/cancelled': {
        const orderId = payload.admin_graphql_api_id || `gid://shopify/Order/${payload.id}`
        await ShopifyOrder.findOneAndUpdate(
          {
            organization: store.organization,
            shopifyStore: store._id,
            shopifyOrderId: orderId,
          },
          {
            financialStatus: 'CANCELLED',
            cancelledAt: payload.cancelled_at ? new Date(payload.cancelled_at) : new Date(),
          }
        )
        break
      }

      case 'products/create':
      case 'products/update': {
        const productId = payload.admin_graphql_api_id || `gid://shopify/Product/${payload.id}`
        const rawPrice = payload.variants?.[0]?.price || '0'
        const price = parseFloat(rawPrice) || 0

        await ShopifyProduct.findOneAndUpdate(
          {
            organization: store.organization,
            shopifyStore: store._id,
            shopifyProductId: productId,
          },
          {
            title: payload.title || 'Untitled Product',
            handle: payload.handle || '',
            status: (payload.status || 'ACTIVE').toUpperCase(),
            vendor: payload.vendor || '',
            productType: payload.product_type || '',
            price,
            createdAtShopify: payload.created_at ? new Date(payload.created_at) : new Date(),
            updatedAtShopify: payload.updated_at ? new Date(payload.updated_at) : new Date(),
            syncedAt: new Date(),
          },
          { upsert: true, new: true }
        )
        break
      }

      case 'products/delete': {
        const productId = payload.admin_graphql_api_id || `gid://shopify/Product/${payload.id}`
        await ShopifyProduct.findOneAndUpdate(
          {
            organization: store.organization,
            shopifyStore: store._id,
            shopifyProductId: productId,
          },
          {
            status: 'DELETED',
          }
        )
        break
      }

      case 'customers/create':
      case 'customers/update': {
        const customerId = payload.admin_graphql_api_id || `gid://shopify/Customer/${payload.id}`
        const ordersCount = parseInt(payload.orders_count || '0', 10) || 0
        const totalSpent = parseFloat(payload.total_spent || '0') || 0

        await ShopifyCustomer.findOneAndUpdate(
          {
            organization: store.organization,
            shopifyStore: store._id,
            shopifyCustomerId: customerId,
          },
          {
            firstName: payload.first_name || '',
            lastName: payload.last_name || '',
            email: payload.email ? payload.email.toLowerCase().trim() : '',
            phone: payload.phone || '',
            ordersCount,
            totalSpent,
            currency: payload.currency || 'INR',
            createdAtShopify: payload.created_at ? new Date(payload.created_at) : new Date(),
            syncedAt: new Date(),
          },
          { upsert: true, new: true }
        )
        break
      }

      case 'app/uninstalled': {
        // Shopify merchant uninstalled app: revoke credentials and mark disconnected
        store.status = 'disconnected'
        store.encryptedAccessToken = '' // Purge access token
        store.disconnectedAt = new Date()
        await store.save()
        console.log(`[Shopify] App uninstalled event processed for ${shopDomain}. Credentials purged.`)
        break
      }

      default:
        console.log(`[Shopify] Unhandled webhook topic: ${topic}`)
    }

    res.status(200).json({
      status: 'success',
      message: `Webhook ${topic} handled successfully.`,
    })
  } catch (err) {
    next(err)
  }
}
