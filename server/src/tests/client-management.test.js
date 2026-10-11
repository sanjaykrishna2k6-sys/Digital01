process.env.NODE_ENV = 'test'
import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import app from '../app.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Client from '../models/Client.js'
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
  console.log('🚀 Running Client Management Test Suite (18 Test Scenarios)')
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
  let createdClientA = null
  let createdClientB = null

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

    orgB = await Organization.findOne({ slug: 'client-test-org-b' })
    if (!orgB) {
      orgB = await Organization.create({
        name: 'Client Test Org B',
        slug: 'client-test-org-b',
        plan: 'growth',
        status: 'active',
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('Password123!', salt)

    // Super Admin (Org A)
    superAdmin = await User.findOne({ email: 'clienttest_superadmin@scalevo.com' })
    if (!superAdmin) {
      superAdmin = await User.create({
        organization: orgA._id,
        name: 'Super Admin Test',
        email: 'clienttest_superadmin@scalevo.com',
        password: hashedPassword,
        role: 'super_admin',
        status: 'active',
      })
    }

    // Agency Admin (Org A)
    agencyAdmin = await User.findOne({ email: 'clienttest_agencyadmin@scalevo.com' })
    if (!agencyAdmin) {
      agencyAdmin = await User.create({
        organization: orgA._id,
        name: 'Agency Admin Test',
        email: 'clienttest_agencyadmin@scalevo.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // Account Manager (Org A)
    accountManager = await User.findOne({ email: 'clienttest_accountmgr@scalevo.com' })
    if (!accountManager) {
      accountManager = await User.create({
        organization: orgA._id,
        name: 'Account Manager Test',
        email: 'clienttest_accountmgr@scalevo.com',
        password: hashedPassword,
        role: 'account_manager',
        status: 'active',
      })
    }

    // Team Member (Org A)
    teamMember = await User.findOne({ email: 'clienttest_teammember@scalevo.com' })
    if (!teamMember) {
      teamMember = await User.create({
        organization: orgA._id,
        name: 'Team Member Test',
        email: 'clienttest_teammember@scalevo.com',
        password: hashedPassword,
        role: 'team_member',
        status: 'active',
      })
    }

    // Client Role User (Org A)
    clientUser = await User.findOne({ email: 'clienttest_portaluser@scalevo.com' })
    if (!clientUser) {
      clientUser = await User.create({
        organization: orgA._id,
        name: 'Client Role Test',
        email: 'clienttest_portaluser@scalevo.com',
        password: hashedPassword,
        role: 'client',
        status: 'active',
      })
    }

    // Admin for Org B
    adminB = await User.findOne({ email: 'clienttest_admin_b@tenantb.com' })
    if (!adminB) {
      adminB = await User.create({
        organization: orgB._id,
        name: 'Tenant B Admin',
        email: 'clienttest_admin_b@tenantb.com',
        password: hashedPassword,
        role: 'agency_admin',
        status: 'active',
      })
    }

    // Generate Auth Cookies
    const superAdminCookie = `scalevo_token=${generateToken({
      userId: superAdmin._id,
      organizationId: orgA._id,
      role: superAdmin.role,
    })}`

    const agencyAdminCookie = `scalevo_token=${generateToken({
      userId: agencyAdmin._id,
      organizationId: orgA._id,
      role: agencyAdmin.role,
    })}`

    const accountManagerCookie = `scalevo_token=${generateToken({
      userId: accountManager._id,
      organizationId: orgA._id,
      role: accountManager.role,
    })}`

    const teamMemberCookie = `scalevo_token=${generateToken({
      userId: teamMember._id,
      organizationId: orgA._id,
      role: teamMember.role,
    })}`

    const clientUserCookie = `scalevo_token=${generateToken({
      userId: clientUser._id,
      organizationId: orgA._id,
      role: clientUser.role,
    })}`

    const adminBCookie = `scalevo_token=${generateToken({
      userId: adminB._id,
      organizationId: orgB._id,
      role: adminB.role,
    })}`

    // Cleanup previous test clients if any
    await Client.deleteMany({
      email: {
        $in: [
          'contact@acmecorp.com',
          'duplicate_test@agency.com',
          'scoped_client@tenant.com',
          'delete_target@agency.com',
        ],
      },
    })

    // -----------------------------------------------------------------
    // Scenario 1: Super Admin can list clients
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 1: Super Admin can list clients')
    const listRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'GET',
      headers: { Cookie: superAdminCookie },
    })
    const listData = await listRes.json()
    assert(
      listRes.status === 200 &&
        listData.status === 'success' &&
        Array.isArray(listData.data?.clients) &&
        listData.pagination !== undefined,
      '1. Super Admin can list clients',
      `status: ${listRes.status}, clients count: ${listData.data?.clients?.length}`
    )

    // -----------------------------------------------------------------
    // Scenario 2: Agency Admin can create client
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 2: Agency Admin can create client')
    const createRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agencyAdminCookie,
      },
      body: JSON.stringify({
        companyName: 'Acme Corporation',
        contactName: 'Jane Smith',
        email: 'contact@acmecorp.com',
        phone: '+1 (555) 123-4567',
        website: 'https://acmecorp.com',
        industry: 'Technology & SaaS',
        address: {
          street: '100 Silicon Way',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: '94105',
        },
        services: ['SEO Optimization', 'Meta & Social Ads'],
        notes: 'Enterprise account onboarding in progress.',
        assignedAccountManager: accountManager._id.toString(),
      }),
    })
    const createData = await createRes.json()
    createdClientA = createData.data?.client
    assert(
      createRes.status === 201 &&
        createData.status === 'success' &&
        createdClientA?.companyName === 'Acme Corporation' &&
        createdClientA?.email === 'contact@acmecorp.com',
      '2. Agency Admin can create client',
      `status: ${createRes.status}, id: ${createdClientA?._id}`
    )

    // -----------------------------------------------------------------
    // Scenario 3: Client is assigned to authenticated organization
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 3: Client is assigned to authenticated organization')
    const dbClientA = await Client.findById(createdClientA._id)
    assert(
      dbClientA && dbClientA.organizationId.toString() === orgA._id.toString(),
      '3. Client is assigned to authenticated organization',
      `client org: ${dbClientA?.organizationId}, expected orgA: ${orgA._id}`
    )

    // -----------------------------------------------------------------
    // Scenario 4: Client cannot supply organizationId
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 4: Client cannot supply organizationId')
    const spoofOrgRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agencyAdminCookie,
      },
      body: JSON.stringify({
        organizationId: orgB._id.toString(),
        companyName: 'Spoof Attempt Inc',
        contactName: 'Attacker Bob',
        email: 'spoof@attacker.com',
      }),
    })
    const spoofOrgData = await spoofOrgRes.json()
    assert(
      spoofOrgRes.status === 400 &&
        spoofOrgData.errors?.some((err) => err.includes('organizationId')),
      '4. Client cannot supply organizationId (rejected with 400)',
      `status: ${spoofOrgRes.status}, message: ${spoofOrgData.message}`
    )

    // -----------------------------------------------------------------
    // Scenario 5: Client can be retrieved
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 5: Client can be retrieved')
    const getRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}`, {
      method: 'GET',
      headers: { Cookie: agencyAdminCookie },
    })
    const getData = await getRes.json()
    assert(
      getRes.status === 200 &&
        getData.status === 'success' &&
        getData.data?.client?._id === createdClientA._id.toString() &&
        getData.data?.client?.companyName === 'Acme Corporation',
      '5. Client can be retrieved',
      `status: ${getRes.status}, client name: ${getData.data?.client?.companyName}`
    )

    // -----------------------------------------------------------------
    // Scenario 6: Client can be updated
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 6: Client can be updated')
    const updateRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: accountManagerCookie,
      },
      body: JSON.stringify({
        companyName: 'Acme Global Corporation',
        phone: '+1 (555) 999-8888',
        notes: 'Updated account notes by account manager.',
      }),
    })
    const updateData = await updateRes.json()

    // Verify organizationId modification is rejected in update requests
    const tamperOrgRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agencyAdminCookie,
      },
      body: JSON.stringify({
        organizationId: orgB._id.toString(),
      }),
    })

    assert(
      updateRes.status === 200 &&
        updateData.status === 'success' &&
        updateData.data?.client?.companyName === 'Acme Global Corporation' &&
        updateData.data?.client?.phone === '+1 (555) 999-8888' &&
        tamperOrgRes.status === 400,
      '6. Client can be updated and organizationId modification is rejected (400)',
      `update status: ${updateRes.status}, company: ${updateData.data?.client?.companyName}, tamper status: ${tamperOrgRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 7: Client status can be changed
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 7: Client status can be changed')
    const statusRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: accountManagerCookie,
      },
      body: JSON.stringify({ status: 'inactive' }),
    })
    const statusData = await statusRes.json()
    assert(
      statusRes.status === 200 &&
        statusData.data?.client?.status === 'inactive',
      '7. Client status can be changed',
      `status: ${statusRes.status}, new status: ${statusData.data?.client?.status}`
    )

    // Revert back to active
    await fetch(`${baseUrl}/api/clients/${createdClientA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agencyAdminCookie,
      },
      body: JSON.stringify({ status: 'active' }),
    })

    // -----------------------------------------------------------------
    // Scenario 8: Unauthorized request returns 401
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 8: Unauthorized request returns 401')
    const unauthRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'GET',
    })
    assert(
      unauthRes.status === 401,
      '8. Unauthorized request returns 401',
      `status: ${unauthRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 9: Client role receives 403
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 9: Client role receives 403')
    const clientRoleListRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'GET',
      headers: { Cookie: clientUserCookie },
    })
    const clientRoleCreateRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: clientUserCookie,
      },
      body: JSON.stringify({
        companyName: 'Forbidden Company',
        contactName: 'Forbidden Person',
        email: 'forbidden@client.com',
      }),
    })
    assert(
      clientRoleListRes.status === 403 && clientRoleCreateRes.status === 403,
      '9. Client role receives 403 on client management APIs',
      `GET status: ${clientRoleListRes.status}, POST status: ${clientRoleCreateRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 10: Team member cannot create client
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 10: Team member cannot create client')
    const teamCreateRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teamMemberCookie,
      },
      body: JSON.stringify({
        companyName: 'Team Create Test',
        contactName: 'Team Person',
        email: 'team_attempt@company.com',
      }),
    })
    assert(
      teamCreateRes.status === 403,
      '10. Team member cannot create client (403 Forbidden)',
      `status: ${teamCreateRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 11: Team member cannot update client
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 11: Team member cannot update client')
    const teamUpdateRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teamMemberCookie,
      },
      body: JSON.stringify({
        companyName: 'Hacked by Team Member',
      }),
    })
    assert(
      teamUpdateRes.status === 403,
      '11. Team member cannot update client (403 Forbidden)',
      `status: ${teamUpdateRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 12: Team member cannot delete client
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 12: Team member cannot delete client')
    const teamDeleteRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}`, {
      method: 'DELETE',
      headers: { Cookie: teamMemberCookie },
    })
    assert(
      teamDeleteRes.status === 403,
      '12. Team member cannot delete client (403 Forbidden)',
      `status: ${teamDeleteRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 13: Account manager cannot delete client
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 13: Account manager cannot delete client')
    const mgrDeleteRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}`, {
      method: 'DELETE',
      headers: { Cookie: accountManagerCookie },
    })
    assert(
      mgrDeleteRes.status === 403,
      '13. Account manager cannot delete client (403 Forbidden)',
      `status: ${mgrDeleteRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 14: Cross-tenant access returns 404
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 14: Cross-tenant access returns 404')
    const crossGetRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}`, {
      method: 'GET',
      headers: { Cookie: adminBCookie },
    })
    const crossUpdateRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminBCookie,
      },
      body: JSON.stringify({ companyName: 'Cross Tenant Tampering' }),
    })
    const crossDeleteRes = await fetch(`${baseUrl}/api/clients/${createdClientA._id}`, {
      method: 'DELETE',
      headers: { Cookie: adminBCookie },
    })
    assert(
      crossGetRes.status === 404 &&
        crossUpdateRes.status === 404 &&
        crossDeleteRes.status === 404,
      '14. Cross-tenant access returns 404 for GET, PATCH, and DELETE',
      `GET: ${crossGetRes.status}, PATCH: ${crossUpdateRes.status}, DELETE: ${crossDeleteRes.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 15: Duplicate email inside organization is rejected
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 15: Duplicate email inside organization is rejected')
    const dupRes1 = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agencyAdminCookie,
      },
      body: JSON.stringify({
        companyName: 'Unique Email First',
        contactName: 'First Person',
        email: 'duplicate_test@agency.com',
      }),
    })
    const dupRes2 = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agencyAdminCookie,
      },
      body: JSON.stringify({
        companyName: 'Duplicate Email Second',
        contactName: 'Second Person',
        email: 'duplicate_test@agency.com',
      }),
    })
    assert(
      dupRes1.status === 201 && dupRes2.status === 409,
      '15. Duplicate email inside organization is rejected (409 Conflict)',
      `First creation status: ${dupRes1.status}, Second duplicate status: ${dupRes2.status}`
    )

    // -----------------------------------------------------------------
    // Scenario 16: Same email in different organization is allowed
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 16: Same email in different organization is allowed')
    const crossOrgDupRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminBCookie,
      },
      body: JSON.stringify({
        companyName: 'Org B Same Email Client',
        contactName: 'Tenant B Contact',
        email: 'duplicate_test@agency.com', // Exactly the same email as in Org A
      }),
    })
    const crossOrgDupData = await crossOrgDupRes.json()
    createdClientB = crossOrgDupData.data?.client
    assert(
      crossOrgDupRes.status === 201 &&
        createdClientB?.email === 'duplicate_test@agency.com' &&
        createdClientB?.organizationId !== orgA._id.toString(),
      '16. Same email in different organization is allowed',
      `Org B creation status: ${crossOrgDupRes.status}, id: ${createdClientB?._id}`
    )

    // -----------------------------------------------------------------
    // Scenario 17: Deleted client cannot be retrieved
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 17: Deleted client cannot be retrieved')
    // Create a disposable client to delete
    const tempClientRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: agencyAdminCookie,
      },
      body: JSON.stringify({
        companyName: 'Delete Target Inc',
        contactName: 'Temporary User',
        email: 'delete_target@agency.com',
      }),
    })
    const tempClientData = await tempClientRes.json()
    const tempClientId = tempClientData.data?.client?._id

    const deleteRes = await fetch(`${baseUrl}/api/clients/${tempClientId}`, {
      method: 'DELETE',
      headers: { Cookie: agencyAdminCookie },
    })

    const retrieveAfterDeleteRes = await fetch(`${baseUrl}/api/clients/${tempClientId}`, {
      method: 'GET',
      headers: { Cookie: agencyAdminCookie },
    })

    assert(
      deleteRes.status === 200 && retrieveAfterDeleteRes.status === 404,
      '17. Deleted client cannot be retrieved (returns 404)',
      `Delete status: ${deleteRes.status}, retrieve after delete status: ${retrieveAfterDeleteRes.status}`
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

    // Clean up created test data
    await Client.deleteMany({
      email: {
        $in: [
          'contact@acmecorp.com',
          'duplicate_test@agency.com',
          'scoped_client@tenant.com',
          'delete_target@agency.com',
        ],
      },
    })
    await User.deleteMany({
      email: {
        $in: [
          'clienttest_superadmin@scalevo.com',
          'clienttest_agencyadmin@scalevo.com',
          'clienttest_accountmgr@scalevo.com',
          'clienttest_teammember@scalevo.com',
          'clienttest_portaluser@scalevo.com',
          'clienttest_admin_b@tenantb.com',
        ],
      },
    })
    await Organization.deleteOne({ _id: orgB._id })
  } finally {
    server.close()
  }

  console.log('\n=================================================================')
  console.log(`Test Results Summary: ${passedCount}/18 Passed, ${failedCount} Failed`)
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
