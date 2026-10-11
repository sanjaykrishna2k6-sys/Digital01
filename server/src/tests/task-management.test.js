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
import Task from '../models/Task.js'
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
  console.log('🚀 Running Task Management Test Suite (48 Test Scenarios)')
  console.log('=================================================================\n')

  await connectDB()

  // Start HTTP server on ephemeral port for real HTTP testing
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  console.log(`Test server running on ${baseUrl}\n`)

  let orgA, orgB
  let superAdmin, agencyAdmin, accountManager, teamMemberA1, teamMemberA2, clientUser, adminB, userB
  let clientA, clientA2, clientB
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

    orgB = await Organization.findOne({ slug: 'task-test-org-b' })
    if (!orgB) {
      orgB = await Organization.create({
        name: 'Task Test Org B',
        slug: 'task-test-org-b',
        plan: 'growth',
        status: 'active',
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('Password123!', salt)

    // Super Admin (Org A)
    superAdmin = await User.findOne({ email: 'tasktest_superadmin@scalevo.com' })
    if (!superAdmin) {
      superAdmin = await User.create({
        organization: orgA._id,
        name: 'Super Admin TaskTest',
        email: 'tasktest_superadmin@scalevo.com',
        password: hashedPassword,
        role: 'super_admin',
        status: 'active',
      })
    }

    // Agency Admin (Org A)
    agencyAdmin = await User.findOne({ email: 'tasktest_agencyadmin@scalevo.com' })
    if (!agencyAdmin) {
      agencyAdmin = await User.create({
        organization: orgA._id,
        name: 'Agency Admin TaskTest',
        email: 'tasktest_agencyadmin@scalevo.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // Account Manager (Org A)
    accountManager = await User.findOne({ email: 'tasktest_manager@scalevo.com' })
    if (!accountManager) {
      accountManager = await User.create({
        organization: orgA._id,
        name: 'Account Manager TaskTest',
        email: 'tasktest_manager@scalevo.com',
        password: hashedPassword,
        role: 'account_manager',
        status: 'active',
      })
    }

    // Team Member 1 (Org A)
    teamMemberA1 = await User.findOne({ email: 'tasktest_member1@scalevo.com' })
    if (!teamMemberA1) {
      teamMemberA1 = await User.create({
        organization: orgA._id,
        name: 'Team Member 1 TaskTest',
        email: 'tasktest_member1@scalevo.com',
        password: hashedPassword,
        role: 'team_member',
        status: 'active',
      })
    }

    // Team Member 2 (Org A)
    teamMemberA2 = await User.findOne({ email: 'tasktest_member2@scalevo.com' })
    if (!teamMemberA2) {
      teamMemberA2 = await User.create({
        organization: orgA._id,
        name: 'Team Member 2 TaskTest',
        email: 'tasktest_member2@scalevo.com',
        password: hashedPassword,
        role: 'team_member',
        status: 'active',
      })
    }

    // Client User (Org A)
    clientUser = await User.findOne({ email: 'tasktest_client@scalevo.com' })
    if (!clientUser) {
      clientUser = await User.create({
        organization: orgA._id,
        name: 'Client User TaskTest',
        email: 'tasktest_client@scalevo.com',
        password: hashedPassword,
        role: 'client',
        status: 'active',
      })
    }

    // Admin B (Org B)
    adminB = await User.findOne({ email: 'tasktest_adminb@scalevo.com' })
    if (!adminB) {
      adminB = await User.create({
        organization: orgB._id,
        name: 'Admin B TaskTest',
        email: 'tasktest_adminb@scalevo.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // User B (Org B)
    userB = await User.findOne({ email: 'tasktest_userb@scalevo.com' })
    if (!userB) {
      userB = await User.create({
        organization: orgB._id,
        name: 'User B TaskTest',
        email: 'tasktest_userb@scalevo.com',
        password: hashedPassword,
        role: 'team_member',
        status: 'active',
      })
    }

    // Clients
    clientA = await Client.findOne({ organizationId: orgA._id, companyName: 'TaskTest Client Alpha' })
    if (!clientA) {
      clientA = await Client.create({
        organizationId: orgA._id,
        companyName: 'TaskTest Client Alpha',
        contactName: 'Alpha Contact',
        email: 'alpha@tasktest.com',
        phone: '1234567890',
        industry: 'Technology',
        status: 'active',
        createdBy: agencyAdmin._id,
      })
    }

    clientA2 = await Client.findOne({ organizationId: orgA._id, companyName: 'TaskTest Client Beta' })
    if (!clientA2) {
      clientA2 = await Client.create({
        organizationId: orgA._id,
        companyName: 'TaskTest Client Beta',
        contactName: 'Beta Contact',
        email: 'beta@tasktest.com',
        phone: '1234567891',
        industry: 'Healthcare',
        status: 'active',
        createdBy: agencyAdmin._id,
      })
    }

    clientB = await Client.findOne({ organizationId: orgB._id, companyName: 'TaskTest Client Gamma' })
    if (!clientB) {
      clientB = await Client.create({
        organizationId: orgB._id,
        companyName: 'TaskTest Client Gamma',
        contactName: 'Gamma Contact',
        email: 'gamma@tasktest.com',
        phone: '1234567892',
        industry: 'Retail',
        status: 'active',
        createdBy: adminB._id,
      })
    }

    // Campaigns
    campaignA = await Campaign.findOne({ organization: orgA._id, name: 'TaskTest Campaign Alpha' })
    if (!campaignA) {
      campaignA = await Campaign.create({
        organization: orgA._id,
        clientId: clientA._id,
        name: 'TaskTest Campaign Alpha',
        campaignType: 'Search',
        channel: 'google_search',
        status: 'active',
        budget: 5000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        createdBy: agencyAdmin._id,
      })
    }

    campaignB = await Campaign.findOne({ organization: orgB._id, name: 'TaskTest Campaign Beta' })
    if (!campaignB) {
      campaignB = await Campaign.create({
        organization: orgB._id,
        clientId: clientB._id,
        name: 'TaskTest Campaign Beta',
        campaignType: 'Social',
        channel: 'facebook',
        status: 'active',
        budget: 8000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        createdBy: adminB._id,
      })
    }

    // Projects
    projectA = await Project.findOne({ organizationId: orgA._id, name: 'TaskTest Project Alpha' })
    if (!projectA) {
      projectA = await Project.create({
        organizationId: orgA._id,
        clientId: clientA._id,
        campaignId: campaignA._id,
        name: 'TaskTest Project Alpha',
        projectType: 'Website Development',
        status: 'Active',
        priority: 'High',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-08-01'),
        projectManager: accountManager._id,
        teamMembers: [teamMemberA1._id, teamMemberA2._id],
        budget: 20000,
        currency: 'USD',
        progress: 25,
        createdBy: agencyAdmin._id,
      })
    }

    projectB = await Project.findOne({ organizationId: orgB._id, name: 'TaskTest Project Beta' })
    if (!projectB) {
      projectB = await Project.create({
        organizationId: orgB._id,
        clientId: clientB._id,
        campaignId: campaignB._id,
        name: 'TaskTest Project Beta',
        projectType: 'SEO',
        status: 'Active',
        priority: 'Medium',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-09-01'),
        projectManager: adminB._id,
        budget: 15000,
        createdBy: adminB._id,
      })
    }

    // Auth Tokens
    const superAdminToken = generateToken({ userId: superAdmin._id, organizationId: orgA._id, role: superAdmin.role })
    const agencyAdminToken = generateToken({ userId: agencyAdmin._id, organizationId: orgA._id, role: agencyAdmin.role })
    const accountManagerToken = generateToken({ userId: accountManager._id, organizationId: orgA._id, role: accountManager.role })
    const teamMemberA1Token = generateToken({ userId: teamMemberA1._id, organizationId: orgA._id, role: teamMemberA1.role })
    const teamMemberA2Token = generateToken({ userId: teamMemberA2._id, organizationId: orgA._id, role: teamMemberA2.role })
    const clientUserToken = generateToken({ userId: clientUser._id, organizationId: orgA._id, role: clientUser.role })
    const adminBToken = generateToken({ userId: adminB._id, organizationId: orgB._id, role: adminB.role })

    const cookieHeader = (token) => ({
      Cookie: `scalevo_token=${token}`,
      'Content-Type': 'application/json',
    })

    // Clean up any existing tasks from previous runs
    await Task.deleteMany({
      $or: [
        { organizationId: orgA._id },
        { organizationId: orgB._id },
        { title: { $regex: /TaskTest/i } },
      ],
    })

    // =================================================================
    // SECTION 1: AUTHENTICATION
    // =================================================================
    console.log('--> Testing Scenario 1: Unauthenticated request rejected (401)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`)
      assert(res.status === 401, '1. Unauthenticated request → 401', `Received status ${res.status}`)
    }

    // =================================================================
    // SECTION 2: TENANT ISOLATION
    // =================================================================
    let taskInOrgA, taskInOrgB

    // Setup base tasks
    taskInOrgA = await Task.create({
      organizationId: orgA._id,
      projectId: projectA._id,
      clientId: clientA._id,
      campaignId: campaignA._id,
      title: 'TaskTest Org A Task Primary',
      taskType: 'Development',
      status: 'To Do',
      priority: 'High',
      assignedTo: teamMemberA1._id,
      createdBy: agencyAdmin._id,
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-01'),
      estimatedHours: 20,
    })

    taskInOrgB = await Task.create({
      organizationId: orgB._id,
      projectId: projectB._id,
      clientId: clientB._id,
      campaignId: campaignB._id,
      title: 'TaskTest Org B Task Primary',
      taskType: 'SEO',
      status: 'In Progress',
      priority: 'Medium',
      assignedTo: userB._id,
      createdBy: adminB._id,
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-01'),
      estimatedHours: 15,
    })

    console.log('--> Testing Scenario 2: Organization A can access own task')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      assert(
        res.status === 200 && data.data?.task?._id === taskInOrgA._id.toString(),
        '2. Organization A can access own task',
        `Status ${res.status}, ID match confirmed`
      )
    }

    console.log('--> Testing Scenario 3: Organization A cannot access Organization B task (404)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgB._id}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      assert(
        res.status === 404,
        '3. Organization A cannot access Organization B task',
        `Received status ${res.status}`
      )
    }

    console.log('--> Testing Scenario 4: Organization A cannot modify Organization B task (404)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgB._id}`, {
        method: 'PUT',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ title: 'Hacked Task Title' }),
      })
      assert(
        res.status === 404,
        '4. Organization A cannot modify Organization B task',
        `Received status ${res.status}`
      )
    }

    console.log('--> Testing Scenario 5: Organization A cannot delete Organization B task (404)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgB._id}`, {
        method: 'DELETE',
        headers: cookieHeader(agencyAdminToken),
      })
      assert(
        res.status === 404,
        '5. Organization A cannot delete Organization B task',
        `Received status ${res.status}`
      )
    }

    // =================================================================
    // SECTION 3: RBAC
    // =================================================================
    console.log('--> Testing Scenario 6: Super admin can create task')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(superAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Created by SuperAdmin',
          projectId: projectA._id,
          taskType: 'Development',
          priority: 'Critical',
          estimatedHours: 10,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 201 && data.data?.task?.title === 'TaskTest Created by SuperAdmin',
        '6. Super admin can create',
        `Status ${res.status}`
      )
    }

    console.log('--> Testing Scenario 7: Agency admin can create task')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Created by AgencyAdmin',
          projectId: projectA._id,
          taskType: 'Design',
          priority: 'High',
          estimatedHours: 8,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 201 && data.data?.task?.title === 'TaskTest Created by AgencyAdmin',
        '7. Agency admin can create',
        `Status ${res.status}`
      )
    }

    console.log('--> Testing Scenario 8: Account manager can create task')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(accountManagerToken),
        body: JSON.stringify({
          title: 'TaskTest Created by AccountManager',
          projectId: projectA._id,
          taskType: 'Content',
          priority: 'Medium',
          estimatedHours: 6,
        }),
      })
      const data = await res.json()
      assert(
        res.status === 201 && data.data?.task?.title === 'TaskTest Created by AccountManager',
        '8. Account manager can create',
        `Status ${res.status}`
      )
    }

    console.log('--> Testing Scenario 9: Team member cannot create task (403)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(teamMemberA1Token),
        body: JSON.stringify({
          title: 'TaskTest Created by TeamMember',
          projectId: projectA._id,
        }),
      })
      assert(res.status === 403, '9. Team member cannot create', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 10: Client cannot create task (403)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(clientUserToken),
        body: JSON.stringify({
          title: 'TaskTest Created by Client',
          projectId: projectA._id,
        }),
      })
      assert(res.status === 403, '10. Client cannot create', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 11: Account manager cannot delete task (403)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}`, {
        method: 'DELETE',
        headers: cookieHeader(accountManagerToken),
      })
      assert(res.status === 403, '11. Account manager cannot delete', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 12: Team member cannot delete task (403)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}`, {
        method: 'DELETE',
        headers: cookieHeader(teamMemberA1Token),
      })
      assert(res.status === 403, '12. Team member cannot delete', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 13: Client cannot edit task (403)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}`, {
        method: 'PUT',
        headers: cookieHeader(clientUserToken),
        body: JSON.stringify({ title: 'Client Modified Title' }),
      })
      assert(res.status === 403, '13. Client cannot edit', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 14: Team member can update assigned task progress')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}/progress`, {
        method: 'PATCH',
        headers: cookieHeader(teamMemberA1Token),
        body: JSON.stringify({ progress: 60 }),
      })
      const data = await res.json()
      assert(
        res.status === 200 && data.data?.task?.progress === 60,
        '14. Team member can update assigned task progress',
        `Status ${res.status}, progress: ${data.data?.task?.progress}`
      )
    }

    console.log('--> Testing Scenario 15: Unauthorized team member cannot modify another user\'s task (403)')
    {
      // TeamMemberA2 attempts to update task assigned to TeamMemberA1
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}/progress`, {
        method: 'PATCH',
        headers: cookieHeader(teamMemberA2Token),
        body: JSON.stringify({ progress: 80 }),
      })
      assert(
        res.status === 403,
        '15. Unauthorized team member cannot modify another user\'s task',
        `Status ${res.status}`
      )
    }

    // =================================================================
    // SECTION 4: VALIDATION
    // =================================================================
    console.log('--> Testing Scenario 16: Empty title rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: '',
          projectId: projectA._id,
        }),
      })
      assert(res.status === 400, '16. Empty title rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 17: Invalid project rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Invalid Project',
          projectId: 'invalid_mongo_id',
        }),
      })
      assert(res.status === 400, '17. Invalid project rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 18: Invalid client rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Invalid Client',
          projectId: projectA._id,
          clientId: 'invalid_mongo_id',
        }),
      })
      assert(res.status === 400, '18. Invalid client rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 19: Invalid campaign rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Invalid Campaign',
          projectId: projectA._id,
          campaignId: 'invalid_mongo_id',
        }),
      })
      assert(res.status === 400, '19. Invalid campaign rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 20: Invalid assignee rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Invalid Assignee',
          projectId: projectA._id,
          assignedTo: 'invalid_mongo_id',
        }),
      })
      assert(res.status === 400, '20. Invalid assignee rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 21: Negative estimated hours rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Negative Hours',
          projectId: projectA._id,
          estimatedHours: -10,
        }),
      })
      assert(res.status === 400, '21. Negative estimated hours rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 22: Negative actual hours rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Negative Actual Hours',
          projectId: projectA._id,
          actualHours: -5,
        }),
      })
      assert(res.status === 400, '22. Negative actual hours rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 23: Progress below 0 rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Progress Subzero',
          projectId: projectA._id,
          progress: -15,
        }),
      })
      assert(res.status === 400, '23. Progress below 0 rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 24: Progress above 100 rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Progress Above 100',
          projectId: projectA._id,
          progress: 125,
        }),
      })
      assert(res.status === 400, '24. Progress above 100 rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 25: Invalid dates rejected (due before start) (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Inverted Dates',
          projectId: projectA._id,
          startDate: '2026-06-01',
          dueDate: '2026-05-01',
        }),
      })
      assert(res.status === 400, '25. Invalid dates rejected', `Status ${res.status}`)
    }

    // =================================================================
    // SECTION 5: CROSS-TENANT REFERENCES
    // =================================================================
    console.log('--> Testing Scenario 26: Cross-tenant project rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Cross Tenant Project',
          projectId: projectB._id, // Project from Org B
        }),
      })
      assert(res.status === 400, '26. Cross-tenant project rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 27: Cross-tenant client rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Cross Tenant Client',
          projectId: projectA._id,
          clientId: clientB._id, // Client from Org B
        }),
      })
      assert(res.status === 400, '27. Cross-tenant client rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 28: Cross-tenant campaign rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Cross Tenant Campaign',
          projectId: projectA._id,
          campaignId: campaignB._id, // Campaign from Org B
        }),
      })
      assert(res.status === 400, '28. Cross-tenant campaign rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 29: Cross-tenant assignee rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Cross Tenant Assignee',
          projectId: projectA._id,
          assignedTo: userB._id, // User from Org B
        }),
      })
      assert(res.status === 400, '29. Cross-tenant assignee rejected', `Status ${res.status}`)
    }

    console.log('--> Testing Scenario 30: Inconsistent project/client relationship rejected (400)')
    {
      // Project A belongs to Client A. Passing Client A2 should be safely rejected with 400
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Inconsistent Client',
          projectId: projectA._id,
          clientId: clientA2._id,
        }),
      })
      assert(
        res.status === 400,
        '30. Inconsistent project/client relationship rejected',
        `Status ${res.status}`
      )
    }

    // =================================================================
    // SECTION 6: CRUD
    // =================================================================
    let crudTaskId

    console.log('--> Testing Scenario 31: Create task succeeds')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest CRUD Create Target',
          projectId: projectA._id,
          taskType: 'Development',
          priority: 'High',
          status: 'To Do',
          assignedTo: teamMemberA1._id,
          startDate: '2026-03-01',
          dueDate: '2026-04-15',
          estimatedHours: 25,
          checklist: [{ title: 'Setup repository', isCompleted: false }],
          description: 'A full task for testing CRUD lifecycle',
        }),
      })
      const data = await res.json()
      crudTaskId = data.data?.task?._id
      assert(
        res.status === 201 && crudTaskId && data.data?.task?.estimatedHours === 25,
        '31. Create task',
        `Created task with ID ${crudTaskId}`
      )
    }

    console.log('--> Testing Scenario 32: List tasks succeeds with pagination & search')
    {
      const res = await fetch(`${baseUrl}/api/tasks?search=CRUD&projectId=${projectA._id}&page=1&limit=10`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const tasks = data.data?.tasks || []
      assert(
        res.status === 200 && tasks.length >= 1 && data.data?.metrics?.totalTasks !== undefined,
        '32. List tasks',
        `Fetched ${tasks.length} tasks, total metrics present`
      )
    }

    console.log('--> Testing Scenario 33: Get task by ID succeeds with populated refs')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${crudTaskId}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const t = data.data?.task
      assert(
        res.status === 200 &&
          t?._id === crudTaskId &&
          t?.projectId?.name === 'TaskTest Project Alpha' &&
          t?.clientId?.companyName === 'TaskTest Client Alpha',
        '33. Get task',
        `Fetched task with populated project & client`
      )
    }

    console.log('--> Testing Scenario 34: Update task succeeds')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${crudTaskId}`, {
        method: 'PUT',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest CRUD Updated Title',
          estimatedHours: 30,
          description: 'Updated description for test',
        }),
      })
      const data = await res.json()
      assert(
        res.status === 200 &&
          data.data?.task?.title === 'TaskTest CRUD Updated Title' &&
          data.data?.task?.estimatedHours === 30,
        '34. Update task',
        `Updated task confirmed`
      )
    }

    console.log('--> Testing Scenario 35: Delete task succeeds')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${crudTaskId}`, {
        method: 'DELETE',
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const verifyRes = await fetch(`${baseUrl}/api/tasks/${crudTaskId}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      assert(
        res.status === 200 && verifyRes.status === 404,
        '35. Delete task',
        `Deleted task confirmed with 404 on subsequent get`
      )
    }

    // =================================================================
    // SECTION 7: STATUS WORKFLOW & TRANSITIONS
    // =================================================================
    let transitionTask = await Task.create({
      organizationId: orgA._id,
      projectId: projectA._id,
      clientId: clientA._id,
      title: 'TaskTest Status Workflow Task',
      taskType: 'Development',
      status: 'To Do',
      priority: 'Medium',
      assignedTo: teamMemberA1._id,
      createdBy: agencyAdmin._id,
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-01'),
      estimatedHours: 12,
    })

    console.log('--> Testing Scenario 36: Valid status transition succeeds (To Do -> In Progress)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${transitionTask._id}/status`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ status: 'In Progress' }),
      })
      const data = await res.json()
      assert(
        res.status === 200 && data.data?.task?.status === 'In Progress',
        '36. Valid status transition succeeds',
        `Status successfully transitioned to ${data.data?.task?.status}`
      )
    }

    console.log('--> Testing Scenario 37: Invalid status transition rejected (In Progress -> Completed directly without Review)')
    {
      // Valid transitions from In Progress are: Review, Blocked, Cancelled
      const res = await fetch(`${baseUrl}/api/tasks/${transitionTask._id}/status`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ status: 'Completed' }),
      })
      assert(
        res.status === 400,
        '37. Invalid status transition rejected',
        `Direct jump from In Progress to Completed rejected with status ${res.status}`
      )
    }

    console.log('--> Testing Scenario 38: Completion records completedAt timestamp and sets progress 100')
    {
      // Valid path: In Progress -> Review -> Completed
      await fetch(`${baseUrl}/api/tasks/${transitionTask._id}/status`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ status: 'Review' }),
      })
      const res = await fetch(`${baseUrl}/api/tasks/${transitionTask._id}/status`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ status: 'Completed' }),
      })
      const data = await res.json()
      const t = data.data?.task
      assert(
        res.status === 200 &&
          t?.status === 'Completed' &&
          t?.progress === 100 &&
          t?.completedAt !== null &&
          t?.completedAt !== undefined,
        '38. Completion records completedAt',
        `completedAt: ${t?.completedAt}, progress: ${t?.progress}`
      )
    }

    // =================================================================
    // SECTION 8: PROGRESS UPDATES
    // =================================================================
    console.log('--> Testing Scenario 39: Valid progress update succeeds (0 <= progress <= 100)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}/progress`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ progress: 85 }),
      })
      const data = await res.json()
      assert(
        res.status === 200 && data.data?.task?.progress === 85,
        '39. Valid progress update succeeds',
        `Progress updated to ${data.data?.task?.progress}%`
      )
    }

    console.log('--> Testing Scenario 40: Invalid progress rejected (progress > 100)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}/progress`, {
        method: 'PATCH',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({ progress: 150 }),
      })
      assert(res.status === 400, '40. Invalid progress rejected', `Status ${res.status}`)
    }

    // =================================================================
    // SECTION 9: ASSIGNMENT
    // =================================================================
    console.log('--> Testing Scenario 41: Authorized manager can assign task')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}/assign`, {
        method: 'PATCH',
        headers: cookieHeader(accountManagerToken),
        body: JSON.stringify({ assignedTo: teamMemberA2._id }),
      })
      const data = await res.json()
      assert(
        res.status === 200 && data.data?.task?.assignedTo?._id === teamMemberA2._id.toString(),
        '41. Authorized manager can assign',
        `Assigned to user: ${data.data?.task?.assignedTo?.name}`
      )
    }

    console.log('--> Testing Scenario 42: Cross-tenant assignment rejected (400)')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}/assign`, {
        method: 'PATCH',
        headers: cookieHeader(accountManagerToken),
        body: JSON.stringify({ assignedTo: userB._id }), // User from Org B
      })
      assert(
        res.status === 400,
        '42. Cross-tenant assignment rejected',
        `Cross-tenant assignment returned status ${res.status}`
      )
    }

    // =================================================================
    // SECTION 10: STATISTICS & OVERDUE DETECTION
    // =================================================================
    // Create an overdue task
    const overdueTask = await Task.create({
      organizationId: orgA._id,
      projectId: projectA._id,
      clientId: clientA._id,
      title: 'TaskTest Overdue Item',
      taskType: 'Development',
      status: 'In Progress',
      priority: 'Critical',
      assignedTo: teamMemberA1._id,
      createdBy: agencyAdmin._id,
      startDate: new Date('2026-01-01'),
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days in the past
      estimatedHours: 8,
    })

    console.log('--> Testing Scenario 43: Task statistics calculate correctly')
    {
      const res = await fetch(`${baseUrl}/api/tasks/statistics`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const stats = data.data?.statistics
      assert(
        res.status === 200 &&
          stats?.total >= 1 &&
          stats?.byStatus !== undefined &&
          stats?.byPriority !== undefined,
        '43. Task statistics calculate correctly',
        `Total: ${stats?.total}, CompletionRate: ${stats?.completionRate}%`
      )
    }

    console.log('--> Testing Scenario 44: Overdue task detection works')
    {
      const res = await fetch(`${baseUrl}/api/tasks?overdue=true`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const overdueTasks = data.data?.tasks || []
      const found = overdueTasks.some((t) => t._id === overdueTask._id.toString())
      assert(
        res.status === 200 && found,
        '44. Overdue task detection works',
        `Overdue task detected in list (found: ${found})`
      )
    }

    // =================================================================
    // SECTION 11: SECURITY & FRONTEND INTEGRITY
    // =================================================================
    console.log('--> Testing Scenario 45: organizationId and createdBy spoofing rejected/overridden')
    {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: cookieHeader(agencyAdminToken),
        body: JSON.stringify({
          title: 'TaskTest Spoofing Attempt',
          projectId: projectA._id,
          organizationId: orgB._id, // Attempt to spoof Org B
          organization: orgB._id,
          createdBy: userB._id, // Attempt to spoof User B
        }),
      })
      // Should either be rejected with 400 or created with server-enforced Org A and agencyAdmin
      if (res.status === 400) {
        assert(
          true,
          '45. organizationId/createdBy spoofing rejected',
          'Spoofing payload rejected with 400 Bad Request'
        )
      } else if (res.status === 201) {
        const data = await res.json()
        const t = data.data?.task
        const safeOrg = t.organizationId?._id
          ? t.organizationId._id === orgA._id.toString()
          : t.organizationId === orgA._id.toString()
        const safeCreator = t.createdBy?._id
          ? t.createdBy._id === agencyAdmin._id.toString()
          : t.createdBy === agencyAdmin._id.toString()
        assert(
          safeOrg && safeCreator,
          '45. organizationId/createdBy spoofing rejected',
          'Server strictly enforced authenticated organizationId and createdBy'
        )
      } else {
        assert(false, '45. organizationId/createdBy spoofing rejected', `Unexpected status ${res.status}`)
      }
    }

    console.log('--> Testing Scenario 46: Sensitive user fields not exposed on populated task references')
    {
      const res = await fetch(`${baseUrl}/api/tasks/${taskInOrgA._id}`, {
        headers: cookieHeader(agencyAdminToken),
      })
      const data = await res.json()
      const t = data.data?.task
      const assignee = t?.assignedTo
      const creator = t?.createdBy

      const safeAssignee = !assignee?.password && !assignee?.passwordResetToken && !assignee?.googleId
      const safeCreator = !creator?.password && !creator?.passwordResetToken && !creator?.googleId
      assert(
        safeAssignee && safeCreator,
        '46. Sensitive user fields not exposed',
        'Password and security tokens stripped from populated user objects'
      )
    }

    console.log('--> Testing Scenario 47: Task frontend route protected')
    {
      const clientDir = path.resolve(__dirname, '../../../Design Digital Marketing Platform/client')
      const appRoutesFile = path.resolve(clientDir, 'src/routes/AppRoutes.jsx')
      const content = fs.readFileSync(appRoutesFile, 'utf8')

      const hasTasksRoute = content.includes('path="/tasks"') && content.includes('path="/tasks/:id"')
      const isProtected = content.includes('ProtectedRoute')

      assert(
        hasTasksRoute && isProtected,
        '47. Task frontend route protected',
        `hasTasksRoute: ${hasTasksRoute}, isProtected: ${isProtected}`
      )
    }

    console.log('--> Testing Scenario 48: Production build succeeds')
    {
      const clientDir = path.resolve(__dirname, '../../../Design Digital Marketing Platform/client')
      let buildSuccess = false
      try {
        execSync('npm run build', { cwd: clientDir, stdio: 'pipe', timeout: 90000 })
        buildSuccess = true
      } catch (err) {
        console.error('Vite build error:', err.message)
      }

      assert(
        buildSuccess,
        '48. Production build succeeds',
        `buildSuccess: ${buildSuccess}`
      )
    }
  } catch (err) {
    console.error('Unexpected error in task test runner:', err)
  } finally {
    await server.close()
  }

  console.log('\n=================================================================')
  console.log(`Task Test Results Summary: ${passedCount}/48 Passed, ${failedCount} Failed`)
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
