process.env.NODE_ENV = 'test'
import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import app from '../app.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyCustomer from '../models/ShopifyCustomer.js'
import { generateToken } from '../utils/token.js'
import { encryptToken } from '../utils/crypto.js'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
  console.log('🚀 Running Shopify Integration Test Suite (18 Scenarios)')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  console.log(`Test server bound to ephemeral port: ${baseUrl}\n`)

  let orgA, orgB
  let adminA, managerA, memberA, clientA, adminB
  let storeA, storeB

  try {
    // -------------------------------------------------------------
    // Setup Organizations and Test Users
    // -------------------------------------------------------------
    orgA = await Organization.findOne({ slug: 'shopify-test-org-a' })
    if (!orgA) {
      orgA = await Organization.create({
        name: 'Shopify Test Org A',
        slug: 'shopify-test-org-a',
        plan: 'enterprise',
      })
    }

    orgB = await Organization.findOne({ slug: 'shopify-test-org-b' })
    if (!orgB) {
      orgB = await Organization.create({
        name: 'Shopify Test Org B',
        slug: 'shopify-test-org-b',
        plan: 'growth',
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('Password123!', salt)

    // Agency Admin (Org A)
    adminA = await User.findOne({ email: 'admin-shopify-a@scalevo.com' })
    if (!adminA) {
      adminA = await User.create({
        organization: orgA._id,
        name: 'Admin Org A',
        email: 'admin-shopify-a@scalevo.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // Account Manager (Org A)
    managerA = await User.findOne({ email: 'mgr-shopify-a@scalevo.com' })
    if (!managerA) {
      managerA = await User.create({
        organization: orgA._id,
        name: 'Manager Org A',
        email: 'mgr-shopify-a@scalevo.com',
        password: hashedPassword,
        role: 'account_manager',
        status: 'active',
      })
    }

    // Team Member (Org A)
    memberA = await User.findOne({ email: 'member-shopify-a@scalevo.com' })
    if (!memberA) {
      memberA = await User.create({
        organization: orgA._id,
        name: 'Member Org A',
        email: 'member-shopify-a@scalevo.com',
        password: hashedPassword,
        role: 'team_member',
        status: 'active',
      })
    }

    // Client Role User (Org A)
    clientA = await User.findOne({ email: 'client-shopify-a@scalevo.com' })
    if (!clientA) {
      clientA = await User.create({
        organization: orgA._id,
        name: 'Client Org A',
        email: 'client-shopify-a@scalevo.com',
        password: hashedPassword,
        role: 'client',
        status: 'active',
      })
    }

    // Agency Admin (Org B)
    adminB = await User.findOne({ email: 'admin-shopify-b@scalevo.com' })
    if (!adminB) {
      adminB = await User.create({
        organization: orgB._id,
        name: 'Admin Org B',
        email: 'admin-shopify-b@scalevo.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // Cookies
    const cookieAdminA = `scalevo_token=${generateToken({ userId: adminA._id, organizationId: orgA._id, role: adminA.role })}`
    const cookieManagerA = `scalevo_token=${generateToken({ userId: managerA._id, organizationId: orgA._id, role: managerA.role })}`
    const cookieMemberA = `scalevo_token=${generateToken({ userId: memberA._id, organizationId: orgA._id, role: memberA.role })}`
    const cookieClientA = `scalevo_token=${generateToken({ userId: clientA._id, organizationId: orgA._id, role: clientA.role })}`
    const cookieAdminB = `scalevo_token=${generateToken({ userId: adminB._id, organizationId: orgB._id, role: adminB.role })}`

    // Clean up previous test artifacts
    await ShopifyStore.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } })
    await ShopifyProduct.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } })
    await ShopifyOrder.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } })
    await ShopifyCustomer.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } })

    // -----------------------------------------------------------------
    // Scenario 1: Unauthenticated Shopify request returns 401
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 1: Unauthenticated Shopify request returns 401')
    const unauthRes = await fetch(`${baseUrl}/api/shopify/status`)
    assert(unauthRes.status === 401, '1. Unauthenticated Shopify request returns 401', `status: ${unauthRes.status}`)

    // -----------------------------------------------------------------
    // Scenario 2: Authorized agency admin can access Shopify status
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 2: Authorized agency admin can access Shopify status')
    const statusRes = await fetch(`${baseUrl}/api/shopify/status`, {
      headers: { Cookie: cookieAdminA },
    })
    const statusData = await statusRes.json()
    assert(
      statusRes.status === 200 && statusData.status === 'success' && statusData.data?.isConnected === false,
      '2. Authorized agency admin can access Shopify status',
      `status: ${statusRes.status}, isConnected: ${statusData.data?.isConnected}`
    )

    // -----------------------------------------------------------------
    // Scenario 3: Shopify connection is scoped to authenticated organization
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 3: Shopify connection is scoped to authenticated organization')
    const testShopDomain = 'scalevo-demo.myshopify.com'
    storeA = await ShopifyStore.create({
      organizationId: orgA._id,
      organization: orgA._id,
      shopDomain: testShopDomain,
      shopName: 'Scalevo Demo Apparel',
      shopEmail: 'owner@scalevodemo.com',
      currency: 'USD',
      country: 'US',
      timezone: 'America/New_York',
      encryptedAccessToken: encryptToken('shpat_mock_token_for_testing'),
      status: 'connected',
      connectedAt: new Date(),
      installedAt: new Date(),
    })

    const connectedStatusRes = await fetch(`${baseUrl}/api/shopify/status`, {
      headers: { Cookie: cookieAdminA },
    })
    const connectedStatusData = await connectedStatusRes.json()
    assert(
      connectedStatusRes.status === 200 &&
        connectedStatusData.data?.isConnected === true &&
        connectedStatusData.data?.store?.shopDomain === testShopDomain,
      '3. Shopify connection is scoped to authenticated organization',
      `shopDomain: ${connectedStatusData.data?.store?.shopDomain}`
    )

    // -----------------------------------------------------------------
    // Scenario 4: Organization A cannot access Organization B's Shopify store
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 4: Organization A cannot access Organization B\'s Shopify store')
    // Org B checks status: must NOT see Org A's store
    const orgBStatusRes = await fetch(`${baseUrl}/api/shopify/status`, {
      headers: { Cookie: cookieAdminB },
    })
    const orgBStatusData = await orgBStatusRes.json()
    const orgBStoreRes = await fetch(`${baseUrl}/api/shopify/store`, {
      headers: { Cookie: cookieAdminB },
    })
    assert(
      orgBStatusRes.status === 200 &&
        orgBStatusData.data?.isConnected === false &&
        orgBStatusData.data?.store === null &&
        orgBStoreRes.status === 404,
      '4. Organization A cannot access Organization B\'s Shopify store (Org B sees disconnected/404)',
      `Org B isConnected: ${orgBStatusData.data?.isConnected}, store status: ${orgBStoreRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 5: Organization A cannot access Organization B's Shopify data
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 5: Organization A cannot access Organization B\'s Shopify data')
    // Create product & order for Org A
    const prodA = await ShopifyProduct.create({
      organizationId: orgA._id,
      organization: orgA._id,
      shopifyStore: storeA._id,
      shopifyProductId: 'gid://shopify/Product/111111',
      title: 'Org A Premium Jacket',
      price: 199.99,
      totalInventory: 25,
      sku: 'JKT-001',
      status: 'ACTIVE',
    })
    const orderA = await ShopifyOrder.create({
      organizationId: orgA._id,
      organization: orgA._id,
      shopifyStore: storeA._id,
      shopifyOrderId: 'gid://shopify/Order/222222',
      orderNumber: '#1001',
      customerName: 'Alice Smith',
      customerEmail: 'alice@example.com',
      totalPrice: 199.99,
      financialStatus: 'PAID',
      fulfillmentStatus: 'FULFILLED',
    })

    // Org B tries to fetch products, orders, and specific product ID
    const orgBProdsRes = await fetch(`${baseUrl}/api/shopify/products`, {
      headers: { Cookie: cookieAdminB },
    })
    const orgBProdsData = await orgBProdsRes.json()

    const crossProdRes = await fetch(`${baseUrl}/api/shopify/products/${prodA._id}`, {
      headers: { Cookie: cookieAdminB },
    })
    const crossOrderRes = await fetch(`${baseUrl}/api/shopify/orders/${orderA._id}`, {
      headers: { Cookie: cookieAdminB },
    })
    assert(
      orgBProdsData.data?.products?.length === 0 &&
        crossProdRes.status === 404 &&
        crossOrderRes.status === 404,
      '5. Organization A cannot access Organization B\'s Shopify data (Isolated products/orders, 404 on direct IDs)',
      `Org B prods count: ${orgBProdsData.data?.products?.length}, direct prod status: ${crossProdRes.status}, direct order status: ${crossOrderRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 6: Client role receives 403
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 6: Client role receives 403')
    const clientStatusRes = await fetch(`${baseUrl}/api/shopify/status`, {
      headers: { Cookie: cookieClientA },
    })
    const clientProductsRes = await fetch(`${baseUrl}/api/shopify/products`, {
      headers: { Cookie: cookieClientA },
    })
    assert(
      clientStatusRes.status === 403 && clientProductsRes.status === 403,
      '6. Client role receives 403 (Blocked from agency Shopify APIs)',
      `status: ${clientStatusRes.status}, products: ${clientProductsRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 7: Team member cannot connect/disconnect Shopify
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 7: Team member cannot connect/disconnect Shopify')
    const memberConnectRes = await fetch(`${baseUrl}/api/shopify/connect?shop=test.myshopify.com`, {
      headers: { Cookie: cookieMemberA },
    })
    const memberDisconnectRes = await fetch(`${baseUrl}/api/shopify/disconnect`, {
      method: 'POST',
      headers: { Cookie: cookieMemberA },
    })
    assert(
      memberConnectRes.status === 403 && memberDisconnectRes.status === 403,
      '7. Team member cannot connect/disconnect Shopify (403 Forbidden)',
      `connect: ${memberConnectRes.status}, disconnect: ${memberDisconnectRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 8: Account manager cannot disconnect Shopify
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 8: Account manager cannot disconnect Shopify')
    const mgrDisconnectRes = await fetch(`${baseUrl}/api/shopify/disconnect`, {
      method: 'POST',
      headers: { Cookie: cookieManagerA },
    })
    assert(
      mgrDisconnectRes.status === 403,
      '8. Account manager cannot disconnect Shopify (403 Forbidden)',
      `disconnect: ${mgrDisconnectRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 9: Shopify credentials are never returned by API
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 9: Shopify credentials are never returned by API')
    const statusPayload = await (
      await fetch(`${baseUrl}/api/shopify/status`, { headers: { Cookie: cookieAdminA } })
    ).json()
    const storePayload = await (
      await fetch(`${baseUrl}/api/shopify/store`, { headers: { Cookie: cookieAdminA } })
    ).json()
    const prodsPayload = await (
      await fetch(`${baseUrl}/api/shopify/products`, { headers: { Cookie: cookieAdminA } })
    ).json()

    const hasLeakedCredentials =
      statusPayload.data?.store?.encryptedAccessToken !== undefined ||
      statusPayload.data?.store?.accessToken !== undefined ||
      storePayload.data?.store?.encryptedAccessToken !== undefined ||
      storePayload.data?.store?.accessToken !== undefined ||
      JSON.stringify(prodsPayload).includes('shpat_')

    assert(
      !hasLeakedCredentials,
      '9. Shopify credentials are never returned by API (accessToken & encryptedAccessToken omitted)',
      `leaked: ${hasLeakedCredentials}`
    )

    // -----------------------------------------------------------------
    // Scenario 10: Shopify access token is never stored in localStorage/sessionStorage
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 10: Shopify access token is never stored in localStorage/sessionStorage')
    const clientSrcPath = path.resolve(__dirname, '../../../Design Digital Marketing Platform/client/src')
    const serviceCode = fs.readFileSync(path.join(clientSrcPath, 'services/shopifyService.js'), 'utf-8')
    const pageCode = fs.readFileSync(path.join(clientSrcPath, 'pages/ShopifyPage.jsx'), 'utf-8')

    const setItemRegex = /localStorage\.setItem\s*\(\s*['"`](token|password|jwt|secret|auth|shopify|access)/i
    const sessionSetRegex = /sessionStorage\.setItem\s*\(\s*['"`](token|password|jwt|secret|auth|shopify|access)/i
    const storesInStorage =
      setItemRegex.test(serviceCode) ||
      sessionSetRegex.test(serviceCode) ||
      setItemRegex.test(pageCode) ||
      sessionSetRegex.test(pageCode)

    assert(
      !storesInStorage,
      '10. Shopify access token is never stored in localStorage/sessionStorage (Pure HTTP-only server proxy)',
      `storesInStorage: ${storesInStorage}`
    )

    // -----------------------------------------------------------------
    // Scenario 11: Invalid shop domain is rejected
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 11: Invalid shop domain is rejected')
    const invalidShopRes = await fetch(`${baseUrl}/api/shopify/connect?shop=malicious-domain.com`, {
      headers: { Cookie: cookieAdminA },
    })
    const emptyShopRes = await fetch(`${baseUrl}/api/shopify/connect?shop=`, {
      headers: { Cookie: cookieAdminA },
    })
    assert(
      invalidShopRes.status === 400 && emptyShopRes.status === 400,
      '11. Invalid shop domain is rejected (400 Bad Request)',
      `invalid: ${invalidShopRes.status}, empty: ${emptyShopRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 12: OAuth state mismatch is rejected
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 12: OAuth state mismatch is rejected')
    const stateMismatchRes = await fetch(
      `${baseUrl}/api/shopify/callback?code=fake_code&shop=test.myshopify.com&state=tampered_nonce`,
      {
        headers: {
          Cookie: `${cookieAdminA}; shopify_oauth_state=genuine_nonce`,
        },
        redirect: 'manual',
      }
    )
    const location = stateMismatchRes.headers.get('location') || ''
    assert(
      stateMismatchRes.status === 302 && location.includes('error=invalid_oauth_state'),
      '12. OAuth state mismatch is rejected (CSRF nonce validation)',
      `status: ${stateMismatchRes.status}, redirect: ${location}`
    )

    // -----------------------------------------------------------------
    // Scenario 13: Shopify API authentication failure is handled safely
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 13: Shopify API authentication failure is handled safely')
    // Attempting sync with corrupted token fails safely without crash
    const corruptStore = await ShopifyStore.create({
      organizationId: orgB._id,
      organization: orgB._id,
      shopDomain: 'corrupt-store.myshopify.com',
      encryptedAccessToken: 'bad_token_format',
      status: 'connected',
    })
    const corruptSyncRes = await fetch(`${baseUrl}/api/shopify/sync`, {
      method: 'POST',
      headers: { Cookie: cookieAdminB },
    })
    assert(
      corruptSyncRes.status >= 400 && corruptSyncRes.status < 600,
      '13. Shopify API authentication failure is handled safely (No unhandled exceptions)',
      `status: ${corruptSyncRes.status}`
    )
    await ShopifyStore.deleteOne({ _id: corruptStore._id })

    // -----------------------------------------------------------------
    // Scenario 14: Shopify API errors are handled safely
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 14: Shopify API errors are handled safely')
    const nonExistentProdRes = await fetch(`${baseUrl}/api/shopify/products/gid://shopify/Product/nonexistent`, {
      headers: { Cookie: cookieAdminA },
    })
    const nonExistentOrderRes = await fetch(`${baseUrl}/api/shopify/orders/gid://shopify/Order/nonexistent`, {
      headers: { Cookie: cookieAdminA },
    })
    assert(
      nonExistentProdRes.status === 404 && nonExistentOrderRes.status === 404,
      '14. Shopify API errors are handled safely (Safe 404 for missing resources)',
      `prod status: ${nonExistentProdRes.status}, order status: ${nonExistentOrderRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 15: Sync endpoint requires an existing connection
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 15: Sync endpoint requires an existing connection')
    // Org B has no connected store
    const noConnSyncRes = await fetch(`${baseUrl}/api/shopify/sync`, {
      method: 'POST',
      headers: { Cookie: cookieAdminB },
    })
    assert(
      noConnSyncRes.status === 404,
      '15. Sync endpoint requires an existing connection (404 when no store linked)',
      `status: ${noConnSyncRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 16: Disconnect only affects the authenticated organization's store
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 16: Disconnect only affects the authenticated organization\'s store')
    // Create store for Org B
    storeB = await ShopifyStore.create({
      organizationId: orgB._id,
      organization: orgB._id,
      shopDomain: 'org-b-store.myshopify.com',
      encryptedAccessToken: encryptToken('shpat_token_b'),
      status: 'connected',
    })

    // Org A disconnects
    const discARes = await fetch(`${baseUrl}/api/shopify/disconnect`, {
      method: 'POST',
      headers: { Cookie: cookieAdminA },
    })

    const checkStoreA = await ShopifyStore.findById(storeA._id).select('+encryptedAccessToken')
    const checkStoreB = await ShopifyStore.findById(storeB._id).select('+encryptedAccessToken')

    assert(
      discARes.status === 200 &&
        checkStoreA.status === 'disconnected' &&
        checkStoreA.encryptedAccessToken === '' &&
        checkStoreB.status === 'connected' &&
        checkStoreB.encryptedAccessToken !== '',
      '16. Disconnect only affects the authenticated organization\'s store (Org B remains connected)',
      `Org A status: ${checkStoreA.status}, Org B status: ${checkStoreB.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 17: Frontend Shopify route is protected
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 17: Frontend Shopify route is protected')
    const appRoutesCode = fs.readFileSync(path.join(clientSrcPath, 'routes/AppRoutes.jsx'), 'utf-8')
    const hasProtectedShopifyRoute =
      appRoutesCode.includes('<Route element={<ProtectedRoute />}>') &&
      appRoutesCode.includes('<Route path="/shopify" element={<ShopifyPage />} />')

    assert(
      hasProtectedShopifyRoute,
      '17. Frontend Shopify route is protected inside ProtectedRoute wrapper',
      `protected: ${hasProtectedShopifyRoute}`
    )

    // -----------------------------------------------------------------
    // Scenario 18: Frontend production build succeeds
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 18: Frontend production build succeeds')
    const clientPath = path.resolve(__dirname, '../../../Design Digital Marketing Platform/client')
    let buildPassed = false
    let buildOutput = ''
    try {
      const stdout = execSync('npm run build', {
        cwd: clientPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      buildPassed = true
      buildOutput = stdout.slice(-300).trim()
    } catch (err) {
      buildPassed = false
      buildOutput = err.stderr || err.stdout || err.message
    }
    assert(
      buildPassed,
      '18. Frontend production build succeeds (Vite bundle compiled cleanly)',
      buildPassed ? 'Vite build successful' : buildOutput
    )

    // Clean up
    await ShopifyStore.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } })
    await ShopifyProduct.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } })
    await ShopifyOrder.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } })
    await ShopifyCustomer.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } })
    await User.deleteMany({
      email: {
        $in: [
          'admin-shopify-a@scalevo.com',
          'mgr-shopify-a@scalevo.com',
          'member-shopify-a@scalevo.com',
          'client-shopify-a@scalevo.com',
          'admin-shopify-b@scalevo.com',
        ],
      },
    })
    await Organization.deleteOne({ _id: orgB._id })
  } finally {
    server.close()
  }

  console.log('\n=================================================================')
  console.log(`Shopify Test Results Summary: ${passedCount}/18 Passed, ${failedCount} Failed`)
  console.log('=================================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err)
  process.exit(1)
})
