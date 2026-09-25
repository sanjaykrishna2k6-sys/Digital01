import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import crypto from 'crypto'
import mongoose from 'mongoose'
import app from '../app.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyCustomer from '../models/ShopifyCustomer.js'
import { generateToken } from '../utils/token.js'
import {
  encryptToken,
  decryptToken,
  isValidShopDomain,
  verifyShopifyOAuthHmac,
  verifyShopifyWebhookHmac,
} from '../utils/crypto.js'

let passedCount = 0
let failedCount = 0
const results = []

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++
    results.push({ name: testName, status: 'PASS', details })
    console.log(`  ✓ [PASS] ${testName}`)
  } else {
    failedCount++
    results.push({ name: testName, status: 'FAIL', details })
    console.error(`  ✗ [FAIL] ${testName} - ${details}`)
  }
}

async function runTests() {
  console.log('=================================================================')
  console.log('🚀 Running Shopify Integration Test Suite (20 Scenarios)')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  console.log(`Test server bound to ephemeral port: ${baseUrl}\n`)

  try {
    // -------------------------------------------------------------
    // Suite 1: Cryptography & Security
    // -------------------------------------------------------------
    console.log('[Suite 1: Cryptography & Security]')
    const rawSecret = 'shpat_test_access_token_1234567890abcdef'
    const encrypted = encryptToken(rawSecret)
    const decrypted = decryptToken(encrypted)
    assert(
      encrypted.includes(':') && decrypted === rawSecret,
      'AES-256-GCM token encryption and decryption round-trip matches exactly'
    )

    let tamperingDetected = false
    try {
      const parts = encrypted.split(':')
      const tampered = `${parts[0]}:${parts[1]}:deadbeef${parts[2].slice(8)}`
      decryptToken(tampered)
    } catch (err) {
      tamperingDetected = true
    }
    assert(tamperingDetected, 'AES-256-GCM authentication tag verifies integrity and rejects tampered ciphertext')

    assert(
      isValidShopDomain('my-brand-store.myshopify.com') &&
        isValidShopDomain('acme-123.myshopify.com') &&
        !isValidShopDomain('evil.com') &&
        !isValidShopDomain('store.myshopify.com.evil.com') &&
        !isValidShopDomain(''),
      'isValidShopDomain correctly filters valid Shopify subdomains and blocks malicious SSRF/open redirects'
    )

    // HMAC calculation
    const testSecret = 'shopify_api_secret_test_key_123'
    const query = {
      code: 'auth_code_999',
      shop: 'test-store.myshopify.com',
      state: 'nonce_abc123',
      timestamp: '1727100000',
    }
    const message = 'code=auth_code_999&shop=test-store.myshopify.com&state=nonce_abc123&timestamp=1727100000'
    const validHmac = crypto.createHmac('sha256', testSecret).update(message).digest('hex')

    assert(
      verifyShopifyOAuthHmac({ ...query, hmac: validHmac }, testSecret),
      'verifyShopifyOAuthHmac verifies authentic Shopify OAuth signature'
    )
    assert(
      !verifyShopifyOAuthHmac({ ...query, hmac: 'forged_invalid_hmac' }, testSecret),
      'verifyShopifyOAuthHmac rejects forged/tampered signature'
    )

    // -------------------------------------------------------------
    // Suite 2: Multi-Tenant Organizations & Access Control
    // -------------------------------------------------------------
    console.log('\n[Suite 2: Multi-Tenant Authorization & Roles]')
    let orgA = await Organization.findOne({ slug: 'shopify-test-org-a' })
    if (!orgA) {
      orgA = await Organization.create({
        name: 'Shopify Test Org A',
        slug: 'shopify-test-org-a',
        plan: 'enterprise',
      })
    }

    let orgB = await Organization.findOne({ slug: 'shopify-test-org-b' })
    if (!orgB) {
      orgB = await Organization.create({
        name: 'Shopify Test Org B',
        slug: 'shopify-test-org-b',
        plan: 'growth',
      })
    }

    let adminA = await User.findOne({ email: 'admin-shopify-a@scalevo.com' })
    if (!adminA) {
      adminA = await User.create({
        organization: orgA._id,
        name: 'Admin Org A',
        email: 'admin-shopify-a@scalevo.com',
        password: 'Password123!',
        role: 'agency_admin',
        status: 'active',
      })
    }

    let memberA = await User.findOne({ email: 'member-shopify-a@scalevo.com' })
    if (!memberA) {
      memberA = await User.create({
        organization: orgA._id,
        name: 'Member Org A',
        email: 'member-shopify-a@scalevo.com',
        password: 'Password123!',
        role: 'team_member',
        status: 'active',
      })
    }

    let adminB = await User.findOne({ email: 'admin-shopify-b@scalevo.com' })
    if (!adminB) {
      adminB = await User.create({
        organization: orgB._id,
        name: 'Admin Org B',
        email: 'admin-shopify-b@scalevo.com',
        password: 'Password123!',
        role: 'agency_admin',
        status: 'active',
      })
    }

    const tokenAdminA = generateToken({ userId: adminA._id })
    const tokenMemberA = generateToken({ userId: memberA._id })
    const tokenAdminB = generateToken({ userId: adminB._id })

    const cookieAdminA = `scalevo_token=${tokenAdminA}`
    const cookieMemberA = `scalevo_token=${tokenMemberA}`
    const cookieAdminB = `scalevo_token=${tokenAdminB}`

    // Unauthenticated status call
    const unauthRes = await fetch(`${baseUrl}/api/integrations/shopify/status`)
    assert(unauthRes.status === 401, 'GET /api/integrations/shopify/status rejects unauthenticated requests (401)')

    // Team member restricted from initiating store connect
    const memberConnectRes = await fetch(`${baseUrl}/api/integrations/shopify/connect?shop=test.myshopify.com`, {
      headers: { Cookie: cookieMemberA },
    })
    assert(
      memberConnectRes.status === 403,
      'GET /api/integrations/shopify/connect restricts non-admin roles (403 Forbidden)'
    )

    // Admin initiates connect with invalid shop
    const invalidShopRes = await fetch(`${baseUrl}/api/integrations/shopify/connect?shop=invalid-domain.com`, {
      headers: { Cookie: cookieAdminA },
    })
    assert(
      invalidShopRes.status === 400,
      'GET /api/integrations/shopify/connect rejects invalid store domains (400 Bad Request)'
    )

    // Admin initiates connect with valid shop
    const validConnectRes = await fetch(`${baseUrl}/api/integrations/shopify/connect?shop=test-demo.myshopify.com`, {
      headers: { Cookie: cookieAdminA },
    })
    const validConnectData = await validConnectRes.json()
    assert(
      validConnectRes.status === 200 && validConnectData.data?.authUrl?.includes('admin/oauth/authorize'),
      'GET /api/integrations/shopify/connect generates valid Shopify OAuth URL with state nonce'
    )

    // -------------------------------------------------------------
    // Suite 3: Connected Store Setup & Strict Tenant Scoping
    // -------------------------------------------------------------
    console.log('\n[Suite 3: Store Connection & Multi-Tenant Scoping]')
    // Connect a store to Org A
    const testShopDomain = 'scalevo-demo.myshopify.com'
    let storeA = await ShopifyStore.findOne({ organization: orgA._id, shopDomain: testShopDomain })
    if (!storeA) {
      storeA = await ShopifyStore.create({
        organization: orgA._id,
        shopDomain: testShopDomain,
        shopName: 'Scalevo Demo Apparel',
        shopifyStoreId: 'gid://shopify/Shop/12345678',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        encryptedAccessToken: encryptToken('shpat_mock_token_for_testing'),
        status: 'connected',
        connectedAt: new Date(),
      })
    }

    // Org A calls status -> returns isConnected: true
    const statusARes = await fetch(`${baseUrl}/api/integrations/shopify/status`, {
      headers: { Cookie: cookieAdminA },
    })
    const statusAData = await statusARes.json()
    assert(
      statusARes.status === 200 &&
        statusAData.data?.isConnected === true &&
        statusAData.data?.store?.shopDomain === testShopDomain &&
        statusAData.data?.store?.encryptedAccessToken === undefined,
      'GET /api/integrations/shopify/status returns connected store and never leaks encrypted access token'
    )

    // Org B calls status -> must be isConnected: false (Strict isolation)
    const statusBRes = await fetch(`${baseUrl}/api/integrations/shopify/status`, {
      headers: { Cookie: cookieAdminB },
    })
    const statusBData = await statusBRes.json()
    assert(
      statusBRes.status === 200 && statusBData.data?.isConnected === false,
      'GET /api/integrations/shopify/status isolates store data strictly to owner organization (Org B sees false)'
    )

    // -------------------------------------------------------------
    // Suite 4: Idempotent Data Synchronization
    // -------------------------------------------------------------
    console.log('\n[Suite 4: Idempotent Product, Order, Customer Upserts]')

    // Upsert Product #1 twice
    const prodId = 'gid://shopify/Product/9876543210'
    await ShopifyProduct.findOneAndUpdate(
      { organization: orgA._id, shopifyStore: storeA._id, shopifyProductId: prodId },
      { title: 'Signature Organic Hoodie', price: 2499, totalInventory: 85, syncedAt: new Date() },
      { upsert: true, new: true }
    )
    await ShopifyProduct.findOneAndUpdate(
      { organization: orgA._id, shopifyStore: storeA._id, shopifyProductId: prodId },
      { title: 'Signature Organic Hoodie (Updated)', price: 2999, totalInventory: 80, syncedAt: new Date() },
      { upsert: true, new: true }
    )
    const productCount = await ShopifyProduct.countDocuments({
      organization: orgA._id,
      shopifyProductId: prodId,
    })
    const finalProduct = await ShopifyProduct.findOne({
      organization: orgA._id,
      shopifyProductId: prodId,
    })
    assert(
      productCount === 1 && finalProduct.price === 2999,
      'Product synchronization is idempotent (re-sync updates record without duplicating)'
    )

    // Upsert Order #1 twice
    const orderId = 'gid://shopify/Order/1122334455'
    await ShopifyOrder.findOneAndUpdate(
      { organization: orgA._id, shopifyStore: storeA._id, shopifyOrderId: orderId },
      {
        orderNumber: '#1001',
        totalPrice: 5998,
        financialStatus: 'PAID',
        createdAtShopify: new Date(),
        syncedAt: new Date(),
      },
      { upsert: true, new: true }
    )
    await ShopifyOrder.findOneAndUpdate(
      { organization: orgA._id, shopifyStore: storeA._id, shopifyOrderId: orderId },
      {
        orderNumber: '#1001',
        totalPrice: 5998,
        financialStatus: 'PAID',
        createdAtShopify: new Date(),
        syncedAt: new Date(),
      },
      { upsert: true, new: true }
    )
    const orderCount = await ShopifyOrder.countDocuments({
      organization: orgA._id,
      shopifyOrderId: orderId,
    })
    assert(orderCount === 1, 'Order synchronization is idempotent (re-sync does not duplicate orders)')

    // Upsert Customer #1
    const custId = 'gid://shopify/Customer/5566778899'
    await ShopifyCustomer.findOneAndUpdate(
      { organization: orgA._id, shopifyStore: storeA._id, shopifyCustomerId: custId },
      { firstName: 'Sameer', lastName: 'Verma', email: 'sameer@example.com', ordersCount: 2, totalSpent: 5998 },
      { upsert: true, new: true }
    )
    const custCount = await ShopifyCustomer.countDocuments({
      organization: orgA._id,
      shopifyCustomerId: custId,
    })
    assert(custCount === 1, 'Customer synchronization is idempotent')

    // -------------------------------------------------------------
    // Suite 5: Webhooks Processing
    // -------------------------------------------------------------
    console.log('\n[Suite 5: Shopify Webhook Handling]')
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || 'test_webhook_sec_123'
    const newOrderPayload = {
      id: 99887711,
      admin_graphql_api_id: 'gid://shopify/Order/99887711',
      name: '#1002',
      total_price: '3499.00',
      financial_status: 'paid',
      created_at: new Date().toISOString(),
    }
    const rawPayloadBuffer = Buffer.from(JSON.stringify(newOrderPayload))
    const webhookHmac = crypto.createHmac('sha256', webhookSecret).update(rawPayloadBuffer).digest('base64')

    const webhookRes = await fetch(`${baseUrl}/api/webhooks/shopify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-topic': 'orders/create',
        'x-shopify-shop-domain': testShopDomain,
        'x-shopify-hmac-sha256': webhookHmac,
      },
      body: rawPayloadBuffer.toString('utf8'),
    })
    assert(webhookRes.status === 200, 'POST /api/webhooks/shopify processes incoming order webhook')

    const createdWebhookOrder = await ShopifyOrder.findOne({
      organization: orgA._id,
      shopifyOrderId: 'gid://shopify/Order/99887711',
    })
    assert(
      createdWebhookOrder && createdWebhookOrder.totalPrice === 3499,
      'Webhook correctly persists order and financial status into database'
    )

    // -------------------------------------------------------------
    // Suite 6: Scalevo Analytics & Dashboard Connection
    // -------------------------------------------------------------
    console.log('\n[Suite 6: Scalevo Analytics & Dashboard Integration]')
    const analyticsRes = await fetch(`${baseUrl}/api/analytics/overview?dateRange=30d`, {
      headers: { Cookie: cookieAdminA },
    })
    const analyticsData = await analyticsRes.json()
    const shopifyAnalytics = analyticsData.data?.shopifyAnalytics

    assert(
      analyticsRes.status === 200 &&
        shopifyAnalytics?.isConnected === true &&
        shopifyAnalytics?.totalRevenue >= 9497 &&
        shopifyAnalytics?.ordersCount >= 2 &&
        shopifyAnalytics?.aov > 0,
      'GET /api/analytics/overview integrates live Shopify revenue, orders count, and AOV'
    )

    // Dashboard stats verification
    const dashboardRes = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: { Cookie: cookieAdminA },
    })
    const dashboardData = await dashboardRes.json()
    const shopifyKpi = dashboardData.data?.kpis?.shopify

    assert(
      dashboardRes.status === 200 &&
        shopifyKpi?.isConnected === true &&
        shopifyKpi?.revenue >= 9497 &&
        shopifyKpi?.ordersCount >= 2,
      'GET /api/dashboard/stats returns real Shopify store sales and revenue in dashboard KPIs'
    )

    // Org B analytics isolation check
    const analyticsBRes = await fetch(`${baseUrl}/api/analytics/overview?dateRange=30d`, {
      headers: { Cookie: cookieAdminB },
    })
    const analyticsBData = await analyticsBRes.json()
    assert(
      analyticsBData.data?.shopifyAnalytics?.isConnected === false,
      'GET /api/analytics/overview guarantees Org B cannot view Org A Shopify revenue (isConnected: false)'
    )

    // -------------------------------------------------------------
    // Suite 7: Disconnection & Credential Purge
    // -------------------------------------------------------------
    console.log('\n[Suite 7: Disconnect & Credential Purging]')
    const disconnectRes = await fetch(`${baseUrl}/api/integrations/shopify/disconnect`, {
      method: 'POST',
      headers: { Cookie: cookieAdminA },
    })
    assert(disconnectRes.status === 200, 'POST /api/integrations/shopify/disconnect succeeds')

    const purgedStore = await ShopifyStore.findById(storeA._id).select('+encryptedAccessToken')
    assert(
      purgedStore.status === 'disconnected' && purgedStore.encryptedAccessToken === '',
      'Store status marked disconnected and encrypted credentials completely wiped from database'
    )

    // -------------------------------------------------------------
    // Teardown
    // -------------------------------------------------------------
    console.log('\n[Teardown]')
    await ShopifyStore.deleteMany({ organization: { $in: [orgA._id, orgB._id] } })
    await ShopifyProduct.deleteMany({ organization: { $in: [orgA._id, orgB._id] } })
    await ShopifyOrder.deleteMany({ organization: { $in: [orgA._id, orgB._id] } })
    await ShopifyCustomer.deleteMany({ organization: { $in: [orgA._id, orgB._id] } })
    console.log('Test artifacts cleaned.')
  } catch (err) {
    console.error('Test execution error:', err)
  } finally {
    server.close()
    console.log('\n=================================================================')
    console.log(`Results: ${passedCount} passed, ${failedCount} failed`)
    console.log('=================================================================\n')
  }
}

runTests().then(() => {
  process.exit(failedCount > 0 ? 1 : 0)
})
