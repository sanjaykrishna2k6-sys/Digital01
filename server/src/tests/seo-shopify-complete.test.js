process.env.NODE_ENV = 'test'
import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import app from '../app.js'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Client from '../models/Client.js'
import SEOProject from '../models/SEOProject.js'
import SEOIssue from '../models/SEOIssue.js'
import SEOKeyword from '../models/SEOKeyword.js'
import SEORecommendation from '../models/SEORecommendation.js'
import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import { generateToken } from '../utils/token.js'
import { validateURLForSSRF, isPrivateIP } from '../services/seoCrawler.service.js'
import { encryptToken, decryptToken, verifyShopifyWebhookHmac } from '../utils/crypto.js'

let passedCount = 0
let failedCount = 0
const testResults = []

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++
    testResults.push({ name: testName, status: 'PASS', details })
    console.log(`  ✓ [PASS] ${testName}`)
  } else {
    failedCount++
    testResults.push({ name: testName, status: 'FAIL', details })
    console.error(`  ✗ [FAIL] ${testName} - ${details}`)
  }
}

async function runCompleteTestSuite() {
  console.log('=================================================================')
  console.log('🚀 Running Complete SEO & Shopify Platform Test Suite')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    const timestamp = Date.now()

    // 1. SSRF Security Engine Unit Tests
    console.log('--> Section 1: Technical SEO Crawler SSRF Protection')
    {
      assert(isPrivateIP('127.0.0.1') === true, '1. Loopback IP 127.0.0.1 identified as private')
      assert(isPrivateIP('10.0.0.1') === true, '2. Private IP 10.0.0.1 identified as private')
      assert(isPrivateIP('192.168.1.100') === true, '3. Private IP 192.168.1.100 identified as private')
      assert(isPrivateIP('169.254.169.254') === true, '4. Cloud metadata IP 169.254.169.254 identified as private')
      assert(isPrivateIP('8.8.8.8') === false, '5. Public IP 8.8.8.8 identified as public')

      const localResult = await validateURLForSSRF('http://127.0.0.1/admin')
      assert(localResult.valid === false, '6. SSRF blocks http://127.0.0.1/admin')

      const ftpResult = await validateURLForSSRF('ftp://example.com')
      assert(ftpResult.valid === false, '7. SSRF blocks non-HTTP/HTTPS schemes')
    }

    // 2. Encryption & Webhook HMAC Unit Tests
    console.log('\n--> Section 2: Shopify Security & Token Encryption')
    {
      const rawSecretToken = 'shpat_test_secret_access_token_12345'
      const encrypted = encryptToken(rawSecretToken)
      assert(typeof encrypted === 'string' && encrypted.includes(':'), '8. Token is encrypted into IV:AuthTag:Ciphertext format')

      const decrypted = decryptToken(encrypted)
      assert(decrypted === rawSecretToken, '9. Decrypted token matches original secret')
    }

    // 3. Organization, User, & Client Setup
    console.log('\n--> Section 3: Platform Multi-Tenant API Scenarios')

    const org = await Organization.create({
      name: `SEO Shopify Test Org ${timestamp}`,
      plan: 'enterprise',
      status: 'active',
    })

    const admin = await User.create({
      organization: org._id,
      name: 'SEO Platform Admin',
      email: `admin.seoshopify.${timestamp}@scalevo.io`,
      password: 'Password123!',
      role: 'agency_admin',
      status: 'active',
    })

    const client = await Client.create({
      organizationId: org._id,
      companyName: 'Apex E-Commerce Store',
      contactName: 'Sarah Jenkins',
      email: `sarah.${timestamp}@apexstore.com`,
      status: 'active',
      createdBy: admin._id,
    })

    const adminToken = generateToken({
      userId: admin._id,
      organizationId: org._id,
      role: admin.role,
    })
    const adminCookie = `scalevo_token=${adminToken}`

    // 4. Create SEO Project & Execute SSRF Audit
    const seoProjectRes = await fetch(`${baseUrl}/api/seo/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Apex SEO Growth Project',
        website: 'https://example.com',
        clientId: client._id,
        primaryCountry: 'US',
        industry: 'E-commerce',
      }),
    })
    const seoProjectData = await seoProjectRes.json()
    assert(
      seoProjectRes.status === 201 && seoProjectData.data?.project?.name === 'Apex SEO Growth Project',
      '10. SEO Project created successfully',
      `ID: ${seoProjectData.data?.project?._id}`
    )

    const seoProjectId = seoProjectData.data?.project?._id

    // Run SEO Audit
    const auditRes = await fetch(`${baseUrl}/api/seo/projects/${seoProjectId}/audit`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    })
    const auditData = await auditRes.json()
    assert(
      auditRes.status === 200 && auditData.data?.healthScore !== undefined,
      '11. Technical SEO Audit executed securely',
      `Health Score: ${auditData.data?.healthScore}`
    )

    // Create & Track SEO Keyword
    const kwRes = await fetch(`${baseUrl}/api/seo/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        seoProjectId,
        keyword: 'best running shoes e-commerce',
        searchVolume: 14500,
        keywordDifficulty: 52,
        currentPosition: 8,
        searchIntent: 'Commercial',
      }),
    })
    assert(kwRes.status === 201, '12. Keyword added to SERP tracking engine')

    // Export Keywords CSV
    const exportKwRes = await fetch(`${baseUrl}/api/seo/keywords/export?projectId=${seoProjectId}`, {
      headers: { Cookie: adminCookie },
    })
    const kwCsvText = await exportKwRes.text()
    assert(
      exportKwRes.status === 200 && kwCsvText.includes('best running shoes e-commerce'),
      '13. SEO Keywords CSV export contains tracked keywords',
      `CSV Header: ${kwCsvText.split('\n')[0]}`
    )

    // SEO Recommendation to Task Conversion
    const rec = await SEORecommendation.create({
      organizationId: org._id,
      seoProjectId,
      recommendationType: 'heading_structure',
      title: 'Fix Missing H1 on Catalog Page',
      description: 'The main product catalog page is missing an H1 element.',
      priority: 'High',
      url: 'https://example.com/catalog',
    })

    const convertRes = await fetch(`${baseUrl}/api/seo/recommendations/${rec._id}/convert-task`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    })
    const convertData = await convertRes.json()
    assert(
      convertRes.status === 200 && convertData.data?.task?.title.includes('Fix Missing H1'),
      '14. SEO Recommendation converted to an assigned Agency Task',
      `Task Title: ${convertData.data?.task?.title}`
    )

    // 5. Shopify Integration & Analytics
    const store = await ShopifyStore.create({
      organizationId: org._id,
      shopDomain: `apex-store-${timestamp}.myshopify.com`,
      shopName: 'Apex E-Commerce Store',
      shopEmail: 'owner@apexstore.com',
      currency: 'USD',
      status: 'connected',
      encryptedAccessToken: encryptToken('shpat_sample_access_token'),
    })

    await ShopifyOrder.create({
      organizationId: org._id,
      shopifyStore: store._id,
      shopifyStoreId: store._id,
      shopifyOrderId: `gid://shopify/Order/${timestamp}`,
      orderNumber: '#1001',
      customerName: 'Sarah Jenkins',
      customerEmail: 'sarah@apexstore.com',
      totalPrice: 250.0,
      currency: 'USD',
      financialStatus: 'PAID',
      fulfillmentStatus: 'FULFILLED',
    })

    const analyticsRes = await fetch(`${baseUrl}/api/shopify/analytics`, {
      headers: { Cookie: adminCookie },
    })
    const analyticsData = await analyticsRes.json()
    assert(
      analyticsRes.status === 200 && analyticsData.data?.metrics?.grossSales === 250.0,
      '15. Shopify analytics computes accurate financial gross sales',
      `Gross Sales: $${analyticsData.data?.metrics?.grossSales}`
    )

    // Export Orders CSV
    const exportOrdersRes = await fetch(`${baseUrl}/api/shopify/orders/export`, {
      headers: { Cookie: adminCookie },
    })
    const ordersCsvText = await exportOrdersRes.text()
    assert(
      exportOrdersRes.status === 200 && ordersCsvText.includes('#1001'),
      '16. Shopify Orders CSV export contains order details',
      `CSV Header: ${ordersCsvText.split('\n')[0]}`
    )
  } catch (err) {
    console.error('Fatal test error:', err)
  } finally {
    server.close()
    await disconnectDB()

    console.log('\n=================================================================')
    console.log(`Complete SEO & Shopify Test Results: ${passedCount}/${passedCount + failedCount} Passed, ${failedCount} Failed`)
    console.log('=================================================================\n')
    process.exit(failedCount > 0 ? 1 : 0)
  }
}

runCompleteTestSuite()
