import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import app from '../app.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Client from '../models/Client.js'
import Campaign from '../models/Campaign.js'
import { generateToken } from '../utils/token.js'
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
  console.log('🚀 Running Campaign Management Test Suite (30 Test Scenarios)')
  console.log('=================================================================\n')

  await connectDB()

  // Start HTTP server on ephemeral port for real HTTP testing
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  console.log(`Test server running on ${baseUrl}\n`)

  let orgA, orgB
  let superAdmin, agencyAdmin, accountManager, teamMember, clientUser, adminB
  let clientA, clientB
  let campaignA, campaignB

  try {
    // -----------------------------------------------------------------
    // Setup Organizations and Test Users
    // -----------------------------------------------------------------
    orgA = await Organization.findOne({ slug: 'scalevo-agency' })
    if (!orgA) {
      orgA = await Organization.create({
        name: 'Scalevo Agency',
        slug: 'scalevo-agency',
        plan: 'enterprise',
        status: 'active',
      })
    }

    orgB = await Organization.findOne({ slug: 'campaign-test-org-b' })
    if (!orgB) {
      orgB = await Organization.create({
        name: 'Campaign Test Org B',
        slug: 'campaign-test-org-b',
        plan: 'growth',
        status: 'active',
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('Password123!', salt)

    // Super Admin (Org A)
    superAdmin = await User.findOne({ email: 'camptest_superadmin@scalevo.com' })
    if (!superAdmin) {
      superAdmin = await User.create({
        organization: orgA._id,
        name: 'Super Admin CampTest',
        email: 'camptest_superadmin@scalevo.com',
        password: hashedPassword,
        role: 'super_admin',
        status: 'active',
      })
    }

    // Agency Admin (Org A)
    agencyAdmin = await User.findOne({ email: 'camptest_agencyadmin@scalevo.com' })
    if (!agencyAdmin) {
      agencyAdmin = await User.create({
        organization: orgA._id,
        name: 'Agency Admin CampTest',
        email: 'camptest_agencyadmin@scalevo.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // Account Manager (Org A)
    accountManager = await User.findOne({ email: 'camptest_acctmgr@scalevo.com' })
    if (!accountManager) {
      accountManager = await User.create({
        organization: orgA._id,
        name: 'Account Manager CampTest',
        email: 'camptest_acctmgr@scalevo.com',
        password: hashedPassword,
        role: 'account_manager',
        status: 'active',
      })
    }

    // Team Member (Org A)
    teamMember = await User.findOne({ email: 'camptest_teammember@scalevo.com' })
    if (!teamMember) {
      teamMember = await User.create({
        organization: orgA._id,
        name: 'Team Member CampTest',
        email: 'camptest_teammember@scalevo.com',
        password: hashedPassword,
        role: 'team_member',
        status: 'active',
      })
    }

    // Client Role (Org A)
    clientUser = await User.findOne({ email: 'camptest_clientuser@scalevo.com' })
    if (!clientUser) {
      clientUser = await User.create({
        organization: orgA._id,
        name: 'Client User CampTest',
        email: 'camptest_clientuser@scalevo.com',
        password: hashedPassword,
        role: 'client',
        status: 'active',
      })
    }

    // Admin for Tenant B (Org B)
    adminB = await User.findOne({ email: 'camptest_adminb@orgb.com' })
    if (!adminB) {
      adminB = await User.create({
        organization: orgB._id,
        name: 'Admin B CampTest',
        email: 'camptest_adminb@orgb.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // Setup Test Clients in Tenant A & Tenant B
    clientA = await Client.findOne({ email: 'clienta_camp@test.com', organizationId: orgA._id })
    if (!clientA) {
      clientA = await Client.create({
        organizationId: orgA._id,
        companyName: 'Acme Corp Org A',
        contactName: 'Alice Smith',
        email: 'clienta_camp@test.com',
        industry: 'E-commerce & Retail',
        status: 'active',
        createdBy: agencyAdmin._id,
      })
    }

    clientB = await Client.findOne({ email: 'clientb_camp@test.com', organizationId: orgB._id })
    if (!clientB) {
      clientB = await Client.create({
        organizationId: orgB._id,
        companyName: 'Beta Corp Org B',
        contactName: 'Bob Jones',
        email: 'clientb_camp@test.com',
        industry: 'Technology & SaaS',
        status: 'active',
        createdBy: adminB._id,
      })
    }

    // Clean up test campaigns from previous runs
    await Campaign.deleteMany({
      name: { $regex: /CampTest/i },
    })

    // Create Campaign in Tenant A
    campaignA = await Campaign.create({
      organizationId: orgA._id,
      organization: orgA._id,
      clientId: clientA._id,
      client: clientA._id,
      name: 'CampTest Org A Alpha',
      description: 'Alpha campaign for tenant A',
      campaignType: 'Meta Ads',
      channel: 'Meta Ads',
      status: 'Active',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      budget: 15000,
      currency: 'USD',
      campaignManager: accountManager._id,
      assignedTo: accountManager._id,
      goals: 'Generate 1000 sales',
      KPIs: { targetROAS: 4.2, targetCPA: 15 },
      channels: ['Meta Ads', 'Instagram'],
      createdBy: agencyAdmin._id,
      metrics: {
        spend: 4500,
        impressions: 120000,
        reach: 85000,
        clicks: 4800,
        conversions: 320,
        revenue: 18900,
      },
    })

    // Create Campaign in Tenant B
    campaignB = await Campaign.create({
      organizationId: orgB._id,
      organization: orgB._id,
      clientId: clientB._id,
      client: clientB._id,
      name: 'CampTest Org B Beta',
      description: 'Beta campaign for tenant B',
      campaignType: 'Google Ads',
      channel: 'Google Ads',
      status: 'Active',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-11-30'),
      budget: 25000,
      currency: 'USD',
      createdBy: adminB._id,
    })

    // Generate authentication tokens
    const superAdminToken = generateToken({ userId: superAdmin._id, organizationId: orgA._id, role: superAdmin.role })
    const agencyAdminToken = generateToken({ userId: agencyAdmin._id, organizationId: orgA._id, role: agencyAdmin.role })
    const accountManagerToken = generateToken({ userId: accountManager._id, organizationId: orgA._id, role: accountManager.role })
    const teamMemberToken = generateToken({ userId: teamMember._id, organizationId: orgA._id, role: teamMember.role })
    const clientUserToken = generateToken({ userId: clientUser._id, organizationId: orgA._id, role: clientUser.role })
    const adminBToken = generateToken({ userId: adminB._id, organizationId: orgB._id, role: adminB.role })

    const cookieHeader = (token) => ({
      Cookie: `scalevo_token=${token}`,
      'Content-Type': 'application/json',
    })

    // =================================================================
    // SECTION 1: AUTHENTICATION
    // =================================================================
    console.log('--> Testing Scenario 1: Unauthenticated campaign request returns 401')
    {
      const res = await fetch(`${baseUrl}/api/campaigns`)
      const data = await res.json()
      assert(
        res.status === 401 && data.status === 'fail',
        '1. Unauthenticated campaign request returns 401',
        `Expected 401, got ${res.status}`
      )
    }

    // =================================================================
    // SECTION 2: ORGANIZATION ISOLATION
    // =================================================================
    console.log('--> Testing Scenario 2: Organization A can access its own campaigns')
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const ids = data.data?.campaigns?.map((c) => c._id) || []
      assert(
        res.status === 200 && ids.includes(campaignA._id.toString()),
        '2. Organization A can access its own campaigns',
        `Expected 200 and campaignA in results`
      )
    }

    console.log('--> Testing Scenario 3: Organization A cannot access Organization B campaign')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${campaignB._id}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      assert(
        res.status === 404 && data.status === 'fail',
        '3. Organization A cannot access Organization B campaign (404 Not Found)',
        `Expected 404, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 4: Organization A cannot modify Organization B campaign')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${campaignB._id}`, {
        method: 'PUT',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ name: 'Tampered Campaign Name' }),
      })
      const data = await res.json()
      assert(
        res.status === 404 && data.status === 'fail',
        '4. Organization A cannot modify Organization B campaign (404 Not Found)',
        `Expected 404, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 5: Organization A cannot delete Organization B campaign')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${campaignB._id}`, {
        method: 'DELETE',
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      assert(
        res.status === 404 && data.status === 'fail',
        '5. Organization A cannot delete Organization B campaign (404 Not Found)',
        `Expected 404, got ${res.status}`
      )
    }

    // =================================================================
    // SECTION 3: RBAC (ROLE-BASED ACCESS CONTROL)
    // =================================================================
    console.log('--> Testing Scenario 6: Super admin can create campaign')
    let superAdminCreatedId = null
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(superAdminToken),
        body: JSON.stringify({
          name: 'CampTest SuperAdmin Created',
          clientId: clientA._id.toString(),
          campaignType: 'Google Ads',
          startDate: '2026-03-01',
          endDate: '2026-08-31',
          budget: 8000,
        }),
      })
      const data = await res.json()
      superAdminCreatedId = data.data?.campaign?._id
      assert(
        res.status === 201 && data.data?.campaign?.name === 'CampTest SuperAdmin Created',
        '6. Super admin can create campaign',
        `Expected 201, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 7: Agency admin can create campaign')
    let agencyAdminCreatedId = null
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest AgencyAdmin Created',
          clientId: clientA._id.toString(),
          campaignType: 'Meta Ads',
          startDate: '2026-04-01',
          endDate: '2026-09-30',
          budget: 12000,
        }),
      })
      const data = await res.json()
      agencyAdminCreatedId = data.data?.campaign?._id
      assert(
        res.status === 201 && data.data?.campaign?.name === 'CampTest AgencyAdmin Created',
        '7. Agency admin can create campaign',
        `Expected 201, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 8: Account manager can create campaign')
    let acctMgrCreatedId = null
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(accountManagerToken),
        body: JSON.stringify({
          name: 'CampTest AcctMgr Created',
          clientId: clientA._id.toString(),
          campaignType: 'Email Marketing',
          startDate: '2026-05-01',
          endDate: '2026-10-31',
          budget: 6500,
        }),
      })
      const data = await res.json()
      acctMgrCreatedId = data.data?.campaign?._id
      assert(
        res.status === 201 && data.data?.campaign?.name === 'CampTest AcctMgr Created',
        '8. Account manager can create campaign',
        `Expected 201, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 9: Team member cannot create campaign')
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(teamMemberToken),
        body: JSON.stringify({
          name: 'CampTest TeamMember Blocked',
          clientId: clientA._id.toString(),
          campaignType: 'SEO',
          startDate: '2026-06-01',
          endDate: '2026-12-31',
          budget: 3000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '9. Team member cannot create campaign (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 10: Client role cannot create campaign')
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(clientUserToken),
        body: JSON.stringify({
          name: 'CampTest Client Blocked',
          clientId: clientA._id.toString(),
          campaignType: 'SEO',
          startDate: '2026-06-01',
          endDate: '2026-12-31',
          budget: 3000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '10. Client role cannot create campaign (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 11: Account manager cannot delete campaign')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${acctMgrCreatedId}`, {
        method: 'DELETE',
        headers: cookieHeader(accountManagerToken),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '11. Account manager cannot delete campaign (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 12: Team member cannot delete campaign')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${campaignA._id}`, {
        method: 'DELETE',
        headers: cookieHeader(teamMemberToken),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '12. Team member cannot delete campaign (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 13: Client role cannot edit campaign')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${campaignA._id}`, {
        method: 'PUT',
        headers: cookieHeader(clientUserToken),
        body: JSON.stringify({ name: 'Tampered By Client' }),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '13. Client role cannot edit campaign (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    // =================================================================
    // SECTION 4: VALIDATION
    // =================================================================
    console.log('--> Testing Scenario 14: Invalid campaign data rejected')
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: '', // Empty name
          clientId: clientA._id.toString(),
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          budget: 1000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '14. Invalid campaign data rejected (Empty name returns 400)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 15: Negative budget rejected')
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest Negative Budget',
          clientId: clientA._id.toString(),
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          budget: -500,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '15. Negative budget rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 16: Invalid dates rejected')
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest Inverted Dates',
          clientId: clientA._id.toString(),
          startDate: '2026-12-31',
          endDate: '2026-01-01', // End date before start date
          budget: 5000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '16. Invalid dates rejected (End date before start date returns 400)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 17: Invalid client rejected')
    {
      const nonExistentId = '666666666666666666666666'
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest Invalid Client',
          clientId: nonExistentId,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          budget: 5000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '17. Invalid client rejected (Non-existent client returns 400)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 18: Cross-organization client rejected')
    {
      // Attempting to create campaign in Org A using clientB from Org B
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest Cross-Org Client',
          clientId: clientB._id.toString(),
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          budget: 5000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '18. Cross-organization client rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 19: Cross-organization campaign manager rejected')
    {
      // Attempting to assign adminB (from Org B) to campaign in Org A
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest Cross-Org Manager',
          clientId: clientA._id.toString(),
          campaignManager: adminB._id.toString(),
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          budget: 5000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '19. Cross-organization campaign manager rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    // =================================================================
    // SECTION 5: CRUD FUNCTIONALITY
    // =================================================================
    console.log('--> Testing Scenario 20: Create campaign with complete fields succeeds')
    let fullCampaignId = null
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest Complete Omnichannel',
          clientId: clientA._id.toString(),
          campaignType: 'Shopify Marketing',
          campaignManager: accountManager._id.toString(),
          description: 'Comprehensive e-commerce marketing campaign',
          startDate: '2026-06-01',
          endDate: '2026-12-31',
          budget: 20000,
          currency: 'USD',
          targetAudience: 'E-commerce fashion buyers aged 18-35',
          channels: ['Shopify Marketing', 'Meta Ads', 'Google Ads'],
          goals: 'Drive 500k in store revenue',
          KPIs: { targetROAS: 5.0, targetCPA: 12.5 },
          notes: 'Coordinate with influencer partners',
          status: 'Draft',
        }),
      })
      const data = await res.json()
      fullCampaignId = data.data?.campaign?._id
      assert(
        res.status === 201 &&
          data.data?.campaign?.channels?.length === 3 &&
          data.data?.campaign?.KPIs?.targetROAS === 5.0,
        '20. Create campaign with complete fields succeeds',
        `Expected 201 with populated KPIs, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 21: Get campaigns lists tenant campaigns with pagination and metrics')
    {
      const res = await fetch(`${baseUrl}/api/campaigns?limit=10&page=1`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      assert(
        res.status === 200 &&
          Array.isArray(data.data?.campaigns) &&
          data.data.campaigns.length >= 1 &&
          data.data?.metrics?.total >= 1 &&
          data.pagination?.totalPages >= 1,
        '21. Get campaigns lists tenant campaigns with pagination and metrics',
        `Expected 200 with campaigns, metrics and pagination`
      )
    }

    console.log('--> Testing Scenario 22: Get campaign by ID returns populated client and manager')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${fullCampaignId}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const camp = data.data?.campaign
      assert(
        res.status === 200 &&
          camp?._id === fullCampaignId &&
          camp?.clientId?.companyName === 'Acme Corp Org A' &&
          camp?.campaignManager?.name === 'Account Manager CampTest',
        '22. Get campaign by ID returns populated client and manager',
        `Expected 200 with populated relations`
      )
    }

    console.log('--> Testing Scenario 23: Update campaign details succeeds')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${fullCampaignId}`, {
        method: 'PUT',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest Complete Omnichannel (Updated)',
          budget: 22500,
          description: 'Updated campaign strategy for Q3-Q4',
        }),
      })
      const data = await res.json()
      assert(
        res.status === 200 &&
          data.data?.campaign?.name === 'CampTest Complete Omnichannel (Updated)' &&
          data.data?.campaign?.budget === 22500,
        '23. Update campaign details succeeds',
        `Expected 200 and updated fields`
      )
    }

    console.log('--> Testing Scenario 24: Delete campaign removes record from tenant')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${superAdminCreatedId}`, {
        method: 'DELETE',
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()

      // Verify it cannot be retrieved anymore
      const checkRes = await fetch(`${baseUrl}/api/campaigns/${superAdminCreatedId}`, {
        headers: cookieHeader(agencyAdminToken),
      })

      assert(
        res.status === 200 && checkRes.status === 404,
        '24. Delete campaign removes record from tenant (Subsequent GET returns 404)',
        `Expected 200 delete and 404 fetch`
      )
    }

    console.log('--> Testing Scenario 25: Update status validates allowed transitions')
    {
      // Transition from Draft to Planned (Allowed)
      const res1 = await fetch(`${baseUrl}/api/campaigns/${fullCampaignId}/status`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ status: 'Planned' }),
      })
      const data1 = await res1.json()

      // Transition from Planned to Active (Allowed)
      const res2 = await fetch(`${baseUrl}/api/campaigns/${fullCampaignId}/status`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ status: 'Active' }),
      })
      const data2 = await res2.json()

      assert(
        res1.status === 200 &&
          data1.data?.campaign?.status === 'Planned' &&
          res2.status === 200 &&
          data2.data?.campaign?.status === 'Active',
        '25. Update status validates allowed transitions (Draft -> Planned -> Active)',
        `Expected status 200 for transitions, got ${res1.status} and ${res2.status}`
      )
    }

    // =================================================================
    // SECTION 6: SECURITY & AUDIT
    // =================================================================
    console.log('--> Testing Scenario 26: organizationId cannot be spoofed in create or update')
    {
      // Spoofing in create
      const createRes = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest Spoofed Org',
          clientId: clientA._id.toString(),
          organizationId: orgB._id.toString(), // Attacker tries to inject Org B
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          budget: 5000,
        }),
      })

      // Spoofing in update
      const updateRes = await fetch(`${baseUrl}/api/campaigns/${fullCampaignId}`, {
        method: 'PUT',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          organizationId: orgB._id.toString(), // Attacker tries to transfer campaign to Org B
        }),
      })

      assert(
        createRes.status === 400 && updateRes.status === 400,
        '26. organizationId cannot be spoofed in create or update (Rejected with 400)',
        `Expected 400 for both spoof attempts, got create: ${createRes.status}, update: ${updateRes.status}`
      )
    }

    console.log('--> Testing Scenario 27: createdBy cannot be spoofed')
    {
      const res = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'CampTest Spoofed Creator',
          clientId: clientA._id.toString(),
          createdBy: superAdmin._id.toString(), // Attacker tries to impersonate super admin
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          budget: 5000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '27. createdBy cannot be spoofed (Rejected with 400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 28: Sensitive user data not unnecessarily returned')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${campaignA._id}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const camp = data.data?.campaign
      const manager = camp?.campaignManager
      assert(
        manager && !manager.password && !manager.passwordResetToken && !manager.googleId,
        '28. Sensitive user data not unnecessarily returned (No password hashes or tokens exposed)',
        `Manager object only contains safe fields: ${Object.keys(manager || {})}`
      )
    }

    console.log('--> Testing Scenario 29: Campaign statistics endpoint calculates budget pacing, CTR, CPC, and ROAS')
    {
      const res = await fetch(`${baseUrl}/api/campaigns/${campaignA._id}/statistics`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const s = data.data?.statistics
      assert(
        res.status === 200 &&
          s?.spend === 4500 &&
          s?.budgetRemaining === 10500 &&
          s?.CTR > 0 &&
          s?.ROAS > 0,
        '29. Campaign statistics endpoint calculates budget pacing, CTR, CPC, and ROAS',
        `Expected 200 with valid computed statistics`
      )
    }

    // =================================================================
    // SECTION 7: FRONTEND INTEGRATION & BUILD
    // =================================================================
    console.log('--> Testing Scenario 30: Frontend production build succeeds and campaign routes are protected')
    {
      const clientDir = path.resolve(__dirname, '../../../Design Digital Marketing Platform/client')
      const appRoutesFile = path.resolve(clientDir, 'src/routes/AppRoutes.jsx')
      const content = fs.readFileSync(appRoutesFile, 'utf8')

      // Verify route registration and protected wrapper
      const hasCampaignRoute = content.includes('/campaigns') && content.includes('ProtectedRoute')

      // Verify production build
      let buildSuccess = false
      try {
        execSync('npm run build', { cwd: clientDir, stdio: 'pipe', timeout: 60000 })
        buildSuccess = true
      } catch (err) {
        console.error('Vite build error:', err.message)
      }

      assert(
        hasCampaignRoute && buildSuccess,
        '30. Frontend production build succeeds and campaign routes are protected (Vite bundle compiled cleanly)',
        `Route protected: ${hasCampaignRoute}, Build succeeded: ${buildSuccess}`
      )
    }
  } catch (err) {
    console.error('Unexpected error in test runner:', err)
  } finally {
    await server.close()
  }

  console.log('\n=================================================================')
  console.log(`Campaign Test Results Summary: ${passedCount}/30 Passed, ${failedCount} Failed`)
  console.log('=================================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
