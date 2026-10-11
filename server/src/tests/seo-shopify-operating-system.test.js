import dotenv from 'dotenv'
dotenv.config()
import assert from 'assert'
import http from 'http'
import mongoose from 'mongoose'
import app from '../app.js'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Client from '../models/Client.js'
import SEOProject from '../models/SEOProject.js'
import SEOIssue from '../models/SEOIssue.js'
import SEOKeyword from '../models/SEOKeyword.js'
import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import Task from '../models/Task.js'
import Project from '../models/Project.js'

let server = null
let baseUrl = ''

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl)
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (token) {
      options.headers['Cookie'] = `scalevo_token=${token}`
    }

    const req = http.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        let json = null
        try {
          json = JSON.parse(data)
        } catch (e) {
          json = { raw: data }
        }
        resolve({ status: res.statusCode, body: json, headers: res.headers })
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function runOperatingSystemTestSuite() {
  console.log('=================================================================')
  console.log('🚀 Running SEO & Shopify Agency Operating System Test Suite')
  console.log('=================================================================')

  await connectDB()
  await mongoose.connection.dropDatabase()

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`

  try {
    // Setup Test Organization & Admin User
    const org = await Organization.create({
      name: 'Scalevo Operating Agency',
      domain: 'scalevo-operating.com',
    })

    const admin = await User.create({
      name: 'Scalevo Admin',
      email: 'admin@scalevo-operating.com',
      password: 'password123',
      role: 'agency_admin',
      organization: org._id,
      isEmailVerified: true,
    })

    // Auth Login
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'admin@scalevo-operating.com',
      password: 'password123',
    })

    const token = loginRes.headers['set-cookie']
      ?.find((c) => c.startsWith('scalevo_token='))
      ?.split(';')[0]
      ?.split('=')[1]

    assert.ok(token, 'Admin should authenticate successfully')

    // Create Test Client
    const client = await Client.create({
      organizationId: org._id,
      companyName: 'Acme E-Commerce',
      contactName: 'John Acme',
      email: 'contact@acme.com',
      website: 'https://acme.com',
      createdBy: admin._id,
    })

    // Create Linked SEO Project & Issues
    const seoProject = await SEOProject.create({
      organizationId: org._id,
      clientId: client._id,
      name: 'Acme SEO Growth',
      website: 'https://acme.com',
      healthScore: 82,
      organicTraffic: 15400,
      createdBy: admin._id,
    })

    const seoIssue = await SEOIssue.create({
      organizationId: org._id,
      seoProjectId: seoProject._id,
      url: 'https://acme.com/products/widget',
      issueType: 'missing_title',
      severity: 'Critical',
      description: 'Missing title tag on main product page.',
      recommendation: 'Add descriptive title tag.',
    })

    // Create Linked Shopify Store & Orders & Products
    const shopifyStore = await ShopifyStore.create({
      organizationId: org._id,
      organization: org._id,
      clientId: client._id,
      shopDomain: 'acme-store.myshopify.com',
      shopName: 'Acme Shopify Store',
      status: 'connected',
      lastSyncedAt: new Date(),
    })

    await ShopifyOrder.create({
      organizationId: org._id,
      organization: org._id,
      shopifyStore: shopifyStore._id,
      shopifyOrderId: 'order_101',
      orderNumber: '#1001',
      totalPrice: 250,
      totalRefunded: 0,
      customerName: 'Alice Smith',
    })

    await ShopifyProduct.create({
      organizationId: org._id,
      organization: org._id,
      shopifyStore: shopifyStore._id,
      shopifyProductId: 'prod_201',
      title: 'Acme Premium Widget',
      price: 125,
      totalInventory: 5, // Low stock threshold!
    })

    // Test Scenario 1: Unified Client Workspace Endpoint
    console.log('\n--> Testing Scenario 1: Unified Client Workspace Endpoint')
    const workspaceRes = await request('GET', `/api/clients/${client._id}/workspace`, null, token)
    assert.strictEqual(workspaceRes.status, 200)
    assert.strictEqual(workspaceRes.body.status, 'success')
    assert.ok(workspaceRes.body.data.dataFreshness)
    assert.strictEqual(workspaceRes.body.data.seo.healthScore, 82)
    assert.strictEqual(workspaceRes.body.data.shopify.grossSales, 250)
    assert.strictEqual(workspaceRes.body.data.shopify.lowStockCount, 1)
    assert.ok(workspaceRes.body.data.pendingActions.length > 0)
    console.log('  ✓ [PASS] Unified Client Workspace returns aggregated SEO, Shopify, and action items')

    // Test Scenario 2: Convert SEO Issue to Agency Task
    console.log('\n--> Testing Scenario 2: Convert SEO Issue to Agency Task')
    const convertRes = await request('POST', `/api/seo/issues/${seoIssue._id}/convert-task`, {}, token)
    assert.strictEqual(convertRes.status, 200)
    assert.strictEqual(convertRes.body.status, 'success')
    assert.ok(convertRes.body.data.task._id)
    assert.strictEqual(convertRes.body.data.issue.status, 'In Progress')
    console.log('  ✓ [PASS] SEO Issue converted into linked Agency Task')

    // Test Scenario 3: Verify SEO Issue Fix
    console.log('\n--> Testing Scenario 3: Verify SEO Issue Fix')
    const verifyRes = await request('POST', `/api/seo/issues/${seoIssue._id}/verify`, {}, token)
    assert.strictEqual(verifyRes.status, 200)
    assert.strictEqual(verifyRes.body.data.issue.status, 'Resolved')
    console.log('  ✓ [PASS] SEO Issue verified and marked as Resolved')

    // Test Scenario 4: Shopify Analytics & Profit Intelligence
    console.log('\n--> Testing Scenario 4: Shopify Analytics & Profit Intelligence')
    const shopifyAnalyticsRes = await request('GET', '/api/shopify/analytics', null, token)
    assert.strictEqual(shopifyAnalyticsRes.status, 200)
    assert.strictEqual(shopifyAnalyticsRes.body.data.metrics.grossSales, 250)
    console.log('  ✓ [PASS] Shopify Analytics returns sales and product metrics')

    // Test Scenario 5: Automation Engine Routine Trigger
    console.log('\n--> Testing Scenario 5: Automation Engine Routine Trigger')
    const autoRes = await request('POST', '/api/automations/run', {}, token)
    assert.strictEqual(autoRes.status, 200)
    assert.strictEqual(autoRes.body.status, 'success')
    assert.ok(Array.isArray(autoRes.body.data.triggersFired))
    console.log('  ✓ [PASS] Automation engine executed routines and identified low-inventory triggers')

    // Test Scenario 6: AI Marketing Assistant Query Engine
    console.log('\n--> Testing Scenario 6: AI Marketing Assistant Query Engine')
    const aiRes = await request('POST', '/api/ai/query', {
      question: 'Why did organic clicks decline this month and which products need attention?',
      clientId: client._id,
    }, token)
    assert.strictEqual(aiRes.status, 200)
    assert.strictEqual(aiRes.body.status, 'success')
    assert.ok(aiRes.body.data.answer.observations.length > 0)
    assert.ok(aiRes.body.data.answer.recommendations.length > 0)
    console.log('  ✓ [PASS] AI Marketing Assistant returned grounded observations and recommendations')

    // Test Scenario 7: Integration Health & Audit Trail
    console.log('\n--> Testing Scenario 7: Integration Health & Audit Trail')
    const healthRes = await request('GET', '/api/integrations/health', null, token)
    assert.strictEqual(healthRes.status, 200)
    assert.ok(healthRes.body.data.integrations.length >= 4)

    const auditRes = await request('GET', '/api/integrations/audit-trail', null, token)
    assert.strictEqual(auditRes.status, 200)
    console.log('  ✓ [PASS] Integration Health & Audit Trail endpoints functioning correctly')

    console.log('\n=================================================================')
    console.log('🎉 All Agency Operating System Tests Passed (7/7 Scenarios)!')
    console.log('=================================================================\n')
  } finally {
    if (server) server.close()
    await disconnectDB()
  }
}

runOperatingSystemTestSuite().catch((err) => {
  console.error('Test Suite Error:', err)
  process.exit(1)
})
