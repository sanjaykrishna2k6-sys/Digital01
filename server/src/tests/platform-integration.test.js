import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import mongoose from 'mongoose'
import app from '../app.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Campaign from '../models/Campaign.js'
import Customer from '../models/Customer.js'
import Lead from '../models/Lead.js'
import { generateToken } from '../utils/token.js'
import bcrypt from 'bcryptjs'

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
  console.log('🚀 Running Digital Marketing Platform End-to-End Integration Suite')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  console.log(`Test server bound to ephemeral port: ${baseUrl}\n`)

  try {
    // -------------------------------------------------------------
    // Test 1: Health check
    // -------------------------------------------------------------
    console.log('[Suite 1: System Health]')
    const healthRes = await fetch(`${baseUrl}/api/health`)
    const healthData = await healthRes.json()
    assert(
      healthRes.status === 200 && healthData.status === 'healthy' && healthData.database === 'connected',
      'API Health check returns status healthy and database connected'
    )

    // -------------------------------------------------------------
    // Multi-tenant Setup: Org A and Org B
    // -------------------------------------------------------------
    console.log('\n[Suite 2: Multi-Tenant Architecture & Auth]')
    let orgA = await Organization.findOne({ slug: 'integ-org-a' })
    if (!orgA) {
      orgA = await Organization.create({
        name: 'Integ Agency A',
        slug: 'integ-org-a',
        plan: 'enterprise',
      })
    }

    let orgB = await Organization.findOne({ slug: 'integ-org-b' })
    if (!orgB) {
      orgB = await Organization.create({
        name: 'Integ Agency B',
        slug: 'integ-org-b',
        plan: 'growth',
      })
    }

    let userA = await User.findOne({ email: 'admin-a@integ.com' })
    if (!userA) {
      userA = await User.create({
        organization: orgA._id,
        name: 'Admin Org A',
        email: 'admin-a@integ.com',
        password: 'TestPass123!',
        role: 'agency_admin',
        status: 'active',
      })
    } else {
      userA.password = 'TestPass123!'
      await userA.save()
    }

    let userB = await User.findOne({ email: 'admin-b@integ.com' })
    if (!userB) {
      userB = await User.create({
        organization: orgB._id,
        name: 'Admin Org B',
        email: 'admin-b@integ.com',
        password: 'TestPass123!',
        role: 'agency_admin',
        status: 'active',
      })
    } else {
      userB.password = 'TestPass123!'
      await userB.save()
    }

    const tokenA = generateToken({ userId: userA._id })
    const tokenB = generateToken({ userId: userB._id })
    const cookieA = `scalevo_token=${tokenA}`
    const cookieB = `scalevo_token=${tokenB}`

    // Test Login endpoint
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin-a@integ.com', password: 'TestPass123!' }),
    })
    const loginData = await loginRes.json()
    const setCookieHeader = loginRes.headers.get('set-cookie')
    assert(
      loginRes.status === 200 &&
        loginData.status === 'success' &&
        setCookieHeader &&
        setCookieHeader.includes('scalevo_token') &&
        setCookieHeader.toLowerCase().includes('httponly'),
      'POST /api/auth/login issues secure HTTP-only cookie'
    )

    // -------------------------------------------------------------
    // Test 3: Campaign Management
    // -------------------------------------------------------------
    console.log('\n[Suite 3: Campaign Management & Scoping]')
    const createCampRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        name: 'Q4 Omnichannel Blast',
        channel: 'Meta Ads',
        status: 'active',
        budget: 50000,
        spent: 12000,
        startDate: new Date().toISOString(),
        metrics: {
          impressions: 45000,
          clicks: 2200,
          conversions: 85,
          spend: 12000,
          revenue: 60000,
          roi: 400,
        },
      }),
    })
    const createCampData = await createCampRes.json()
    const createdCampId = createCampData.data?.campaign?._id

    assert(
      createCampRes.status === 201 && createdCampId,
      'POST /api/campaigns creates campaign scoped to authenticated organization'
    )

    // Org A reads campaign
    const getCampARes = await fetch(`${baseUrl}/api/campaigns/${createdCampId}`, {
      headers: { Cookie: cookieA },
    })
    assert(
      getCampARes.status === 200,
      'GET /api/campaigns/:id allows Org A to read its own campaign'
    )

    // Cross-tenant access check: Org B attempts to read Org A's campaign
    const getCampBRes = await fetch(`${baseUrl}/api/campaigns/${createdCampId}`, {
      headers: { Cookie: cookieB },
    })
    assert(
      getCampBRes.status === 404,
      'GET /api/campaigns/:id prevents Org B from accessing Org A campaign (404 Tenant Isolation)'
    )

    // -------------------------------------------------------------
    // Test 4: Customer Management
    // -------------------------------------------------------------
    console.log('\n[Suite 4: Customer Management & Isolation]')
    const createCustRes = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        name: 'Alpha Retail Corp',
        email: 'contact@alpharetail.com',
        phone: '+91 9988776655',
        company: 'Alpha Retail',
        source: 'Meta Ads',
        status: 'active',
        totalSpend: 75000,
      }),
    })
    const createCustData = await createCustRes.json()
    const createdCustId = createCustData.data?.customer?._id

    assert(
      createCustRes.status === 201 && createdCustId,
      'POST /api/customers creates customer scoped to authenticated organization'
    )

    // Cross-tenant check on customer
    const getCustBRes = await fetch(`${baseUrl}/api/customers/${createdCustId}`, {
      headers: { Cookie: cookieB },
    })
    assert(
      getCustBRes.status === 404,
      'GET /api/customers/:id prevents Org B from accessing Org A customer (404 Tenant Isolation)'
    )

    // -------------------------------------------------------------
    // Test 5: Lead Pipeline Management
    // -------------------------------------------------------------
    console.log('\n[Suite 5: Lead Pipeline Management & Status Tracking]')
    const createLeadRes = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        name: 'Rajesh Sharma',
        email: 'rajesh@innovate.in',
        phone: '+91 9811223344',
        company: 'Innovate India',
        source: 'Meta Ads',
        campaign: createdCampId,
        status: 'new',
        leadScore: 85,
        estimatedValue: 120000,
      }),
    })
    const createLeadData = await createLeadRes.json()
    const createdLeadId = createLeadData.data?.lead?._id

    assert(
      createLeadRes.status === 201 && createdLeadId,
      'POST /api/leads creates inbound lead linked to campaign and organization'
    )

    // Update Lead Status
    const updateLeadRes = await fetch(`${baseUrl}/api/leads/${createdLeadId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({ status: 'qualified' }),
    })
    const updateLeadData = await updateLeadRes.json()
    assert(
      updateLeadRes.status === 200 && updateLeadData.data?.lead?.status === 'qualified',
      'PATCH /api/leads/:id/status successfully transitions lead status'
    )

    // Cross-tenant check on lead
    const updateLeadBRes = await fetch(`${baseUrl}/api/leads/${createdLeadId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieB,
      },
      body: JSON.stringify({ status: 'lost' }),
    })
    assert(
      updateLeadBRes.status === 404,
      'PATCH /api/leads/:id/status prevents Org B from mutating Org A lead'
    )

    // -------------------------------------------------------------
    // Test 6: Analytics Overview Aggregation
    // -------------------------------------------------------------
    console.log('\n[Suite 6: Analytics Overview Aggregation]')
    const analyticsARes = await fetch(`${baseUrl}/api/analytics/overview?dateRange=30d`, {
      headers: { Cookie: cookieA },
    })
    const analyticsAData = await analyticsARes.json()
    const cStats = analyticsAData.data?.campaignAnalytics
    const lStats = analyticsAData.data?.leadAnalytics
    const custStats = analyticsAData.data?.customerAnalytics

    assert(
      analyticsARes.status === 200 &&
        cStats?.totalSpend >= 12000 &&
        cStats?.totalRevenue >= 60000 &&
        lStats?.totalLeads >= 1 &&
        custStats?.totalCustomers >= 1,
      'GET /api/analytics/overview aggregates real campaign, customer, and lead metrics for Org A'
    )

    // Org B Analytics check - should have 0 of Org A's data
    const analyticsBRes = await fetch(`${baseUrl}/api/analytics/overview?dateRange=30d`, {
      headers: { Cookie: cookieB },
    })
    const analyticsBData = await analyticsBRes.json()
    assert(
      analyticsBRes.status === 200 &&
        analyticsBData.data?.campaignAnalytics?.totalCampaigns === 0 &&
        analyticsBData.data?.leadAnalytics?.totalLeads === 0 &&
        analyticsBData.data?.customerAnalytics?.totalCustomers === 0,
      'GET /api/analytics/overview isolates analytics strictly to caller organization (Org B sees 0)'
    )

    // -------------------------------------------------------------
    // Test 7: Organization & User Settings
    // -------------------------------------------------------------
    console.log('\n[Suite 7: Settings & Profile]')
    const getOrgRes = await fetch(`${baseUrl}/api/settings/organization`, {
      headers: { Cookie: cookieA },
    })
    const getOrgData = await getOrgRes.json()
    assert(
      getOrgRes.status === 200 && getOrgData.data?.organization?.slug === 'integ-org-a',
      'GET /api/settings/organization returns organization workspace profile'
    )

    const patchOrgRes = await fetch(`${baseUrl}/api/settings/organization`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        },
      }),
    })
    const patchOrgData = await patchOrgRes.json()
    assert(
      patchOrgRes.status === 200 &&
        patchOrgData.data?.organization?.settings?.currency === 'INR',
      'PATCH /api/settings/organization updates workspace settings'
    )

    // -------------------------------------------------------------
    // Cleanup test records
    // -------------------------------------------------------------
    console.log('\n[Teardown]')
    await Campaign.deleteOne({ _id: createdCampId })
    await Customer.deleteOne({ _id: createdCustId })
    await Lead.deleteOne({ _id: createdLeadId })
    console.log('Test artifacts cleanly purged.')
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
