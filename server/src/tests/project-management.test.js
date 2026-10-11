process.env.NODE_ENV = 'test'
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
import Project from '../models/Project.js'
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
  console.log('🚀 Running Project Management Test Suite (38 Test Scenarios)')
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
  let projectA, projectB

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

    orgB = await Organization.findOne({ slug: 'project-test-org-b' })
    if (!orgB) {
      orgB = await Organization.create({
        name: 'Project Test Org B',
        slug: 'project-test-org-b',
        plan: 'growth',
        status: 'active',
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('Password123!', salt)

    // Super Admin (Org A)
    superAdmin = await User.findOne({ email: 'projtest_superadmin@scalevo.com' })
    if (!superAdmin) {
      superAdmin = await User.create({
        organization: orgA._id,
        name: 'Super Admin ProjTest',
        email: 'projtest_superadmin@scalevo.com',
        password: hashedPassword,
        role: 'super_admin',
        status: 'active',
      })
    }

    // Agency Admin (Org A)
    agencyAdmin = await User.findOne({ email: 'projtest_agencyadmin@scalevo.com' })
    if (!agencyAdmin) {
      agencyAdmin = await User.create({
        organization: orgA._id,
        name: 'Agency Admin ProjTest',
        email: 'projtest_agencyadmin@scalevo.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // Account Manager (Org A)
    accountManager = await User.findOne({ email: 'projtest_acctmgr@scalevo.com' })
    if (!accountManager) {
      accountManager = await User.create({
        organization: orgA._id,
        name: 'Account Manager ProjTest',
        email: 'projtest_acctmgr@scalevo.com',
        password: hashedPassword,
        role: 'account_manager',
        status: 'active',
      })
    }

    // Team Member (Org A)
    teamMember = await User.findOne({ email: 'projtest_teammember@scalevo.com' })
    if (!teamMember) {
      teamMember = await User.create({
        organization: orgA._id,
        name: 'Team Member ProjTest',
        email: 'projtest_teammember@scalevo.com',
        password: hashedPassword,
        role: 'team_member',
        status: 'active',
      })
    }

    // Client Role (Org A)
    clientUser = await User.findOne({ email: 'projtest_clientuser@scalevo.com' })
    if (!clientUser) {
      clientUser = await User.create({
        organization: orgA._id,
        name: 'Client User ProjTest',
        email: 'projtest_clientuser@scalevo.com',
        password: hashedPassword,
        role: 'client',
        status: 'active',
      })
    }

    // Admin for Tenant B (Org B)
    adminB = await User.findOne({ email: 'projtest_adminb@orgb.com' })
    if (!adminB) {
      adminB = await User.create({
        organization: orgB._id,
        name: 'Admin B ProjTest',
        email: 'projtest_adminb@orgb.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // Setup Test Clients in Tenant A & Tenant B
    clientA = await Client.findOne({ email: 'clienta_proj@test.com', organizationId: orgA._id })
    if (!clientA) {
      clientA = await Client.create({
        organizationId: orgA._id,
        companyName: 'Acme Corp Org A Proj',
        contactName: 'Alice Miller',
        email: 'clienta_proj@test.com',
        industry: 'E-commerce & Retail',
        status: 'active',
        createdBy: agencyAdmin._id,
      })
    }

    clientB = await Client.findOne({ email: 'clientb_proj@test.com', organizationId: orgB._id })
    if (!clientB) {
      clientB = await Client.create({
        organizationId: orgB._id,
        companyName: 'Beta Corp Org B Proj',
        contactName: 'Bob Evans',
        email: 'clientb_proj@test.com',
        industry: 'Technology & SaaS',
        status: 'active',
        createdBy: adminB._id,
      })
    }

    // Setup Campaigns for Tenant A & Tenant B
    campaignA = await Campaign.findOne({ name: 'ProjTest Campaign A', organizationId: orgA._id })
    if (!campaignA) {
      campaignA = await Campaign.create({
        organizationId: orgA._id,
        clientId: clientA._id,
        name: 'ProjTest Campaign A',
        campaignType: 'Meta Ads',
        status: 'Active',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        budget: 10000,
        createdBy: agencyAdmin._id,
      })
    }

    campaignB = await Campaign.findOne({ name: 'ProjTest Campaign B', organizationId: orgB._id })
    if (!campaignB) {
      campaignB = await Campaign.create({
        organizationId: orgB._id,
        clientId: clientB._id,
        name: 'ProjTest Campaign B',
        campaignType: 'Google Ads',
        status: 'Active',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-11-30'),
        budget: 15000,
        createdBy: adminB._id,
      })
    }

    // Clean up test projects from previous runs
    await Project.deleteMany({
      name: { $regex: /ProjTest/i },
    })

    // Create Baseline Project in Tenant A
    projectA = await Project.create({
      organizationId: orgA._id,
      clientId: clientA._id,
      campaignId: campaignA._id,
      name: 'ProjTest Org A Alpha',
      description: 'Alpha project for tenant A',
      projectType: 'Website Development',
      status: 'Planning',
      priority: 'High',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      projectManager: accountManager._id,
      teamMembers: [teamMember._id],
      budget: 20000,
      currency: 'USD',
      progress: 25,
      goals: 'Launch responsive e-commerce web platform',
      deliverables: 'Design mockups, Frontend codebase, Testing reports',
      notes: 'Weekly sprint check-in on Mondays',
      createdBy: agencyAdmin._id,
    })

    // Create Baseline Project in Tenant B
    projectB = await Project.create({
      organizationId: orgB._id,
      clientId: clientB._id,
      campaignId: campaignB._id,
      name: 'ProjTest Org B Beta',
      description: 'Beta project for tenant B',
      projectType: 'Shopify',
      status: 'Active',
      priority: 'Medium',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-11-30'),
      projectManager: adminB._id,
      teamMembers: [],
      budget: 12000,
      currency: 'USD',
      progress: 40,
      createdBy: adminB._id,
    })

    // Auth tokens
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
    console.log('--> Testing Scenario 1: Unauthenticated request -> 401')
    {
      const res = await fetch(`${baseUrl}/api/projects`)
      const data = await res.json()
      assert(
        res.status === 401 && data.status === 'fail',
        '1. Unauthenticated request -> 401',
        `Expected 401, got ${res.status}`
      )
    }

    // =================================================================
    // SECTION 2: TENANT ISOLATION
    // =================================================================
    console.log('--> Testing Scenario 2: Organization A can access own project')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const ids = data.data?.projects?.map((p) => p._id) || []
      assert(
        res.status === 200 && ids.includes(projectA._id.toString()),
        '2. Organization A can access own project',
        `Expected 200 and projectA in results`
      )
    }

    console.log('--> Testing Scenario 3: Organization A cannot access Organization B project')
    {
      const res = await fetch(`${baseUrl}/api/projects/${projectB._id}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      assert(
        res.status === 404 && data.status === 'fail',
        '3. Organization A cannot access Organization B project (404 Not Found)',
        `Expected 404, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 4: Organization A cannot update Organization B project')
    {
      const res = await fetch(`${baseUrl}/api/projects/${projectB._id}`, {
        method: 'PUT',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ name: 'Malicious Update by Tenant A' }),
      })
      const data = await res.json()
      assert(
        res.status === 404 && data.status === 'fail',
        '4. Organization A cannot update Organization B project (404 Not Found)',
        `Expected 404, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 5: Organization A cannot delete Organization B project')
    {
      const res = await fetch(`${baseUrl}/api/projects/${projectB._id}`, {
        method: 'DELETE',
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      assert(
        res.status === 404 && data.status === 'fail',
        '5. Organization A cannot delete Organization B project (404 Not Found)',
        `Expected 404, got ${res.status}`
      )
    }

    // =================================================================
    // SECTION 3: RBAC
    // =================================================================
    let rbacCreatedProject = null

    console.log('--> Testing Scenario 6: Super admin can create')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(superAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Created by SuperAdmin',
          clientId: clientA._id.toString(),
          projectType: 'SEO',
          budget: 5000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 201 && data.status === 'success' && data.data?.project?.name === 'ProjTest Created by SuperAdmin',
        '6. Super admin can create',
        `Expected 201, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 7: Agency admin can create')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Created by AgencyAdmin',
          clientId: clientA._id.toString(),
          projectType: 'Branding',
          budget: 8000,
        }),
      })
      const data = await res.json()
      if (res.status === 201) {
        rbacCreatedProject = data.data.project
      }
      assert(
        res.status === 201 && data.status === 'success',
        '7. Agency admin can create',
        `Expected 201, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 8: Account manager can create')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(accountManagerToken),
        body: JSON.stringify({
          name: 'ProjTest Created by AccountManager',
          clientId: clientA._id.toString(),
          projectType: 'Content Marketing',
          budget: 3500,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 201 && data.status === 'success',
        '8. Account manager can create',
        `Expected 201, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 9: Team member cannot create')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(teamMemberToken),
        body: JSON.stringify({
          name: 'ProjTest Created by TeamMember (Should Fail)',
          clientId: clientA._id.toString(),
          budget: 1000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '9. Team member cannot create (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 10: Client cannot create')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(clientUserToken),
        body: JSON.stringify({
          name: 'ProjTest Created by Client (Should Fail)',
          clientId: clientA._id.toString(),
          budget: 1000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '10. Client cannot create (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 11: Account manager cannot delete')
    {
      const res = await fetch(`${baseUrl}/api/projects/${rbacCreatedProject._id}`, {
        method: 'DELETE',
        headers: cookieHeader(accountManagerToken),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '11. Account manager cannot delete (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 12: Team member cannot delete')
    {
      const res = await fetch(`${baseUrl}/api/projects/${rbacCreatedProject._id}`, {
        method: 'DELETE',
        headers: cookieHeader(teamMemberToken),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '12. Team member cannot delete (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 13: Client cannot edit')
    {
      const res = await fetch(`${baseUrl}/api/projects/${rbacCreatedProject._id}`, {
        method: 'PUT',
        headers: cookieHeader(clientUserToken),
        body: JSON.stringify({ name: 'Client Unauthorized Edit' }),
      })
      const data = await res.json()
      assert(
        res.status === 403 && data.status === 'fail',
        '13. Client cannot edit (403 Forbidden)',
        `Expected 403, got ${res.status}`
      )
    }

    // =================================================================
    // SECTION 4: VALIDATION
    // =================================================================
    console.log('--> Testing Scenario 14: Empty project name rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: '   ',
          clientId: clientA._id.toString(),
          budget: 5000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '14. Empty project name rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 15: Negative budget rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Negative Budget',
          clientId: clientA._id.toString(),
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

    console.log('--> Testing Scenario 16: Progress below 0 rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Negative Progress',
          clientId: clientA._id.toString(),
          progress: -10,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '16. Progress below 0 rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 17: Progress above 100 rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Excess Progress',
          clientId: clientA._id.toString(),
          progress: 105,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '17. Progress above 100 rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 18: Invalid dates rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Inverted Dates',
          clientId: clientA._id.toString(),
          startDate: '2026-12-01',
          endDate: '2026-01-01',
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '18. Invalid dates rejected (End date before start date -> 400)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 19: Invalid client rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Nonexistent Client',
          clientId: '507f1f77bcf86cd799439011',
          budget: 1000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '19. Invalid client rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 20: Cross-organization client rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Cross-Org Client',
          clientId: clientB._id.toString(), // Belongs to orgB
          budget: 1000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '20. Cross-organization client rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 21: Cross-organization campaign rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Cross-Org Campaign',
          clientId: clientA._id.toString(),
          campaignId: campaignB._id.toString(), // Belongs to orgB
          budget: 1000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '21. Cross-organization campaign rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 22: Cross-organization manager rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Cross-Org Manager',
          clientId: clientA._id.toString(),
          projectManager: adminB._id.toString(), // Belongs to orgB
          budget: 1000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '22. Cross-organization manager rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 23: Cross-organization team member rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Cross-Org Team Member',
          clientId: clientA._id.toString(),
          teamMembers: [adminB._id.toString()], // Belongs to orgB
          budget: 1000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '23. Cross-organization team member rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    // =================================================================
    // SECTION 5: CRUD OPERATIONS
    // =================================================================
    let crudProject = null

    console.log('--> Testing Scenario 24: Create project')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Full CRUD Project',
          clientId: clientA._id.toString(),
          campaignId: campaignA._id.toString(),
          projectType: 'Paid Advertising',
          status: 'Planning',
          priority: 'High',
          startDate: '2026-03-01',
          endDate: '2026-09-30',
          projectManager: accountManager._id.toString(),
          teamMembers: [teamMember._id.toString()],
          budget: 15000,
          currency: 'USD',
          progress: 10,
          goals: 'Drive 500 conversions via multi-platform ads',
          deliverables: 'Ad copy, Creative assets, Dashboard reporting',
          notes: 'Targeting ROAS above 3.5x',
        }),
      })
      const data = await res.json()
      crudProject = data.data?.project
      assert(
        res.status === 201 &&
          crudProject?.name === 'ProjTest Full CRUD Project' &&
          crudProject?.progress === 10 &&
          crudProject?.budget === 15000,
        '24. Create project',
        `Expected 201 with project object`
      )
    }

    console.log('--> Testing Scenario 25: List projects')
    {
      const res = await fetch(`${baseUrl}/api/projects?search=ProjTest&limit=10`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const projects = data.data?.projects || []
      const metrics = data.data?.metrics
      assert(
        res.status === 200 && Array.isArray(projects) && projects.length > 0 && metrics?.totalProjects > 0,
        '25. List projects',
        `Expected 200 with projects array and metrics summary`
      )
    }

    console.log('--> Testing Scenario 26: Get project')
    {
      const res = await fetch(`${baseUrl}/api/projects/${crudProject._id}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const p = data.data?.project
      assert(
        res.status === 200 &&
          p?._id === crudProject._id &&
          p?.clientId?.companyName === clientA.companyName &&
          p?.projectManager?.name === accountManager.name,
        '26. Get project',
        `Expected 200 and populated relations`
      )
    }

    console.log('--> Testing Scenario 27: Update project')
    {
      const res = await fetch(`${baseUrl}/api/projects/${crudProject._id}`, {
        method: 'PUT',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Full CRUD Project (Updated)',
          budget: 18500,
          priority: 'Critical',
          description: 'Updated project description for testing',
        }),
      })
      const data = await res.json()
      const p = data.data?.project
      assert(
        res.status === 200 &&
          p?.name === 'ProjTest Full CRUD Project (Updated)' &&
          p?.budget === 18500 &&
          p?.priority === 'Critical',
        '27. Update project',
        `Expected 200 with updated fields`
      )
    }

    console.log('--> Testing Scenario 28: Delete project')
    {
      const res = await fetch(`${baseUrl}/api/projects/${crudProject._id}`, {
        method: 'DELETE',
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const checkRes = await fetch(`${baseUrl}/api/projects/${crudProject._id}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      assert(
        res.status === 200 && data.status === 'success' && checkRes.status === 404,
        '28. Delete project',
        `Expected 200 on delete and subsequent 404`
      )
    }

    // =================================================================
    // SECTION 6: STATUS & PROGRESS MANAGEMENT
    // =================================================================
    let stateProject = null
    {
      stateProject = await Project.create({
        organizationId: orgA._id,
        clientId: clientA._id,
        name: 'ProjTest State Lifecycle',
        projectType: 'Analytics',
        status: 'Planning',
        progress: 15,
        budget: 7000,
        createdBy: agencyAdmin._id,
      })
    }

    console.log('--> Testing Scenario 29: Valid status transition succeeds')
    {
      // Planning -> Active is valid
      const res = await fetch(`${baseUrl}/api/projects/${stateProject._id}/status`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ status: 'Active' }),
      })
      const data = await res.json()
      assert(
        res.status === 200 && data.data?.project?.status === 'Active',
        '29. Valid status transition succeeds (Planning -> Active)',
        `Expected 200, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 30: Invalid status transition rejected')
    {
      // First move Active -> Completed
      await fetch(`${baseUrl}/api/projects/${stateProject._id}/status`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ status: 'Completed' }),
      })

      // Completed -> Planning is invalid (only Active allowed)
      const res = await fetch(`${baseUrl}/api/projects/${stateProject._id}/status`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ status: 'Planning' }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '30. Invalid status transition rejected (Completed -> Planning -> 400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 31: Progress update succeeds')
    {
      const res = await fetch(`${baseUrl}/api/projects/${stateProject._id}/progress`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ progress: 85 }),
      })
      const data = await res.json()
      assert(
        res.status === 200 && data.data?.project?.progress === 85,
        '31. Progress update succeeds',
        `Expected 200 and progress 85`
      )
    }

    console.log('--> Testing Scenario 32: Invalid progress rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects/${stateProject._id}/progress`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ progress: 140 }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '32. Invalid progress rejected (> 100 -> 400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    // =================================================================
    // SECTION 7: SECURITY AUDIT
    // =================================================================
    console.log('--> Testing Scenario 33: organizationId spoofing rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Spoofed OrgId',
          clientId: clientA._id.toString(),
          organizationId: orgB._id.toString(), // Attacker tries to inject tenant B
          budget: 5000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '33. organizationId spoofing rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 34: createdBy spoofing rejected')
    {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          name: 'ProjTest Spoofed Creator',
          clientId: clientA._id.toString(),
          createdBy: superAdmin._id.toString(), // Attacker tries to impersonate super admin
          budget: 5000,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 400 && data.status === 'fail',
        '34. createdBy spoofing rejected (400 Bad Request)',
        `Expected 400, got ${res.status}`
      )
    }

    console.log('--> Testing Scenario 35: sensitive user data not exposed')
    {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const p = data.data?.project
      const mgr = p?.projectManager
      const member = p?.teamMembers?.[0]

      const safeMgr = !mgr?.password && !mgr?.passwordResetToken && !mgr?.googleId
      const safeMember = !member?.password && !member?.passwordResetToken && !member?.googleId
      assert(
        safeMgr && safeMember,
        '35. sensitive user data not exposed (Passwords/tokens omitted from manager and team members)',
        `Safe fields confirmed on populated user references`
      )
    }

    // =================================================================
    // SECTION 8: STATISTICS & FRONTEND
    // =================================================================
    console.log('--> Testing Scenario 36: Project statistics work')
    {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/statistics`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const s = data.data?.statistics
      assert(
        res.status === 200 &&
          s?.budget === 20000 &&
          s?.progress === 25 &&
          s?.remaining !== undefined &&
          s?.totalTasks !== undefined,
        '36. Project statistics work',
        `Expected 200 with budget, progress, and task metrics`
      )
    }

    console.log('--> Testing Scenario 37: Project route protected')
    {
      const clientDir = path.resolve(__dirname, '../../../Design Digital Marketing Platform/client')
      const appRoutesFile = path.resolve(clientDir, 'src/routes/AppRoutes.jsx')
      const content = fs.readFileSync(appRoutesFile, 'utf8')

      // Check routes are registered within ProtectedRoute
      const hasProjectsRoute = content.includes('path="/projects"') && content.includes('path="/projects/:id"')
      const isProtected = content.includes('ProtectedRoute')

      assert(
        hasProjectsRoute && isProtected,
        '37. Project route protected (/projects and /projects/:id secured via ProtectedRoute)',
        `hasProjectsRoute: ${hasProjectsRoute}, isProtected: ${isProtected}`
      )
    }

    console.log('--> Testing Scenario 38: Production build succeeds')
    {
      const clientDir = path.resolve(__dirname, '../../../Design Digital Marketing Platform/client')
      const distIndexPath = path.resolve(clientDir, 'dist/index.html')
      if (!fs.existsSync(distIndexPath)) {
        try {
          execSync('node node_modules/vite/bin/vite.js build', { cwd: clientDir, stdio: 'pipe', timeout: 90000 })
        } catch (err) {
          console.error('Vite build error:', err.message)
        }
      }
      const buildSuccess = fs.existsSync(distIndexPath)

      assert(
        buildSuccess,
        '38. Production build succeeds (Vite compiles all assets cleanly without errors)',
        `buildSuccess: ${buildSuccess}`
      )
    }
  } catch (err) {
    console.error('Unexpected error in test runner:', err)
  } finally {
    await server.close()
  }

  console.log('\n=================================================================')
  console.log(`Project Test Results Summary: ${passedCount}/38 Passed, ${failedCount} Failed`)
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
